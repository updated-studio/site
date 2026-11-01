// Site kılavuzu plakaları: her sayfa türünde bölgeleri numaralı çerçeveyle işaretleyip görüntü alır; işaret listesini plakalar.json'a yazar.
import { chromium } from '/opt/updated/calisma/araclar/node_modules/playwright-core/index.mjs'
import fs from 'fs'
const KOK = 'https://updated.com.tr'
const O = process.env.CIKTI || '/tmp/kilavuz/'; fs.mkdirSync(O, { recursive: true })
// [kod, seçici, terim anahtarı]
const PLAKALAR = [
  { kod: 'A', ad: 'Ana sayfa · üst kısım', yol: '/', w: 1440, h: 900, y: 0, tema: 'light', bolge: [
    ['.hdr', 'header'], ['.logo', 'logo'], ['.logo-kulup', 'kulup-link'], ['.nav', 'primary-nav'], ['.srch', 'search-button'], ['.hdr-r [data-theme-btn]', 'theme-toggle'], ['.hdr-r .dil', 'language-switcher'], ['.hdr-r .btn-p', 'newsletter-cta'], ['.uye-b', 'account-button'],
    ['.mn-sl', 'hero-carousel'], ['.mn-kat', 'category-tag'], ['.mv', 'reels-rail'], ['.mv-ok', 'carousel-arrows'], ['.yan-rek.yan-sol', 'side-rail-ad'] ] },
  { kod: 'B', ad: 'Ana sayfa · videolar ve haberler', yol: '/', w: 1440, h: 900, hedef: '.vd', tema: 'light', bolge: [
    ['.vd .sh', 'section-header'], ['.vd', 'video-wall'], ['.vd .btn-p', 'channel-cta'], ['.vd a, .vd button', 'video-card'] ] },
  { kod: 'C', ad: 'Ana sayfa · son haberler ve sağ sütun', yol: '/', w: 1440, h: 1000, hedef: '.with-rail', tema: 'light', bolge: [
    ['.with-rail .sh .no', 'section-number'], ['.ana-sol .grid4', 'card-grid'], ['.ana-sol .grid4 .c-std', 'news-card'], ['.ana-sol .grid4 .c-std .c-img', 'card-thumbnail'], ['.ana-sol .grid4 .c-std .cat', 'card-category'], ['.ana-sol .grid4 .c-std .yz-satir', 'card-byline'],
    ['.grid-yatay', 'horizontal-cards'], ['.rail', 'sidebar'], ['.rd', 'release-radar'], ['[data-okunan]', 'most-read'], ['.eco-sekme', 'tabs'] ] },
  { kod: 'D', ad: 'Ana sayfa · özet, inceleme, kıyas', yol: '/', w: 1440, h: 1000, hedef: '.oz', tema: 'light', bolge: [
    ['.oz-dinle', 'audio-briefing-button'], ['.oz-segs', 'progress-segments'], ['.oz-iz', 'briefing-carousel'], ['.oz-metin', 'transcript'], ['.kose', 'floating-dock'], ['.kose-ozet', 'floating-audio'], ['.kose-kulup', 'floating-kulup'] ] },
  { kod: 'E', ad: 'Ana sayfa · kıyasla ve künyeler', yol: '/', w: 1440, h: 1000, hedef: '.ky', tema: 'light', bolge: [
    ['.ky .kb', 'compare-form'], ['.ky-hazir', 'compare-presets'], ['.kcard', 'spec-card'], ['[data-kose]', 'floating-dock'] ] },
  { kod: 'F', ad: 'Alt bilgi', yol: '/', w: 1440, h: 700, hedef: '.ftr', tema: 'light', bolge: [
    ['.ftr', 'footer'], ['.ftr .nl', 'newsletter-form'], ['.ftr .bt', 'footer-bottom'] ] },
  { kod: 'G', ad: 'Haberler · kategori sayfası', yol: '/kamera', w: 1440, h: 900, y: 0, tema: 'dark', sd: true, bolge: [
    ['#sd', 'breaking-ticker'], ['.kat-serit', 'sub-nav'], ['.kat-serit [aria-current=page]', 'active-chip'], ['main h1', 'page-title'], ['main .lead', 'page-lead'], ['main .grid4', 'feed-grid'], ['.sdk', 'latest-list'] ] },
  { kod: 'H', ad: 'Haber yazısı', yol: '/kamera/sony-a7-r6-inceleme-kandoda-100-400mm-f4-5-ve-yeni-a7', w: 1440, h: 1000, y: 0, tema: 'light', bolge: [
    ['.crumbs', 'breadcrumbs'], ['.art-head', 'article-header'], ['.art-head h1', 'headline'], ['.art-head .lead', 'standfirst'], ['.kunye-row', 'article-meta'], ['figure.cover', 'cover-image'], ['.rail-yan, .rail', 'sidebar'] ] },
  { kod: 'I', ad: 'Haber yazısı · gövde', yol: '/kamera/sony-a7-r6-inceleme-kandoda-100-400mm-f4-5-ve-yeni-a7', w: 1440, h: 1000, hedef: '.prose', tema: 'light', bolge: [
    ['.prose', 'article-body'], ['.prose p strong, .prose h2, .prose h3', 'subheading'], ['.rail [data-okunan], .rail-yan [data-okunan]', 'most-read'] ] },
  { kod: 'J', ad: 'Ürün künyesi', yol: '/urun/apple-iphone-17-pro', w: 1440, h: 900, y: 0, tema: 'light', bolge: [
    ['.ku-hero', 'product-hero'], ['.ku-status', 'status-chips'], ['.ku-actions', 'action-buttons'], ['.ku-stats', 'stat-row'], ['.ku-stage', 'exploded-view'], ['.ku-tabs', 'segmented-control'] ] },
  { kod: 'K', ad: 'Kulüp · araç sayfası', yol: '/araclar/flas', w: 1440, h: 900, y: 0, tema: 'light', bolge: [
    ['.ktabs', 'kulup-tabs'], ['main .art-head, main h1', 'page-title'], ['.arac', 'tool-panel'], ['.arac input, .arac select', 'form-field'], ['.arac-buyuk', 'result-tile'], ['.arac-l', 'tool-list'] ] },
  { kod: 'L', ad: 'Telefon · ana sayfa', yol: '/', w: 390, h: 844, y: 0, tema: 'light', bolge: [
    ['.hdr', 'header'], ['.logo-kulup', 'kulup-link'], ['.hdr-r .dil', 'language-switcher'], ['.menu-b', 'hamburger'], ['.bolum-serit', 'mobile-section-bar'], ['.mn-sl', 'hero-carousel'], ['.mv', 'reels-rail'] ] },
  { kod: 'M', ad: 'Telefon · menü açık', yol: '/', w: 390, h: 844, y: 0, tema: 'light', menu: true, bolge: [
    ['.sheet', 'drawer'], ['.sh-hesap', 'account-card'], ['.sh-grup', 'menu-group'], ['.sheet-tema', 'theme-toggle'] ] },
  { kod: 'N', ad: 'Telefon · bölüm arası reklam', yol: '/', w: 390, h: 844, hedef: '.mobil-alan', tema: 'light', bolge: [
    ['.mobil-alan', 'inline-ad'], ['.grid-yatay', 'horizontal-cards'] ] },
]
const b = await chromium.launch({ executablePath: '/opt/updated/calisma/araclar/tarayici/chromium-1140/chrome-linux/chrome' })
const cikti = []
for (const P of PLAKALAR) {
  const p = await b.newPage({ viewport: { width: P.w, height: P.h }, colorScheme: P.tema, deviceScaleFactor: P.w < 500 ? 2 : 1 })
  await p.goto(KOK + P.yol, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {})
  await p.waitForTimeout(1500)
  if (P.sd) await p.evaluate(() => { const sd = document.getElementById('sd'); if (!sd) return; sd.dataset.items = JSON.stringify([{ t: 'Örnek son dakika: editör kritik bir haber girdiğinde bu bant açılır', h: '/', at: '19.42' }, { t: 'İkinci son dakika haberi', h: '/', at: '19.30' }]); sd.hidden = false; sd.dispatchEvent(new Event('sd-yenile')) })
  if (P.menu) { await p.click('.menu-b'); await p.waitForTimeout(500) }
  // Hareketi dondur: kayan şerit ve geçişler sabit
  await p.addStyleTag({ content: '*{animation-play-state:paused!important;transition:none!important}.sd-ray{animation:none!important}' })
  if (P.hedef) { await p.evaluate((s) => { const e = document.querySelector(s); if (e) scrollTo(0, e.getBoundingClientRect().top + scrollY - (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hdr-alt')) || 120) - 24) }, P.hedef); await p.waitForTimeout(600) }
  else await p.evaluate((y) => scrollTo(0, y || 0), P.y)
  if (P.kod === 'D' || P.kod === 'E') { await p.evaluate(() => { const k = document.querySelector('[data-kose]'); if (k) k.hidden = false }) }
  const isaret = await p.evaluate(({ bolge, kod }) => {
    const out = []; let n = 0
    const kat = document.createElement('div'); kat.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647'; document.body.appendChild(kat)
    for (const [sec, anahtar] of bolge) {
      const e = [...document.querySelectorAll(sec)].find((x) => { const r = x.getBoundingClientRect(); return r.width > 4 && r.height > 4 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && getComputedStyle(x).visibility !== 'hidden' })
      if (!e) continue
      n++
      const r = e.getBoundingClientRect()
      const L = Math.max(2, r.left), T = Math.max(2, r.top), W = Math.min(innerWidth - 2, r.right) - L, H = Math.min(innerHeight - 2, r.bottom) - T
      const kutu = document.createElement('div'); kutu.style.cssText = `position:absolute;left:${L}px;top:${T}px;width:${W}px;height:${H}px;border:2px solid #FF6B1A;border-radius:6px;box-shadow:0 0 0 1px rgba(0,0,0,.35)`
      const no = document.createElement('div'); no.textContent = kod + n
      const bx = Math.min(innerWidth - 40, Math.max(0, L - 6)), by = Math.max(0, T - 10)
      no.style.cssText = `position:absolute;left:${bx}px;top:${by}px;min-width:26px;height:22px;padding:0 6px;border-radius:11px;background:#FF6B1A;color:#111;font:700 12px/22px ui-monospace,Menlo,monospace;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,.4)`
      kat.appendChild(kutu); kat.appendChild(no)
      out.push({ no: kod + n, terim: anahtar, sec: sec.split(',')[0].trim() })
    }
    return out
  }, { bolge: P.bolge, kod: P.kod })
  const dosya = `plaka-${P.kod}.jpg`
  await p.screenshot({ path: O + dosya, type: 'jpeg', quality: 78 })
  cikti.push({ kod: P.kod, ad: P.ad, yol: P.yol, genislik: P.w, dosya, isaret })
  console.log(P.kod, isaret.length, 'işaret')
  await p.close()
}
await b.close()
fs.writeFileSync(O + 'plakalar.json', JSON.stringify(cikti, null, 1))
