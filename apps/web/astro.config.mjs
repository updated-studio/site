import { defineConfig } from 'astro/config'
import vercel from '@astrojs/vercel'

export default defineConfig({
  site: process.env.SITE_URL || 'https://updated.com.tr',
  output: 'server',
  trailingSlash: 'never',
  // Sayfalar sunucuda üretilir, Vercel önbelleğinde tutulur (ISR); Payload yayın değişince ilgili adresi yeniler.
  adapter: vercel({
    isr: { bypassToken: process.env.ISR_BYPASS_TOKEN, expiration: 60 * 60 * 24, exclude: [/^\/onizleme\//, /^\/ara/, /^\/parca\//, /^\/api\//, /^\/rss\.xml/] },
    imageService: false,
  }),
  build: { inlineStylesheets: 'auto' },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  security: { checkOrigin: true },
})
