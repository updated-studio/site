/**
 * /hesap sayfası: Uper ol, giriş (e-posta + şifre, e-postaya bağlantı, Google), profil, bildirimler, kaydettiklerim,
 * yorumlarım, puan ve seviye, ayarlar (bildirim, şifre, e-posta, verilerimi indir, hesabımı sil).
 * Giriş servisinden dönüşte adres çubuğundaki #access_token=… burada okunur ve hemen silinir.
 */
import { AUTH, api, avatar, ben, bildir, cikis, esc, giris, girisli, isaretler, oturumYaz, zamanOnce } from './uye'

const kok = document.getElementById('hesap')!
const SITE = location.origin
const DONUS = SITE + '/hesap'
const depo = { al: (k: string) => { try { return localStorage.getItem(k) } catch { return null } }, yaz: (k: string, v: string | null) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v) } catch {} } }
let AYAR: { google: boolean; turnstile: string | null; puan: { kod: string; ad: string; puan: number; gunluk: number }[]; seviyeler: { ad: string; puan: number }[] } | null = null
let bilgi = ''   // bir sonraki çizimde üstte gösterilecek mesaj

/* ---------------- giriş servisi mesajları Türkçe ---------------- */
function hataMetni(j: any, s: number): string {
  const m = String(j?.msg || j?.error_description || j?.message || j?.error || '')
  if (s === 429 || /security purposes|rate limit|too many/i.test(m)) return 'Çok sık denedin. Biraz bekleyip yeniden dene.'
  if (/invalid login credentials|invalid_grant/i.test(m)) return 'E-posta ya da şifre hatalı.'
  if (/email not confirmed/i.test(m)) return 'E-postanı henüz onaylamadın. Gelen kutuna (ve gereksiz klasörüne) bak.'
  if (/already registered|already been registered|exists/i.test(m)) return 'Bu e-postayla zaten bir hesap var. Giriş yap ya da şifreni yenile.'
  if (/password.*(at least|characters|short)/i.test(m)) return 'Şifre en az 8 karakter olmalı.'
  if (/weak|pwned/i.test(m)) return 'Bu şifre çok kolay tahmin edilir; başka bir şifre seç.'
  if (/captcha/i.test(m)) return 'Robot doğrulaması tamamlanmadı. Kutuyu işaretleyip yeniden dene.'
  if (/invalid.*email|email.*invalid|unable to validate email/i.test(m)) return 'Geçerli bir e-posta adresi yaz.'
  if (/banned/i.test(m)) return 'Bu hesap engellendi.'
  if (/same.*password|different from the old/i.test(m)) return 'Yeni şifre eskisiyle aynı olamaz.'
  if (/expired|otp/i.test(m)) return 'Bağlantının süresi dolmuş ya da daha önce kullanılmış. Yeniden iste.'
  if (s === 0) return 'Bağlantı kurulamadı. İnternetini kontrol edip yeniden dene.'
  return 'Bir sorun oldu, yeniden dene.'
}

/* ---------------- robot doğrulaması (Cloudflare Turnstile, açıksa) ---------------- */
let tsYuk: Promise<void> | null = null
const tsHazir = () => (tsYuk ||= new Promise<void>((ok) => {
  const s = document.createElement('script'); s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; s.async = true; s.onload = () => ok(); s.onerror = () => ok(); document.head.appendChild(s)
}))
const kutular = new Map<HTMLElement, string>()
async function robotKutulari() {
  if (!AYAR?.turnstile) return
  await tsHazir()
  const ts = (window as any).turnstile; if (!ts) return
  kok.querySelectorAll<HTMLElement>('[data-robot]').forEach((el) => { if (!kutular.has(el)) kutular.set(el, ts.render(el, { sitekey: AYAR!.turnstile, language: 'tr', theme: 'auto', size: 'flexible' })) })
}
function robotJetonu(f: HTMLElement): string | undefined {
  const el = f.querySelector<HTMLElement>('[data-robot]'); const ts = (window as any).turnstile
  if (!el || !ts || !kutular.has(el)) return undefined
  return ts.getResponse(kutular.get(el)) || undefined
}
function robotSifirla(f: HTMLElement) { const el = f.querySelector<HTMLElement>('[data-robot]'); const ts = (window as any).turnstile; if (el && ts && kutular.has(el)) ts.reset(kutular.get(el)) }
const guvenlik = (f: HTMLElement) => { const t = robotJetonu(f); return t ? { gotrue_meta_security: { captcha_token: t } } : {} }

