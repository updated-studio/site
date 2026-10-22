import type { Endpoint } from 'payload'
import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { cut, trSlug } from '../lib/slug'

/**
 * POST /api/triyaj/import — Stüdyo · Haber Masası taslağı gönderir (WordPress'e gönderimin yerini alır).
 * Başlık: x-studio-key: <STUDIO_IMPORT_KEY>
 * Gövde: { studioId, title, spot, markdown, category, label?, sources[{name,url,primary}], image?{url,credit,alt},
 *          priority?, cluster?, editorEmail?, products?[slug], shortAnswer? }
 * Sonuç: taslak haber "incelemede" durumunda açılır; aynı studioId ikinci kez gelirse günceller.
 */
export const triyajImport: Endpoint = {
  path: '/triyaj/import',
  method: 'post',
  handler: async (req) => {
    if (req.headers.get('x-studio-key') !== process.env.STUDIO_IMPORT_KEY || !process.env.STUDIO_IMPORT_KEY)
      return Response.json({ error: 'Yetkisiz' }, { status: 401 })
    const body = await req.json?.()
    if (!body?.title || !body?.markdown || !body?.category) return Response.json({ error: 'title, markdown ve category zorunlu' }, { status: 400 })
    const { payload } = req

    const cat = await payload.find({ collection: 'categories', where: { slug: { equals: trSlug(body.category) } }, limit: 1, depth: 0 })
    const category = cat.docs[0]?.id ?? (await payload.create({ collection: 'categories', data: { name: body.category } })).id

    let author: string | number | undefined, owner: string | number | undefined
    if (body.editorEmail) {
      const u = await payload.find({ collection: 'users', where: { email: { equals: body.editorEmail } }, limit: 1, depth: 0 })
      owner = u.docs[0]?.id; author = (u.docs[0] as any)?.author
    }
    if (!author) author = (await payload.find({ collection: 'authors', limit: 1, depth: 0, sort: 'createdAt' })).docs[0]?.id

    let cover: string | number | undefined
    if (body.image?.url) {
      try {
        const r = await fetch(body.image.url)
        const buf = Buffer.from(await r.arrayBuffer())
        const m = await payload.create({
          collection: 'media',
          data: { alt: cut(body.image.alt || body.title, 125), credit: body.image.credit || 'Görsel: kaynak', sourceUrl: body.image.url, aiGenerated: !!body.image.ai },
          file: { data: buf, mimetype: r.headers.get('content-type') || 'image/jpeg', name: `${trSlug(body.title)}.jpg`, size: buf.length },
        })
        cover = m.id
      } catch (e) { payload.logger.warn(`Triyaj görseli alınamadı: ${e}`) }
    }

    const editorConfig = await editorConfigFactory.default({ config: payload.config })
    const products = body.products?.length
      ? (await payload.find({ collection: 'products', where: { slug: { in: body.products } }, depth: 0, limit: 10 })).docs.map((p) => p.id)
      : []
    const data: any = {
      title: cut(body.title, 70),
      spot: cut(body.spot || '', 160),
      category, label: body.label || 'yok', cover, author, products,
      shortAnswer: body.shortAnswer,
      // Stüdyo'nun etiketleri: sayfa açılmaz, yalnız marka/ürün varlığı olarak (arama motoru ve yapay zekâ için schema "mentions") en fazla 4
      ...(Array.isArray(body.tags) && body.tags.length ? { seo: { entities: body.tags.map((t: any) => String(t).trim()).filter(Boolean).slice(0, 4) } } : {}),
      body: convertMarkdownToLexical({ editorConfig, markdown: body.markdown }),
      sources: body.sources || [],
      workflow: { state: 'incelemede', ownerUser: owner },
      triyaj: { priority: body.priority, cluster: body.cluster, studioId: String(body.studioId || ''), importedAt: new Date().toISOString() },
      _status: 'draft',
    }
    const prev = body.studioId ? await payload.find({ collection: 'news', where: { 'triyaj.studioId': { equals: String(body.studioId) } }, limit: 1, depth: 0, draft: true }) : { docs: [] as any[] }
    const doc = prev.docs[0]
      ? await payload.update({ collection: 'news', id: prev.docs[0].id, data, draft: true })
      : await payload.create({ collection: 'news', data, draft: true })
    const admin = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/admin/collections/news/${doc.id}`
    return Response.json({ id: doc.id, admin, preview: `${process.env.WEB_URL}/onizleme?tur=haber&id=${doc.id}&k=${process.env.PREVIEW_SECRET || ''}`, updated: !!prev.docs[0] })
  },
}
