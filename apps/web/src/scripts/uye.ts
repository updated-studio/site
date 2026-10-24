/**
 * Uper (okur üyeliği) istemcisi: oturum, üst çubuktaki hesap düğmesi, yazıların topluluk bölümü (tepki, kaydet, yorum), okuma puanı.
 * Giriş ayrı servis (panel.updated.com.tr/uye/v1, Supabase Auth); topluluk verisi panelin /api/uye/* uçlarından.
 * Oturum bu tarayıcıda (localStorage "up-oturum"); anahtar kısa ömürlü, yenileme anahtarıyla kendiliğinden tazelenir.
 */
export const CMS = (document.documentElement.dataset.cms || 'https://panel.updated.com.tr').replace(/\/$/, '')
export const AUTH = CMS + '/uye/v1'
const ANAHTAR = 'up-oturum'
type Oturum = { a: string; r: string; e: number; email: string }
const depo = {
  al: (k: string) => { try { return localStorage.getItem(k) } catch { return null } },
  yaz: (k: string, v: string | null) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v) } catch {} },
}
export const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/* ---------------- oturum ---------------- */
let oturum: Oturum | null = (() => { try { return JSON.parse(depo.al(ANAHTAR) || 'null') } catch { return null } })()
export const girisli = () => !!oturum
export function oturumYaz(t: { access_token: string; refresh_token: string; expires_in?: number; expires_at?: number; user?: { email?: string } } | null) {
  if (!t) { oturum = null; depo.yaz(ANAHTAR, null); dinleyiciler.forEach((f) => f()); return }
  const e = t.expires_at ? t.expires_at * 1000 : Date.now() + (t.expires_in || 3600) * 1000
  oturum = { a: t.access_token, r: t.refresh_token, e, email: t.user?.email || oturum?.email || '' }
  depo.yaz(ANAHTAR, JSON.stringify(oturum)); dinleyiciler.forEach((f) => f())
}
const dinleyiciler = new Set<() => void>()
export const oturumDegisince = (f: () => void) => { dinleyiciler.add(f) }
addEventListener('storage', (e) => { if (e.key === ANAHTAR) { try { oturum = JSON.parse(e.newValue || 'null') } catch { oturum = null } dinleyiciler.forEach((f) => f()); benOnbellek = null } })

let yenileniyor: Promise<boolean> | null = null
async function tazele(): Promise<boolean> {
  if (!oturum) return false
  if (!yenileniyor) yenileniyor = (async () => {
    try {
      const r = await fetch(`${AUTH}/token?grant_type=refresh_token`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: oturum!.r }) })
      if (r.ok) { oturumYaz(await r.json()); return true }
      if (r.status === 400 || r.status === 401 || r.status === 403) oturumYaz(null)
      return false
    } catch { return false } finally { setTimeout(() => (yenileniyor = null), 0) }
  })()
  return yenileniyor
}
export async function anahtar(): Promise<string | null> {
  if (!oturum) return null
  if (oturum.e - Date.now() < 60_000) await tazele()
  return oturum?.a ?? null
}

/** Panel uçları: yanıt { s: durum, j: gövde } */
export async function api(yol: string, method = 'GET', govde?: unknown): Promise<{ s: number; j: any }> {
  const istek = async () => {
    const t = await anahtar()
    const r = await fetch(`${CMS}/api${yol}`, { method, headers: { ...(t ? { Authorization: `Uper ${t}` } : {}), ...(govde !== undefined ? { 'Content-Type': 'application/json' } : {}) }, body: govde !== undefined ? JSON.stringify(govde) : undefined })
    let j: any = null; try { j = await r.json() } catch {}
    return { s: r.status, j }
  }
  try {
    let y = await istek()
    if (y.s === 401 && oturum) { if (await tazele()) y = await istek(); else oturumYaz(null) }
    return y
  } catch { return { s: 0, j: { hata: 'Bağlantı kurulamadı. İnternetini kontrol edip yeniden dene.' } } }
}

/** Giriş servisi istekleri */
export async function giris(yol: string, govde?: unknown, method = 'POST', yetkili = false): Promise<{ s: number; j: any }> {
  try {
    const t = yetkili ? await anahtar() : null
    const r = await fetch(`${AUTH}${yol}`, { method, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) }, body: govde !== undefined ? JSON.stringify(govde) : undefined })
    let j: any = null; try { j = await r.json() } catch {}
    return { s: r.status, j }
  } catch { return { s: 0, j: { msg: 'Bağlantı kurulamadı.' } } }
}
export async function cikis() {
  const t = oturum?.a
  oturumYaz(null); benOnbellek = null
  if (t) fetch(`${AUTH}/logout`, { method: 'POST', headers: { Authorization: `Bearer ${t}` } }).catch(() => {})
}

