import type { Endpoint, PayloadRequest } from 'payload'
import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { LIMIT } from '../lib/kit'
import { cut, trSlug } from '../lib/slug'

/**
 * Stüdyo · Haber Masası → panel (WordPress'e gönderimin yerini aldı, 23 Ekim 2026). Anahtar: x-studio-key = STUDIO_IMPORT_KEY.
 *
 * GET  /api/triyaj/durum   → { ok, kategoriler[{id,name,slug}], yazar } — Stüdyo "Bağlantıyı dene" ve kategori listesi.
 * POST /api/triyaj/import  → taslak haber açar ya da günceller (aynı studioId).
 *   Gövde: { studioId, title, spot, markdown, category, label?, sources[{name,url,primary}], image?{url,credit,alt,ai},
 *            seo?{title,description,slug}, tags?[], products?[slug], shortAnswer?, priority?, cluster?, editorEmail?,
 *            lastSeen? (Stüdyo'nun son gördüğü updatedAt), force? }
 *   Kurallar: haber "incelemede" taslak olarak açılır; yayındaki ya da zamanlanmış haberin üzerine yazılmaz (409 yayinda);
 *   panelde Stüdyo'dan sonra değiştirilmiş taslağın üzerine force olmadan yazılmaz (409 duzenlendi); kategori yalnız var olanlardan
 *   (422 kategori); görsel bir kez yüklenir (aynı adres tekrar gelirse yeniden yüklenmez).
 * POST /api/triyaj/kapak   → { studioId, image } — sonradan gelen görseli (Flux) kapağı olmayan taslağa ekler.
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

/** Görseli indirip ortam kütüphanesine yükler (WebP türevlerini Media koleksiyonu üretir). Hata yazıyı engellemez. */
async function gorselYukle(req: PayloadRequest, image: any, baslik: string) {
  try {
    const c = new AbortController(); const t = setTimeout(() => c.abort(), 25_000)
    const r = await fetch(image.url, { signal: c.signal, headers: { 'User-Agent': 'UpdatedPanel/1.0 (https://updated.com.tr)' } }).finally(() => clearTimeout(t))
    if (!r.ok) return { hata: `Görsel indirilemedi (${r.status})` }
    const tur = (r.headers.get('content-type') || 'image/jpeg').split(';')[0]
    if (!/^image\/(jpeg|png|webp)$/.test(tur)) return { hata: `Görsel türü desteklenmiyor: ${tur}` }
    const buf = Buffer.from(await r.arrayBuffer())
    if (buf.length > 12_000_000) return { hata: 'Görsel çok büyük' }
    const uzanti = tur === 'image/png' ? 'png' : tur === 'image/webp' ? 'webp' : 'jpg'
    const m = await req.payload.create({
      collection: 'media',
      data: { alt: cut(image.alt || baslik, LIMIT.alt), credit: image.credit || 'Görsel: kaynak', sourceUrl: image.url, aiGenerated: !!image.ai } as any,
      file: { data: buf, mimetype: tur, name: `${trSlug(baslik) || 'haber-gorseli'}.${uzanti}`, size: buf.length },
    })
    return { id: m.id }
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
    if (!author) author = prev?.author ?? (await payload.find({ collection: 'authors', limit: 1, depth: 0, sort: 'createdAt' })).docs[0]?.id

    // Kapak: aynı görsel adresi daha önce yüklendiyse yeniden yüklenmez
    let cover: string | number | undefined = prev?.cover ?? undefined
    let gorselHata = ''
    if (body.image?.url) {
      const eski = cover ? await payload.findByID({ collection: 'media', id: cover, depth: 0 }).catch(() => null) : null
      if (!eski || (eski as any).sourceUrl !== body.image.url) {
        const y = await gorselYukle(req, body.image, body.title)
        if (y.id) cover = y.id
        gorselHata = y.hata || ''
      }
    }

    const editorConfig = await editorConfigFactory.default({ config: payload.config })
    const products = Array.isArray(body.products) && body.products.length
      ? (await payload.find({ collection: 'products', where: { slug: { in: body.products } }, depth: 0, limit: 10 })).docs.map((p) => p.id)
      : []
    const etiketler = Array.isArray(body.tags) ? body.tags.map((t: any) => String(t).trim()).filter(Boolean).slice(0, 4) : []
    const seo = body.seo || {}
    const data: any = {
      title: cut(body.title, LIMIT.title),
      spot: cut(body.spot || '', LIMIT.spot),
      category: kat.id, label: body.label || 'yok', cover, author,
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
      workflow: prev ? { ...(prev.workflow || {}), ownerUser: owner ?? prev.workflow?.ownerUser } : { state: 'incelemede', ownerUser: owner },
      triyaj: { priority: body.priority, cluster: body.cluster, studioId, importedAt: new Date().toISOString() },
      _status: 'draft',
    }
    const doc = prev
      ? await payload.update({ collection: 'news', id: prev.id, data, draft: true })
      : await payload.create({ collection: 'news', data, draft: true })
    return Response.json({ ...linkler(doc), updated: !!prev, kategori: kat.name, kapak: !!cover, gorselHata })
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
    const doc = await req.payload.update({ collection: 'news', id: prev.id, data: { cover: y.id, _status: 'draft' } as any, draft: true })
    return Response.json({ ok: true, ...linkler(doc) })
  },
}