/* ---------------- dönüş (e-posta bağlantısı, Google) ---------------- */
function donusuOku() {
  const h = new URLSearchParams(location.hash.slice(1))
  if (h.get('access_token')) {
    oturumYaz({ access_token: h.get('access_token')!, refresh_token: h.get('refresh_token') || '', expires_in: Number(h.get('expires_in')) || 3600, expires_at: Number(h.get('expires_at')) || undefined })
    const tur = h.get('type')
    history.replaceState(null, '', location.pathname)
    if (tur === 'recovery') return 'yeni-sifre'
    if (tur === 'signup') bilgi = 'E-postan onaylandı. Hoş geldin!'
    else if (tur === 'email_change') bilgi = 'E-posta adresin güncellendi.'
    else bilgi = 'Giriş yaptın.'
    return 'donus'
  }
  if (h.get('error') || h.get('error_code')) {
    history.replaceState(null, '', location.pathname)
    bilgi = '!' + hataMetni({ msg: h.get('error_description') || h.get('error_code') }, 400)
  }
  return null
}
function sayfayaDon(): boolean {
  const d = depo.al('up-donus')
  if (d && d.startsWith('/') && !d.startsWith('//') && !d.startsWith('/hesap')) { depo.yaz('up-donus', null); location.href = d; return true }
  depo.yaz('up-donus', null); return false
}

/* ---------------- ekranlar ---------------- */
const mesaj = () => {
  if (!bilgi) return ''
  const hata = bilgi.startsWith('!'), m = hata ? bilgi.slice(1) : bilgi
  bilgi = ''
  return `<p class="hs-msg${hata ? ' hata' : ''}" role="${hata ? 'alert' : 'status'}">${esc(m)}</p>`
}
const googleDugme = () => AYAR?.google ? `<button class="btn hs-g" type="button" data-google><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.5 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 7l7.4 5.7c4.3-4 6.9-9.9 6.9-17.2z"/><path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.8-6z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.8 6C6.6 42.6 14.6 48 24 48z"/></svg>Google ile devam et</button><div class="hs-ya"><span>ya da</span></div>` : ''

function girisEkrani(sekme: 'giris' | 'kayit' | 'baglanti' | 'sifre') {
  const sek = (k: string, ad: string) => `<a href="#${k}" role="tab" aria-selected="${sekme === k}" class="${sekme === k ? 'on' : ''}">${ad}</a>`
  let f = ''
  if (sekme === 'kayit') f = `
    <form class="hs-f" data-f="kayit" novalidate>
      ${googleDugme()}
      <label>Adın (yorumlarda görünür)<input name="ad" autocomplete="name" maxlength="40" required></label>
      <label>E-posta<input name="email" type="email" autocomplete="email" required></label>
      <label>Şifre (en az 8 karakter)<input name="password" type="password" autocomplete="new-password" minlength="8" required></label>
      <label class="hs-tuzak" aria-hidden="true">Web sitesi<input name="site" tabindex="-1" autocomplete="off"></label>
      <label class="hs-c"><input type="checkbox" name="sozlesme" required> <span><a href="/uyelik-sozlesmesi" target="_blank">Üyelik sözleşmesini</a> ve <a href="/topluluk-kurallari" target="_blank">topluluk kurallarını</a> okudum, kabul ediyorum.</span></label>
      <label class="hs-c"><input type="checkbox" name="kvkk" required> <span><a href="/uyelik-aydinlatma-metni" target="_blank">Aydınlatma metnini</a> okudum.</span></label>
      <div data-robot></div>
      <button class="btn btn-p" type="submit">Uper ol</button>
    </form>`
  else if (sekme === 'giris') f = `
    <form class="hs-f" data-f="giris" novalidate>
      ${googleDugme()}
      <label>E-posta<input name="email" type="email" autocomplete="email" required></label>
      <label>Şifre<input name="password" type="password" autocomplete="current-password" required></label>
      <div data-robot></div>
      <button class="btn btn-p" type="submit">Giriş yap</button>
      <p class="hs-alt"><a href="#baglanti">Şifresiz giriş: e-postama bağlantı gönder</a> · <a href="#sifre">Şifremi unuttum</a></p>
    </form>`
  else if (sekme === 'baglanti') f = `
    <form class="hs-f" data-f="baglanti" novalidate>
      <p>E-posta adresini yaz; giriş bağlantısı gönderelim. Hesabın yoksa bu bağlantıyla Uper olursun.</p>
      <label>E-posta<input name="email" type="email" autocomplete="email" required></label>
      <div data-robot></div>
      <button class="btn btn-p" type="submit">Bağlantı gönder</button>
      <p class="hs-alt"><a href="#giris">Şifreyle giriş</a></p>
    </form>`
  else f = `
    <form class="hs-f" data-f="sifre" novalidate>
      <p>Hesabının e-posta adresini yaz; şifreni yenileme bağlantısı gönderelim.</p>
      <label>E-posta<input name="email" type="email" autocomplete="email" required></label>
      <div data-robot></div>
      <button class="btn btn-p" type="submit">Yenileme bağlantısı gönder</button>
      <p class="hs-alt"><a href="#giris">Girişe dön</a></p>
    </form>`
  kok.innerHTML = `
    <div class="hs-kart">
      <h1 class="h2">${sekme === 'kayit' ? 'Uper ol' : sekme === 'giris' ? 'Giriş yap' : sekme === 'baglanti' ? 'Şifresiz giriş' : 'Şifremi unuttum'}</h1>
      <p class="lead hs-giris-lead">Yorum yap, tepki ver, yazıları kaydet; okudukça ve katıldıkça puan topla, seviye atla. Kulüp ilerlemen de hesabında saklanır.</p>
      ${sekme === 'kayit' || sekme === 'giris' ? `<div class="hs-sek" role="tablist">${sek('giris', 'Giriş yap')}${sek('kayit', 'Uper ol')}</div>` : ''}
      ${mesaj()}
      ${f}
    </div>`
  robotKutulari()
}

