import { createHmac, createHash, timingSafeEqual } from 'node:crypto'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionConfig, Payload, PayloadRequest } from 'payload'

/**
 * Uper (okur üyeliği) çekirdeği: okur anahtarının doğrulanması, puan, bildirim, moderasyon.
 * Okur anahtarı ayrı giriş servisinin (deploy/altyapi/uye) imzasıdır (HS256, UYE_JWT_SECRET); Payload'un kendi kullanıcısı olmaz,
 * yani okur hiçbir koşulda ekip yetkisi (req.user) almaz. Bütün okur işleri endpoints/uye.ts'teki uçlardan geçer.
 * Ham tablolar (tepki, beğeni, kayıt, bildirim, puan defteri) payload şemasında; göç dosyası 20261024_uye_topluluk.
 */
export type Sorgu = { query: (q: string, v?: unknown[]) => Promise<{ rows: any[]; rowCount?: number | null }> }
export const havuz = (p: Payload) => (p.db as unknown as { pool: Sorgu }).pool

/* ---------------- okur anahtarı ---------------- */
export type Kimlik = { sub: string; email: string; provider: string; meta: Record<string, unknown> }
const b64 = (s: string) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
const b64u = (b: Buffer | string) => Buffer.from(b).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')

export function anahtarCoz(token: string): Kimlik | null {
  const gizli = process.env.UYE_JWT_SECRET
  if (!gizli || !token) return null
  const p = token.split('.')
  if (p.length !== 3) return null
  try {
    const bas = JSON.parse(b64(p[0]).toString())
    if (bas.alg !== 'HS256') return null
    const imza = createHmac('sha256', gizli).update(`${p[0]}.${p[1]}`).digest()
    const gelen = b64(p[2])
    if (gelen.length !== imza.length || !timingSafeEqual(gelen, imza)) return null
    const c = JSON.parse(b64(p[1]).toString())
    if (c.aud !== 'uye' || typeof c.exp !== 'number' || c.exp * 1000 < Date.now() || !c.sub || !c.email) return null
    if (c.role === 'service_role') return null
    return { sub: String(c.sub), email: String(c.email).toLowerCase(), provider: String(c.app_metadata?.provider || 'email'), meta: c.user_metadata || {} }
  } catch { return null }
}

