import type { Endpoint, PayloadRequest } from 'payload'
import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { LIMIT } from '../lib/kit'
import { cut, trSlug } from '../lib/slug'
import { baslikUydur, makineDenetimi } from '../lib/triyajKural'
import sharp from 'sharp'
import { sql } from '@payloadcms/db-postgres'

/**
 * Stüdyo · Haber Masası → panel (WordPress'e gönderimin yerini aldı, 23 Ekim 2026). Anahtar: x-studio-key = STUDIO_IMPORT_KEY.
 *
 * GET  /api/triyaj/durum   → { ok, kategoriler[{id,name,slug}], yazar } — Stüdyo "Bağlantıyı dene" ve kategori listesi.
 * POST /api/triyaj/import  → taslak haber açar ya da günceller (aynı studioId).
 *   Gövde: { studioId, title, spot, markdown, category, label?, sources[{name,url,primary}], image?{url,credit,alt,ai},
 *            seo?{title,description,slug}, tags?[], products?[slug], shortAnswer?, priority?, cluster?, editorEmail?,
 *            leak?{knowns[],unknowns[],certainty}, lastSeen? (Stüdyo'nun son gördüğü updatedAt), force? }
 *   Kurallar: haber "incelemede" taslak olarak açılır; yayındaki ya da zamanlanmış haberin üzerine yazılmaz (409 yayinda);
 *   panelde Stüdyo'dan sonra değiştirilmiş taslağın üzerine force olmadan yazılmaz (409 duzenlendi); kategori yalnız var olanlardan
 *   (422 kategori); görsel bir kez yüklenir (aynı adres tekrar gelirse yeniden yüklenmez) ve 16:9'a kırpılır (önemli yer ortada).
 *   Yayın kurallarına uydurulur (lib/triyajKural.ts): başlık düzeltilir, kontrol listesinin ölçülebilir maddeleri işaretlenir;
 *   yanıtta eksikler (editörün tamamlayacakları) ve duzeltmeler döner.
 * POST /api/triyaj/kapak   → { studioId, image } — sonradan gelen görseli (Flux) kapağı olmayan taslağa ekler.
 * POST /api/triyaj/temizle → { gun, taslaklar: [{ studioId, lastSeen }] } — panelde `gun` gündür kimsenin dokunmadığı
 *   otomatik taslakları (son sürüm Stüdyo'nun son gördüğüyle aynı, yayında/planlı değil) ve yalnız onların kullandığı kapakları siler
 *   (Fatih, 24 Ekim 2026: taslak birikmesi). Yanıt: { silinen: studioId[] }.
 */

const yetkili = (req: PayloadRequest) => !!process.env.STUDIO_IMPORT_KEY && req.headers.get('x-studio-key') === process.env.STUDIO_IMPORT_KEY
const yetkisiz = () => Response.json({ error: 'Yetkisiz', code: 'yetki' }, { status: 401 })
const anahtar = (s: string) => trSlug(String(s || ''), 20)

async function kategoriBul(req: PayloadRequest, ad: string) {
  const liste = await req.payload.find({ collection: 'categories', limit: 200, depth: 0, pagination: false })
  const k = anahtar(ad)
  return liste.docs.find((c: any) => c.slug === k || anahtar(c.name) === k)
}

async function bulStudyo(req: PayloadRequest, studioId: string) {
  if (!studioId) return undefined
  const r = await req.payload.find({ collection: 'news', where: { 'triyaj.studioId': { equals: studioId } }, limit: 1, depth: 0, draft: true })
  return r.docs[0] as any
}

type KapakBilgi = { width?: number; height?: number; alt?: string; credit?: string; aiGenerated?: boolean; representative?: boolean }

/** Görseli 16:9'a kırpar; görselin en dikkat çeken bölgesi (sharp "attention") kadrajda kalır */
async function onAltiyaDokuz(buf: Buffer) {
  const m = await sharp(buf).metadata()
  const w = m.width ?? 0, h = m.height ?? 0
  if (!w || !h || Math.abs(w / h - 16 / 9) < 0.01) return { buf, w, h, kirpildi: false }
  const [tw, th] = w / h > 16 / 9 ? [Math.round((h * 16) / 9), h] : [w, Math.round((w * 9) / 16)]
  const out = await sharp(buf).rotate().resize(tw, th, { fit: 'cover', position: sharp.strategy.attention }).jpeg({ quality: 92, mozjpeg: true }).toBuffer()
  return { buf: out, w: tw, h: th, kirpildi: true }
}

