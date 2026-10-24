/** Herkese açık Uper profili: /uper?ad=kullaniciadi (seviye, rozetler, ekipman, son yorumlar). */
import { api, avatar, esc, onay, zamanOnce } from './uye'

const kok = document.getElementById('uper')!
const ad = new URLSearchParams(location.search).get('ad') || ''
;(async () => {
  const [y, a] = await Promise.all([api(`/uye/profil?ad=${encodeURIComponent(ad)}`), api('/uye/ayar')])
  if (y.s !== 200) { kok.innerHTML = `<h1 class="h2">Uper bulunamadı</h1><p>Bu kullanıcı adıyla bir Uper yok ya da hesabını kapatmış.</p><a class="btn" href="/">Ana sayfaya dön</a>`; return }
  const u = y.j, sv = a.j?.seviyeler || []
  document.title = `${u.ad} (@${u.kullaniciAdi}) · UPDATED`
  kok.innerHTML = `
    <div class="hs-bas">${avatar(u, 88)}<div><h1 class="h2">${esc(u.ad)}${onay(u.ekip)}</h1><p class="kad">@${esc(u.kullaniciAdi)} · Üyelik ${new Date(u.uyelik).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</p>${u.bio ? `<p>${esc(u.bio)}</p>` : ''}</div></div>
    <div class="hs-iki">
      <div>
        <h2 class="label">Seviye</h2>
        <ol class="sv-l kucuk">${sv.map((s: any, i: number) => `<li class="${s.ad === u.seviye.ad ? 'on' : u.seviye.puan >= s.puan ? 'gecti' : ''}"><span class="num">${i + 1}</span><b>${esc(s.ad)}</b></li>`).join('')}</ol>
        <p class="meta"><span class="num">${u.seviye.puan}</span> puan · ${u.istatistik.yorum} yorum · ${u.istatistik.begeni} beğeni</p>
        ${u.rozetler.length ? `<h2 class="label" style="margin-top:24px">Rozetler</h2><ul class="rz">${u.rozetler.map((r: any) => `<li class="rz-${esc(r.kod)}">${esc(r.ad)}</li>`).join('')}</ul>` : ''}
        ${u.ekipman.length ? `<h2 class="label" style="margin-top:24px">Ekipmanı</h2><ul class="hs-ekl">${u.ekipman.map((e: any) => `<li><span class="meta">${esc(e.tur)}</span> ${e.urun?.yol ? `<a href="${esc(e.urun.yol)}">${esc(e.ad)}</a>` : esc(e.ad)}</li>`).join('')}</ul>` : ''}
      </div>
      <div>
        <h2 class="label">Son yorumları</h2>
        ${u.yorumlar.length ? `<ul class="hs-l">${u.yorumlar.map((x: any) => `<li><a href="${esc(x.yol)}#yorum-${x.id}"><b>${esc(x.baslik)}</b></a><p>${esc(x.metin)}</p><span class="meta">${esc(zamanOnce(x.at))}</span></li>`).join('')}</ul>` : '<p class="meta">Henüz yorum yok.</p>'}
      </div>
    </div>`
})()