/** Giriş servisinin yönetim uçları için kısa ömürlü anahtar (hesap silme, engelleme) */
function yonetimAnahtari() {
  const s = process.env.UYE_JWT_SECRET || ''
  const h = b64u(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const c = b64u(JSON.stringify({ role: 'service_role', aud: 'uye', iss: 'panel', exp: Math.floor(Date.now() / 1000) + 120 }))
  return `${h}.${c}.${b64u(createHmac('sha256', s).update(`${h}.${c}`).digest())}`
}
export async function girisYonetim(yol: string, method: string, govde?: unknown) {
  const url = (process.env.UYE_AUTH_URL || 'http://127.0.0.1:9998') + yol
  const t = yonetimAnahtari()
  const r = await fetch(url, { method, headers: { Authorization: `Bearer ${t}`, apikey: t, 'Content-Type': 'application/json' }, body: govde ? JSON.stringify(govde) : undefined })
  if (!r.ok && r.status !== 404) throw new Error(`giriş servisi ${r.status}`)
  return r
}

/* ---------------- seviye, puan ---------------- */
/** Seviyeler (sürüm ilerlemesi, 25 Ekim 2026): puan arttıkça Beta'dan Updated'a. */
export const SEVIYELER = [
  { ad: 'Beta', puan: 0 },
  { ad: 'v1.0', puan: 100 },
  { ad: 'v2.0', puan: 300 },
  { ad: 'Pro', puan: 700 },
  { ad: 'Ultra', puan: 1500 },
  { ad: 'Updated', puan: 3000 },
] as const
export function seviye(puan: number) {
  let i = 0
  SEVIYELER.forEach((s, k) => { if (puan >= s.puan) i = k })
  const s = SEVIYELER[i], sonraki = SEVIYELER[i + 1]
  return { no: i + 1, ad: s.ad, puan, sonraki: sonraki ? { ad: sonraki.ad, puan: sonraki.puan } : null }
}

/** Puan kuralları: sitede "Puan nasıl kazanılır" bu listeden yazılır. gunluk = o işten günde en fazla kaç puan. */
export const PUAN = {
  hosgeldin: { puan: 10, gunluk: 10, ad: 'Uper oldun' },
  profil: { puan: 10, gunluk: 10, ad: 'Profilini tamamladın (hakkında + bir ekipman)' },
  yorum: { puan: 5, gunluk: 50, ad: 'Yorumun yayında' },
  begeni: { puan: 2, gunluk: 50, ad: 'Yorumun beğenildi' },
  tepki: { puan: 1, gunluk: 10, ad: 'Bir yazıya tepki verdin' },
  okuma: { puan: 3, gunluk: 30, ad: 'Bir yazıyı sonuna kadar okudun' },
  kulup: { puan: 10, gunluk: 100, ad: "Kulüp'te bir adımı bitirdin" },
  yarisma: { puan: 10, gunluk: 20, ad: 'Bir yarışmaya katıldığını işaretledin' },
  gorev_katilim: { puan: 15, gunluk: 15, ad: 'Haftalık göreve katıldın' },
  gorev_oy: { puan: 1, gunluk: 3, ad: 'Haftalık görevde oy verdin' },
  gorev_birinci: { puan: 100, gunluk: 100, ad: 'Haftalık görevde birinci oldun' },
  gorev_ikinci: { puan: 60, gunluk: 60, ad: 'Haftalık görevde ikinci oldun' },
  gorev_ucuncu: { puan: 40, gunluk: 40, ad: 'Haftalık görevde üçüncü oldun' },
} as const
export type PuanTur = keyof typeof PUAN

/** Aynı iş (tur + ref) bir kez puan getirir; günlük sınır aşılırsa puan yazılmaz. Seviye atlanırsa bildirim düşer. */
export async function puanEkle(p: Payload, uyeId: number, tur: PuanTur, ref: string) {
  const k = PUAN[tur], db = havuz(p)
  const bugun = await db.query(`select coalesce(sum(puan),0)::int as t from payload.uye_puan where uye_id=$1 and tur=$2 and at >= date_trunc('day', now() at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul'`, [uyeId, tur])
  if (bugun.rows[0].t + k.puan > k.gunluk) return 0
  const r = await db.query(`insert into payload.uye_puan (uye_id, tur, puan, ref) values ($1,$2,$3,$4) on conflict do nothing`, [uyeId, tur, k.puan, ref])
  if (!r.rowCount) return 0
  const u = await db.query(`update payload.uyeler set puan = coalesce(puan,0) + $2 where id=$1 returning puan::int as puan`, [uyeId, k.puan])
  const yeni = Number(u.rows[0]?.puan ?? 0)
  const once = seviye(yeni - k.puan), simdi = seviye(yeni)
  if (simdi.no > once.no) await bildirimEkle(p, uyeId, 'seviye', `Seviye atladın: ${simdi.ad}. Tebrikler!`, '/hesap#puan')
  return k.puan
}
export async function puanGeriAl(p: Payload, uyeId: number, tur: PuanTur, ref: string) {
  const db = havuz(p)
  const r = await db.query(`delete from payload.uye_puan where uye_id=$1 and tur=$2 and ref=$3 returning puan`, [uyeId, tur, ref])
  const geri = r.rows.reduce((t, x) => t + x.puan, 0)
  if (geri) await db.query(`update payload.uyeler set puan = greatest(0, coalesce(puan,0) - $2) where id=$1`, [uyeId, geri])
}

/* ---------------- bildirim (sitede zil + isteğe bağlı e-posta) ---------------- */
export async function bildirimEkle(p: Payload, uyeId: number, tur: string, metin: string, yol: string) {
  await havuz(p).query(`insert into payload.uye_bildirim (uye_id, tur, metin, yol) values ($1,$2,$3,$4)`, [uyeId, tur, metin.slice(0, 300), yol.slice(0, 300)]).catch(() => {})
}

const SON_EPOSTA = new Map<number, number>()
const kacis = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
/** Yanıt e-postası: kişi başına 15 dakikada en fazla bir tane (ayarından kapatabilir). */
export async function yanitEpostasi(p: Payload, uye: { id: number; email: string; bildirimEposta?: boolean | null; durum?: string | null }, kim: string, baslik: string, adres: string) {
  if (!uye.bildirimEposta || uye.durum === 'engelli' || !process.env.UYE_SMTP_HOST) return
  const t = SON_EPOSTA.get(uye.id) ?? 0
  if (Date.now() - t < 15 * 60_000) return
  SON_EPOSTA.set(uye.id, Date.now())
  try {
    const nodemailer = (await import('nodemailer')).default
    const tr = nodemailer.createTransport({ host: process.env.UYE_SMTP_HOST, port: Number(process.env.UYE_SMTP_PORT || 465), secure: Number(process.env.UYE_SMTP_PORT || 465) === 465, auth: { user: process.env.UYE_SMTP_USER, pass: process.env.UYE_SMTP_PASS } })
    const site = process.env.WEB_URL || 'https://updated.com.tr'
    const link = site + adres
    await tr.sendMail({
      from: `UPDATED <${process.env.UYE_SMTP_USER}>`, to: uye.email, subject: `${kim} yorumuna yanıt verdi`,
      text: `${kim}, "${baslik}" yazısındaki yorumuna yanıt verdi.\n\nYanıtı gör: ${link}\n\nBu e-postaları hesabından kapatabilirsin: ${site}/hesap#ayarlar`,
      html: `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#121212;max-width:520px"><p style="font-weight:900;letter-spacing:.04em">UPDATED</p><p><b>${kacis(kim)}</b>, “${kacis(baslik)}” yazısındaki yorumuna yanıt verdi.</p><p><a href="${kacis(link)}" style="display:inline-block;background:#FF6B1A;color:#121212;text-decoration:none;font-weight:700;padding:12px 18px">Yanıtı gör</a></p><p style="font-size:12px;color:#5C5C5C">Bu e-postaları <a href="${site}/hesap#ayarlar">hesabından</a> kapatabilirsin.</p></div>`,
    })
  } catch (e) { p.logger.warn(`yanıt e-postası gitmedi: ${e}`) }
}

/* ---------------- moderasyon ---------------- */
// Uygunsuz kelime listesi (kısa ve bilerek kaba: yakalanan yorum silinmez, ekip onayına düşer)
const KUFUR = /(^|[^a-zçğıöşü])(am[ıi]n[ae]|amc[ıi]k|orospu|o\.ç|sik(er|ik|eyim|tir|iş)|siktir|piç|yarra[kğ]|ya?vşak|götveren|ibne|kahpe|şerefsiz|aptal|gerizekal[ıi]|salak|dangalak|ananı|bacını|puşt|kaltak|fuck|shit|bitch)/i
const BAGLANTI = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|me|xyz|ru|tk|link|shop|site)\b|t\.me\/|wa\.me\/)/i
const TEKRAR = /(.)\1{9,}/

