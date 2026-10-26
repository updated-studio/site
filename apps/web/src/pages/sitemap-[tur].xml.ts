import type { APIRoute } from 'astro'
import { ARACLAR } from '../lib/araclar'
import { allPages, allPaths, getCategories, getProducts } from '../lib/api'
import { SITE } from '../lib/seo'
import { esc } from '../lib/format'

const MAP = { haberler: 'news', incelemeler: 'reviews', karsilastirmalar: 'comparisons', urunler: 'products' } as const
export function getStaticPaths() { return ['sayfalar', 'haberler', 'incelemeler', 'karsilastirmalar', 'urunler'].map((tur) => ({ params: { tur } })) }
export const GET: APIRoute = async ({ params }) => {
  const tur = params.tur as string
  let urls: { loc: string; lastmod?: string; image?: string }[] = []
  if (tur === 'sayfalar') {
    const cats = await getCategories()
    urls = ['/', '/haberler', '/inceleme', '/karsilastirma', '/urun', '/kulup', ...cats.map((c) => `/${c.slug}`), ...(await allPages()).map((s) => `/${s}`), '/topluluk-kurallari', '/uyelik-sozlesmesi', '/uyelik-aydinlatma-metni', '/araclar', ...ARACLAR.map((a) => a.yol), '/yarismalar'].map((p) => ({ loc: SITE + (p === '/' ? '' : p) }))
  } else if (tur === 'urunler') {
    // Yalnız dolu künyeler (en az 5 özellik değeri): boş künye arama motoruna "ince içerik" olarak gitmesin (sayfası da noindex)
    const r = await getProducts(5000)
    urls = r.filter((p) => (p.specs || []).filter((s) => s.value).length >= 5).map((p) => ({ loc: `${SITE}/urun/${p.slug}`, image: p.image?.url }))
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
