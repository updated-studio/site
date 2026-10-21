import type { APIRoute } from 'astro'
import { SITE } from '../lib/seo'
import { env } from '../lib/env'

/** Hazırlık (staging) alan adında her şey kapalı; canlıda açık. Yapay zekâ tarayıcıları için tercih: açık (GEO). */
export const GET: APIRoute = async () => {
  const staging = env('STAGING') === '1' || !SITE.endsWith('updated.com.tr') || /\/\/(yeni|staging|test)\./.test(SITE)
  const body = staging
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\nDisallow: /onizleme\nDisallow: /parca/\nDisallow: /ara\n\nSitemap: ${SITE}/sitemap.xml\nSitemap: ${SITE}/news-sitemap.xml\n`
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
