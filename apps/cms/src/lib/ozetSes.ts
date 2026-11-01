/**
 * "Bugün 60 saniyede" sesli özeti, panel tarafı (1 Kasım 2026, kullanıcı: "gerçek insan sesi; haberin kısa özeti ve yorum; cihazın ses
 * panelinden kontrol edilebilmeli"). Metin ve sesi Stüdyo'daki ozet-ses fonksiyonu üretir (ücretsiz Gemini, anahtar havuzu) ve ham WAV bırakır;
 * fonksiyonların işlemci sınırı MP3'e çevirmeye yetmediği için çevirme burada yapılır.
 * 5 dakikada bir: (1) media kovasında ozet/bekleyen.json varsa WAV → MP3 (64 kbps), ozet/son.json yazılır, ham dosya silinir;
 * (2) yoksa ve sitenin en yeni 6 haberi son özetten farklıysa (ya da 12 saat geçtiyse) fonksiyon çağrılır. Fonksiyon kendi kilidini ve
 * günlük sınırını tutar. Site son.json'u doğrudan okur (herkese açık kova).
 */
import type { Payload } from 'payload'
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { Mp3Encoder } from '@breezystack/lamejs'

const FONKSIYON = 'https://panel.updated.com.tr/functions/v1/ozet-ses'
const GENEL = 'https://panel.updated.com.tr/storage/v1/object/public/media'
const ESKI = 12 * 3600e3
type Ozet = { tarih: string; ses: string; sure: number; metin: string; maddeler: { id: number; yol: string; baslik: string; bas: number }[]; kimlik: string; gunluk?: { gun: string; sayi: number } }

let s3: S3Client | null = null
const istemci = () => (s3 ??= new S3Client({ forcePathStyle: true, region: process.env.S3_REGION, endpoint: process.env.S3_ENDPOINT, credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID || '', secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '' } }))
const KOVA = () => process.env.S3_BUCKET || 'media'
async function al(anahtar: string): Promise<Uint8Array | null> {
  try { const r = await istemci().send(new GetObjectCommand({ Bucket: KOVA(), Key: anahtar })); return r.Body ? await r.Body.transformToByteArray() : null } catch { return null }
}
const alJson = async <T>(k: string): Promise<T | null> => { const b = await al(k); try { return b ? JSON.parse(new TextDecoder().decode(b)) as T : null } catch { return null } }
const koy = (k: string, govde: Uint8Array | string, tur: string, onbellek: string) => istemci().send(new PutObjectCommand({ Bucket: KOVA(), Key: k, Body: govde, ContentType: tur, CacheControl: onbellek }))
const sil = (k: string) => istemci().send(new DeleteObjectCommand({ Bucket: KOVA(), Key: k })).catch(() => {})

/** WAV (16 bit tek kanal) → MP3; olay döngüsü kilitlenmesin diye her 200 karede bir nefes alır */
async function mp3(wav: Uint8Array): Promise<Uint8Array> {
  const d = new DataView(wav.buffer, wav.byteOffset, wav.byteLength)
  const hz = d.getUint32(24, true), ham = new Int16Array(wav.buffer.slice(wav.byteOffset + 44, wav.byteOffset + wav.byteLength))
  // Yumuşak giriş/çıkış (1 Kasım 2026, kullanıcı: "biterken cızırtı"): sondaki sessizlik ve tıkırtı kırpılır, 40 ms açılış ve 700 ms
  // kosinüs kısılma, ardından 400 ms sessizlik
  let son = ham.length; while (son > hz && Math.abs(ham[son - 1]) < 300) son--
  son = Math.min(ham.length, son + Math.round(hz * 0.15))
  const kuyruk = Math.round(hz * 0.4), pcm = new Int16Array(son + kuyruk)
  pcm.set(ham.subarray(0, son))
  const ac = Math.round(hz * 0.04), kis = Math.min(Math.round(hz * 0.7), son)
  for (let i = 0; i < ac; i++) pcm[i] = Math.round(pcm[i] * (i / ac))
  for (let i = 0; i < kis; i++) { const k = son - kis + i; pcm[k] = Math.round(pcm[k] * (0.5 + 0.5 * Math.cos((Math.PI * i) / kis))) }
  const enc = new Mp3Encoder(1, hz, 64), parca: Uint8Array[] = []
  for (let i = 0, k = 0; i < pcm.length; i += 1152, k++) {
    const b = enc.encodeBuffer(pcm.subarray(i, i + 1152)); if (b.length) parca.push(new Uint8Array(b))
    if (k % 200 === 199) await new Promise((ok) => setImmediate(ok))
  }
  const s = enc.flush(); if (s.length) parca.push(new Uint8Array(s))
  return Buffer.concat(parca)
}

async function tur(p: Payload) {
  // 1) Bekleyen ham ses varsa yayına hazırla
  const bek = await alJson<Ozet>('ozet/bekleyen.json')
  if (bek) {
    const wav = await al(bek.ses)
    if (wav) {
      const ad = bek.ses.replace(/^ozet\/ham-/, 'ozet/').replace(/\.wav$/, '.mp3')
      await koy(ad, await mp3(wav), 'audio/mpeg', 'public, max-age=31536000, immutable')
      const onceki = await alJson<Ozet>('ozet/son.json')
      await koy('ozet/son.json', JSON.stringify({ ...bek, ses: `${GENEL}/${ad}` }), 'application/json', 'public, max-age=60')
      if (onceki?.ses?.includes('/ozet/') && !onceki.ses.endsWith(ad)) await sil(onceki.ses.slice(onceki.ses.indexOf('ozet/')))
      p.logger.info(`sesli özet yayında: ${ad} (${bek.sure} sn)`)
    }
    await sil(bek.ses); await sil('ozet/bekleyen.json')
    return
  }
  // 2) Haber listesi değiştiyse yenisini iste
  const son = await alJson<Ozet>('ozet/son.json')
  const h = await p.find({ collection: 'news', where: { _status: { equals: 'published' } }, sort: '-publishedAt', limit: 6, depth: 0, overrideAccess: true })
  const kimlik = h.docs.map((d) => d.id).join(',')
  if (son && son.kimlik === kimlik && Date.now() - +new Date(son.tarih) < ESKI) return
  const r = await fetch(FONKSIYON, { method: 'POST', signal: AbortSignal.timeout(280_000) }).catch((e) => ({ ok: false, status: 0, text: async () => String(e) }))
  const j = await r.text(); p.logger.info(`sesli özet isteği: ${r.status} ${j.slice(0, 160)}`)
  if (r.ok && j.includes('üretildi')) await tur(p) // bekleyen hemen çevrilir
}

let saat: ReturnType<typeof setInterval> | null = null, calisiyor = false
export function ozetZamanlayici(p: Payload) {
  if (saat || !process.env.S3_BUCKET) return
  const t = async () => { if (calisiyor) return; calisiyor = true; try { await tur(p) } catch (e) { p.logger.warn(`sesli özet: ${e}`) } finally { calisiyor = false } }
  setTimeout(t, 120_000); saat = setInterval(t, 5 * 60_000)
}
