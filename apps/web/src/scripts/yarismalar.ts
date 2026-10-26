/**
 * Yarışmalar takvimi (/yarismalar): kalan gün, süzgeçler, süresi geçenlerin arşive inmesi; Uper'e başvuru bağlantısı, ayrıntılar,
 * "Hatırlat" (son tarihten 3 gün önce bildirim), "Katıldım" ve takvime ekleme. Liste derlemede gelir, ayrıntılar /api/uye/yarismalar'dan.
 */
import { api, bildir, esc, girisli, oturumDegisince } from './uye'

const liste = document.querySelector<HTMLOListElement>('[data-yr-liste]')
const arsiv = document.querySelector<HTMLDetailsElement>('[data-yr-arsiv]')
const arsivListe = document.querySelector<HTMLOListElement>('[data-yr-arsiv-liste]')
const kartlar = () => Array.from(document.querySelectorAll<HTMLLIElement>('.yr-kart'))
const GUN = 86_400_000

/** Son tarih o günün sonuna kadar geçerli (İstanbul saati yaklaşık: tarih + 1 gün) */
const kalanGun = (iso: string) => { const son = new Date(iso); son.setHours(23, 59, 59, 999); return Math.ceil((+son - Date.now()) / GUN) - 1 }

function kalanlar() {
  for (const k of kartlar()) {
    const g = kalanGun(k.dataset.son!)
    const e = k.querySelector<HTMLElement>('[data-kalan]')!
    if (g < 0) { k.classList.add('gecti'); e.textContent = 'Süresi geçti'; if (arsivListe && k.parentElement !== arsivListe) arsivListe.prepend(k); continue }
    e.textContent = g === 0 ? 'Bugün son gün' : g === 1 ? 'Yarın son gün' : `${g} gün kaldı`
    k.classList.toggle('yakin', g <= 7)
  }
  if (arsiv && arsivListe) arsiv.hidden = !arsivListe.children.length
}

/* ---------------- süzgeçler ---------------- */
const suz = { tur: '', ucretsiz: false, yakin: false, kapsam: '' }
function uygula() {
  for (const k of kartlar()) {
    if (k.classList.contains('gecti')) continue
    const tur = k.dataset.tur!
    const gor = (!suz.tur || tur === suz.tur || (tur === 'karma' && suz.tur !== 'kisa-film'))
      && (!suz.ucretsiz || k.dataset.ucretsiz === '1') && (!suz.yakin || kalanGun(k.dataset.son!) <= 7) && (!suz.kapsam || k.dataset.kapsam === suz.kapsam)
    k.hidden = !gor
  }
  const bos = liste && !kartlar().some((k) => !k.hidden && !k.classList.contains('gecti'))
  let not = document.querySelector<HTMLElement>('[data-yr-sonuc-yok]')
  if (bos && !not && liste) { not = document.createElement('p'); not.className = 'yr-bos'; not.dataset.yrSonucYok = ''; not.textContent = 'Bu süzgece uyan açık yarışma yok.'; liste.after(not) }
  if (not) not.hidden = !bos
}
document.querySelectorAll<HTMLButtonElement>('.yr-cip').forEach((b) => b.addEventListener('click', () => {
  const t = b.dataset.suz as keyof typeof suz
  if (t === 'tur') { suz.tur = b.dataset.deger || ''; document.querySelectorAll<HTMLButtonElement>('.yr-cip[data-suz="tur"]').forEach((x) => x.classList.toggle('on', x === b)) }
  else if (t === 'kapsam') { suz.kapsam = suz.kapsam === b.dataset.deger ? '' : b.dataset.deger!; document.querySelectorAll<HTMLButtonElement>('.yr-cip[data-suz="kapsam"]').forEach((x) => { const on = x.dataset.deger === suz.kapsam; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)) }) }
  else { (suz as any)[t] = !(suz as any)[t]; b.classList.toggle('on', (suz as any)[t]); b.setAttribute('aria-pressed', String((suz as any)[t])) }
  uygula()
}))

/* ---------------- takvime ekle (.ics) ---------------- */
function takvim(ad: string, son: string, url: string) {
  const d = new Date(son)
  const tarih = (x: Date) => x.toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' }).replace(/-/g, '')
  const ertesi = new Date(+d + GUN)
  const kac = (s: string) => s.replace(/[\\,;]/g, (c) => '\\' + c).replace(/\n/g, '\\n')
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//UPDATED//Yarismalar//TR', 'BEGIN:VEVENT', `UID:yarisma-${tarih(d)}-${encodeURIComponent(ad).slice(0, 40)}@updated.com.tr`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')}`, `DTSTART;VALUE=DATE:${tarih(d)}`, `DTEND;VALUE=DATE:${tarih(ertesi)}`,
    `SUMMARY:${kac('Son başvuru: ' + ad)}`, `URL:${url}`, `DESCRIPTION:${kac('Başvuru: ' + url + '\nUPDATED yarışmalar takvimi')}`,
    'BEGIN:VALARM', 'TRIGGER:-P3D', 'ACTION:DISPLAY', `DESCRIPTION:${kac(ad + ': son başvuruya 3 gün')}`, 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' })); a.download = `yarisma-${tarih(d)}.ics`
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}

