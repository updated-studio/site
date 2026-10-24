// Kullanım: PLAYWRIGHT_BROWSERS_PATH=... node ekran.mjs <adres> <çıktı.png> [genişlik] [koyu|acik]
import { chromium } from 'playwright'
const [,, url, out, w = '1280', tema = 'acik'] = process.argv
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: +w, height: 900 }, colorScheme: tema === 'koyu' ? 'dark' : 'light' })
await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await p.screenshot({ path: out, fullPage: false })
const f = await p.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => `${f.family} ${f.weight}`).join(', '))
console.log('yüklenen yazı tipleri:', f || '(yok)')
await b.close()
