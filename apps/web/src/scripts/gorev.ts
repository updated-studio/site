/**
 * Haftalık fotoğraf görevi (/gorev): katılım (tek fotoğraf yükleme), kör oylama (sahibi gizli, kişiye özel karışık sıra, en çok 3 oy),
 * son sonuçlar. Veri /api/uye/gorev'den; yükleme /api/uye/gorev/katil (çok parçalı form).
 */
import { CMS, anahtar, api, avatar, bildir, esc, girisli, isaretler, oturumDegisince } from './uye'

const $ = <T extends HTMLElement>(s: string) => document.querySelector<T>(s)!
const katilAlani = $('[data-gv-katil]'), oylamaAlani = $('[data-gv-oylama]'), sonucAlani = $('[data-gv-sonuclar]')
const buyuk = $<HTMLDialogElement>('[data-gv-buyuk]')
let veri: any = null

const kalan = (iso: string) => {
  const ms = +new Date(iso) - Date.now(); if (ms <= 0) return 'bitti'
  const g = Math.floor(ms / 86_400_000), s = Math.floor(ms / 3_600_000) % 24
  return g > 0 ? `${g} gün ${s} saat` : s > 0 ? `${s} saat` : `${Math.max(1, Math.floor(ms / 60_000))} dakika`
}
const gun = (iso: string) => new Date(+new Date(iso) - 1).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long', timeZone: 'Europe/Istanbul' })

function buyukAc(src: string, not: string) {
  $<HTMLImageElement>('[data-gv-buyuk-img]').src = src
  $('[data-gv-buyuk-not]').textContent = not
  buyuk.showModal()
}
buyuk.addEventListener('click', (e) => { if (e.target === buyuk) buyuk.close() })

/* ---------------- katılım ---------------- */
function katilCiz() {
  const k = veri?.katilim
  if (!k) { katilAlani.innerHTML = `<p class="gv-bos">Şu an katılıma açık görev yok. Yeni tema pazartesi 00.00'da açılır.</p>`; return }
  $('[data-gv-baslik]').textContent = k.baslik
  if (k.aciklama) $('[data-gv-aciklama]').textContent = k.aciklama
  $('[data-gv-sure]').textContent = `Katılım ${gun(k.bitis)} 23.59'da biter · ${kalan(k.bitis)} kaldı · ${k.katilimci} fotoğraf`
  if (!girisli()) {
    katilAlani.innerHTML = `<div class="gv-davet"><p><b>Katılmak için Uper ol.</b> Fotoğrafını yükle, hafta sonunda Uper'ler kör oylamayla haftanın fotoğrafını seçsin. Ücretsiz.</p><div><a class="btn btn-p" href="/hesap#kayit" data-donus>Uper ol</a> <a class="btn" href="/hesap#giris" data-donus>Giriş yap</a></div></div>`
    return
  }
  const b = k.benim
  if (b) {
    const DURUM: Record<string, string> = { bekliyor: 'Onay bekliyor', onaylandi: 'Göreve katıldın ✓', reddedildi: 'Alınmadı' }
    katilAlani.innerHTML = `<div class="gv-benim"><img src="${esc(b.kucuk)}" alt="Senin fotoğrafın" loading="lazy">
      <div><p class="meta">Senin fotoğrafın</p><p class="gv-durum gv-${esc(b.durum)}">${DURUM[b.durum] || b.durum}</p>${b.aciklama ? `<p>${esc(b.aciklama)}</p>` : ''}
      <p class="gv-ipucu">${b.durum === 'reddedildi' ? 'Kurallara ya da temaya uymadığı için alınmadı. Başka bir fotoğrafla yeniden katılabilirsin.' : 'Pazar 23.59\'a kadar değiştirebilir ya da geri çekebilirsin.'}</p>
      <div class="gv-dugmeler"><button class="btn" data-degistir>Değiştir</button> <button class="btn" data-geri>Geri çek</button></div></div></div>`
    katilAlani.querySelector('[data-degistir]')!.addEventListener('click', () => formCiz(true))
    katilAlani.querySelector('[data-geri]')!.addEventListener('click', async () => {
      if (!confirm('Fotoğrafını görevden geri çekmek istiyor musun?')) return
      const r = await api('/uye/gorev/geri-cek', 'POST', {})
      if (r.s !== 200) return bildir(r.j?.hata || 'Olmadı.', 'hata')
      bildir('Fotoğrafın geri çekildi.'); yukle()
    })
    return
  }
  formCiz(false)
}

