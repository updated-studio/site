import { defineConfig } from 'astro/config'

/**
 * Statik site: GitHub Actions derler, çıktı (dist/) Natro'ya FTP ile yüklenir; hazırlık sürümü GitHub Pages'te.
 * Her yayında panel derlemeyi tetikler (apps/cms/src/hooks/revalidate.ts → repository_dispatch).
 * BASE_PATH: GitHub Pages proje adresinde (/site) çalışırken; Natro ve özel alan adında boş.
 */
const base = process.env.BASE_PATH || '/'
export default defineConfig({
  site: process.env.SITE_URL || 'https://updated.com.tr',
  base,
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file', inlineStylesheets: 'auto', concurrency: 4 },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
})