async function gonder(f: HTMLFormElement) {
  const v = (n: string) => ((f.elements.namedItem(n) as HTMLInputElement | null)?.value || '').trim()
  const c = (n: string) => !!(f.elements.namedItem(n) as HTMLInputElement | null)?.checked
  const tur = f.dataset.f!, btn = f.querySelector<HTMLButtonElement>('[type=submit]')!
  const hata = (m: string) => { f.querySelector('.hs-msg')?.remove(); btn.insertAdjacentHTML('beforebegin', `<p class="hs-msg hata" role="alert">${esc(m)}</p>`) }
  const email = v('email').toLowerCase()
  if ('email' in f.elements && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && tur !== 'yeni-sifre' && tur !== 'profil-tamamla') return hata('Geçerli bir e-posta adresi yaz.')
  if (AYAR?.turnstile && f.querySelector('[data-robot]') && !robotJetonu(f)) return hata('Robot doğrulamasını tamamla.')
  btn.disabled = true
  try {
    if (tur === 'kayit') {
      if (v('site')) return // tuzak alanı doldurulduysa (bot) sessizce dur
      if (v('ad').length < 2) return hata('Adını yaz (en az 2 karakter).')
      if (v('password').length < 8) return hata('Şifre en az 8 karakter olmalı.')
      if (!c('sozlesme') || !c('kvkk')) return hata('Devam etmek için iki kutuyu da işaretle.')
      const y = await giris(`/signup?redirect_to=${encodeURIComponent(DONUS)}`, { email, password: v('password'), data: { ad: v('ad'), sozlesme: true, kvkk: true }, ...guvenlik(f) })
      if (y.s !== 200) return hata(hataMetni(y.j, y.s))
      depo.yaz('up-onay', '1')
      if (y.j?.access_token) { oturumYaz(y.j); return cizim() }
      kok.innerHTML = `<div class="hs-kart"><h1 class="h2">E-postana bak</h1><p class="lead"><b>${esc(email)}</b> adresine bir onay bağlantısı gönderdik. Bağlantıya basınca hesabın açılır.</p><p>Birkaç dakikada gelmezse gereksiz (spam) klasörüne bak.</p><button class="btn" type="button" data-tekrar="${esc(email)}">Yeniden gönder</button> <a class="btn btn-t" href="#giris">Girişe dön</a></div>`
    } else if (tur === 'giris') {
      const y = await giris('/token?grant_type=password', { email, password: v('password'), ...guvenlik(f) })
      if (y.s !== 200) {
        robotSifirla(f)
        if (/not confirmed/i.test(y.j?.msg || y.j?.error_description || '')) { hata(hataMetni(y.j, y.s)); btn.insertAdjacentHTML('afterend', ` <button class="btn" type="button" data-tekrar="${esc(email)}">Onay e-postasını yeniden gönder</button>`); return }
        return hata(hataMetni(y.j, y.s))
      }
      oturumYaz(y.j); bilgi = 'Giriş yaptın.'
      const u = await ben(true)
      if (u?.kayitli && sayfayaDon()) return
      cizim()
    } else if (tur === 'baglanti') {
      const y = await giris(`/otp?redirect_to=${encodeURIComponent(DONUS)}`, { email, create_user: true, ...guvenlik(f) })
      if (y.s !== 200) { robotSifirla(f); return hata(hataMetni(y.j, y.s)) }
      kok.innerHTML = `<div class="hs-kart"><h1 class="h2">E-postana bak</h1><p class="lead"><b>${esc(email)}</b> adresine giriş bağlantısı gönderdik. Bağlantı 1 saat geçerli.</p><p>Gelmezse gereksiz (spam) klasörüne bak.</p><a class="btn btn-t" href="#giris">Girişe dön</a></div>`
    } else if (tur === 'sifre') {
      const y = await giris(`/recover?redirect_to=${encodeURIComponent(DONUS)}`, { email, ...guvenlik(f) })
      if (y.s !== 200) { robotSifirla(f); return hata(hataMetni(y.j, y.s)) }
      kok.innerHTML = `<div class="hs-kart"><h1 class="h2">E-postana bak</h1><p class="lead">Bu adresle bir hesap varsa şifre yenileme bağlantısı gönderdik.</p><a class="btn btn-t" href="#giris">Girişe dön</a></div>`
    } else if (tur === 'yeni-sifre') {
      if (v('password').length < 8) return hata('Şifre en az 8 karakter olmalı.')
      const y = await giris('/user', { password: v('password') }, 'PUT', true)
      if (y.s !== 200) return hata(hataMetni(y.j, y.s))
      bilgi = 'Yeni şifren kaydedildi.'; location.hash = ''; cizim()
    } else if (tur === 'profil-tamamla') {
      if (!c('sozlesme') || !c('kvkk')) return hata('Devam etmek için iki kutuyu da işaretle.')
      const y = await api('/uye/ben', 'POST', { kullaniciAdi: v('kullaniciAdi').toLowerCase(), ad: v('ad'), sozlesme: true, kvkk: true })
      if (y.s !== 201 && y.s !== 200) return hata(y.j?.hata || 'Kaydedilemedi.')
      depo.yaz('up-onay', null)
      await ben(true)
      bilgi = "Uper oldun! İlk 10 puanın hesabında."
      if (sayfayaDon()) return
      location.hash = '#profil'; cizim()
    }
  } finally { btn.disabled = false }
}