function formCiz(degistir: boolean) {
  katilAlani.innerHTML = `<form class="gv-form" data-form>
    <label class="gv-dosya"><input type="file" accept="image/jpeg,image/png,image/webp,image/heic" required data-dosya><span data-dosya-yazi>${degistir ? 'Yeni fotoğrafı seç' : 'Fotoğrafını seç'}</span><img alt="" hidden data-onizleme></label>
    <div class="gv-alanlar">
      <label>Kısa not (isteğe bağlı)<input type="text" maxlength="140" placeholder="Nerede, nasıl çektin?" data-aciklama></label>
      <label class="gv-onay"><input type="checkbox" required data-sahip> Bu fotoğrafı ben çektim. UPDATED'ın adımla sitede ve sosyal medyada göstermesine izin veriyorum.</label>
      <p class="gv-ipucu">JPEG ya da PNG, en az 800 piksel. Konum ve cihaz bilgisi silinir. Fotoğraf ekip onayından sonra oylamaya girer.</p>
      <div class="gv-dugmeler"><button class="btn btn-p" type="submit" data-gonder>${degistir ? 'Fotoğrafı değiştir' : 'Göreve katıl'}</button>${degistir ? ' <button class="btn" type="button" data-vazgec>Vazgeç</button>' : ''}</div>
    </div></form>`
  const form = katilAlani.querySelector<HTMLFormElement>('[data-form]')!
  const dosya = form.querySelector<HTMLInputElement>('[data-dosya]')!, on = form.querySelector<HTMLImageElement>('[data-onizleme]')!
  dosya.addEventListener('change', () => {
    const f = dosya.files?.[0]; if (!f) return
    on.src = URL.createObjectURL(f); on.hidden = false
    form.querySelector('[data-dosya-yazi]')!.textContent = f.name
  })
  form.querySelector('[data-vazgec]')?.addEventListener('click', katilCiz)
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const f = dosya.files?.[0]; if (!f) return
    if (f.size > 25 * 1024 * 1024) return bildir('Fotoğraf 25 MB\'tan büyük olamaz.', 'hata')
    const gonder = form.querySelector<HTMLButtonElement>('[data-gonder]')!
    gonder.disabled = true; gonder.textContent = 'Yükleniyor…'
    const fd = new FormData()
    fd.append('dosya', f); fd.append('aciklama', form.querySelector<HTMLInputElement>('[data-aciklama]')!.value); fd.append('sahip', form.querySelector<HTMLInputElement>('[data-sahip]')!.checked ? '1' : '0')
    try {
      const t = await anahtar()
      const r = await fetch(`${CMS}/api/uye/gorev/katil`, { method: 'POST', headers: t ? { Authorization: `Uper ${t}` } : {}, body: fd })
      const j = await r.json().catch(() => null)
      if (!r.ok) { bildir(j?.hata || 'Yüklenemedi.', 'hata'); gonder.disabled = false; gonder.textContent = 'Yeniden dene'; return }
      bildir('Fotoğrafın alındı. Ekip onayından sonra oylamaya girecek.')
      yukle()
    } catch { bildir('Bağlantı kurulamadı.', 'hata'); gonder.disabled = false; gonder.textContent = 'Yeniden dene' }
  })
}

