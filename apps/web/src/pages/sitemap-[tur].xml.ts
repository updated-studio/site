import type { APIRoute } from 'astro'
import { allPaths, getCategories } from '../lib/api'
import { SITE } from '../lib/seo'
import { esc } from '../lib/format'

const MAP = { haberler: 'news', incelemeler: 'reviews', karsilastirmalar: 'comparisons', urunler: 'products' } as const
export const GET: APIRoute = async ({ params }) => {
  const tur = params.tur as string
  let urls: { loc: string; lastmod?: string; image?: string }[] = []
  if (tur === 'sayfalar') {
    const cats = await getCategories()
    urls = ['/', '/haberler', '/inceleme', '/karsilastirma', '/urun', '/kulup', ...cats.map((c) => `/${c.slug}`)].map((p) => ({ loc: SITE + (p === '/' ? '' : p) }))
  } else if (tur in MAP) {
    urls = (await allPaths(MAP[tur as keyof typeof MAP])).map((d) => ({ loc: SITE + d.path, lastmod: d.updatedAt, image: d.image }))
  } else return new Response(null, { status: 404 })
  const abs = (u: string) => (/^https?:/.test(u) ? u : SITE + u)
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map((u) => `<url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ''}${u.image ? `<image:image><image:loc>${esc(abs(u.image))}</image:loc></image:image>` : ''}</url>`).join('\n')}
</urlset>`
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, s-maxage=3600' } })
}