/** Görseli indirip ortam kütüphanesine yükler (WebP türevlerini Media koleksiyonu üretir). Hata yazıyı engellemez. */
async function gorselYukle(req: PayloadRequest, image: any, baslik: string): Promise<{ id?: number | string; kapak?: KapakBilgi; hata?: string }> {
  try {
    const c = new AbortController(); const t = setTimeout(() => c.abort(), 25_000)
    const r = await fetch(image.url, { signal: c.signal, headers: { 'User-Agent': 'UpdatedPanel/1.0 (https://updated.com.tr)' } }).finally(() => clearTimeout(t))
    if (!r.ok) return { hata: `Görsel indirilemedi (${r.status})` }
    const tur = (r.headers.get('content-type') || 'image/jpeg').split(';')[0]
    if (!/^image\/(jpeg|png|webp)$/.test(tur)) return { hata: `Görsel türü desteklenmiyor: ${tur}` }
    const ham = Buffer.from(await r.arrayBuffer())
    if (ham.length > 12_000_000) return { hata: 'Görsel çok büyük' }
    const k = await onAltiyaDokuz(ham)
    const mime = k.kirpildi ? 'image/jpeg' : tur
    const uzanti = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'
    const m: any = await req.payload.create({
      collection: 'media',
      data: { alt: cut(image.alt || baslik, LIMIT.alt), credit: image.credit || 'Görsel: kaynak', sourceUrl: image.url, aiGenerated: !!image.ai } as any,
      file: { data: k.buf, mimetype: mime, name: `${trSlug(baslik) || 'haber-gorseli'}.${uzanti}`, size: k.buf.length },
    })
    // Odak noktası (28 Ekim 2026): yapay zekâ seçerken konunun yerini verdiyse küçük boyutlar ve sitenin kırpmaları o noktaya göre
    const o = image.odak
    if (o && typeof o === 'object') {
      const yz = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : 50 }
      const fx = yz(o.x), fy = yz(o.y)
      if (fx !== 50 || fy !== 50) try { await req.payload.update({ collection: 'media', id: m.id, data: { focalX: fx, focalY: fy } as any, overrideAccess: true }) } catch (e) { req.payload.logger.warn(`odak noktası yazılamadı: ${e}`) }
    }
    return { id: m.id, kapak: { width: m.width, height: m.height, alt: m.alt, credit: m.credit, aiGenerated: m.aiGenerated, representative: m.representative } }
  } catch (e) {
    req.payload.logger.warn(`Triyaj görseli alınamadı: ${e}`)
    return { hata: `Görsel yüklenemedi: ${String((e as Error)?.message ?? e).slice(0, 120)}` }
  }
}

const linkler = (doc: any) => ({
  id: doc.id,
  updatedAt: doc.updatedAt,
  admin: `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/admin/collections/news/${doc.id}`,
  preview: `${process.env.WEB_URL}/onizleme?tur=haber&id=${doc.id}&k=${process.env.PREVIEW_SECRET || ''}`,
})

export const triyajDurum: Endpoint = {
  path: '/triyaj/durum',
  method: 'get',
  handler: async (req) => {
    if (!yetkili(req)) return yetkisiz()
    const k = await req.payload.find({ collection: 'categories', limit: 200, depth: 0, pagination: false })
    const y = await req.payload.find({ collection: 'authors', limit: 1, depth: 0 })
    return Response.json({
      ok: true,
      kategoriler: k.docs.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug })),
      yazar: y.totalDocs,
      panel: process.env.PAYLOAD_PUBLIC_SERVER_URL,
    })
  },
}

