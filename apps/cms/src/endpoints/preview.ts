import { headersWithCors, type Endpoint } from 'payload'

/**
 * GET /api/onizleme/:tur/:id?k=PREVIEW_SECRET — statik sitedeki önizleme sayfası taslağı buradan okur.
 * Parola panel sunucusunda doğrulanır; yanıt önbelleğe alınmaz.
 */
const COLL: Record<string, 'news' | 'reviews' | 'comparisons'> = { haber: 'news', inceleme: 'reviews', karsilastirma: 'comparisons' }
export const previewEndpoint: Endpoint = {
  path: '/onizleme/:tur/:id',
  method: 'get',
  handler: async (req) => {
    const headers = headersWithCors({ headers: new Headers({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' }), req })
    const secret = process.env.PREVIEW_SECRET
    const k = new URL(req.url || '', 'http://x').searchParams.get('k')
    if (!secret || k !== secret) return Response.json({ error: 'Yetkisiz' }, { status: 401, headers })
    const coll = COLL[String(req.routeParams?.tur)]
    if (!coll) return Response.json({ error: 'Tür yok' }, { status: 404, headers })
    try {
      const doc = await req.payload.findByID({ collection: coll, id: String(req.routeParams?.id), draft: true, depth: 2, overrideAccess: true })
      return Response.json(doc, { headers })
    } catch {
      return Response.json({ error: 'Bulunamadı' }, { status: 404, headers })
    }
  },
}
