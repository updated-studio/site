import { defineMiddleware } from 'astro:middleware'
import redirects from './redirects.json'

/**
 * WordPress'ten kalan eski adresler → yeni adres (301). Liste taşıma betiğinden gelir (apps/cms/scripts/wp-migrate.ts).
 * Binlerce satır olabilir; Vercel yapılandırmasına değil, burada bellekteki tabloya bakılır.
 * Ayrıca: sondaki "/" atılır, büyük harfli adresler küçültülür (tek adres kuralı).
 */
const MAP = new Map<string, string>(Object.entries(redirects as Record<string, string>))
export const onRequest = defineMiddleware(async (ctx, next) => {
  const { pathname, search } = ctx.url
  const bare = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  const hit = MAP.get(bare) || MAP.get(decodeURIComponent(bare))
  if (hit) return ctx.redirect(hit + search, 301)
  if (bare !== pathname && !pathname.startsWith('/_')) return ctx.redirect(bare + search, 301)
  if (/[A-ZÇĞİÖŞÜ]/.test(pathname) && !pathname.startsWith('/_') && !/\.\w+$/.test(pathname)) return ctx.redirect(pathname.toLocaleLowerCase('tr-TR') + search, 301)
  const res = await next()
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  return res
})
