import type { APIRoute } from 'astro'
import { allNews, allReviews, allComparisons, getProducts } from '../lib/api'

/**
 * Arama dizini (statik). Tarayıcı bir kez indirir, aramayı kendisi yapar.
 * Kısa tutulur: tür, başlık, adres, kategori, tarih. Son 3000 haber.
 */
export const GET: APIRoute = async () => {
  const [news, reviews, cmps, products] = await Promise.all([allNews(), allReviews(), allComparisons(), getProducts(2000)])
  const rows = [
    ...products.map((p) => ['k', `${p.brand} ${p.name}`.trim(), `/urun/${p.slug}`, 'Künye', '']),
    ...reviews.map((r) => ['i', r.title, r.path, 'İnceleme', r.publishedAt.slice(0, 10)]),
    ...cmps.map((c) => ['c', c.title, c.path, 'Karşılaştırma', c.publishedAt?.slice(0, 10) || '']),
    ...news.slice(0, 3000).map((n) => ['h', n.title, n.path, n.category.name, n.publishedAt.slice(0, 10)]),
  ]
  return new Response(JSON.stringify(rows), { headers: { 'Content-Type': 'application/json; charset=utf-8' } })
}