/* ---------------- oylama ---------------- */
function oylamaCiz() {
  const o = veri?.oylama
  oylamaAlani.hidden = !o
  if (!o) return
  const oyVerebilir = girisli()
  oylamaAlani.innerHTML = `<div class="gv-bas"><h2>Oylama: ${esc(o.baslik)}</h2>
    <p class="meta">${kalan(o.oylamaBitis)} kaldı · ${o.fotolar.length} fotoğraf · <span data-oy-kalan>${oyVerebilir ? `${o.oyKalan} oy hakkın var` : 'Oy vermek için Uper ol'}</span></p>
    <p class="gv-ipucu">Fotoğrafların sahipleri oylama bitene kadar gizli; sıra herkes için farklı.</p></div>
    <ul class="gv-izgara">${o.fotolar.map((f: any) => `<li class="gv-foto${f.oyum ? ' oylu' : ''}" data-id="${f.id}">
      <button class="gv-ac" data-ac aria-label="Büyüt"><img src="${esc(f.kucuk)}" alt="${esc(f.aciklama || 'Görev fotoğrafı')}" loading="lazy"${f.en ? ` width="${f.en}" height="${f.boy}"` : ''}></button>
      ${f.benim ? `<span class="gv-senin">Senin fotoğrafın</span>` : oyVerebilir ? `<button class="gv-oy" data-oy aria-pressed="${f.oyum}">${f.oyum ? '★ Oy verdin' : '☆ Oy ver'}</button>` : ''}
      ${f.aciklama ? `<p>${esc(f.aciklama)}</p>` : ''}</li>`).join('')}</ul>
    ${oyVerebilir ? '' : `<p><a class="btn btn-p" href="/hesap#kayit" data-donus>Oy vermek için Uper ol</a></p>`}`
  for (const li of oylamaAlani.querySelectorAll<HTMLLIElement>('.gv-foto')) {
    const f = o.fotolar.find((x: any) => String(x.id) === li.dataset.id)
    li.querySelector('[data-ac]')!.addEventListener('click', () => buyukAc(f.buyuk, f.aciklama || ''))
    const b = li.querySelector<HTMLButtonElement>('[data-oy]')
    b?.addEventListener('click', async () => {
      const ver = b.getAttribute('aria-pressed') !== 'true'
      b.disabled = true
      const r = await api('/uye/gorev/oy', 'POST', { foto: f.id, oy: ver })
      b.disabled = false
      if (r.s !== 200) return bildir(r.j?.hata || 'Olmadı.', 'hata')
      b.setAttribute('aria-pressed', String(r.j.oyum)); b.textContent = r.j.oyum ? '★ Oy verdin' : '☆ Oy ver'; li.classList.toggle('oylu', r.j.oyum)
      oylamaAlani.querySelector('[data-oy-kalan]')!.textContent = `${r.j.oyKalan} oy hakkın var`
    })
  }
}

/* ---------------- sonuçlar ---------------- */
function sonucCiz() {
  const l = veri?.sonuclar || []
  sonucAlani.hidden = !l.length
  if (!l.length) return
  const DERECE = ['', '1.', '2.', '3.']
  sonucAlani.innerHTML = `<h2 class="gv-h">Sonuçlar</h2>` + l.map((g: any) => {
    const ilk = g.fotolar.filter((f: any) => f.sira), diger = g.fotolar.filter((f: any) => !f.sira)
    const kim = (f: any) => f.uye ? `<a class="gv-kim" href="/uper?ad=${esc(f.uye.kullaniciAdi)}">${avatar(f.uye, 28)}<span>${esc(f.uye.ad)}</span>${isaretler(f.uye)}</a>` : '<span class="gv-kim">Uper</span>'
    return `<article class="gv-sonuc" id="sonuc-${g.id}"><h3>${esc(g.baslik)} <span class="meta">${g.fotolar.length} fotoğraf</span></h3>
      ${ilk.length ? `<ol class="gv-kursu">${ilk.map((f: any) => `<li class="gv-d${f.sira}" data-id="${f.id}"><button class="gv-ac" data-ac aria-label="Büyüt"><img src="${esc(f.kucuk)}" alt="${esc(f.aciklama || g.baslik)}" loading="lazy"></button>
        <div class="gv-alt"><b>${DERECE[f.sira]}</b>${kim(f)}<span class="meta">${f.oy} oy</span></div></li>`).join('')}</ol>` : '<p class="gv-ipucu">Bu hafta oy alan fotoğraf olmadı.</p>'}
      ${diger.length ? `<ul class="gv-izgara kucuk">${diger.map((f: any) => `<li class="gv-foto" data-id="${f.id}"><button class="gv-ac" data-ac aria-label="Büyüt"><img src="${esc(f.kucuk)}" alt="${esc(f.aciklama || g.baslik)}" loading="lazy"></button>${kim(f)}</li>`).join('')}</ul>` : ''}
    </article>`
  }).join('')
  for (const g of l) for (const f of g.fotolar) sonucAlani.querySelector(`#sonuc-${g.id} [data-id="${f.id}"] [data-ac]`)?.addEventListener('click', () => buyukAc(f.buyuk, `${f.uye?.ad || ''}${f.aciklama ? ' · ' + f.aciklama : ''}`))
  if (location.hash.startsWith('#sonuc-')) document.querySelector(location.hash)?.scrollIntoView()
}

async function yukle() {
  const r = await api('/uye/gorev')
  if (r.s !== 200 || !r.j) { katilAlani.innerHTML = `<p class="gv-bos">Şu an yüklenemedi. Biraz sonra yeniden dene.</p>`; return }
  veri = r.j
  katilCiz(); oylamaCiz(); sonucCiz()
}
yukle()
oturumDegisince(() => { yukle() })