/* ---------------- profil tamamlama (ilk girişte: kullanıcı adı + onaylar) ---------------- */
function profilTamamla(u: any) {
  const onayVar = depo.al('up-onay') === '1'
  kok.innerHTML = `
    <div class="hs-kart">
      <h1 class="h2">Profilini tamamla</h1>
      ${mesaj()}
      <p class="lead">Son adım: yorumlarda görünecek adını ve kullanıcı adını seç.</p>
      <form class="hs-f" data-f="profil-tamamla" novalidate>
        <label>Görünen ad<input name="ad" maxlength="40" required value="${esc(u.oneri?.ad || '')}" autocomplete="name"></label>
        <label>Kullanıcı adı<span class="hs-on"><span>@</span><input name="kullaniciAdi" maxlength="20" required value="${esc(u.oneri?.kullaniciAdi || '')}" autocapitalize="none" spellcheck="false" pattern="[a-z0-9_.]{3,20}"></span><span class="meta" data-ad-durum>Küçük harf, rakam, alt çizgi ve nokta; 3-20 karakter.</span></label>
        <label class="hs-c"><input type="checkbox" name="sozlesme" ${onayVar ? 'checked' : ''}> <span><a href="/uyelik-sozlesmesi" target="_blank">Üyelik sözleşmesini</a> ve <a href="/topluluk-kurallari" target="_blank">topluluk kurallarını</a> okudum, kabul ediyorum.</span></label>
        <label class="hs-c"><input type="checkbox" name="kvkk" ${onayVar ? 'checked' : ''}> <span><a href="/uyelik-aydinlatma-metni" target="_blank">Aydınlatma metnini</a> okudum.</span></label>
        <button class="btn btn-p" type="submit">Uper ol</button>
      </form>
      <p class="meta"><button class="btn-t btn" type="button" data-cikis>${esc(u.email)} hesabından çık</button></p>
    </div>`
  let t: number | undefined
  kok.querySelector<HTMLInputElement>('[name=kullaniciAdi]')!.addEventListener('input', (e) => {
    const i = e.target as HTMLInputElement; i.value = i.value.toLowerCase().replace(/[^a-z0-9_.]/g, '')
    clearTimeout(t); t = window.setTimeout(async () => {
      const d = kok.querySelector('[data-ad-durum]')!
      if (i.value.length < 3) { d.textContent = 'En az 3 karakter.'; return }
      const y = await api(`/uye/kullanici-adi?ad=${encodeURIComponent(i.value)}`)
      d.textContent = y.j?.uygun ? `@${i.value} uygun.` : (y.j?.mesaj || '')
      d.classList.toggle('hata', !y.j?.uygun)
    }, 350)
  })
}

/* ---------------- hesabım (sekmeler) ---------------- */
type Sekme = 'profil' | 'bildirimler' | 'kaydedilenler' | 'yorumlarim' | 'puan' | 'ayarlar'
const SEKMELER: [Sekme, string][] = [['profil', 'Profil'], ['bildirimler', 'Bildirimler'], ['kaydedilenler', 'Kaydettiklerim'], ['yorumlarim', 'Yorumlarım'], ['puan', 'Puan ve seviye'], ['ayarlar', 'Ayarlar']]
const EKIPMAN = ['Kamera', 'Lens', 'Gimbal', 'Dron', 'Işık', 'Ses', 'Telefon', 'Bilgisayar', 'Diğer']
const DURUM: Record<string, string> = { yayinda: 'Yayında', 'onay-bekliyor': 'Onay bekliyor', gizli: 'Gizlendi' }

