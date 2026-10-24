import type { CollectionAfterChangeHook, CollectionConfig, Payload } from 'payload'

/**
 * Siteden gelenler (Otomasyon 3+4, 24 Ekim 2026): bir haber / inceleme / karşılaştırma ilk kez yayınlanınca Stüdyo'ya bildirilir
 * (Stüdyo göç 0031: public.icerik_gelen_ekle). Stüdyo'da İçerik → Siteden gelenler'e düşer, hazırlayana (yoksa yayınlayana) İşler'de iş açılır.
 * Format kuralı (Fatih onayladı): son dakika ve sızıntı Story, diğerleri Post; sponsorlu hiç gelmez. Şablon seçimi Stüdyo'da (motor orada).
 * Hata yayını asla durdurmaz: yalnız kayda yazılır.
 */
type Tur = 'news' | 'reviews' | 'comparisons'
const havuz = (p: Payload) => (p.db as unknown as { pool: { query: (q: string, v?: unknown[]) => Promise<unknown> } }).pool

const medyaAdresi = (m: any): string | null => (m && typeof m === 'object' ? m.url || m.sizes?.hero?.url || null : null)
const adOf = (x: any) => (x && typeof x === 'object' ? x.name || x.title || '' : '')
const IS_KATEGORI: [RegExp, string][] = [[/telefon|mobil|phone|tablet/i, 'telefon'], [/bilgisayar|laptop|pc|computer/i, 'bilgisayar'], [/dron|drone/i, 'drone'], [/lens/i, 'lens'], [/kamera|camera|cam360|fotoğraf/i, 'kamera']]
const isKategori = (...s: string[]) => { const m = s.join(' '); for (const [r, k] of IS_KATEGORI) if (r.test(m)) return k; return 'kamera' }

/** Zengin metindeki ara başlıklar (rehberde liste slaytı için) */
function araBasliklar(body: any): string[] {
  const out: string[] = []
  const gez = (n: any) => {
    if (!n || out.length >= 6) return
    if (n.type === 'heading' && (n.tag === 'h2' || n.tag === 'h3')) { const t = (n.children || []).map((c: any) => c.text || '').join('').trim(); if (t) out.push(t.slice(0, 80)) }
    ;(n.children || []).forEach(gez)
  }
  gez(body?.root)
  return out
}

async function bildir(p: Payload, tur: Tur, id: number | string, yayinlayanEposta: string | null) {
  const d = await p.findByID({ collection: tur, id, depth: 2, overrideAccess: true, draft: false }) as any
  if (!d || d._status !== 'published' || !d.path) return
  const etiket = String(d.label || 'yok')
  if (etiket === 'sponsorlu') return
  const sahip = d.workflow?.ownerUser && typeof d.workflow.ownerUser === 'object' ? d.workflow.ownerUser.email : null
  const ek: Record<string, unknown> = {}
  let kategori = '', marka = '', isKat = ''
  if (tur === 'news') {
    kategori = adOf(d.category); const pr = (d.products || [])[0]; marka = pr?.brand || ''
    isKat = isKategori(d.category?.slug || '', kategori, pr?.type || '')
    if (etiket === 'rehber') ek.basliklar = araBasliklar(d.body)
    if (etiket === 'sizinti') { ek.bilinenler = (d.knowns || []).slice(0, 4); ek.kesinlik = d.certainty || null }
  } else if (tur === 'reviews') {
    const pr = d.product || {}; kategori = 'İnceleme'; marka = pr.brand || ''; isKat = isKategori(pr.type || '', pr.name || '')
    Object.assign(ek, { urun: pr.name || d.title, puan: d.scoreBox?.score ?? null, artilar: d.scoreBox?.pros || [], eksiler: d.scoreBox?.cons || [], karar: d.shortAnswer || '', urunGorsel: medyaAdresi(pr.image) })
  } else {
    const a = d.a || {}, b = d.b || {}; kategori = 'Karşılaştırma'; marka = [a.brand, b.brand].filter(Boolean).join(' / '); isKat = isKategori(a.type || '', b.type || '')
    Object.assign(ek, { a: a.name || '', b: b.name || '', aGorsel: medyaAdresi(a.image), bGorsel: medyaAdresi(b.image), farklar: (d.keyDiffs || []).slice(0, 4).map((x: any) => ({ buyuk: x.big, ad: x.label, kazanan: x.winner || null })), karar: d.shortAnswer || '' })
  }
  const govde = {
    kaynak: `${tur}:${d.id}`, tur, format: etiket === 'son-dakika' || etiket === 'sizinti' ? 'story' : 'post',
    baslik: d.title || '', spot: d.spot || '', kategori, etiket, yol: d.path, gorsel: medyaAdresi(d.cover), ek,
    eposta: sahip || yayinlayanEposta || '', marka, is_kategori: isKat,
  }
  await havuz(p).query('select public.icerik_gelen_ekle($1::jsonb)', [JSON.stringify(govde)])
}

const kanca = (tur: Tur): CollectionAfterChangeHook => ({ doc, previousDoc, req }) => {
  // Yalnız ilk yayın: taslaktan (ya da yeni) yayına geçiş. Yayındaki yazının düzeltmesi yeni iş açmaz.
  if (doc?._status !== 'published' || previousDoc?._status === 'published' || req.context?.icerikGelenYok) return doc
  const eposta = (req.user as any)?.email ?? null
  // Kayıt işlemi bitip veritabanına yazıldıktan sonra okunsun diye birkaç saniye sonra
  setTimeout(() => { bildir(req.payload, tur, doc.id, eposta).catch((e) => req.payload.logger.warn(`Siteden gelenler: ${tur}:${doc.id} Stüdyo'ya bildirilemedi: ${e}`)) }, 4000)
  return doc
}

/** Haber, inceleme ve karşılaştırma koleksiyonlarına yayın kancasını ekler */
export const icerikGelenKancasi = (c: CollectionConfig): CollectionConfig =>
  c.slug === 'news' || c.slug === 'reviews' || c.slug === 'comparisons'
    ? { ...c, hooks: { ...c.hooks, afterChange: [...(c.hooks?.afterChange ?? []), kanca(c.slug as Tur)] } }
    : c