export const triyajImport: Endpoint = {
  path: '/triyaj/import',
  method: 'post',
  handler: async (req) => {
    if (!yetkili(req)) return yetkisiz()
    const body = await req.json?.()
    if (!body?.title || !body?.markdown || !body?.category)
      return Response.json({ error: 'title, markdown ve category zorunlu', code: 'eksik' }, { status: 400 })
    const { payload } = req
    const studioId = String(body.studioId || '')

    const prev = await bulStudyo(req, studioId)
    if (prev) {
      if (prev._status === 'published' || ['planlandi', 'yayinda', 'arsiv'].includes(prev.workflow?.state))
        return Response.json({ error: 'Bu haber panelde yayınlanmış ya da planlanmış; Stüdyo üzerine yazmaz.', code: 'yayinda', ...linkler(prev) }, { status: 409 })
      if (!body.force && body.lastSeen && prev.updatedAt !== body.lastSeen)
        return Response.json({ error: 'Bu taslak panelde düzenlenmiş; üzerine yazılmadı.', code: 'duzenlendi', ...linkler(prev) }, { status: 409 })
    }

    const kat = await kategoriBul(req, body.category)
    if (!kat) return Response.json({ error: `"${body.category}" kategorisi panelde yok.`, code: 'kategori' }, { status: 422 })

    let author: string | number | undefined, owner: string | number | undefined
    if (body.editorEmail) {
      const u = await payload.find({ collection: 'users', where: { email: { equals: String(body.editorEmail).toLowerCase() } }, limit: 1, depth: 0 })
      owner = u.docs[0]?.id; author = (u.docs[0] as any)?.author
    }
    // Editörü olmayan otomatik taslak "Updated Stüdyo" imzasıyla açılır (önceden listedeki ilk yazar, "admin" oluyordu);
    // bir editör yayına alınca imza onun olur (hooks/imza.ts)
    if (!author) author = prev?.author ?? (await payload.find({ collection: 'authors', where: { slug: { equals: 'studyo' } }, limit: 1, depth: 0 })).docs[0]?.id
      ?? (await payload.find({ collection: 'authors', limit: 1, depth: 0, sort: 'createdAt' })).docs[0]?.id

    // Kapak: aynı görsel adresi daha önce yüklendiyse yeniden yüklenmez
    const label = body.label || 'yok'
    const { baslik, duzeltmeler } = baslikUydur(body.title, label)
    let cover: string | number | undefined = prev?.cover ?? undefined
    let gorselHata = ''
    const eski: any = cover ? await payload.findByID({ collection: 'media', id: cover, depth: 0 }).catch(() => null) : null
    let kapak: KapakBilgi | null = eski
    if (body.image?.url && (!eski || eski.sourceUrl !== body.image.url)) {
      const y = await gorselYukle(req, body.image, baslik)
      if (y.id) { cover = y.id; kapak = y.kapak ?? null }
      gorselHata = y.hata || ''
    }

    const editorConfig = await editorConfigFactory.default({ config: payload.config })
    const products = Array.isArray(body.products) && body.products.length
      ? (await payload.find({ collection: 'products', where: { slug: { in: body.products } }, depth: 0, limit: 10 })).docs.map((p) => p.id)
      : []
    const etiketler = Array.isArray(body.tags) ? body.tags.map((t: any) => String(t).trim()).filter(Boolean).slice(0, 4) : []
    const seo = body.seo || {}
    const leak = label === 'sizinti' && body.leak ? {
      knowns: (Array.isArray(body.leak.knowns) ? body.leak.knowns : []).map(String).filter(Boolean).slice(0, 8),
      unknowns: (Array.isArray(body.leak.unknowns) ? body.leak.unknowns : []).map(String).filter(Boolean).slice(0, 8),
      certainty: ['1', '2', '3', '4'].includes(String(body.leak.certainty)) ? String(body.leak.certainty) : undefined,
    } : null
    const spot = cut(body.spot || '', LIMIT.spot)
    const seoTitle = seo.title ? cut(seo.title, LIMIT.seoTitle) : cut(baslik, LIMIT.seoTitle)
    const denetim = makineDenetimi({ title: baslik, spot, seoTitle, category: kat.id, label, kapak, shortAnswer: body.shortAnswer, sizinti: leak ?? undefined })
    const data: any = {
      title: baslik,
      spot,
      category: kat.id, label, cover, author,
      ...(leak ? { knowns: leak.knowns, unknowns: leak.unknowns, ...(leak.certainty ? { certainty: leak.certainty } : {}) } : {}),
      ...(products.length ? { products } : {}),
      ...(body.shortAnswer ? { shortAnswer: body.shortAnswer } : {}),
      // SEO: Stüdyo'nun yazdığı değer korunur; boş olan alanı panel otomatik doldurur. Etiketler sayfa açmaz, yalnız varlık (schema "mentions").
      seo: {
        ...(prev?.seo || {}),
        ...(seo.title ? { title: cut(seo.title, LIMIT.seoTitle) } : {}),
        ...(seo.description ? { description: cut(seo.description, LIMIT.spot) } : {}),
        ...(etiketler.length ? { geo: { ...(prev?.seo?.geo || {}), entities: etiketler } } : {}),
      },
      ...(!prev && seo.slug ? { slug: seo.slug } : {}),
      body: convertMarkdownToLexical({ editorConfig, markdown: body.markdown }),
      sources: Array.isArray(body.sources) ? body.sources.filter((s: any) => s?.name).slice(0, 8) : [],
      // Ölçülebilir maddeler her gönderimde yeniden ölçülür; editörün işaretlediği diğer maddeler korunur
      workflow: prev
        ? { ...(prev.workflow || {}), ownerUser: owner ?? prev.workflow?.ownerUser, checklist: { ...(prev.workflow?.checklist || {}), ...denetim.checklist } }
        : { state: 'incelemede', ownerUser: owner, checklist: denetim.checklist },
      triyaj: { priority: body.priority, cluster: body.cluster, studioId, importedAt: new Date().toISOString() },
      _status: 'draft',
    }
    const doc = prev
      ? await payload.update({ collection: 'news', id: prev.id, data, draft: true })
      : await payload.create({ collection: 'news', data, draft: true })
    return Response.json({ ...linkler(doc), updated: !!prev, kategori: kat.name, kapak: !!cover, gorselHata, eksikler: denetim.eksikler, duzeltmeler })
  },
}