/** Profil: bir kez çekilir (sayfa boyunca) */
let benOnbellek: Promise<any> | null = null
export const ben = (taze = false) => {
  if (!oturum) return Promise.resolve(null)
  if (!benOnbellek || taze) benOnbellek = api('/uye/ben').then((y) => (y.s === 200 ? y.j : null))
  return benOnbellek
}
oturumDegisince(() => { benOnbellek = null })

/* ---------------- yardımcılar ---------------- */
export function zamanOnce(iso: string) {
  const s = (Date.now() - +new Date(iso)) / 1000
  if (s < 60) return 'az önce'
  if (s < 3600) return `${Math.floor(s / 60)} dk önce`
  if (s < 86400) return `${Math.floor(s / 3600)} sa önce`
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} gün önce`
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}
export const basHarf = (ad: string) => (ad || '?').trim().split(/\s+/).slice(0, 2).map((x) => x[0]).join('').toLocaleUpperCase('tr-TR')
const ONAY = `<svg class="onay" width="16" height="16" viewBox="0 0 24 24" role="img" aria-label="Updated ekibi"><title>Updated ekibi</title><path fill="#2563EB" d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69 3.1 5.5l.34 3.7L1 12l2.44 2.79-.34 3.7 3.61.82L8.6 22.5l3.4-1.47 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12z"/><path fill="#FFFFFF" d="M10 17l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>`
/** Ekip üyesinin adının yanında mavi onay işareti (Instagram'daki gibi) */
export const onay = (ekip?: boolean) => (ekip ? ONAY : '')
export const avatar = (u: { ad: string; renk?: string }, boy = 40) => `<span class="av av-${esc(u.renk || 'turuncu')}" style="width:${boy}px;height:${boy}px;font-size:${Math.round(boy * 0.42)}px" aria-hidden="true">${esc(basHarf(u.ad))}</span>`
export function bildir(metin: string, tur: 'ok' | 'hata' = 'ok') {
  document.querySelectorAll('.toast.uye-t').forEach((t) => t.remove())
  const t = document.createElement('div')
  t.className = 'toast uye-t'; t.setAttribute('role', tur === 'hata' ? 'alert' : 'status')
  t.innerHTML = `${tur === 'ok' ? '<span class="ck">✓</span>' : ''}<span>${esc(metin)}</span>`
  document.body.appendChild(t); setTimeout(() => t.remove(), 4500)
}
const metinHtml = (s: string) => esc(s).replace(/\n/g, '<br>')
const donusYaz = () => depo.yaz('up-donus', location.pathname + location.hash)

