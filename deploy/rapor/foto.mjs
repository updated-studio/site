// Eski sitenin Fotoğrafçılık sayfasının ekran görüntüleri (masaüstü + telefon) ve metni
import { chromium } from 'playwright'
const url = (process.env.WP_URL || 'https://updated.com.tr').replace(/\/$/, '') + '/fotografcilik/'
const b = await chromium.launch()
for (const [ad, vp] of [['masaustu', { width: 1440, height: 900 }], ['telefon', { width: 390, height: 844 }]]) {
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: 1 })
  await p.goto(url, { waitUntil: 'networkidle', timeout: 90000 }).catch(() => {})
  await p.waitForTimeout(3000)
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 150)) } window.scrollTo(0, 0) })
  await p.waitForTimeout(1500)
  await p.screenshot({ path: `rapor/fotografcilik-${ad}.jpg`, fullPage: true, type: 'jpeg', quality: 70 })
  if (ad === 'masaustu') { const fs = await import('node:fs'); fs.writeFileSync('rapor/fotografcilik.txt', await p.evaluate(() => document.title + '\n\n' + document.body.innerText)); fs.writeFileSync('rapor/fotografcilik.html', await p.content()) }
}
await b.close()
