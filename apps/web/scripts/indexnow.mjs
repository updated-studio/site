/** Yükleme sonrası IndexNow (Bing, Yandex): son 48 saatin haberleri + panelin bildirdiği adresler. Google site haritasını kullanır. */
import { readFileSync, existsSync } from 'node:fs'
const KEY = process.env.INDEXNOW_KEY, SITE = (process.env.SITE_URL || '').replace(/\/$/, '')
if (!KEY || !SITE) process.exit(0)
const f = new URL('../dist/news-sitemap.xml', import.meta.url).pathname
const urls = new Set(existsSync(f) ? [...readFileSync(f, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]) : [])
for (const p of (process.env.CHANGED_PATHS || '').split(',').map((x) => x.trim()).filter(Boolean)) urls.add(SITE + p)
urls.add(SITE + '/')
const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'content-type': 'application/json; charset=utf-8' }, body: JSON.stringify({ host: new URL(SITE).host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: [...urls].slice(0, 10000) }) })
console.log(`IndexNow ${r.status} · ${urls.size} adres`)