/* ---------------- üst çubuk: hesap düğmesi + bildirim menüsü ---------------- */
async function ustCubuk() {
  const b = document.querySelector<HTMLAnchorElement>('[data-uye-btn]'); if (!b) return
  const ilk = b.innerHTML
  let menu: HTMLDivElement | null = null
  const kapat = () => { menu?.remove(); menu = null; b.setAttribute('aria-expanded', 'false') }
  const ciz = async () => {
    kapat()
    const u = oturum ? await ben() : null
    b.onclick = null
    if (!u) { b.innerHTML = ilk; b.classList.remove('on'); b.setAttribute('aria-label', 'Uper ol / giriş yap'); b.title = 'Uper ol / giriş yap'; b.removeAttribute('aria-haspopup'); return }
    if (!u.kayitli) { b.innerHTML = ilk; b.setAttribute('aria-label', 'Profilini tamamla'); b.title = 'Profilini tamamla'; return }
    const bl = await api('/uye/bildirimler')
    const n = bl.j?.okunmamis || 0
    b.innerHTML = avatar(u, 30) + (n ? `<span class="nokta">${n > 9 ? '9+' : n}</span>` : '')
    b.classList.add('on'); b.setAttribute('aria-haspopup', 'true'); b.setAttribute('aria-expanded', 'false')
    b.setAttribute('aria-label', `Hesabım: ${u.ad}${n ? `, ${n} yeni bildirim` : ''}`); b.title = u.ad
    b.onclick = (e) => {
      if (e.metaKey || e.ctrlKey) return
      e.preventDefault()
      if (menu) return kapat()
      menu = document.createElement('div')
      menu.className = 'uye-m'; menu.setAttribute('role', 'menu')
      const liste = (bl.j?.liste || []).slice(0, 6)
      menu.innerHTML = `<div class="uye-m-bas">${avatar(u, 40)}<div><b>${esc(u.ad)}${onay(u.ekip)}</b><span class="kad">@${esc(u.kullaniciAdi)} · ${esc(u.seviye.ad)} · ${u.seviye.puan} puan</span></div></div>
        <div class="label uye-m-l">Bildirimler</div>
        ${liste.length ? `<ul class="uye-bl">${liste.map((x: any) => `<li class="${x.okundu ? '' : 'yeni'}"><a href="${esc(x.yol || '/hesap#bildirimler')}">${esc(x.metin)}<span class="meta">${esc(zamanOnce(x.at))}</span></a></li>`).join('')}</ul>` : '<p class="meta" style="padding:0 16px">Henüz bildirim yok.</p>'}
        <nav><a role="menuitem" href="/hesap#profil">Profilim</a><a role="menuitem" href="/hesap#kaydedilenler">Kaydettiklerim</a><a role="menuitem" href="/hesap#bildirimler">Tüm bildirimler</a><button role="menuitem" type="button" data-cikis>Çıkış yap</button></nav>`
      b.after(menu); b.setAttribute('aria-expanded', 'true')
      menu.querySelector('[data-cikis]')!.addEventListener('click', async () => { await cikis(); bildir('Çıkış yaptın.') })
      if (n) api('/uye/bildirimler/okundu', 'POST', {}).then(() => { b.querySelector('.nokta')?.remove() })
    }
  }
  document.addEventListener('click', (e) => { if (menu && !menu.contains(e.target as Node) && !b.contains(e.target as Node)) kapat() })
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu) { kapat(); b.focus() } })
  oturumDegisince(ciz)
  await ciz()
}

/* ---------------- yazının topluluk bölümü ---------------- */
const TEPKI: [string, string][] = [['begendim', 'Beğendim'], ['ilginc', 'İlginç'], ['sasirtici', 'Şaşırttı'], ['katilmiyorum', 'Katılmıyorum']]
const SIKAYET = ['Hakaret / nefret', 'Spam / reklam', 'Yanlış bilgi', 'Kişisel bilgi', 'Diğer']