export const triyajKapak: Endpoint = {
  path: '/triyaj/kapak',
  method: 'post',
  handler: async (req) => {
    if (!yetkili(req)) return yetkisiz()
    const body = await req.json?.()
    const prev = await bulStudyo(req, String(body?.studioId || ''))
    if (!prev) return Response.json({ error: 'Haber panelde yok', code: 'yok' }, { status: 404 })
    if (prev._status === 'published' || prev.cover) return Response.json({ ok: false, error: 'Haberin zaten kapağı var ya da yayında; dokunulmadı.', ...linkler(prev) }, { status: 409 })
    if (!body?.image?.url) return Response.json({ error: 'image.url gerekli', code: 'eksik' }, { status: 400 })
    const y = await gorselYukle(req, body.image, prev.title)
    if (!y.id) return Response.json({ ok: false, error: y.hata }, { status: 502 })
    const denetim = makineDenetimi({ title: prev.title ?? '', spot: prev.spot ?? '', seoTitle: prev.seo?.title, category: prev.category, label: prev.label ?? 'yok', kapak: y.kapak ?? null, shortAnswer: prev.shortAnswer, sizinti: { knowns: prev.knowns, unknowns: prev.unknowns, certainty: prev.certainty } })
    const workflow = { ...(prev.workflow || {}), checklist: { ...(prev.workflow?.checklist || {}), kapak: denetim.checklist.kapak, alt: denetim.checklist.alt, kunye: denetim.checklist.kunye } }
    const doc = await req.payload.update({ collection: 'news', id: prev.id, data: { cover: y.id, workflow, _status: 'draft' } as any, draft: true })
    return Response.json({ ok: true, ...linkler(doc), eksikler: denetim.eksikler })
  },
}

/** Görsel hiçbir kayıtta (sürümler dahil) kullanılmıyorsa siler */
async function sahipsizseSil(req: PayloadRequest, id: number) {
  const n = Number(id)
  if (!Number.isInteger(n)) return
  const r: any = await (req.payload.db as any).drizzle.execute(sql.raw(
    ['news', 'reviews', 'comparisons'].map((t) => `select 1 from payload.${t} where cover_id=${n} or seo_image_id=${n} union all select 1 from payload._${t}_v where version_cover_id=${n} or version_seo_image_id=${n}`)
      .concat([`select 1 from payload.reels where cover_id=${n}`, `select 1 from payload.products where image_id=${n} or seo_image_id=${n}`, `select 1 from payload.pages where seo_image_id=${n}`,
        `select 1 from payload.ads where image_id=${n} or mobile_image_id=${n}`, `select 1 from payload.authors where avatar_id=${n}`, `select 1 from payload.videos where thumb_id=${n}`, `select 1 from payload.kulup_tracks where image_id=${n}`])
      .join(' union all ') + ' limit 1'))
  if ((r.rows ?? r).length) return
  await req.payload.delete({ collection: 'media', id: n, overrideAccess: true })
}

export const triyajTemizle: Endpoint = {
  path: '/triyaj/temizle',
  method: 'post',
  handler: async (req) => {
    if (!yetkili(req)) return yetkisiz()
    const body = await req.json?.()
    const gun = Number(body?.gun)
    const liste = (Array.isArray(body?.taslaklar) ? body.taslaklar : []).slice(0, 50)
    if (!(gun >= 1) || !liste.length) return Response.json({ error: 'gun ve taslaklar gerekli', code: 'eksik' }, { status: 400 })
    const sinir = Date.now() - gun * 86_400_000
    const silinen: string[] = []
    for (const t of liste) {
      const studioId = String(t?.studioId || '')
      const d = await bulStudyo(req, studioId)
      if (!d) { silinen.push(studioId); continue } // panelde zaten yok: Stüdyo bağı temizlesin
      const el = d.updatedAt !== t.lastSeen // Stüdyo'nun son gönderiminden sonra biri dokunmuş (otomatik kayıt dahil)
      const yeni = !d.triyaj?.importedAt || Date.parse(d.triyaj.importedAt) > sinir
      if (el || yeni || d._status === 'published' || ['yayinda', 'planlandi'].includes(d.workflow?.state)) continue
      await req.payload.delete({ collection: 'news', id: d.id, overrideAccess: true })
      for (const m of new Set([d.cover, d.seo?.image].filter(Boolean))) await sahipsizseSil(req, m).catch(() => {})
      silinen.push(studioId)
    }
    return Response.json({ silinen })
  },
}