// Temiz yorum her Uper için hemen yayında (25 Ekim 2026: ilk yorum onayı kaldırıldı)
export function onayNedeni(metin: string, _guvenilir?: boolean): string | null {
  if (KUFUR.test(metin)) return 'Uygunsuz kelime'
  if (BAGLANTI.test(metin)) return 'Bağlantı içeriyor'
  if (TEKRAR.test(metin)) return 'Anlamsız tekrar'
  return null
}

/** Basit hız sınırı (bellekte): anahtar başına pencere içinde en fazla n istek */
const SAYAC = new Map<string, number[]>()
export function hizSiniri(anahtar: string, n: number, pencereMs: number) {
  const s = Date.now()
  const l = (SAYAC.get(anahtar) || []).filter((t) => s - t < pencereMs)
  if (l.length >= n) { SAYAC.set(anahtar, l); return false }
  l.push(s); SAYAC.set(anahtar, l)
  if (SAYAC.size > 20000) SAYAC.clear()
  return true
}
export const ipOzet = (req: PayloadRequest) => createHash('sha256').update((req.headers.get('x-forwarded-for') || '').split(',')[0].trim() + (process.env.PAYLOAD_SECRET || '')).digest('hex').slice(0, 16)

/** Ekibe (Stüdyo bildirimi): onay bekleyen yorum. 30 dakikada en fazla bir bildirim. */
let sonEkipBildirimi = 0
export async function ekibeHaberVer(p: Payload, metin: string) {
  if (Date.now() - sonEkipBildirimi < 30 * 60_000) return
  sonEkipBildirimi = Date.now()
  await havuz(p).query('select public.yorum_onay_bildir($1)', [metin.slice(0, 200)]).catch((e) => p.logger.warn(`Stüdyo bildirimi gitmedi: ${e}`))
}

