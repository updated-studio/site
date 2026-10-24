// Marka Kiti 1.2 denetimi: sayfadaki görünür öğelerin hesaplanmış stillerini kit kurallarıyla karşılaştırır.
// Kullanım: node denetim.mjs <adres> [genişlik] [acik|koyu]
import { chromium } from 'playwright'
const [,, url, w = '1280', tema = 'acik'] = process.argv
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: +w, height: 900 }, colorScheme: tema === 'koyu' ? 'dark' : 'light' })
await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
const r = await p.evaluate(() => {
  // Kit paleti + arayüz nötrleri + koyu mod değerleri (12b)
  const PALET = ['#000000','#ffffff','#2563eb','#ff6b1a','#f2f2f2','#171717','#55585c','#6b6f74','#e2e2e2','#9a9ea3',
    '#121212','#1c1c1c','#262626','#333333','#b4b7bb','#8e9297']
  const hex = (c) => { const m = c.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/); if (!m) return null
    if (m[4] !== undefined && +m[4] === 0) return 'şeffaf'
    const h = '#' + [m[1], m[2], m[3]].map((x) => (+x).toString(16).padStart(2, '0')).join('')
    return m[4] !== undefined && +m[4] < 1 ? `${h}@${m[4]}` : h }
  const ad = (e) => (e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.classList.length ? '.' + [...e.classList].slice(0, 2).join('.') : '')).slice(0, 60)
  const gorunur = (e) => { const s = getComputedStyle(e), q = e.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && q.width > 0 && q.height > 0 }
  const dis = {}, ekle = (k, v) => { (dis[k] ??= new Map()); const m = dis[k]; m.set(v, (m.get(v) || 0) + 1) }
  const tumu = [...document.querySelectorAll('body *')].filter(gorunur)
  for (const e of tumu) {
    const s = getComputedStyle(e)
    const metinVar = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
    for (const [k, v] of [['metin rengi', metinVar ? s.color : null], ['zemin', s.backgroundColor], ['çerçeve', parseFloat(s.borderTopWidth) || parseFloat(s.borderBottomWidth) || parseFloat(s.borderLeftWidth) ? (parseFloat(s.borderTopWidth) ? s.borderTopColor : parseFloat(s.borderBottomWidth) ? s.borderBottomColor : s.borderLeftColor) : null]]) {
      if (!v) continue; const h = hex(v); if (!h || h === 'şeffaf') continue
      if (!PALET.includes(h)) ekle(`palet dışı ${k}`, `${h} (${ad(e)})`)
    }
    if (s.borderRadius !== '0px' && !['img','svg','path'].includes(e.tagName.toLowerCase())) ekle('köşe yarıçapı ≠ 0', `${s.borderRadius} (${ad(e)})`)
    if (s.boxShadow !== 'none') ekle('gölge', ad(e))
    if (s.backgroundImage.includes('gradient')) ekle('gradyan', ad(e))
    if (+s.opacity < 1 && +s.opacity > 0) ekle('saydamlık', `${s.opacity} (${ad(e)})`)
    if (metinVar) {
      const fs = parseFloat(s.fontSize), aile = s.fontFamily.split(',')[0].replace(/["']/g, '').trim()
      if (!['Big Shoulders Display','IBM Plex Sans','IBM Plex Mono','Newsreader'].includes(aile)) ekle('set dışı yazı tipi', `${aile} (${ad(e)})`)
      if (aile === 'Big Shoulders Display' && fs < 20) ekle('Big Shoulders 20 px altında', `${fs}px (${ad(e)})`)
      if (aile === 'Newsreader' && !e.closest('blockquote, q, .alinti, [class*=quote], [class*=alinti]')) ekle('Newsreader alıntı dışında', ad(e))
      if (fs < 12) ekle('12 px altı yazı', `${fs}px (${ad(e)})`)
      else if (fs < 14 && !(aile === 'IBM Plex Mono' && s.textTransform === 'uppercase')) ekle('14 px altı yazı (etiket değil)', `${fs}px ${aile} (${ad(e)})`)
      if (/^H[1-3]$/.test(e.tagName)) {
        const lh = s.lineHeight === 'normal' ? NaN : parseFloat(s.lineHeight) / fs
        if (aile === 'Big Shoulders Display' && !(Math.abs(lh - 1.2) < 0.02)) ekle('başlık satır yüksekliği ≠ 1,2', `${lh.toFixed(2)} (${ad(e)})`)
        if (aile === 'Big Shoulders Display' && s.textTransform !== 'uppercase') ekle('başlık büyük harf değil', ad(e))
        if (s.letterSpacing !== 'normal' && parseFloat(s.letterSpacing) !== 0) ekle('başlıkta harf aralığı', `${s.letterSpacing} (${ad(e)})`)
      }
    }
  }
  // Ölçüler
  const olc = {}
  const header = document.querySelector('header'); if (header) { const s = getComputedStyle(header); olc['üst menü'] = `${Math.round(header.getBoundingClientRect().height)} px, alt çizgi ${s.borderBottomWidth} ${hex(s.borderBottomColor)}, zemin ${hex(s.backgroundColor)}` }
  const h1s = document.querySelectorAll('h1'); olc['H1 sayısı'] = h1s.length
  const h1 = h1s[0]; if (h1) { const s = getComputedStyle(h1); olc['H1'] = `${s.fontFamily.split(',')[0]} ${s.fontWeight} ${s.fontSize} / ${(parseFloat(s.lineHeight) / parseFloat(s.fontSize)).toFixed(2)}` }
  const par = [...document.querySelectorAll('main p, article p')].filter(gorunur).sort((a, b) => b.textContent.length - a.textContent.length)[0]
  if (par) { const s = getComputedStyle(par); olc['gövde paragrafı'] = `${s.fontFamily.split(',')[0]} ${s.fontSize} / ${(parseFloat(s.lineHeight) / parseFloat(s.fontSize)).toFixed(2)}, genişlik ${Math.round(par.getBoundingClientRect().width)} px` }
  olc['lang'] = document.documentElement.lang
  const kucukDokunma = [...document.querySelectorAll('a, button, input, select, [role=button]')].filter(gorunur).filter((e) => { const q = e.getBoundingClientRect(); return (q.width < 44 || q.height < 44) && !e.closest('p, li > p') && getComputedStyle(e).display !== 'inline' })
  olc['44 px altı dokunma alanı (satır içi bağlantılar hariç)'] = kucukDokunma.length + (kucukDokunma.length ? ': ' + kucukDokunma.slice(0, 6).map((e) => `${ad(e)} ${Math.round(e.getBoundingClientRect().width)}×${Math.round(e.getBoundingClientRect().height)}`).join(' | ') : '')
  const alt = [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length; olc['alt metni olmayan görsel'] = alt
  return { olc, dis: Object.fromEntries(Object.entries(dis).map(([k, m]) => [k, [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([v, n]) => `${v}×${n}`)])) }
})
console.log(`== ${url} (${w} px, ${tema})`)
for (const [k, v] of Object.entries(r.olc)) console.log(`  ${k}: ${v}`)
for (const [k, v] of Object.entries(r.dis)) console.log(`  ⚠ ${k}: ${v.join(' · ')}`)
await b.close()
