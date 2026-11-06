// Galeri (6 Kasım 2026, kullanıcı onayı): 6 ve daha fazla yazı içi fotoğrafı olan yazıda fotoğrafa dokununca tam ekran galeri,
// yazının sonunda "Bütün fotoğraflar" ızgarası. Galeride ana dosya (en çok 2560 px WebP) gösterilir; orijinal sitede yok, indirme düğmesi yok.
const ESIK = 6
const IPUCU = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2"/></svg>'
const ok = (d: string) => `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="2"/></svg>`
const kacis = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

type Foto = { kucuk: string; buyuk: string; alt: string; yazi: string }

function kur(prose: HTMLElement) {
  const figs = [...prose.querySelectorAll<HTMLElement>('figure.yazi-foto')].filter((f) => f.querySelector('img'))
  // İncelemenin kapağı galerinin ilk karesi (yazının başındaki fotoğraf metinde tekrar edilmez)
  const kapak = document.querySelector<HTMLElement>('figure[data-galeri-kapak]')
  if (kapak?.querySelector('img')) figs.unshift(kapak)
  if (figs.length < ESIK) return
  const fotolar: Foto[] = figs.map((f) => {
    const img = f.querySelector('img')!
    return { kucuk: img.currentSrc || img.src, buyuk: f.dataset.buyuk || img.src, alt: img.alt, yazi: f.querySelector('figcaption')?.textContent?.trim() || '' }
  })
  const n = fotolar.length
  // Metindeki fotoğraflar düğme olur
  figs.forEach((f, i) => {
    const img = f.querySelector('img')!
    if (f === kapak) { f.style.cursor = 'zoom-in'; f.dataset.g = String(i); return }
    const b = document.createElement('button')
    b.type = 'button'; b.className = 'g-ac'; b.dataset.g = String(i)
    b.setAttribute('aria-label', `Fotoğrafı büyüt, ${i + 1} / ${n}`)
    img.replaceWith(b); b.append(img)
    b.insertAdjacentHTML('beforeend', `<span class="g-ipucu" aria-hidden="true">${IPUCU}${n}</span>`)
  })
  // Bütün fotoğraflar
  const yazar = document.querySelector('.kunye-row [rel="author"], [rel="author"]')?.textContent?.trim()
  const butun = document.createElement('section')
  butun.className = 'g-butun'; butun.setAttribute('aria-label', 'Bütün fotoğraflar')
  butun.innerHTML = `<div class="g-butun-bas"><h2>Bütün fotoğraflar</h2><span>${n} kare${yazar ? ' · ' + kacis(yazar) : ''}</span></div>
    <div class="g-izgara">${fotolar.map((f, i) => `<button type="button" class="g-k" data-g="${i}" aria-label="${i + 1}. fotoğrafı aç"><img src="${kacis(f.kucuk)}" alt="" loading="lazy"></button>`).join('')}</div>`
  prose.append(butun)

  // Tam ekran galeri
  const baslik = document.querySelector('h1')?.textContent?.trim() || ''
  const g = document.createElement('div')
  g.className = 'galeri'; g.hidden = true
  g.setAttribute('role', 'dialog'); g.setAttribute('aria-modal', 'true'); g.setAttribute('aria-label', 'Fotoğraf galerisi')
  g.innerHTML = `<div class="g-ust"><span class="g-say" aria-live="polite"><b data-sira>1</b> / ${n}</span><span class="g-baslik">${kacis(baslik)}</span>
      <button type="button" class="g-btn" data-kapat aria-label="Galeriyi kapat">${ok('M6 6l12 12M18 6L6 18')}</button></div>
    <div class="g-sahne"><img alt="" data-buyuk>
      <button type="button" class="g-btn g-onceki" data-yon="-1" aria-label="Önceki fotoğraf">${ok('M15 5l-7 7 7 7')}</button>
      <button type="button" class="g-btn g-sonraki" data-yon="1" aria-label="Sonraki fotoğraf">${ok('M9 5l7 7-7 7')}</button></div>
    <div class="g-alt"><p class="g-yazi" data-yazi></p><div class="g-serit">${fotolar.map((f, i) => `<button type="button" data-s="${i}" aria-label="${i + 1}. fotoğraf"><img src="${kacis(f.kucuk)}" alt="" loading="lazy"></button>`).join('')}</div></div>`
  document.body.append(g)
  const buyuk = g.querySelector<HTMLImageElement>('[data-buyuk]')!, yazi = g.querySelector('[data-yazi]')!, sira = g.querySelector('[data-sira]')!
  const serit = [...g.querySelectorAll<HTMLElement>('[data-s]')]
  let i = 0, donus: HTMLElement | null = null, zaman = 0
  const goster = (k: number) => {
    i = (k + n) % n
    const f = fotolar[i]
    buyuk.classList.add('gecis'); clearTimeout(zaman)
    zaman = window.setTimeout(() => { buyuk.src = f.buyuk; buyuk.alt = f.alt; buyuk.classList.remove('gecis') }, 120)
    sira.textContent = String(i + 1)
    // Altyazının son parçası fotoğrafçı ("Fotoğraf: …") ise kalın
    const p = f.yazi.split(' · '), son = p.length > 1 && /^(Fotoğraf|Görsel)\b/.test(p[p.length - 1]) ? p.pop()! : ''
    yazi.innerHTML = kacis(p.join(' · ')) + (son ? `${p.length ? ' · ' : ''}<b>${kacis(son)}</b>` : '')
    serit.forEach((b, k) => { b.setAttribute('aria-current', String(k === i)); if (k === i) b.scrollIntoView({ block: 'nearest', inline: 'center' }) })
    // Sonraki fotoğraf önceden yüklenir
    new Image().src = fotolar[(i + 1) % n].buyuk
  }
  const ac = (k: number, el: HTMLElement) => { donus = el; g.hidden = false; document.documentElement.style.overflow = 'hidden'; goster(k); g.querySelector<HTMLElement>('[data-kapat]')!.focus() }
  const kapat = () => { g.hidden = true; document.documentElement.style.overflow = ''; donus?.focus() }
  for (const el of [prose, kapak].filter(Boolean) as HTMLElement[]) el.addEventListener('click', (e) => { const t = (e.target as HTMLElement).closest<HTMLElement>('[data-g]'); if (t) ac(Number(t.dataset.g), t) })
  g.addEventListener('click', (e) => {
    const t = e.target as HTMLElement
    const s = t.closest<HTMLElement>('[data-s]'); if (s) return goster(Number(s.dataset.s))
    if (t.closest('[data-kapat]')) return kapat()
    const y = t.closest<HTMLElement>('[data-yon]'); if (y) return goster(i + Number(y.dataset.yon))
    if (t.classList.contains('g-sahne')) kapat()
  })
  document.addEventListener('keydown', (e) => {
    if (g.hidden) return
    if (e.key === 'Escape') kapat(); else if (e.key === 'ArrowRight') goster(i + 1); else if (e.key === 'ArrowLeft') goster(i - 1)
    else if (e.key === 'Tab') { const o = [...g.querySelectorAll<HTMLElement>('button')].filter((b) => b.offsetParent); const a = o.indexOf(document.activeElement as HTMLElement); if (e.shiftKey ? a <= 0 : a === o.length - 1) { e.preventDefault(); o[e.shiftKey ? o.length - 1 : 0].focus() } }
  })
  let x0: number | null = null
  g.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX }, { passive: true })
  g.addEventListener('touchend', (e) => { if (x0 == null) return; const d = e.changedTouches[0].clientX - x0; if (Math.abs(d) > 40) goster(i + (d < 0 ? 1 : -1)); x0 = null })
  buyuk.addEventListener('contextmenu', (e) => e.preventDefault())
}

document.querySelectorAll<HTMLElement>('.prose').forEach(kur)
