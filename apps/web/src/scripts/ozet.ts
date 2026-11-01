/**
 * "Bugün 90 saniyede" sesli bülteninin tek oynatıcısı (1 Kasım 2026). Ana sayfadaki bölüm ve her sayfadaki sağ alt köşe düğmesi aynı sesi
 * yönetir; iki yerden basılsa da tek ses çalar. Bülten: media/ozet/son.json (Stüdyo ozet-ses + panel lib/ozetSes.ts).
 * Media Session: kilit ekranı, denetim merkezi, bildirim; oynat/duraklat, haber haber ileri/geri, sarma.
 */
export type Ozet = { tarih: string; ses: string; sure: number; metin: string; maddeler: { id: number; yol: string; baslik: string; bas: number }[] }
export const BASLIK = 'Bugün 90 saniyede'
const KAYNAK = 'https://panel.updated.com.tr/storage/v1/object/public/media/ozet/son.json'

let yukleme: Promise<Ozet | null> | null = null
/** Bülten; yoksa ya da 36 saatten eskiyse null */
export const ozetYukle = () => (yukleme ??= fetch(KAYNAK, { cache: 'no-cache' })
  .then((r) => (r.ok ? r.json() : null))
  .then((o: Ozet | null) => (o?.ses && Date.now() - +new Date(o.tarih) < 36 * 3600e3 ? o : null))
  .catch(() => null))

/** Olaylar: "durum" (çalıyor/durdu/bitti), "zaman" (saniye) */
export const olay = new EventTarget()
let ses: HTMLAudioElement | null = null, oz: Ozet | null = null

export const caliyor = () => !!ses && !ses.paused
export const zaman = () => ses?.currentTime ?? 0
export const basladi = () => !!ses && ses.currentTime > 0 && !ses.ended

function hazirla(o: Ozet) {
  if (ses) return ses
  oz = o
  ses = new Audio(o.ses); ses.preload = 'auto'
  const yay = (ad: string) => olay.dispatchEvent(new Event(ad))
  ses.addEventListener('play', () => yay('durum')); ses.addEventListener('pause', () => yay('durum')); ses.addEventListener('ended', () => yay('durum'))
  ses.addEventListener('timeupdate', () => {
    yay('zaman')
    if ('mediaSession' in navigator && ses!.duration) try { navigator.mediaSession.setPositionState({ duration: ses!.duration, position: ses!.currentTime, playbackRate: ses!.playbackRate }) } catch {}
  })
  if ('mediaSession' in navigator) {
    const tarih = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long' }).format(new Date(o.tarih))
    navigator.mediaSession.metadata = new MediaMetadata({ title: BASLIK, artist: 'UPDATED', album: `${tarih} · teknoloji bülteni`, artwork: [{ src: '/marka/og-varsayilan.jpg', sizes: '1200x630', type: 'image/jpeg' }] })
    const ms = navigator.mediaSession, h = (a: MediaSessionAction, f: MediaSessionActionHandler) => { try { ms.setActionHandler(a, f) } catch {} }
    h('play', () => ses!.play()); h('pause', () => ses!.pause())
    h('nexttrack', () => atla(1)); h('previoustrack', () => atla(-1))
    h('seekforward', () => git(ses!.currentTime + 10)); h('seekbackward', () => git(ses!.currentTime - 10))
    h('seekto', (d) => { if (d.seekTime != null) git(d.seekTime) })
    olay.addEventListener('durum', () => { ms.playbackState = caliyor() ? 'playing' : 'paused' })
  }
  return ses
}

export function calDuraklat(o: Ozet) { const a = hazirla(o); if (a.paused) a.play().catch(() => {}); else a.pause() }
export function git(t: number) { if (ses && oz) ses.currentTime = Math.max(0, Math.min(oz.sure, t)) }
export function atla(yon: 1 | -1) {
  if (!ses || !oz) return
  const t = ses.currentTime
  const hedef = yon > 0 ? oz.maddeler.find((m) => m.bas > t + 0.5)?.bas : [...oz.maddeler].reverse().find((m) => m.bas < t - 2)?.bas
  git(hedef ?? (yon > 0 ? oz.sure : 0))
}
export const sn = (x: number) => `${Math.floor(x / 60)}:${String(Math.round(x % 60)).padStart(2, '0')}`
