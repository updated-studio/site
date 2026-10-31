/**
 * Araç verisini Uper hesabında saklar (31 Ekim 2026, toplantı notu: maliyet, storyboard, ekipman listesi). Giriş yoksa yalnız tarayıcıda kalır.
 * Açılışta hesaptaki kayıt varsa o yüklenir; değişiklikler 1,5 sn bekleyip hesaba yazılır. Panel ucu: /uye/arac/:arac (2 MB sınır).
 */
import { api, girisli, oturumDegisince } from '../uye'

export type AracDurum = 'yerel' | 'kaydediliyor' | 'kaydedildi' | 'hata'

export function aracHesabi<T>(arac: 'storyboard' | 'maliyet' | 'ekipman-listesi', yereldenOku: () => T, uygula: (veri: T) => void) {
  let zaman = 0
  const etiket = document.querySelector<HTMLElement>('[data-arac-hesap]')
  const yaz = (d: AracDurum, ek = '') => {
    if (!etiket) return
    etiket.dataset.durum = d
    etiket.innerHTML = d === 'yerel' ? 'Bu tarayıcıda saklanıyor · <a href="/hesap">Uper ol, hesabında saklansın</a>'
      : d === 'kaydediliyor' ? 'Hesabına kaydediliyor…' : d === 'kaydedildi' ? `Hesabına kaydedildi${ek}` : `Hesaba kaydedilemedi${ek ? ': ' + ek : ''}; bu tarayıcıda duruyor`
  }
  async function yukle() {
    if (!girisli()) { yaz('yerel'); return }
    const { s, j } = await api(`/uye/arac/${arac}`)
    if (s === 200 && j?.veri != null) { uygula(j.veri as T); yaz('kaydedildi') }
    else if (s === 200) { kaydet(); }
    else yaz(s === 409 ? 'yerel' : 'hata')
  }
  function kaydet() {
    if (!girisli()) { yaz('yerel'); return }
    clearTimeout(zaman); yaz('kaydediliyor')
    zaman = window.setTimeout(async () => {
      const { s, j } = await api(`/uye/arac/${arac}`, 'PUT', { veri: yereldenOku() })
      yaz(s === 200 ? 'kaydedildi' : 'hata', s === 200 ? '' : j?.hata || '')
    }, 1500)
  }
  oturumDegisince(() => { yukle() })
  yukle()
  return { kaydet }
}
