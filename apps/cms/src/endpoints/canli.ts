import { headersWithCors, type Endpoint } from 'payload'

/**
 * GET /api/canli — sitenin "anlık" katmanı: son 12 yayımlanmış haber (başlık, adres, saat, etiket, kategori).
 * Statik sayfa yeniden derlenene kadar (1–2 dk) yeni haber son dakika şeridinde ve yan sütunda hemen görünür.
 * 10 sn bellekte tutulur; her ziyaretçi isteği veritabanına gitmez.
 */
let cache: { at: number; body: string } | null = null
export const canliEndpoint: Endpoint = {
  path: '/canli',
  method: 'get',
  handler: async (req) => {
    const headers = headersWithCors({ headers: new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=15' }), req })
    if (!cache || Date.now() - cache.at > 10_000) {
      const r = await req.payload.find({ collection: 'news', where: { _status: { equals: 'published' } }, sort: '-publishedAt', limit: 12, depth: 1, overrideAccess: false, select: { title: true, path: true, publishedAt: true, label: true, category: true } as any })
      const items = r.docs.map((d: any) => ({ t: d.title, h: d.path, at: d.publishedAt, l: d.label, c: typeof d.category === 'object' ? d.category?.name : '' }))
      cache = { at: Date.now(), body: JSON.stringify({ items, now: new Date().toISOString() }) }
    }
    return new Response(cache.body, { headers })
  },
}
