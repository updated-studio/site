import type { News, Review } from './types'
import { SITE } from './seo'
import { esc } from './format'

export function rss(title: string, path: string, items: (News | Review)[]) {
  const abs = (u: string) => (/^https?:/.test(u) ? u : SITE + u)
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel><title>${esc(title)}</title><link>${SITE}${path}</link><description>Teknoloji haberleri, incelemeler ve karşılaştırmalar.</description><language>tr</language>
<atom:link href="${SITE}${path ? `/rss${path}.xml` : '/rss.xml'}" rel="self" type="application/rss+xml"/>
${items.map((n) => `<item><title>${esc(n.title)}</title><link>${SITE}${n.path}</link><guid isPermaLink="true">${SITE}${n.path}</guid><pubDate>${new Date(n.publishedAt).toUTCString()}</pubDate><description>${esc(n.spot)}</description><dc:creator>${esc(n.author.name)}</dc:creator>${n.cover ? `<media:content url="${esc(abs(n.cover.url))}" medium="image"/>` : ''}</item>`).join('\n')}
</channel></rss>`
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } })
}