function ilerleme(sv: any) {
  if (!sv.sonraki) return '<p class="meta">En üst seviyedesin.</p>'
  const onceki = AYAR?.seviyeler.find((s) => s.ad === sv.ad)?.puan ?? 0
  const y = Math.min(100, Math.round(((sv.puan - onceki) / (sv.sonraki.puan - onceki)) * 100))
  return `<div class="sv-bar" role="progressbar" aria-valuenow="${y}" aria-valuemin="0" aria-valuemax="100" aria-label="Sonraki seviyeye ilerleme"><b style="width:${y}%"></b></div><p class="meta">${sv.sonraki.puan - sv.puan} puan sonra: ${esc(sv.sonraki.ad)}</p>`
}

async function hesabim(u: any, sekme: Sekme) {
  kok.innerHTML = `
    <div class="hs-bas">${avatar(u, 72)}<div><h1 class="h2">${esc(u.ad)}${isaretler(u)}</h1><p class="kad">@${esc(u.kullaniciAdi)} · ${esc(u.seviye.ad)} · <span class="num">${u.seviye.puan}</span> puan</p></div>
      <a class="btn" href="/uper?ad=${esc(u.kullaniciAdi)}">Profilimi gör</a></div>
    ${mesaj()}
    <nav class="hs-sek hs-sek-g" aria-label="Hesap bölümleri">${SEKMELER.map(([k, ad]) => `<a href="#${k}" aria-current="${k === sekme ? 'page' : 'false'}" class="${k === sekme ? 'on' : ''}">${ad}</a>`).join('')}</nav>
    <div class="hs-ic" data-ic><p class="meta">Yükleniyor…</p></div>`
  const ic = kok.querySelector<HTMLElement>('[data-ic]')!
  if (sekme === 'profil') {
    const ek = (e: any = {}) => `<div class="hs-ek"><select class="sel" name="tur" aria-label="Tür">${EKIPMAN.map((t) => `<option${t === e.tur ? ' selected' : ''}>${t}</option>`).join('')}</select><input name="model" maxlength="60" placeholder="Model (ör. Sony A7 IV)" value="${esc(e.ad || '')}" aria-label="Model" list="urun-liste" autocomplete="off"><button type="button" class="ibtn" data-ek-sil aria-label="Kaldır">×</button></div>`
    ic.innerHTML = `
      <div class="hs-iki">
        <div>
          <h2 class="label">Seviye</h2><p class="hs-sv"><b>${esc(u.seviye.ad)}</b> <span class="num">${u.seviye.puan}</span> puan</p>${ilerleme(u.seviye)}
          <h2 class="label" style="margin-top:24px">Rozetler</h2>
          ${u.rozetler.length ? `<ul class="rz">${u.rozetler.map((r: any) => `<li class="rz-${esc(r.kod)}">${esc(r.ad)}</li>`).join('')}</ul>` : '<p class="meta">Yorum yaptıkça rozet kazanırsın.</p>'}
          <h2 class="label" style="margin-top:24px">Sayılar</h2>
          <p class="meta">${u.istatistik.yorum} yorum · ${u.istatistik.begeni} beğeni · ${u.istatistik.kulup} Kulüp adımı · Üyelik ${new Date(u.uyelik).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</p>
        </div>
        <form class="hs-f" data-profil novalidate>
          <label>Görünen ad<input name="ad" maxlength="40" value="${esc(u.ad)}" required></label>
          <label>Kullanıcı adı<span class="hs-on"><span>@</span><input name="kullaniciAdi" maxlength="20" value="${esc(u.kullaniciAdi)}" autocapitalize="none" spellcheck="false"></span></label>
          <label>Hakkında (160 karakter)<textarea name="bio" maxlength="160" rows="3">${esc(u.bio)}</textarea></label>
          <fieldset><legend>Profil resmi</legend><div class="hs-foto">
            <label><input type="radio" name="fotoTur" value="harf"${u.fotoTur === 'harf' || !u.fotoTur ? ' checked' : ''}>${avatar({ ad: u.ad, renk: u.renk }, 44)}<span>Baş harfler</span></label>
            ${u.googleFoto ? `<label><input type="radio" name="fotoTur" value="google"${u.fotoTur === 'google' ? ' checked' : ''}>${avatar({ ad: u.ad, renk: u.renk, foto: u.googleFoto }, 44)}<span>Google fotoğrafım</span></label>` : ''}
            ${u.studyoFoto ? `<label><input type="radio" name="fotoTur" value="studyo"${u.fotoTur === 'studyo' ? ' checked' : ''}>${avatar({ ad: u.ad, renk: u.renk, foto: u.studyoFoto }, 44)}<span>Stüdyo fotoğrafım</span></label>` : ''}
            <label data-gravatar><input type="radio" name="fotoTur" value="gravatar"${u.fotoTur === 'gravatar' ? ' checked' : ''}>${avatar({ ad: u.ad, renk: u.renk, foto: u.gravatar }, 44)}<span>Gravatar <a href="https://gravatar.com" target="_blank" rel="noopener" class="meta">nedir?</a></span></label>
            <label><input type="radio" name="fotoTur" value="emoji"${u.fotoTur === 'emoji' ? ' checked' : ''}>${avatar({ ad: u.ad, renk: u.renk, emoji: u.emoji || u.emojiler[0] }, 44)}<span>Emoji</span></label>
          </div>
          <div class="hs-emoji" data-emoji-l${u.fotoTur === 'emoji' ? '' : ' hidden'}>${u.emojiler.map((e: string) => `<label><input type="radio" name="emoji" value="${e}"${(u.emoji || u.emojiler[0]) === e ? ' checked' : ''}><span>${e}</span></label>`).join('')}</div>
          <p class="meta">Zorunlu değil. Gravatar, e-postana bağlı fotoğraf servisidir (WordPress de kullanır); hesabın yoksa baş harflerin görünür.</p></fieldset>
          <fieldset><legend>Profil rengi</legend><div class="hs-renk">${['turuncu', 'mavi', 'siyah', 'gri'].map((r) => `<label><input type="radio" name="renk" value="${r}"${u.renk === r ? ' checked' : ''}><span class="av av-${r}" style="width:36px;height:36px">${esc(u.ad[0] || '?')}</span><span class="sr">${r}</span></label>`).join('')}</div></fieldset>
          <fieldset><legend>Ekipmanım</legend><p class="meta">Kullandığın kamera, lens, gimbal… Profilinde görünür.</p><div data-ekler>${(u.ekipman.length ? u.ekipman : [{}]).map(ek).join('')}</div><button type="button" class="btn" data-ek-ekle>+ Ekipman ekle</button><datalist id="urun-liste"></datalist><p class="meta">Listeden seçtiğin model künyedeki ürünle eşleşir; ürün sayfasında "Kullananlar"da görünürsün.</p></fieldset>
          <button class="btn btn-p" type="submit">Kaydet</button>
        </form>
      </div>`
    // Künyedeki ürün adları öneri listesine (yazarken çıkar; seçmek zorunlu değil)
    api('/products?limit=1000&depth=0&select[name]=true&select[brand]=true&sort=name').then(({ s, j }) => {
      const dl = ic.querySelector('#urun-liste'); if (s !== 200 || !dl) return
      dl.innerHTML = (j.docs || []).map((d: any) => `<option value="${esc(`${d.brand} ${d.name}`)}">`).join('')
    })
    ic.querySelectorAll<HTMLInputElement>('input[name=fotoTur]').forEach((r) => r.addEventListener('change', () => { ic.querySelector<HTMLElement>('[data-emoji-l]')!.hidden = r.value !== 'emoji' || !r.checked }))
    ic.querySelector('[data-ek-ekle]')!.addEventListener('click', () => { const l = ic.querySelector('[data-ekler]')!; if (l.children.length < 12) l.insertAdjacentHTML('beforeend', ek()) })
    ic.addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest('[data-ek-sil]'); if (b) b.parentElement!.remove() })
    ic.querySelector<HTMLFormElement>('[data-profil]')!.addEventListener('submit', async (e) => {
      e.preventDefault()
      const f = e.target as HTMLFormElement, fd = new FormData(f)
      const ekipman = [...f.querySelectorAll('.hs-ek')].map((r) => ({ tur: (r.querySelector('select') as HTMLSelectElement).value, ad: (r.querySelector('input') as HTMLInputElement).value.trim() })).filter((x) => x.ad)
      const y = await api('/uye/ben', 'PATCH', { ad: fd.get('ad'), kullaniciAdi: String(fd.get('kullaniciAdi') || '').toLowerCase(), bio: fd.get('bio'), renk: fd.get('renk'), ekipman, fotoTur: fd.get('fotoTur') || 'harf', emoji: fd.get('emoji') })
      if (y.s !== 200) return bildir(y.j?.hata || 'Kaydedilemedi.', 'hata')
      await ben(true); bilgi = 'Profilin kaydedildi.'; cizim()
    })
  } else if (sekme === 'bildirimler') {
    const y = await api('/uye/bildirimler')
    const l = y.j?.liste || []
    ic.innerHTML = l.length ? `<ul class="uye-bl genis">${l.map((x: any) => `<li class="${x.okundu ? '' : 'yeni'}"><a href="${esc(x.yol || '#')}">${esc(x.metin)}<span class="meta">${esc(zamanOnce(x.at))}</span></a></li>`).join('')}</ul>` : '<p class="meta">Henüz bildirim yok. Yorumuna yanıt gelince ya da yorumun beğenilince burada görürsün.</p>'
    if (y.j?.okunmamis) api('/uye/bildirimler/okundu', 'POST', {})
  } else if (sekme === 'kaydedilenler') {
    const y = await api('/uye/kaydedilenler')
    const l = y.j || []
    ic.innerHTML = l.length ? `<ul class="hs-l">${l.map((x: any) => `<li><a href="${esc(x.yol)}"><b>${esc(x.baslik)}</b></a><span class="meta">${esc(zamanOnce(x.at))} kaydedildi</span><button type="button" class="btn btn-t" data-kaldir="${esc(x.hedef)}">Kaldır</button></li>`).join('')}</ul>` : '<p class="meta">Kaydettiğin yazı yok. Yazıların altındaki "Kaydet" ile sonra okumak için ayırabilirsin.</p>'
    ic.addEventListener('click', async (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-kaldir]'); if (!b) return
      const r = await api('/uye/kaydet', 'POST', { hedef: b.dataset.kaldir })
      if (r.s === 200 && !r.j.kayitli) b.closest('li')!.remove()
    })
  } else if (sekme === 'yorumlarim') {
    const y = await api('/uye/yorumlarim')
    const l = y.j || []
    ic.innerHTML = l.length ? `<ul class="hs-l">${l.map((x: any) => `<li><a href="${esc(x.yol)}#yorum-${x.id}"><b>${esc(x.baslik)}</b></a><p>${esc(x.metin.slice(0, 240))}</p><span class="meta">${esc(zamanOnce(x.at))} · ${esc(DURUM[x.durum] || x.durum)}${x.begeni ? ` · ${x.begeni} beğeni` : ''}</span></li>`).join('')}</ul>` : '<p class="meta">Henüz yorum yazmadın.</p>'
  } else if (sekme === 'puan') {
    const sv = AYAR?.seviyeler || []
    ic.innerHTML = `
      <div class="hs-iki">
        <div><h2 class="label">Seviyeler: sürüm ilerlemesi</h2>
          <ol class="sv-l">${sv.map((s, i) => `<li class="${s.ad === u.seviye.ad ? 'on' : u.seviye.puan >= s.puan ? 'gecti' : ''}"><span class="num">${i + 1}</span><b>${esc(s.ad)}</b><span class="meta">${s.puan} puan</span></li>`).join('')}</ol>
          ${ilerleme(u.seviye)}</div>
        <div><h2 class="label">Puan nasıl kazanılır</h2>
          <table class="hs-t"><tbody>${(AYAR?.puan || []).map((p) => `<tr><td>${esc(p.ad)}</td><td class="num">+${p.puan}</td><td class="meta">${p.gunluk > p.puan ? `günde en fazla ${p.gunluk}` : 'bir kez'}</td></tr>`).join('')}</tbody></table>
          <p class="meta">Gizlenen yorumun puanı geri alınır.</p></div>
      </div>`
  } else if (sekme === 'ayarlar') {
    ic.innerHTML = `
      <div class="hs-ayar">
        <section><h2 class="label">Bildirimler</h2><label class="hs-c"><input type="checkbox" data-eposta ${u.bildirimEposta ? 'checked' : ''}> <span>Yorumuma yanıt gelince e-posta gönder</span></label></section>
        <section><h2 class="label">Şifre</h2><form class="hs-f" data-f-ic="sifre"><label>Yeni şifre (en az 8 karakter)<input name="password" type="password" autocomplete="new-password" minlength="8"></label><button class="btn" type="submit">Şifreyi değiştir</button></form></section>
        <section><h2 class="label">E-posta</h2><p class="meta">Şu an: ${esc(u.email)}${u.giris === 'google' ? ' (Google ile giriş)' : ''}</p><form class="hs-f" data-f-ic="eposta"><label>Yeni e-posta<input name="email" type="email" autocomplete="email"></label><button class="btn" type="submit">E-postayı değiştir</button></form></section>
        <section><h2 class="label">Verilerin</h2><p>Hesabındaki bütün verileri (profil, yorumlar, tepkiler, kayıtlar, puan geçmişi) bir dosya olarak indirebilirsin.</p><button class="btn" type="button" data-veri>Verilerimi indir</button></section>
        <section><h2 class="label">Oturum</h2><button class="btn" type="button" data-cikis>Çıkış yap</button></section>
        <section class="hs-sil"><h2 class="label">Hesabımı sil</h2><p>Hesabın, profilin, tepkilerin, kayıtların ve puanın kalıcı olarak silinir. Yanıt almış yorumların "Bu yorum silindi." olarak kalır (konuşma bozulmasın), diğer yorumların silinir. Geri alınamaz.</p>
          <form class="hs-f" data-f-ic="sil"><label>Onaylamak için SİL yaz<input name="onay" autocomplete="off"></label><button class="btn" type="submit">Hesabımı kalıcı olarak sil</button></form></section>
      </div>`
    ic.querySelector<HTMLInputElement>('[data-eposta]')!.addEventListener('change', async (e) => {
      const y = await api('/uye/ben', 'PATCH', { bildirimEposta: (e.target as HTMLInputElement).checked })
      bildir(y.s === 200 ? 'Kaydedildi.' : 'Kaydedilemedi.', y.s === 200 ? 'ok' : 'hata'); ben(true)
    })
    ic.querySelector('[data-veri]')!.addEventListener('click', async () => {
      const y = await api('/uye/ben/veri')
      if (y.s !== 200) return bildir('İndirilemedi.', 'hata')
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(y.j, null, 2)], { type: 'application/json' })); a.download = `updated-verilerim-${u.kullaniciAdi}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000)
    })
    ic.addEventListener('submit', async (e) => {
      e.preventDefault()
      const f = e.target as HTMLFormElement, fd = new FormData(f), t = f.dataset.fIc
      if (t === 'sifre') {
        const p = String(fd.get('password') || ''); if (p.length < 8) return bildir('Şifre en az 8 karakter olmalı.', 'hata')
        const y = await giris('/user', { password: p }, 'PUT', true)
        bildir(y.s === 200 ? 'Şifren değişti.' : hataMetni(y.j, y.s), y.s === 200 ? 'ok' : 'hata'); if (y.s === 200) f.reset()
      } else if (t === 'eposta') {
        const m = String(fd.get('email') || '').trim(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m)) return bildir('Geçerli bir e-posta yaz.', 'hata')
        const y = await giris(`/user?redirect_to=${encodeURIComponent(DONUS)}`, { email: m }, 'PUT', true)
        bildir(y.s === 200 ? 'İki adrese de onay bağlantısı gönderdik; ikisini de onaylayınca değişir.' : hataMetni(y.j, y.s), y.s === 200 ? 'ok' : 'hata')
      } else if (t === 'sil') {
        if (String(fd.get('onay') || '').trim().toLocaleUpperCase('tr-TR') !== 'SİL') return bildir('Onaylamak için SİL yaz.', 'hata')
        const y = await api('/uye/ben', 'DELETE', { onay: 'SİL' })
        if (y.s !== 200) return bildir(y.j?.hata || 'Silinemedi.', 'hata')
        await cikis(); bilgi = 'Hesabın silindi. Bizimle olduğun için teşekkürler.'; location.hash = '#kayit'; cizim()
      }
    })
  }
}

/* ---------------- yönlendirme ---------------- */
async function cizim() {
  const h = location.hash.slice(1)
  if (!girisli()) return girisEkrani((['giris', 'kayit', 'baglanti', 'sifre'].includes(h) ? h : 'giris') as 'giris')
  if (h === 'yeni-sifre') {
    kok.innerHTML = `<div class="hs-kart"><h1 class="h2">Yeni şifre</h1>${mesaj()}<form class="hs-f" data-f="yeni-sifre" novalidate><label>Yeni şifre (en az 8 karakter)<input name="password" type="password" autocomplete="new-password" minlength="8" required></label><button class="btn btn-p" type="submit">Kaydet</button></form></div>`
    return
  }
  const u = await ben()
  if (!u) { if (!girisli()) return cizim(); kok.innerHTML = `<div class="hs-kart"><p class="hs-msg hata">Hesabına şu an ulaşılamadı. Biraz sonra yeniden dene.</p><button class="btn" type="button" data-cikis>Çıkış yap</button></div>`; return }
  if (!u.kayitli) return profilTamamla(u)
  hesabim(u, (SEKMELER.some(([k]) => k === h) ? h : 'profil') as Sekme)
}

kok.addEventListener('submit', (e) => { const f = e.target as HTMLFormElement; if (f.dataset.f) { e.preventDefault(); gonder(f) } })
kok.addEventListener('click', async (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>('button'); if (!b) return
  if (b.matches('[data-google]')) location.href = `${AUTH}/authorize?provider=google&redirect_to=${encodeURIComponent(DONUS)}`
  else if (b.matches('[data-cikis]')) { await cikis(); bilgi = 'Çıkış yaptın.'; location.hash = '#giris'; cizim() }
  else if (b.dataset.tekrar) {
    const y = await giris(`/resend?redirect_to=${encodeURIComponent(DONUS)}`, { type: 'signup', email: b.dataset.tekrar })
    bildir(y.s === 200 ? 'Onay e-postasını yeniden gönderdik.' : hataMetni(y.j, y.s), y.s === 200 ? 'ok' : 'hata')
  }
})
addEventListener('hashchange', () => { if (!location.hash.includes('access_token')) cizim() })
// Başka sekmede giriş/çıkış yapılırsa bu sayfa da güncellenir
addEventListener('storage', (e) => { if (e.key === 'up-oturum') cizim() })

;(async () => {
  const d = donusuOku()
  AYAR = (await api('/uye/ayar')).j
  if (d === 'yeni-sifre') { location.hash = '#yeni-sifre'; return cizim() }
  if (d === 'donus') { const u = await ben(true); if (u?.kayitli && sayfayaDon()) return }
  cizim()
})()
