import type { APIRoute } from 'astro'
import { getLatest, getProduct } from '../lib/api'
import { SITE } from '../lib/seo'
import { esc } from '../lib/format'

/** RSS: son 30 haber. ?urun=slug → yalnız o ürünün haberleri ve incelemeleri (künyede "Takip et"). */
export const GET: APIRoute = async ({ url }) => {
  const urun = url.searchParams.get('urun')
  const p = urun ? await getProduct(urun) : null
  const items = p ? [...p.news, ...p.reviews].sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt)) : await getLatest(1, 30)
  const title = p ? `UPDATED · ${p.name}` : 'UPDATED'
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
<channel><title>${esc(title)}</title><link>${SITE}${p ? p.path : ''}</link><description>Teknoloji haberleri, incelemeler ve karşılaştırmalar.</description><language>tr</language>
<atom:link href="${esc(url.href)}" rel="self" type="application/rss+xml"/>
${items.map((n) => `<item><title>${esc(n.title)}</title><link>${SITE}${n.path}</link><guid isPermaLink="true">${SITE}${n.path}</guid><pubDate>${new Date(n.publishedAt).toUTCString()}</pubDate><description>${esc(n.spot)}</description><dc:creator xmlns:dc="http://purl.org/dc/elements/1.1/">${esc(n.author.name)}</dc:creator>${n.cover ? `<media:content url="${esc(/^https?:/.test(n.cover.url) ? n.cover.url : SITE + n.cover.url)}" medium="image"/>` : ''}</item>`).join('\n')}
</channel></rss>`
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=300, s-maxage=600' } })
}
