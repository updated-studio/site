import type { APIRoute } from 'astro'
import { getLatest } from '../lib/api'
import { rss } from '../lib/feed'

/** RSS: son 30 haber. Ürün takibi: /rss/urun/{slug}.xml */
export const GET: APIRoute = async () => rss('UPDATED', '', await getLatest(1, 30))
