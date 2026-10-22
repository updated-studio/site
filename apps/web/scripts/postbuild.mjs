/**
 * Derleme sonrası (dist/):
 * 1) BASE_PATH varsa (GitHub Pages proje adresi) iç bağlantılara önek ekler.
 * 2) Natro (Apache/LiteSpeed) için .htaccess üretir: uzantısız adres, 404, https, sondaki "/", önbellek,
 *    güvenlik başlıkları, WordPress'ten kalan eski adresler (src/redirects.json) ve ters sıralı kıyas adresleri.
 * 3) IndexNow anahtar dosyasını yazar.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'

const DIST = new URL('../dist/', import.meta.url).pathname
const BASE = (process.env.BASE_PATH || '').replace(/\/$/, '')
const SITE = (process.env.SITE_URL || 'https://updated.com.tr').replace(/\/$/, '')
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p] })
const files = walk(DIST)

/* 1) taban yol */
if (BASE) {
  const b = BASE.slice(1).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const not = `(?!\\/|${b}(?:[\\/"'?#\\s]|$))` // "//cdn…" ve Astro'nun zaten öneklediği "/site/_astro…" atlanır
  const re = new RegExp(`((?:href|src|action|poster)=["'])\\/${not}`, 'g')
  const reSet = /(srcset=["'])([^"']+)/g
  const reJson = new RegExp(`(&quot;h&quot;:&quot;)\\/${not}`, 'g')
  for (const f of files.filter((f) => f.endsWith('.html'))) {
    const s = readFileSync(f, 'utf8')
    const o = s.replace(re, `$1${BASE}/`).replace(reSet, (_, a, v) => a + v.split(',').map((x) => x.trim().replace(new RegExp(`^\\/${not}`), `${BASE}/`)).join(', ')).replace(reJson, `$1${BASE}/`)
    if (o !== s) writeFileSync(f, o)
  }
  console.log(`taban yol eklendi: ${BASE}`)
}

/* 2) .htaccess */
const host = new URL(SITE).host
// Hazırlıkta (STAGING=1) SSL henüz yoksa site http'den de açılsın diye https zorlaması yok; canlıda var.
const httpsRule = process.env.STAGING === '1' ? '# hazırlık: https zorlaması kapalı (SSL kurulunca canlıda açılır)\n' : `# https ve www'suz tek adres
RewriteCond %{HTTPS} !=on [OR]
RewriteCond %{HTTP_HOST} ^www\\. [NC]
RewriteRule ^(.*)$ https://${host}/$1 [R=301,L]
`
const esc = (p) => p.replace(/^\//, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const redirects = existsSync('src/redirects.json') ? JSON.parse(readFileSync('src/redirects.json', 'utf8')) : {}
const kiyas = files.filter((f) => /\/karsilastirma\/[^/]+-vs-[^/]+\.html$/.test(f)).map((f) => relative(DIST, f).replace(/\.html$/, ''))
const reverse = Object.fromEntries(kiyas.map((p) => { const [, a, b] = p.match(/^karsilastirma\/(.+)-vs-(.+)$/); return [`/karsilastirma/${b}-vs-${a}`, `/${p}`] }))
const rules = Object.entries({ ...redirects, ...reverse }).filter(([from, to]) => from !== to)
const ht = `# Üretildi: scripts/postbuild.mjs — elle düzenlemeyin
Options -MultiViews -Indexes
DirectorySlash Off
DirectoryIndex index.html
ErrorDocument 404 /404.html
AddDefaultCharset utf-8
AddType application/xml .xml
AddType text/plain .txt

<IfModule mod_rewrite.c>
RewriteEngine On

${httpsRule}
# sondaki "/" atılır
RewriteRule ^(.+)/$ /$1 [R=301,L]

# /index ve /index.html → ana sayfa
RewriteRule ^index(\\.html)?$ / [R=301,L]

# .html uzantılı istek → uzantısız adres
RewriteCond %{THE_REQUEST} \\s/([^?\\s]+)\\.html[\\s?]
RewriteRule ^ /%1 [R=301,L]

# Eski adresler (WordPress) ve ters sıralı kıyaslar → 301 (${rules.length} kural)
${rules.map(([from, to]) => `RewriteRule ^${esc(decodeURIComponent(from))}/?$ ${to} [R=301,L,NE]`).join('\n')}

# uzantısız adres → .html dosyası
RewriteCond %{REQUEST_FILENAME}.html -f
RewriteRule ^(.+)$ $1.html [L]
</IfModule>

<IfModule mod_headers.c>
Header always set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set X-Frame-Options "SAMEORIGIN"
Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
<FilesMatch "\\.(html|xml|json|txt)$">
Header set Cache-Control "public, max-age=120, must-revalidate"
</FilesMatch>
<FilesMatch "^(onizleme|404)\\.html$">
Header set X-Robots-Tag "noindex"
Header set Cache-Control "no-store"
</FilesMatch>
</IfModule>

<IfModule mod_expires.c>
ExpiresActive On
ExpiresByType text/css "access plus 1 year"
ExpiresByType application/javascript "access plus 1 year"
ExpiresByType text/javascript "access plus 1 year"
ExpiresByType image/webp "access plus 30 days"
ExpiresByType image/avif "access plus 30 days"
ExpiresByType image/svg+xml "access plus 30 days"
ExpiresByType image/jpeg "access plus 30 days"
</IfModule>

<IfModule mod_deflate.c>
AddOutputFilterByType DEFLATE text/html text/css text/plain text/xml application/xml application/json application/javascript text/javascript application/rss+xml image/svg+xml
</IfModule>
`
writeFileSync(join(DIST, '.htaccess'), ht)
console.log(`.htaccess: ${rules.length} yönlendirme`)

/* 3) IndexNow anahtarı */
if (process.env.INDEXNOW_KEY) writeFileSync(join(DIST, `${process.env.INDEXNOW_KEY}.txt`), process.env.INDEXNOW_KEY)
/* GitHub Pages: Jekyll kapalı (_astro klasörü için) */
writeFileSync(join(DIST, '.nojekyll'), '')
console.log(`dosya: ${files.length}`)