function topluluk(kok: HTMLElement) {
  const hedef = kok.dataset.hedef!, ic = kok.querySelector<HTMLElement>('[data-tp-ic]')!
  let veri: any = null, sira = 'yeni', profil: any = null
  const say = document.querySelector<HTMLAnchorElement>('[data-yorum-say]')

  async function yukle() {
    const [y, p] = await Promise.all([api(`/uye/sayfa?hedef=${encodeURIComponent(hedef)}&sira=${sira}`), oturum ? ben() : Promise.resolve(null)])
    if (y.s === 404) { kok.hidden = true; return }
    if (y.s !== 200) { ic.innerHTML = `<p class="meta">Yorumlar şu an yüklenemedi.</p>`; return }
    veri = y.j; profil = p
    ciz()
    if (say) { say.hidden = false; say.textContent = veri.yorumSayisi ? `${veri.yorumSayisi} yorum` : 'Yorum yap' }
    const hedefYorum = /^#yorum-(\d+)$/.exec(location.hash)
    if (hedefYorum) { const el = document.getElementById(`yorum-${hedefYorum[1]}`); if (el) { el.scrollIntoView({ block: 'center' }); el.classList.add('vurgu') } }
  }

  const yorumHtml = (y: any, yanit = false): string => `
    <li class="yr${y.onayda ? ' onayda' : ''}${y.silindi ? ' silik' : ''}" id="yorum-${y.id}" data-id="${y.id}">
      ${y.uye ? `<a class="yr-av" href="/uper?ad=${esc(y.uye.kullaniciAdi)}" tabindex="-1">${avatar(y.uye, yanit ? 32 : 40)}</a>` : `<span class="yr-av"><span class="av av-gri" style="width:${yanit ? 32 : 40}px;height:${yanit ? 32 : 40}px" aria-hidden="true"></span></span>`}
      <div class="yr-g">
        <div class="yr-bas">${y.uye ? `<a href="/uper?ad=${esc(y.uye.kullaniciAdi)}"><b>${esc(y.uye.ad)}</b>${onay(y.uye.ekip)}</a> <span class="kad">@${esc(y.uye.kullaniciAdi)}</span> <span class="sv" title="Seviye">${esc(y.uye.seviye.ad)}</span>` : '<span class="meta">Silinmiş yorum</span>'}
          <span class="meta">· <time datetime="${esc(y.at)}">${esc(zamanOnce(y.at))}</time>${y.duzenlendi ? ' · düzenlendi' : ''}</span></div>
        ${y.onayda ? '<p class="yr-not">Ekibin onayını bekliyor; şimdilik yalnız sen görüyorsun.</p>' : ''}
        ${y.yanitlananAd ? `<span class="meta">↳ ${esc(y.yanitlananAd)} kişisine yanıt</span>` : ''}
        <div class="yr-m">${metinHtml(y.metin)}</div>
        ${y.silindi ? '' : `<div class="yr-a">
          <button type="button" class="yr-btn${y.begendim ? ' on' : ''}" data-begen ${y.benim || y.onayda ? 'disabled' : ''} aria-pressed="${y.begendim}">Beğen${y.begeni ? ` · <span class="num">${y.begeni}</span>` : ''}</button>
          ${y.onayda ? '' : '<button type="button" class="yr-btn" data-yanitla>Yanıtla</button>'}
          ${y.benim && Date.now() - +new Date(y.at) < 15 * 60_000 ? '<button type="button" class="yr-btn" data-duzenle>Düzenle</button>' : ''}
          ${y.benim ? '<button type="button" class="yr-btn" data-sil>Sil</button>' : y.onayda ? '' : '<button type="button" class="yr-btn" data-sikayet>Şikâyet et</button>'}
        </div>`}
        ${!yanit && y.yanitlar?.length ? `<ol class="yr-l yanitlar">${y.yanitlar.map((z: any) => yorumHtml(z, true)).join('')}</ol>` : ''}
      </div>
    </li>`

  const formHtml = (yer: string, deger = '', dugme = 'Gönder') => `
    <form class="yr-f" data-form="${yer}" novalidate>
      <label class="sr" for="yf-${yer}">Yorumun</label>
      <textarea id="yf-${yer}" name="metin" rows="${yer === 'ana' ? 3 : 2}" maxlength="2000" placeholder="${yer === 'ana' ? 'Ne düşünüyorsun? Saygılı ve konuyla ilgili yaz.' : 'Yanıtın…'}" required>${esc(deger)}</textarea>
      <div class="yr-fa"><span class="meta" data-kalan>${2000 - deger.length}</span>${yer !== 'ana' ? '<button type="button" class="btn" data-vazgec>Vazgeç</button>' : ''}<button class="btn btn-p" type="submit">${dugme}</button></div>
    </form>`

  function ciz() {
    const t = veri.tepkiler || {}
    const benim = veri.benim || {}
    const kayitli = profil?.kayitli
    const cta = !oturum
      ? `<div class="tp-cta"><p><b>Sohbete katıl.</b> Yorum yapmak, tepki vermek ve puan toplamak için Uper ol.</p><div><a class="btn btn-p" href="/hesap#kayit" data-donus>Uper ol</a> <a class="btn" href="/hesap#giris" data-donus>Giriş yap</a></div></div>`
      : !kayitli ? `<div class="tp-cta"><p>Yorum yapmadan önce profilini tamamla (kullanıcı adı seçmek bir dakika sürer).</p><a class="btn btn-p" href="/hesap" data-donus>Profilini tamamla</a></div>`
      : profil.durum === 'susturuldu' ? '<p class="tp-cta">Hesabın şimdilik yorum yapamıyor (topluluk kuralları).</p>'
      : `<div class="tp-ben">${avatar(profil, 40)}${formHtml('ana')}</div>`
    ic.innerHTML = `
      <div class="tp-bar" role="group" aria-label="Bu yazıya tepkin">
        ${TEPKI.map(([k, ad]) => `<button type="button" class="tp-t${benim.tepki === k ? ' on' : ''}" data-tepki="${k}" aria-pressed="${benim.tepki === k}">${ad}<span class="num">${t[k] || ''}</span></button>`).join('')}
        <span class="tp-ara"></span>
        <button type="button" class="tp-t${benim.kayitli ? ' on' : ''}" data-kaydet aria-pressed="${!!benim.kayitli}">${benim.kayitli ? 'Kaydedildi' : 'Kaydet'}</button>
        <button type="button" class="tp-t" data-paylas>Paylaş</button>
      </div>
      ${cta}
      <div class="tp-ust"><span class="label">${veri.yorumSayisi ? `${veri.yorumSayisi} yorum` : 'Henüz yorum yok. İlk yorumu sen yaz.'}</span>
        ${veri.yorumSayisi > 1 ? `<label class="sr" for="tp-sira">Sırala</label><select class="sel" id="tp-sira" data-sira><option value="yeni"${sira === 'yeni' ? ' selected' : ''}>En yeni</option><option value="begeni"${sira === 'begeni' ? ' selected' : ''}>En çok beğenilen</option></select>` : ''}</div>
      <ol class="yr-l">${veri.yorumlar.map((y: any) => yorumHtml(y)).join('')}</ol>
      <p class="meta tp-kural">Yorumlar <a href="/topluluk-kurallari">topluluk kurallarına</a> göre denetlenir. Bağlantı içeren yorumlar onaydan sonra görünür.</p>`
  }

  const yetki = () => {
    if (!oturum) { donusYaz(); location.href = '/hesap#giris'; return false }
    if (!profil?.kayitli) { donusYaz(); location.href = '/hesap'; return false }
    return true
  }

  ic.addEventListener('click', async (e) => {
    const h = e.target as HTMLElement
    const el = h.closest<HTMLElement>('button, a')
    if (!el) return
    if (el.matches('[data-donus]')) { donusYaz(); return }
    const li = el.closest<HTMLElement>('.yr'), id = li?.dataset.id
    if (el.matches('[data-tepki]')) {
      if (!yetki()) return
      const y = await api('/uye/tepki', 'POST', { hedef, tur: el.dataset.tepki })
      if (y.s !== 200) return bildir(y.j?.hata || 'Olmadı.', 'hata')
      veri.tepkiler = y.j.tepkiler; veri.benim.tepki = y.j.tepki; ciz()
    } else if (el.matches('[data-kaydet]')) {
      if (!yetki()) return
      const y = await api('/uye/kaydet', 'POST', { hedef })
      if (y.s !== 200) return bildir(y.j?.hata || 'Olmadı.', 'hata')
      veri.benim.kayitli = y.j.kayitli; ciz(); bildir(y.j.kayitli ? 'Kaydedildi. Hesabım → Kaydettiklerim.' : 'Kayıttan çıkarıldı.')
    } else if (el.matches('[data-paylas]')) {
      const url = location.origin + location.pathname, baslik = document.title
      if (navigator.share) navigator.share({ title: baslik, url }).catch(() => {})
      else { await navigator.clipboard?.writeText(url).catch(() => {}); bildir('Bağlantı kopyalandı.') }
    } else if (el.matches('[data-begen]') && id) {
      if (!yetki()) return
      const y = await api(`/uye/yorum/${id}/begen`, 'POST', {})
      if (y.s !== 200) return bildir(y.j?.hata || 'Olmadı.', 'hata')
      el.classList.toggle('on', y.j.begendim); el.setAttribute('aria-pressed', String(y.j.begendim))
      el.innerHTML = `Beğen${y.j.begeni ? ` · <span class="num">${y.j.begeni}</span>` : ''}`
    } else if (el.matches('[data-yanitla]') && li) {
      if (!yetki()) return
      if (profil.durum === 'susturuldu') return bildir('Hesabın şimdilik yorum yapamıyor.', 'hata')
      ic.querySelectorAll('[data-form^="yanit"]').forEach((f) => f.remove())
      const g = li.querySelector(':scope > .yr-g')!
      g.querySelector(':scope > .yr-a')!.insertAdjacentHTML('afterend', formHtml(`yanit-${id}`))
      g.querySelector<HTMLTextAreaElement>('textarea')!.focus()
    } else if (el.matches('[data-vazgec]')) {
      el.closest('form')!.remove()
    } else if (el.matches('[data-duzenle]') && li) {
      const m = li.querySelector<HTMLElement>(':scope > .yr-g > .yr-m')!
      const eski = findYorum(Number(id))?.metin || m.textContent || ''
      m.hidden = true
      m.insertAdjacentHTML('afterend', formHtml(`duzen-${id}`, eski, 'Kaydet'))
    } else if (el.matches('[data-sil]') && id) {
      if (!confirm('Yorumun silinsin mi? Bu geri alınamaz.')) return
      const y = await api(`/uye/yorum/${id}`, 'DELETE')
      if (y.s !== 200) return bildir(y.j?.hata || 'Olmadı.', 'hata')
      bildir('Yorumun silindi.'); yukle()
    } else if (el.matches('[data-sikayet]') && id) {
      if (!yetki()) return
      ic.querySelectorAll('.yr-sk').forEach((f) => f.remove())
      el.closest('.yr-a')!.insertAdjacentHTML('afterend', `<form class="yr-sk" data-sikayet-form="${id}"><label for="sk-${id}">Neden şikâyet ediyorsun?</label><select class="sel" id="sk-${id}" name="neden">${SIKAYET.map((x) => `<option>${esc(x)}</option>`).join('')}</select><button class="btn btn-p" type="submit">Gönder</button><button class="btn" type="button" data-vazgec>Vazgeç</button></form>`)
      ic.querySelector<HTMLSelectElement>(`#sk-${id}`)!.focus()
    }
  })
  ic.addEventListener('change', (e) => { const s = e.target as HTMLSelectElement; if (s.matches('[data-sira]')) { sira = s.value; yukle() } })
  ic.addEventListener('input', (e) => { const t = e.target as HTMLTextAreaElement; if (t.name === 'metin') { const k = t.form?.querySelector('[data-kalan]'); if (k) k.textContent = String(2000 - t.value.length) } })
  ic.addEventListener('submit', async (e) => {
    e.preventDefault()
    const f = e.target as HTMLFormElement
    if (f.dataset.sikayetForm) {
      const y = await api(`/uye/yorum/${f.dataset.sikayetForm}/sikayet`, 'POST', { neden: (f.elements.namedItem('neden') as HTMLSelectElement).value })
      f.remove()
      return bildir(y.s === 200 ? 'Teşekkürler, şikâyetin ekibe iletildi.' : (y.j?.hata || 'Olmadı.'), y.s === 200 ? 'ok' : 'hata')
    }
    const yer = f.dataset.form!, metin = (f.elements.namedItem('metin') as HTMLTextAreaElement).value.trim()
    if (metin.length < 2) return bildir('Yorum boş olamaz.', 'hata')
    const btn = f.querySelector<HTMLButtonElement>('[type=submit]')!; btn.disabled = true
    let y
    if (yer.startsWith('duzen-')) y = await api(`/uye/yorum/${yer.slice(6)}`, 'PATCH', { metin })
    else y = await api('/uye/yorum', 'POST', { hedef, metin, ust: yer.startsWith('yanit-') ? Number(yer.slice(6)) : undefined })
    btn.disabled = false
    if (y.s !== 200 && y.s !== 201) return bildir(y.j?.hata || 'Gönderilemedi.', 'hata')
    if (y.j?.mesaj) bildir(y.j.mesaj); else if (y.j?.onayda) bildir('Yorumun ekibin onayından sonra yayında olacak.'); else bildir(yer.startsWith('duzen-') ? 'Yorumun güncellendi.' : 'Yorumun yayında. +5 puan')
    await yukle()
    const yeni = document.getElementById(`yorum-${y.j.id}`); yeni?.scrollIntoView({ block: 'nearest' })
  })
  const findYorum = (id: number): any => { for (const y of veri.yorumlar) { if (y.id === id) return y; for (const z of y.yanitlar || []) if (z.id === id) return z } return null }

  oturumDegisince(() => { yukle() })
  // Bölüme yaklaşınca (ya da yorum bağlantısıyla gelindiyse hemen) yüklenir
  const hemen = location.hash.startsWith('#yorum') || location.hash === '#topluluk'
  if (hemen || !('IntersectionObserver' in window)) yukle()
  else {
    const g = new IntersectionObserver((l) => { if (l.some((x) => x.isIntersecting)) { g.disconnect(); yukle() } }, { rootMargin: '1200px 0px' })
    g.observe(kok)
  }

  // Okuma puanı: yazının sonuna inildiyse ve en az 20 sn geçtiyse, yazı başına bir kez
  if (oturum) {
    const basla = Date.now(), DEPO = 'up-okunan'
    const okunan: string[] = (() => { try { return JSON.parse(depo.al(DEPO) || '[]') } catch { return [] } })()
    if (!okunan.includes(hedef)) {
      const g = new IntersectionObserver((l) => {
        if (!l.some((x) => x.isIntersecting)) return
        g.disconnect()
        setTimeout(async () => {
          const y = await api('/uye/okudum', 'POST', { hedef })
          if (y.s === 200) depo.yaz(DEPO, JSON.stringify([...okunan, hedef].slice(-300)))
        }, Math.max(0, 20_000 - (Date.now() - basla)))
      })
      g.observe(kok)
    }
  }
}

/* ---------------- başlat ---------------- */
ustCubuk()
document.querySelectorAll<HTMLElement>('#topluluk[data-hedef]').forEach(topluluk)
