import type { APIRoute } from 'astro'
import { allProductSlugs, getProduct } from '../../../lib/api'
import { rss } from '../../../lib/feed'

/** Künyede "Takip et": bu ürünün haberleri ve incelemeleri. */
export async function getStaticPaths() { return (await allProductSlugs()).map((slug) => ({ params: { slug } })) }
export const GET: APIRoute = async ({ params }) => {
  const p = (await getProduct(params.slug!))!
  const items = [...p.news, ...p.reviews].sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
  return rss(`UPDATED · ${p.name}`, p.path, items)
}
