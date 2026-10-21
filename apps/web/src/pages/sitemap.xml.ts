import type { APIRoute } from 'astro'
import { SITE } from '../lib/seo'

/** Site haritası dizini. Haber haritası (son 48 saat) ayrı: /news-sitemap.xml */
export const GET: APIRoute = async () => {
  const parts = ['sayfalar', 'haberler', 'incelemeler', 'karsilastirmalar', 'urunler']
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${parts.map((p) => `<sitemap><loc>${SITE}/sitemap-${p}.xml</loc></sitemap>`).join('\n')}
<sitemap><loc>${SITE}/news-sitemap.xml</loc></sitemap>
</sitemapindex>`
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, s-maxage=3600' } })
}