/** E-posta Stüdyo'daki bir ekip üyesinin mi (site rolü olsun olmasın) */
export async function ekipMi(p: Payload, email: string) {
  const r = await havuz(p).query('select 1 from public.site_uyesi($1)', [email]).catch(() => ({ rows: [] }))
  return r.rows.length > 0
}

/* ---------------- yazı (hedef) ---------------- */
/** Giriş yapmamış okurlar için yazının topluluk yanıtı 30 sn bellekte; yorum/tepki/ekip işlemi olunca o yazınınki silinir */
export const SAYFA_ON = new Map<string, { t: number; govde: unknown }>()
export const sayfaTemizle = (anahtar: string) => { for (const k of SAYFA_ON.keys()) if (k.startsWith(anahtar + '|')) SAYFA_ON.delete(k) }

export const HEDEF_TUR = { news: 'news', reviews: 'reviews', comparisons: 'comparisons' } as const
export type Hedef = { tur: keyof typeof HEDEF_TUR; id: number; anahtar: string; yol: string; baslik: string }
const HEDEF_ON = new Map<string, { h: Hedef | null; t: number }>()
export async function hedefBul(p: Payload, anahtar: string): Promise<Hedef | null> {
  const m = /^(news|reviews|comparisons):(\d{1,9})$/.exec(anahtar || '')
  if (!m) return null
  const o = HEDEF_ON.get(anahtar)
  if (o && Date.now() - o.t < 10 * 60_000) return o.h
  const d = await p.findByID({ collection: m[1] as Hedef['tur'], id: Number(m[2]), depth: 0, overrideAccess: false, draft: false, disableErrors: true, select: { title: true, path: true } as never }).catch(() => null) as { title?: string; path?: string; _status?: string } | null
  const h: Hedef | null = d && d.path ? { tur: m[1] as Hedef['tur'], id: Number(m[2]), anahtar, yol: d.path, baslik: d.title || '' } : null
  if (HEDEF_ON.size > 5000) HEDEF_ON.clear()
  HEDEF_ON.set(anahtar, { h, t: Date.now() })
  return h
}

/* ---------------- ekip işlemleri (Stüdyo'dan) ---------------- */
/** Ekip yorumun durumunu değiştirdiğinde: yayına alınırsa puan + bildirim + Uper güvenilir olur; gizlenirse puan geri alınır. */
export const yorumDurumDegisti: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  if (operation !== 'update' || !previousDoc) return doc
  const hid = typeof doc.hedef?.value === 'object' ? doc.hedef.value?.id : doc.hedef?.value
  if (hid) sayfaTemizle(`${doc.hedef.relationTo}:${hid}`)
  if (doc.durum === previousDoc.durum || req.context?.uyeIslemi) return doc
  const uyeId = typeof doc.uye === 'object' ? doc.uye?.id : doc.uye
  if (!uyeId) return doc
  const p = req.payload
  if (doc.durum === 'yayinda') {
    await puanEkle(p, uyeId, 'yorum', `yorum:${doc.id}`)
    await havuz(p).query('update payload.uyeler set guvenilir = true where id=$1', [uyeId])
    if (previousDoc.durum === 'onay-bekliyor') {
      await bildirimEkle(p, uyeId, 'onay', 'Yorumun onaylandı ve yayında.', `${doc.yol}#yorum-${doc.id}`)
      await yanitBildir(p, doc, uyeId)
    }
  } else if (doc.durum === 'gizli') {
    await puanGeriAl(p, uyeId, 'yorum', `yorum:${doc.id}`)
    await bildirimEkle(p, uyeId, 'gizlendi', 'Bir yorumun topluluk kurallarına uymadığı için gizlendi.', '/topluluk-kurallari')
  }
  return doc
}

