import type { APIRoute } from 'astro'
import { getCategories, getLatest, getReviews } from '../lib/api'
import { SITE } from '../lib/seo'

/** llms.txt — yapay zekâ asistanları için site özeti (GEO). */
export const GET: APIRoute = async () => {
  const [cats, news, reviews] = await Promise.all([getCategories(), getLatest(1, 20), getReviews(1, 10)])
  const md = `# UPDATED

> Türkçe teknoloji haberleri, incelemeler ve karşılaştırmalar. Önce bilgi, sonra yorum. Her haberde birincil kaynak; incelemelerde /20 puan, kullanım süresi ve cihazın kaynağı yazılır. Sızıntılar "Sızıntı" etiketiyle ayrılır.

## Bölümler
${cats.map((c) => `- [${c.name}](${SITE}/${c.slug})`).join('\n')}
- [İncelemeler](${SITE}/inceleme)
- [Karşılaştırmalar](${SITE}/karsilastirma)
- [Künyeler (ürün veritabanı)](${SITE}/urun): her ürünün kaynaklı teknik verileri ve tüm içerikleri

## Son haberler
${news.map((n) => `- [${n.title}](${SITE}${n.path}): ${n.spot}`).join('\n')}

## İncelemeler
${reviews.map((r) => `- [${r.title}](${SITE}${r.path}): ${Math.round(r.score)}/20`).join('\n')}

## Yayın ilkeleri
- [Test yöntemimiz](${SITE}/test-yontemimiz)
- [Düzeltme politikası](${SITE}/duzeltme-politikasi)
`
  return new Response(md, { headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'public, s-maxage=3600' } })
}
