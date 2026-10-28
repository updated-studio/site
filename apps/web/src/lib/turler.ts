/** Künye türlerinin okur adları (kıyas formu, ana sayfa, künye rafı). Anahtarlar panelde Products.type ile aynı. */
import type { K } from './kiyas'
export const TUR: Record<string, string> = { camera: 'Fotoğraf makinesi', lens: 'Lens', drone: 'Dron', cam360: '360/aksiyon kamera', phone: 'Telefon', gimbal: 'Gimbal', light: 'Işık', mic: 'Mikrofon', headphones: 'Kulaklık', laptop: 'Bilgisayar', tablet: 'Tablet', watch: 'Akıllı saat', pad: 'Kumanda/konsol', audio: 'Ses', accessory: 'Aksesuar', other: 'Diğer' }
export const turAdi = (t: string) => TUR[t] || 'Ürün'
/** Kıyasa başlangıç grupları: en az iki künyesi olan türler, her türde en dolu künye önce. */
const dolu = (k: K) => k.sp.filter((o) => o[1]).length + (k.g ? 5 : 0)
export const kiyasGruplari = (katalog: K[]) => Object.keys(TUR).map((t) => ({ t, ad: TUR[t], l: katalog.filter((k) => k.t === t).sort((a, b) => dolu(b) - dolu(a)) })).filter((g) => g.l.length >= 2)
