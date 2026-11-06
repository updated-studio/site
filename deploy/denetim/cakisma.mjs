// Ölçek denetimi (31 Ekim 2026, kullanıcı: "ölçekleme hep bir sorun çıkarıyor, kalıcı çözmemiz gerekiyor").
// Her sayfayı 8 ekran genişliğinde açar ve şunları arar:
//   1) üst üste binen yazılar: iki ayrı yazı satırının kutuları çakışıyor (biri ötekinin içinde değil)
//   2) kutusundan taşan yazı: tek satırlık öğede yazı kesilmeden dışarı çıkıyor
//   3) sayfanın yana kayması
// Kullanım: node deploy/denetim/cakisma.mjs <kök adres> [yol ...]   (yol verilmezse ana sayfa türleri)
// Çıkış kodu: sorun varsa 1. Her arayüz değişikliğinden sonra deneme kopyasında çalıştırılır (CLAUDE.md kural 11).
// Aynı anda ESZAMAN sekme açılır (varsayılan 2; 6 Kasım 2026). Sonuçlar yine sayfa ve genişlik sırasıyla yazılır, çıktı tek sekmeyle aynıdır.
const { chromium } = await import(process.env.PW || '/opt/updated/calisma/araclar/node_modules/playwright-core/index.mjs')
const [,, kok = 'http://127.0.0.1:4402', ...yollar] = process.argv
const YOLLAR = yollar.length ? yollar : ['/', '/haberler', '/kamera', '/inceleme', '/rehber', '/karsilastirma', '/karsilastirma/kiyas', '/urun', '/araclar', '/araclar/maliyet', '/araclar/storyboard', '/kulup', '/hesap', '/ara', '/404']
const GENISLIK = (process.env.GENISLIK || '320,360,390,414,768,1024,1440,1920').split(',').map(Number)
const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/updated/calisma/araclar/tarayici/chromium-1140/chrome-linux/chrome' })
const ESZAMAN = Math.max(1, +(process.env.ESZAMAN || 2))
const isler = YOLLAR.flatMap((yol) => GENISLIK.map((w) => ({ yol, w })))
const sonuc = new Array(isler.length)
const denetle = async ({ yol, w }) => {
  const p = await b.newPage({ viewport: { width: w, height: 900 } })
  await p.goto(kok + yol, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {})
  await p.waitForTimeout(600)
  const s = await p.evaluate(OLC).catch(async () => { // yük altında sayfa ölçülürken hâlâ yükleniyor olabilir: bir kez daha, yine olmazsa sorun sayılır
    await p.goto(kok + yol, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {})
    await p.waitForTimeout(600)
    return p.evaluate(OLC).catch((h2) => ['AÇILAMADI ' + String(h2.message || h2).split('\n')[0]])
  })
  await p.close()
  return s.map((x) => `${yol} @${w}: ${x}`)
}
function OLC() {
    const out = []
    const ad = (e) => (e.tagName.toLowerCase() + (e.classList.length ? '.' + [...e.classList].slice(0, 2).join('.') : '')).slice(0, 50) + ` "${e.textContent.trim().slice(0, 24)}"`
    const gorunur = (e) => { if (e.closest('details:not([open]) > :not(summary)')) return false; for (let a = e; a; a = a.parentElement) { const c = getComputedStyle(a); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0) return false; if (a.hidden) return false } return true }
    // Doğrudan yazı taşıyan öğeler; satır kutuları Range ile ölçülür (öğe kutusu değil, yazının kendisi)
    const kutular = []
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (!n.textContent.trim()) continue
      const e = n.parentElement; if (!e || e.closest('script,style,svg,[aria-hidden=true],.sr,.sr-only,noscript,template,select,option')) continue
      const r = document.createRange(); r.selectNodeContents(n)
      for (const q of r.getClientRects()) if (q.width > 2 && q.height > 2) kutular.push({ e, q })
    }
    const ilk = kutular.filter((k) => gorunur(k.e))
    // Kaydırılan şeritlerde (overflow) ekran dışına düşen yazılar sayılmaz
    // Yazı, kırpan kutuların (öğenin kendisi dahil: "…" ile kesilen başlık) içinde kalan görünür parçasıyla ölçülür (3 Kasım 2026: kesilen
    // uzun ürün adı görünmeyen kısmıyla yan karta "çakışıyor" sayılıyordu)
    const kirp = (k) => { let q = { left: k.q.left, right: k.q.right, top: k.q.top, bottom: k.q.bottom }; for (let a = k.e; a && a !== document.body; a = a.parentElement) { const c = getComputedStyle(a); if (/(auto|scroll|hidden|clip)/.test(c.overflowX + c.overflowY)) { const r = a.getBoundingClientRect(); q = { left: Math.max(q.left, r.left), right: Math.min(q.right, r.right), top: Math.max(q.top, r.top), bottom: Math.min(q.bottom, r.bottom) }; if (q.right - q.left <= 1 || q.bottom - q.top <= 1) return null } } return { ...k, q: { ...q, width: q.right - q.left, height: q.bottom - q.top } } }
    const yazi = ilk.map(kirp).filter(Boolean)
    const kat = (e) => { let z = 0; for (let a = e; a; a = a.parentElement) { const c = getComputedStyle(a); if (c.position !== 'static' && c.zIndex !== 'auto') z = Math.max(z, +c.zIndex || 0) } return z }
    const sabit = (e) => { for (let a = e; a; a = a.parentElement) { const p = getComputedStyle(a).position; if (p === 'fixed' || p === 'sticky') return true } return false }
    const goruldu = new Set()
    for (let i = 0; i < yazi.length; i++) for (let j = i + 1; j < yazi.length; j++) {
      const A = yazi[i], B = yazi[j]
      if (A.e === B.e || A.e.contains(B.e) || B.e.contains(A.e)) continue
      const x = Math.min(A.q.right, B.q.right) - Math.max(A.q.left, B.q.left), y = Math.min(A.q.bottom, B.q.bottom) - Math.max(A.q.top, B.q.top)
      // Yapışık yazı: aynı satırda iki ayrı kutunun (başlık, düğme, etiket) yazıları arada boşluk kalmadan birbirine değiyor
      const kutu = (e) => { for (let a = e; a; a = a.parentElement) { const d = getComputedStyle(a).display; if (d !== 'inline' && d !== 'contents') return a } return document.body }
      const ayriKutu = kutu(A.e) !== kutu(B.e) && !kutu(A.e).contains(kutu(B.e)) && !kutu(B.e).contains(kutu(A.e))
      const ayniSatir = y > Math.min(A.q.height, B.q.height) * 0.5
      if (ayriKutu && ayniSatir && x > -3 && x <= 3) { const k = ad(A.e) + ' × ' + ad(B.e); if (!goruldu.has(k)) { goruldu.add(k); out.push('YAPIŞIK ' + k) } continue }
      if (x <= 3 || y <= Math.min(A.q.height, B.q.height) * 0.3) continue
      if (sabit(A.e) !== sabit(B.e)) continue // yapışık üst bar kayan içeriğin üstünden geçer; kasıtlı
      if (kat(A.e) !== kat(B.e)) continue // açılır menü gibi üst katmanlar
      const k = ad(A.e) + ' × ' + ad(B.e); if (goruldu.has(k)) continue; goruldu.add(k)
      out.push('ÇAKIŞMA ' + k)
    }
    for (const e of new Set(yazi.map((k) => k.e))) {
      const c = getComputedStyle(e); if (c.whiteSpace !== 'nowrap' || /(hidden|clip)/.test(c.overflowX) || c.textOverflow === 'ellipsis') continue
      if (e.scrollWidth > e.clientWidth + 2 && e.clientWidth > 0 && c.display !== 'inline') out.push('TAŞAN YAZI ' + ad(e))
    }
    if (document.documentElement.scrollWidth > innerWidth + 1) out.push('YANA KAYMA ' + document.documentElement.scrollWidth + ' px')
    return out
}
let sira = 0
await Promise.all(Array.from({ length: ESZAMAN }, async () => { while (sira < isler.length) { const i = sira++; sonuc[i] = await denetle(isler[i]) } }))
await b.close()
let toplam = 0
for (const s of sonuc) { for (const x of s) console.log(x); toplam += s.length }
console.log(toplam ? `${toplam} sorun` : 'Temiz: çakışan ya da taşan yazı yok')
process.exit(toplam ? 1 : 0)
