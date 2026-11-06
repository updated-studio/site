/** Herkese açık Uper profili: /uper?ad=kullaniciadi (seviye, rozetler, ekipman, son yorumlar). */
import { api, avatar, esc, isaretler, zamanOnce } from './uye'
import { glyph } from '../lib/ui'

/** Ekipman türü → künye çizimi (künyeye bağlı olmayan ekipmanda görsel yerine) */
const CIZIM: Record<string, string> = { Kamera: 'camera', Lens: 'lens', Dron: 'drone', Gimbal: 'gimbal', Işık: 'light', Ses: 'mic', Telefon: 'phone', Bilgisayar: 'laptop' }
/** Ekipman rafı (6 Kasım 2026): künyeye bağlı ürün görseli ve adresiyle, bağlı olmayan yalnız adıyla */
const raf = (l: any[]) => `<ul class="up-raf">${l.map((e) => {
  const g = e.urun?.gorsel ? `<img src="${esc(e.urun.gorsel)}" alt="" loading="lazy" decoding="async" width="800" height="450">` : glyph(CIZIM[e.tur] || 'other', 64)
  const ic = `<span class="g">${g}</span><span class="y"><span class="meta">${esc(e.tur || 'Ekipman')}</span><b translate="no">${esc(e.urun?.ad || e.ad)}</b></span>`
  return `<li>${e.urun?.yol ? `<a href="${esc(e.urun.yol)}">${ic}</a>` : `<span class="up-raf-k">${ic}</span>`}</li>`
}).join('')}</ul>`

const kok = document.getElementById('uper')!
const ad = new URLSearchParams(location.search).get('ad') || ''
;(async () => {
  if (!ad) { kok.innerHTML = `<h1 class="h2">Uper profili</h1><p>Profil adresi eksik. Bir Uper'ın profilini görmek için adına dokunun.</p><a class="btn" href="/">Ana sayfaya dön</a>`; return }
  const [y, a] = await Promise.all([api(`/uye/profil?ad=${encodeURIComponent(ad)}`), api('/uye/ayar')])
  if (y.s !== 200) { kok.innerHTML = `<h1 class="h2">Uper bulunamadı</h1><p>Bu kullanıcı adıyla bir Uper yok ya da hesabını kapatmış.</p><a class="btn" href="/">Ana sayfaya dön</a>`; return }
  const u = y.j, sv = a.j?.seviyeler || []
  document.title = `${u.ad} (@${u.kullaniciAdi}) · UPDATED`
  kok.innerHTML = `
    <div class="hs-bas">${avatar(u, 88)}<div><h1 class="h2">${esc(u.ad)}${isaretler(u)}</h1><p class="kad">@${esc(u.kullaniciAdi)} · Üyelik ${new Date(u.uyelik).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</p>${u.bio ? `<p>${esc(u.bio)}</p>` : ''}</div></div>
    ${u.ekipman.length ? `<section class="up-ekipman" aria-labelledby="up-ek-b"><h2 class="label" id="up-ek-b">Ekipmanı <span class="num">${u.ekipman.length}</span></h2>${raf(u.ekipman)}</section>` : ''}
    <div class="hs-iki">
      <div>
        <h2 class="label">Seviye</h2>
        <ol class="sv-l kucuk">${sv.map((s: any, i: number) => `<li class="${s.ad === u.seviye.ad ? 'on' : u.seviye.puan >= s.puan ? 'gecti' : ''}"><span class="num">${i + 1}</span><b>${esc(s.ad)}</b></li>`).join('')}</ol>
        <p class="meta"><span class="num">${u.seviye.puan}</span> puan · ${u.istatistik.yorum} yorum · ${u.istatistik.begeni} beğeni</p>
        ${u.rozetler.length ? `<h2 class="label" style="margin-top:24px">Rozetler</h2><ul class="rz">${u.rozetler.map((r: any) => `<li class="rz-${esc(r.kod)}">${esc(r.ad)}</li>`).join('')}</ul>` : ''}
      </div>
      <div>
        <h2 class="label">Son yorumları</h2>
        ${u.yorumlar.length ? `<ul class="hs-l">${u.yorumlar.map((x: any) => `<li><a href="${esc(x.yol)}#yorum-${x.id}"><b>${esc(x.baslik)}</b></a><p>${esc(x.metin)}</p><span class="meta">${esc(zamanOnce(x.at))}</span></li>`).join('')}</ul>` : '<p class="meta">Henüz yorum yok.</p>'}
      </div>
    </div>`
})()