/** Yanıt yayına girince yanıt verilen yorumun sahibine bildirim (+ isteğe bağlı e-posta) */
export async function yanitBildir(p: Payload, yorum: any, yazanId: number) {
  const ref = yorum.yanitlanan ?? yorum.ust
  const ustId = typeof ref === 'object' ? ref?.id : ref
  if (!ustId) return
  const ust = await p.findByID({ collection: 'yorumlar', id: ustId, depth: 0, overrideAccess: true, disableErrors: true }).catch(() => null) as any
  const sahipId = ust && (typeof ust.uye === 'object' ? ust.uye?.id : ust.uye)
  if (!sahipId || sahipId === yazanId) return
  const [sahip, yazan] = await Promise.all([
    p.findByID({ collection: 'uyeler', id: sahipId, depth: 0, overrideAccess: true, disableErrors: true }) as Promise<any>,
    p.findByID({ collection: 'uyeler', id: yazanId, depth: 0, overrideAccess: true, disableErrors: true }) as Promise<any>,
  ])
  if (!sahip || !yazan) return
  const hedefId = typeof yorum.hedef?.value === 'object' ? yorum.hedef.value.id : yorum.hedef?.value
  const h = await hedefBul(p, `${yorum.hedef?.relationTo}:${hedefId}`)
  await bildirimEkle(p, sahipId, 'yanit', `${yazan.ad} yorumuna yanıt verdi${h ? `: ${h.baslik}` : ''}`, `${yorum.yol}#yorum-${yorum.id}`)
  await yanitEpostasi(p, sahip, yazan.ad, h?.baslik || 'UPDATED', `${yorum.yol}#yorum-${yorum.id}`)
}

/** Ekip Uper'i engellerse giriş servisinde de girişi kapanır; kaldırırsa açılır. */
export const uyeDurumDegisti: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  if (operation !== 'update' || !previousDoc || doc.durum === previousDoc.durum) return doc
  if (doc.durum === 'engelli' || previousDoc.durum === 'engelli') {
    await girisYonetim(`/admin/users/${encodeURIComponent(doc.authId)}`, 'PUT', { ban_duration: doc.durum === 'engelli' ? '876000h' : 'none' })
      .catch((e) => req.payload.logger.warn(`Uper engel durumu giriş servisine yazılamadı: ${e}`))
  }
  return doc
}

/** Silinen yazının yorumları, tepkileri ve kayıtları da silinir. */
export const toplulukTemizligi = (c: CollectionConfig): CollectionConfig => {
  if (!(c.slug in HEDEF_TUR)) return c
  const temizle: CollectionAfterDeleteHook = async ({ collection, id, req }) => {
    const anahtar = `${collection.slug}:${id}`
    await req.payload.delete({ collection: 'yorumlar', where: { and: [{ 'hedef.relationTo': { equals: collection.slug } }, { 'hedef.value': { equals: id } }] } as never, overrideAccess: true, req, context: { uyeIslemi: true } }).catch(() => {})
    await havuz(req.payload).query('delete from payload.uye_tepki where hedef=$1', [anahtar]).catch(() => {})
    await havuz(req.payload).query('delete from payload.uye_kayit where hedef=$1', [anahtar]).catch(() => {})
    HEDEF_ON.delete(anahtar)
  }
  return { ...c, hooks: { ...c.hooks, afterDelete: [...(c.hooks?.afterDelete ?? []), temizle] } }
}

/* ---------------- yarışma hatırlatması ---------------- */
/** Takip edilen yarışmanın son başvurusuna 3 gün kala bir kez bildirim (sitede zil + isteğe bağlı e-posta yok: kısa duyuru) */
export async function yarismaHatirlat(p: Payload) {
  const db = havuz(p)
  const r = await db.query(`select k.uye_id, k.yarisma_id, y.ad, y.son_tarih from payload.uye_yarisma k join payload.yarismalar y on y.id = k.yarisma_id
    where k.takip and not k.hatirlatildi and y.durum = 'yayinda' and y.son_tarih between now() and now() + interval '3 days' limit 500`)
  for (const x of r.rows) {
    const gun = Math.max(0, Math.ceil((+new Date(x.son_tarih) - Date.now()) / 86_400_000))
    await bildirimEkle(p, x.uye_id, 'yarisma', `${x.ad}: son başvuruya ${gun === 0 ? 'bugün son gün' : `${gun} gün kaldı`}.`, `/yarismalar#y-${x.yarisma_id}`)
    await db.query('update payload.uye_yarisma set hatirlatildi = true where uye_id=$1 and yarisma_id=$2', [x.uye_id, x.yarisma_id])
  }
}
let yarismaSaati: NodeJS.Timeout | null = null
/** Panel açılınca saatte bir hatırlatma turu (tek panel süreci çalışır) */
export function yarismaZamanlayici(p: Payload) {
  if (yarismaSaati) return
  const tur = () => yarismaHatirlat(p).catch((e) => p.logger.warn(`yarışma hatırlatması: ${e}`))
  setTimeout(tur, 60_000); yarismaSaati = setInterval(tur, 3600_000)
}
