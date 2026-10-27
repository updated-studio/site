/**
 * Kıyas masası etkileşimi (27 Ekim 2026): ürün ekle/çıkar, "Sadece farklar", paylaşılabilir adres (?u=a,b,c).
 * Künye kataloğu /veri/kunyeler.json'dan bir kez okunur; HTML'i derlemedeki aynı fonksiyonlar üretir (lib/kiyas.ts).
 */
import { baslik, cubukHtml, kartlarHtml, nedenHtml, tabloHtml, type Araliklar, type K } from '../lib/kiyas'

const EN_COK = 4
let katalog: Promise<{ k: K[]; ar: Araliklar }> | null = null
const yukle = () => (katalog ??= fetch('/veri/kunyeler.json').then((r) => r.json()))

for (const kok of Array.from(document.querySelectorAll<HTMLElement>('[data-kiyas]'))) {
  const $ = <T extends Element>(ad: string) => kok.querySelector<T>(`[data-km="${ad}"]`)!
  const adresli = kok.dataset.adresli === '1', tag = kok.dataset.tag || ''
  let secili = (kok.dataset.kiyas || '').split(',').filter(Boolean)
  let sadeceFark = false

  async function ciz() {
    const { k, ar } = await yukle()
    const ks = secili.map((s) => k.find((x) => x.s === s)).filter((x): x is K => !!x)
    if (ks.length < 2) return
    kok.style.setProperty('--n', String(ks.length))
    $('kartlar').innerHTML = kartlarHtml(ks, ar, tag)
    kok.querySelector('.km-cubuk-ic')!.innerHTML = `<div class="sol"><button class="btn" type="button" data-km="fark" aria-pressed="${sadeceFark}">Sadece farklar</button></div>` + cubukHtml(ks, ar)
    $('neden').innerHTML = nedenHtml(ks)
    $('tablo').innerHTML = tabloHtml(ks)
    const h1 = document.querySelector('[data-kiyas-baslik]')
    if (h1 && adresli) { h1.textContent = baslik(ks); document.title = `${baslik(ks)} · Kıyasla · UPDATED` }
    if (adresli) history.replaceState(null, '', `?u=${secili.join(',')}`)
  }

  async function listele(q = '') {
    const { k } = await yukle()
    const tur = k.find((x) => x.s === secili[0])?.t
    const ara = q.toLocaleLowerCase('tr-TR').trim()
    const l = k.filter((x) => x.t === tur && !secili.includes(x.s) && `${x.b} ${x.n}`.toLocaleLowerCase('tr-TR').includes(ara))
      .sort((a, b) => b.sp.filter((o) => o[1]).length - a.sp.filter((o) => o[1]).length)
    const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)
    $('liste').innerHTML = l.length ? l.slice(0, 60).map((x) => `<li><button type="button" data-ekle="${esc(x.s)}"><small translate="no">${esc(x.b)}</small><b translate="no">${esc(x.n)}</b></button></li>`).join('') : '<li class="pc-unk">Bu adla aynı türden künye yok.</li>'
  }

  kok.addEventListener('click', async (e) => {
    const t = e.target as Element
    const sil = t.closest<HTMLElement>('[data-sil]'), ekle = t.closest<HTMLElement>('[data-ekle]')
    if (sil) { secili = secili.filter((s) => s !== sil.dataset.sil); await ciz(); return }
    if (ekle) {
      secili.push(ekle.dataset.ekle!)
      $<HTMLDialogElement>('secici').close()
      if (!adresli) { location.href = `/karsilastirma/kiyas?u=${secili.join(',')}`; return }
      await ciz(); return
    }
    if (t.closest('[data-ekle-ac]') && secili.length < EN_COK) {
      const d = $<HTMLDialogElement>('secici'), a = $<HTMLInputElement>('ara')
      a.value = ''; d.showModal(); listele(); if (matchMedia('(pointer:fine)').matches) a.focus()
      return
    }
    if (t.closest('[data-km="fark"]')) {
      sadeceFark = !sadeceFark
      t.closest('[data-km="fark"]')!.setAttribute('aria-pressed', String(sadeceFark))
      kok.querySelector('.km-tablo')!.classList.toggle('sadece-fark', sadeceFark)
    }
  })
  $<HTMLInputElement>('ara').addEventListener('input', (e) => listele((e.target as HTMLInputElement).value))

  // Kıyas aracı: adresteki seçim (paylaşılan bağlantı) derlemedeki varsayılanın yerine geçer
  if (adresli) {
    const u = new URLSearchParams(location.search).get('u')?.split(',').map((s) => s.trim()).filter(Boolean).slice(0, EN_COK)
    if (u?.length === 1) {
      // Künye sayfasından tek ürünle gelindi: aynı türün en dolu başka künyesi rakip olur
      yukle().then(({ k }) => {
        const ben = k.find((x) => x.s === u[0]); if (!ben) return
        const rakip = k.filter((x) => x.t === ben.t && x.s !== ben.s).sort((a, b) => b.sp.filter((o) => o[1]).length - a.sp.filter((o) => o[1]).length)[0]
        if (rakip) { secili = [ben.s, rakip.s]; ciz() }
      })
    } else if (u && u.length >= 2 && u.join(',') !== secili.join(',')) { secili = [...new Set(u)]; ciz() }
  }
}