/* ---------------- Uper: ayrıntılar ve kayıt ---------------- */
const uyeAlani = document.querySelector<HTMLElement>('[data-yr-uye]')
function davet() {
  if (!uyeAlani) return
  uyeAlani.hidden = false
  uyeAlani.innerHTML = `<p><b>Başvuru bağlantıları Uper'lere açık.</b> Uper olunca ödül ve ücret ayrıntısını görürsün, son tarihten 3 gün önce hatırlatma alırsın, katıldığın yarışmalar profilinde kayıtlı kalır. Ücretsiz.</p><div><a class="btn btn-p" href="/hesap#kayit" data-donus>Uper ol</a> <a class="btn" href="/hesap#giris" data-donus>Giriş yap</a></div>`
}

async function uyeYukle() {
  if (!liste) return
  if (!girisli()) { davet(); return }
  const { s, j } = await api('/uye/yarismalar')
  if (s === 409) {
    if (uyeAlani) { uyeAlani.hidden = false; uyeAlani.innerHTML = `<p><b>Bir adım kaldı.</b> Başvuru bağlantılarını görmek için Uper profilini tamamla.</p><div><a class="btn btn-p" href="/hesap">Profilini tamamla</a></div>` }
    return
  }
  if (s !== 200 || !j) { davet(); return }
  if (uyeAlani) uyeAlani.hidden = true
  const ayr = new Map<number, any>(j.yarismalar.map((y: any) => [y.id, y]))
  for (const k of kartlar()) {
    const id = Number(k.dataset.id); const y = ayr.get(id); const alan = k.querySelector<HTMLElement>('[data-ayrinti]')
    if (!y || !alan) continue
    const kayit = j.kayit?.[id] || { takip: false, katildi: false }
    const satir = [y.odul && `<p><b>Ödül:</b> ${esc(y.odul)}</p>`, k.dataset.ucretsiz ? '' : y.ucret && `<p><b>Katılım ücreti:</b> ${esc(y.ucret)}</p>`, y.aciklama && `<p>${esc(y.aciklama)}</p>`].filter(Boolean).join('')
    alan.innerHTML = `${satir}<div class="yr-dugmeler">
      <a class="btn btn-p" href="${esc(y.baglanti)}" target="_blank" rel="noopener">Resmi sayfa ve başvuru ↗</a>
      <button class="btn" data-takip aria-pressed="${kayit.takip}">${kayit.takip ? 'Hatırlatma açık ✓' : 'Hatırlat'}</button>
      <button class="btn" data-katildi aria-pressed="${kayit.katildi}">${kayit.katildi ? 'Katıldım ✓' : 'Katıldım'}</button>
      <button class="btn" data-takvim>Takvime ekle</button></div>`
    alan.querySelector('[data-takvim]')!.addEventListener('click', () => takvim(k.dataset.ad!, k.dataset.son!, y.baglanti))
    for (const ad of ['takip', 'katildi'] as const) {
      const b = alan.querySelector<HTMLButtonElement>(`[data-${ad}]`)!
      b.addEventListener('click', async () => {
        const yeni = b.getAttribute('aria-pressed') !== 'true'
        b.disabled = true
        const r = await api('/uye/yarisma', 'POST', { id, [ad]: yeni })
        b.disabled = false
        if (r.s !== 200) { bildir(r.j?.hata || 'Kaydedilemedi.', 'hata'); return }
        b.setAttribute('aria-pressed', String(r.j[ad]))
        b.textContent = ad === 'takip' ? (r.j.takip ? 'Hatırlatma açık ✓' : 'Hatırlat') : (r.j.katildi ? 'Katıldım ✓' : 'Katıldım')
        if (ad === 'takip' && r.j.takip) bildir('Son başvurudan 3 gün önce bildirim alacaksın.')
        if (ad === 'katildi' && r.j.katildi) bildir('Kaydedildi. Bol şans!')
      })
    }
  }
}

kalanlar(); uygula(); uyeYukle()
oturumDegisince(() => { uyeYukle() })
// Bağlantıyla gelinen yarışmayı (#y-12) vurgula
if (location.hash.startsWith('#y-')) document.querySelector(location.hash)?.classList.add('vurgu')
