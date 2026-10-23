/**
 * Google Fonts'u kendi sunucumuza alır (ziyaretçi Google'a bağlanmaz; yazı tipleri OFL lisanslı, kendi sitede barındırmak serbest).
 * Yalnız latin + latin-ext (Türkçe: ğ ş ı İ) alt kümeleri. Çıktı: <klasör>/yazi-tipleri.css + .woff2 dosyaları.
 * Kullanım: node deploy/yazi-tipi-indir.mjs '<fonts.googleapis.com/css2?... adresi>' <çıktı klasörü> [css içindeki yol öneki]
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const [, , adres, cikti, onek = '.'] = process.argv
if (!adres || !cikti) { console.error('kullanım: node yazi-tipi-indir.mjs <adres> <klasör> [önek]'); process.exit(1) }
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' // woff2 ister
const css = await (await fetch(adres, { headers: { 'User-Agent': UA } })).text()
mkdirSync(cikti, { recursive: true })

const bloklar = [...css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*{[^}]+})/g)]
let sonuc = `/* Yazı tipleri (kendi barındırma; kaynak Google Fonts, OFL). Üretici: deploy/yazi-tipi-indir.mjs — elle düzenlenmez. */\n`
let n = 0
for (const [, altkume, blok] of bloklar) {
  if (altkume !== 'latin' && altkume !== 'latin-ext') continue
  const aile = blok.match(/font-family:\s*'([^']+)'/)[1]
  const stil = blok.match(/font-style:\s*(\w+)/)[1]
  const kalinlik = blok.match(/font-weight:\s*([\d ]+)/)[1].trim().replace(' ', '-')
  const kaynak = blok.match(/url\(([^)]+\.woff2)\)/)[1]
  const ad = `${aile.toLowerCase().replace(/\s+/g, '-')}-${kalinlik}${stil === 'italic' ? 'i' : ''}-${altkume}.woff2`
  const r = await fetch(kaynak)
  if (!r.ok) throw new Error(`${kaynak}: ${r.status}`)
  writeFileSync(join(cikti, ad), Buffer.from(await r.arrayBuffer()))
  sonuc += blok.replace(/src:\s*url\([^)]+\)/, `src: url(${onek}/${ad})`) + '\n'
  n++
}
if (!n) throw new Error('hiç yazı tipi bulunamadı (adres doğru mu?)')
writeFileSync(join(cikti, 'yazi-tipleri.css'), sonuc)
console.log(`${n} dosya → ${cikti}`)
