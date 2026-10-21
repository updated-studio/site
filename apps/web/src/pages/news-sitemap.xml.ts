import type { APIRoute } from 'astro'
import { allPaths } from '../lib/api'
import { SITE } from '../lib/seo'
import { esc } from '../lib/format'

/** Google News site haritası: yalnız son 48 saatte yayımlanan haberler (en fazla 1000). */
export const GET: APIRoute = async () => {
  const since = new Date(Date.now() - 48 * 3600e3)
  const items = (await allPaths('news', since)).filter((d) => d.publishedAt && new Date(d.publishedAt) > since).slice(0, 1000)
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items.map((d) => `<url><loc>${SITE}${esc(d.path)}</loc><news:news><news:publication><news:name>UPDATED</news:name><news:language>tr</news:language></news:publication><news:publication_date>${new Date(d.publishedAt!).toISOString()}</news:publication_date><news:title>${esc(d.title)}</news:title></news:news></url>`).join('\n')}
</urlset>`
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, s-maxage=300' } })
}
