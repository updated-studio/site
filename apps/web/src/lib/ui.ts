/** Sunucu tarafı küçük HTML parçaları (ikon, kesinlik çubuğu, künye etiketi). Partial uçlarında da kullanılır. */
import type { ProductRef } from './types'
import { esc, LABEL_TEXT, STATUS_TEXT } from './format'

const I: Record<string, string> = {
  dil: '<path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3Z"/>',
  search: '<path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4"/>', menu: '<path d="M3 6h18M3 12h18M3 18h18"/>', x: '<path d="M5 5l14 14M19 5L5 19"/>',
  left: '<path d="M15 5l-7 7 7 7"/>', right: '<path d="M9 5l7 7-7 7"/>', play: '<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>',
  sun: '<path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM12 1v3M12 20v3M1 12h3M20 12h3M4 4l2 2M18 18l2 2M4 20l2-2M18 6l2-2"/>',
  moon: '<path d="M20 15A8 8 0 0 1 9 4a8 8 0 1 0 11 11Z"/>', auto: '<path d="M12 3a9 9 0 1 0 0 18V3Z" fill="currentColor"/><path d="M12 3a9 9 0 1 1 0 18"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>', check: '<path d="M4 12l5 5L20 6"/>',
  user: '<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21c0-4 4-6 8-6s8 2 8 6"/>',
  // Künye satırı (28 Ekim 2026, kit 1.4 §8 İkon: çizgi 2 px, düz uç, dolgu yok). Tek set: Stüdyo src/shared/Ikon.tsx ile aynı çizimler
  takvim: '<path d="M3 5h18v16H3zM3 10h18M8 3v4M16 3v4"/>', saat: '<path d="M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2"/>',
  okuma: '<path d="M3 5h6a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H3zM21 5h-6a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h7z"/>',
  guncel: '<path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5"/>', yorum: '<path d="M4 5h16v11H9l-5 4z"/>',
}
/** Künye satırı öğesi: ikon + yazı (tarih, saat, okuma süresi, güncelleme). */
export const km = (k: string, metin: string, dt?: string) => `<span class="km">${ico(k, 16)}${dt ? `<time datetime="${esc(dt)}">${esc(metin)}</time>` : esc(metin)}</span>`
/** Yazar fotoğrafı (28 Ekim 2026): fotoğraf varsa yuvarlak küçük resim; yoksa baş harfler; Updated Stüdyo (otomatik haberler) için boş. */
export const yazarFoto = (a: { name: string; slug: string; avatar?: { url: string } }, s = 24, harita: Record<string, string> = {}) => {
  const url = a.avatar?.url || harita[a.slug]
  if (url) return `<img class="yz-foto" src="${esc(url)}" width="${s}" height="${s}" alt="" loading="lazy" decoding="async" style="--yz:${s}px">`
  if (a.slug === 'studyo' || a.slug === 'updated') return `<span class="yz-foto yz-up" style="--yz:${s}px" aria-hidden="true"><img src="/marka/updated-up-white.svg" alt="" width="${s}" height="${s}"></span>` // otomatik haberler: marka işareti
  const bas = a.name.trim().split(/\s+/).slice(0, 2).map((p) => p[0] || '').join('').toLocaleUpperCase('tr-TR')
  return `<span class="yz-foto yz-bas" style="--yz:${s}px" aria-hidden="true">${esc(bas)}</span>`
}
/** Başlık (30 Ekim 2026, kullanıcı: "genişteyken başlıklar sığmıyor"): "Double-X", "Wi-Fi" gibi tireli kelimeler satır sonunda tireden bölünmez. */
export const baslik = (t: string) => esc(t).replace(/[^\s-]+(?:-[^\s-]+)+/g, (k) => `<span class="nb">${k}</span>`)
export const ico = (k: string, s = 20) => `<svg class="ico" width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true">${I[k] || ''}</svg>`

const G: Record<string, string> = {
  phone: '<rect x="38" y="14" width="24" height="44" rx="4"/><rect x="42" y="18" width="9" height="9" rx="2"/>',
  pad: '<path d="M26 40 Q20 58 32 56 L40 50 L60 50 L68 56 Q80 58 74 40 Q50 32 26 40Z"/><circle cx="38" cy="44" r="3"/><circle cx="62" cy="42" r="2"/><circle cx="66" cy="46" r="2"/>',
  audio: '<path d="M30 46 V40 a20 20 0 0 1 40 0 V46"/><rect x="26" y="44" width="10" height="14" rx="3"/><rect x="64" y="44" width="10" height="14" rx="3"/>',
  drone: '<circle cx="34" cy="26" r="9"/><circle cx="66" cy="26" r="9"/><circle cx="34" cy="52" r="9"/><circle cx="66" cy="52" r="9"/><rect x="44" y="32" width="12" height="14" rx="3"/>',
  camera: '<rect x="24" y="26" width="52" height="32" rx="4"/><circle cx="50" cy="42" r="10"/><circle cx="50" cy="42" r="5"/><rect x="30" y="20" width="12" height="6"/>',
  cam360: '<rect x="40" y="12" width="20" height="50" rx="9"/><circle cx="50" cy="24" r="6"/><rect x="44" y="38" width="12" height="16" rx="2"/>',
  laptop: '<rect x="28" y="18" width="44" height="30" rx="2"/><path d="M20 56 H80"/>',
  // 27 Ekim 2026: lens, mikrofon, ışık, gimbal, kulaklık kendi simgesiyle (önceden telefon çiziliyordu)
  lens: '<rect x="30" y="20" width="40" height="40" rx="6"/><circle cx="50" cy="40" r="13"/><circle cx="50" cy="40" r="5"/><path d="M30 30 H70M30 50 H70" stroke-width="3"/>',
  mic: '<rect x="40" y="10" width="20" height="34" rx="10"/><path d="M32 36 a18 18 0 0 0 36 0M50 54 V66M40 66 H60"/>',
  light: '<rect x="24" y="16" width="52" height="36" rx="4"/><path d="M34 26 H66M34 34 H66M34 42 H66" stroke-width="3"/><path d="M50 52 V66M40 66 H60"/>',
  gimbal: '<rect x="44" y="40" width="12" height="28" rx="5"/><path d="M50 40 V30 H32 V14 M32 14 H58"/><rect x="58" y="8" width="16" height="12" rx="2"/>',
  headphones: '<path d="M28 50 V38 a22 22 0 0 1 44 0 V50"/><rect x="22" y="46" width="12" height="18" rx="4"/><rect x="66" y="46" width="12" height="18" rx="4"/>',
}
export const glyph = (t: string, s = 22) => `<svg class="pk-svg" width="${s}" height="${Math.round(s * 0.78)}" viewBox="0 0 100 78" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="5">${G[t] || G.phone}</svg>`
// "Sızıntı" adı okuyucuya "Söylenti" (7 Kasım 2026, kullanıcı: "sızıntının adı değişiyor, söylenti olacak"); iç değer sizinti kaldı
export const LVN = ['', 'Söylenti', 'Söylenti', 'Test / takvim', 'Resmî']
/** Kesinlik etiketi (30 Ekim 2026, kullanıcı seçimi "C"): pil çubuğu yerine tek kelime + renk. Kesik çizgi söylenti, turuncu sızıntı, çizgili test/takvim, dolu mavi resmî. */
export const kes = (lv: number, metin = LVN[lv] || '') => `<span class="kes k${Math.max(1, Math.min(4, lv || 4))}">${esc(metin)}</span>`
const DURUM_SEVIYE: Record<string, number> = { soylenti: 1, sizinti: 2, test: 3, takvim: 3, duyuruldu: 4, satista: 3, eol: 1 }
/** Ürün durumu etiketi: kartlarda ve künyede "Satışta", "Söylenti" gibi */
export const durum = (s: string) => kes(DURUM_SEVIYE[s] ?? 3, STATUS_TEXT[s] || s)
/** Künye etiketi: metinde ve kartlarda ürüne bağlantı; masaüstünde üzerine gelince kart açılır. */
export const chip = (p: Pick<ProductRef, 'slug' | 'name' | 'type'>, label?: string) => `<a class="pk" href="/urun/${esc(p.slug)}" data-p="${esc(p.slug)}">${glyph(p.type, 16)}<span>${esc(label || p.name)}</span></a>`
export const label = (l?: string) => { const x = l && LABEL_TEXT[l]; return x ? `<span class="lbl ${x[1]}">${x[0]}</span>` : '' }
/** Puan verilmeyen ürün türleri (7 Kasım 2026, kullanıcı: "puan kalkıyor lens ve kameralar için", "şimdilik lens ve kamerada olmayacak") */
/** Ürünün marka ile tam adı (7 Kasım 2026, kullanıcı: "künyede marka ismi yazmıyor"); ad zaten markayla başlıyorsa tekrarlanmaz */
export const tamAd = (marka = '', ad = '') => (marka && !ad.toLocaleLowerCase('tr').startsWith(marka.toLocaleLowerCase('tr')) ? `${marka} ${ad}` : ad)
export const PUANSIZ_TUR = ['camera', 'lens']
export const puanli = (tur?: string) => !PUANSIZ_TUR.includes(tur || '')
/** UPscore (6 Kasım 2026, kullanıcı: "tüm puan sistemimizi UPscore yapacağız, 10'lu"): 10 üzerinden, tek ondalık, Türkçe virgül (8,7) */
export const ups = (n?: number) => (n == null ? '' : (Math.round(n * 10) / 10).toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }))
export const s10 = (n?: number) => (n == null ? '' : `${ups(n)}/10`)
/**
 * Metindeki ürün adlarını künye etiketine çevirir (her ürün için ilk geçiş).
 * Başlık ve bağlantı içindekiler atlanır.
 */
export function linkProducts(html: string, products: ProductRef[]) {
  let out = html
  for (const p of [...products].sort((a, b) => b.name.length - a.name.length)) {
    const re = new RegExp(`(<p[^>]*>(?:(?!</p>).)*?)(?<![\\w>])(${p.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?![\\w])`, 's')
    out = out.replace(re, (_m, pre, name) => (/<a [^>]*>[^<]*$/.test(pre) ? _m : pre + chip(p, name)))
  }
  return out
}

/** Platform logoları (31 Ekim 2026, kullanıcı: Reels başlığına Instagram, video duvarına YouTube logosu). Markanın kendi renkleriyle, başlık yanında. */
export const logoInstagram = (s = 22) => `<svg class="pl-logo" width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true"><defs><radialGradient id="igg" cx="30%" cy="107%" r="150%"><stop offset="0" stop-color="#FDF497"/><stop offset=".05" stop-color="#FDF497"/><stop offset=".45" stop-color="#FD5949"/><stop offset=".6" stop-color="#D6249F"/><stop offset=".9" stop-color="#285AEB"/></radialGradient></defs><rect width="24" height="24" rx="6" fill="url(#igg)"/><rect x="5" y="5" width="14" height="14" rx="4" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="12" cy="12" r="3.3" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="16.4" cy="7.6" r="1.1" fill="#fff"/></svg>`
export const logoYoutube = (s = 22) => `<svg class="pl-logo" width="${Math.round(s * 1.4)}" height="${s}" viewBox="0 0 28 20" aria-hidden="true"><rect width="28" height="20" rx="5.5" fill="#FF0000"/><path d="M11.2 5.6v8.8l7.6-4.4z" fill="#fff"/></svg>`

/** Ürün türü simgeleri (7 Kasım 2026, kullanıcı: "simgeleri bizim stilimizde yap"): Stüdyo'daki kitle aynı, Solar bold-duotone (480 Design, CC BY 4.0);
 *  ikinci katman (opacity) CSS'te mavi geçişle boyanır (ana.css .ts). Dron Solar'da yok, aynı dille çizildi. Bilinmeyen tür eski çizgi glifine düşer. */
const TS: Record<string, string> = { "camera": "<path d=\"M9.778 21h4.444c3.121 0 4.682 0 5.803-.735a4.4 4.4 0 0 0 1.226-1.204c.749-1.1.749-2.633.749-5.697s0-4.597-.749-5.697a4.4 4.4 0 0 0-1.226-1.204c-.72-.473-1.622-.642-3.003-.702c-.659 0-1.226-.49-1.355-1.125A2.064 2.064 0 0 0 13.634 3h-3.268c-.988 0-1.839.685-2.033 1.636c-.129.635-.696 1.125-1.355 1.125c-1.38.06-2.282.23-3.003.702A4.4 4.4 0 0 0 2.75 7.667C2 8.767 2 10.299 2 13.364s0 4.596.749 5.697c.324.476.74.885 1.226 1.204C5.096 21 6.657 21 9.778 21\" opacity=\".5\"/><path d=\"M17.556 9.272a.826.826 0 0 0-.833.819c0 .452.373.818.833.818h1.111c.46 0 .834-.367.834-.818a.826.826 0 0 0-.834-.819z\"/><path fill-rule=\"evenodd\" d=\"M12 9.272c-2.3 0-4.166 1.832-4.166 4.091s1.865 4.091 4.167 4.091c2.3 0 4.166-1.831 4.166-4.09s-1.865-4.092-4.166-4.092m0 1.637c-1.38 0-2.5 1.099-2.5 2.454s1.12 2.455 2.5 2.455c1.381 0 2.5-1.099 2.5-2.455c0-1.355-1.119-2.454-2.5-2.454\" clip-rule=\"evenodd\"/>", "lens": "<path d=\"M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12s4.477 10 10 10\" opacity=\".5\"/><path fill-rule=\"evenodd\" d=\"M12.75 12c0 .644.188 1.245.51 1.75h-2.52A3.25 3.25 0 1 0 8 15.25h8A3.25 3.25 0 1 0 12.75 12m1.5 0a1.75 1.75 0 1 1 3.5 0a1.75 1.75 0 0 1-3.5 0m-4.5 0a1.75 1.75 0 1 1-3.5 0a1.75 1.75 0 0 1 3.5 0\" clip-rule=\"evenodd\"/>", "phone": "<path d=\"M12.052 2c1.68 0 3.01 0 4.052.142c1.072.147 1.94.456 2.624 1.152s.988 1.58 1.132 2.67c.14 1.06.14 2.414.14 4.123v3.826c0 1.71 0 3.064-.14 4.123c-.144 1.09-.448 1.974-1.132 2.67s-1.552 1.005-2.624 1.152C15.063 22 13.732 22 12.052 22h-.104c-1.68 0-3.01 0-4.052-.142c-1.072-.147-1.94-.456-2.624-1.152s-.988-1.58-1.132-2.67C4 16.976 4 15.622 4 13.913v-3.826c0-1.71 0-3.064.14-4.123c.144-1.09.448-1.974 1.132-2.67S6.824 2.29 7.896 2.142C8.937 2 10.268 2 11.948 2z\" opacity=\".5\"/><path d=\"M8.571 18.511c0-.385.307-.697.686-.697h5.486c.378 0 .685.312.685.697a.69.69 0 0 1-.685.698H9.257a.69.69 0 0 1-.686-.698\"/>", "light": "<path d=\"M4 9.674C4 5.436 7.358 2 11.5 2S19 5.436 19 9.674a7.74 7.74 0 0 1-2.499 5.72c-.51.467-.889.814-1.157 1.066a15 15 0 0 0-.4.39l-.025.027l-.008.01c-.237.298-.288.375-.318.445s-.053.16-.113.54c-.023.15-.026.406-.026 1.105v.03c0 .409 0 .762-.025 1.051c-.027.306-.087.61-.248.895a2.07 2.07 0 0 1-.75.767c-.278.165-.575.226-.874.254c-.283.026-.628.026-1.028.026h-.058c-.4 0-.745 0-1.028-.026c-.3-.028-.596-.09-.875-.254a2.07 2.07 0 0 1-.749-.767c-.16-.285-.22-.588-.248-.895c-.026-.29-.026-.642-.026-1.051v-.03c0-.699-.002-.955-.026-1.105c-.06-.38-.081-.47-.112-.54c-.03-.07-.081-.147-.318-.446l-.008-.01l-.025-.026l-.088-.09a15 15 0 0 0-.312-.3c-.268-.252-.647-.599-1.157-1.067A7.74 7.74 0 0 1 4 9.674\" opacity=\".5\"/><path d=\"M13.085 19.675h-3.17q.004.144.014.258c.018.21.05.285.071.323a.7.7 0 0 0 .25.256c.037.021.111.054.316.072c.214.02.496.021.934.021c.437 0 .72 0 .934-.02c.204-.02.279-.052.316-.073a.7.7 0 0 0 .25-.256c.02-.038.052-.114.07-.323q.01-.113.015-.258M12.61 8.177c.307.224.378.66.159.973l-1.178 1.688h1.402a.68.68 0 0 1 .606.378a.71.71 0 0 1-.051.725L11.6 14.73a.67.67 0 0 1-.951.163a.71.71 0 0 1-.159-.973l1.178-1.688h-1.402a.68.68 0 0 1-.606-.379a.71.71 0 0 1 .051-.724l1.948-2.79a.67.67 0 0 1 .951-.163\"/>", "mic": "<path fill-rule=\"evenodd\" d=\"M12 2C8.56 2 5.77 4.811 5.77 8.28v4.65c0 3.468 2.79 6.28 6.23 6.28s6.231-2.812 6.231-6.28V8.28c0-3.469-2.79-6.28-6.23-6.28M9.68 7.39a.7.7 0 0 1-.028-.986l.503.48l-.502-.48v-.001l.002-.002l.003-.003l.008-.008l.06-.055a2 2 0 0 1 .127-.099a2.3 2.3 0 0 1 .437-.232c.379-.154.93-.283 1.711-.283s1.333.129 1.712.283c.189.077.332.16.437.232a1.5 1.5 0 0 1 .187.154l.007.008l.003.003l.002.002s.002.001-.492.471l.494-.47c.262.28.25.722-.028.987a.69.69 0 0 1-.95 0l-.008-.005a1 1 0 0 0-.171-.088C13 7.22 12.629 7.116 12 7.116c-.628 0-1 .104-1.192.182a1 1 0 0 0-.171.088l-.008.005a.69.69 0 0 1-.95 0m0 2.791a.7.7 0 0 1-.028-.986l.503.48l-.502-.48v-.002l.002-.001l.003-.004l.008-.007l.06-.056a2 2 0 0 1 .127-.098a2.3 2.3 0 0 1 .437-.232c.379-.154.93-.283 1.711-.283s1.333.129 1.712.283c.189.077.332.16.437.232a1.5 1.5 0 0 1 .187.154l.007.007l.003.004l.002.001v.001s.002.001-.492.47l.494-.469c.262.28.25.722-.028.986a.69.69 0 0 1-.95 0l-.008-.004a1 1 0 0 0-.171-.088c-.193-.08-.564-.183-1.193-.183c-.628 0-1 .104-1.192.182a1 1 0 0 0-.171.088l-.008.005a.69.69 0 0 1-.95 0\" clip-rule=\"evenodd\" opacity=\".5\"/><path d=\"M9.651 9.195a.7.7 0 0 0 .028.986a.69.69 0 0 0 .95 0l.008-.005a1 1 0 0 1 .171-.088c.192-.078.564-.181 1.192-.181c.63 0 1 .103 1.193.181a1 1 0 0 1 .171.088l.007.006a.69.69 0 0 0 .951 0a.7.7 0 0 0 .028-.987l-.493.47l.492-.47v-.002l-.002-.001l-.004-.004l-.007-.007l-.017-.017a1 1 0 0 0-.17-.137a2.3 2.3 0 0 0-.437-.232c-.38-.155-.93-.284-1.712-.284c-.78 0-1.332.13-1.71.284a2.3 2.3 0 0 0-.438.232a1.5 1.5 0 0 0-.187.154l-.007.007l-.004.004l-.001.001zl.502.48zm0-2.791a.7.7 0 0 0 .028.986a.69.69 0 0 0 .95 0l.008-.004a1 1 0 0 1 .171-.088c.192-.078.564-.182 1.192-.182c.63 0 1 .104 1.193.182c.096.039.15.073.171.088l.007.005a.69.69 0 0 0 .951 0a.7.7 0 0 0 .028-.987l-.493.47l.492-.47v-.001l-.002-.002l-.004-.004l-.007-.007a1.2 1.2 0 0 0-.187-.154a2.3 2.3 0 0 0-.437-.232c-.38-.154-.93-.283-1.712-.283c-.78 0-1.332.129-1.71.283a2.3 2.3 0 0 0-.438.232a1.5 1.5 0 0 0-.187.154l-.007.007l-.004.004l-.001.002zl.502.48z\"/><path fill-rule=\"evenodd\" d=\"M3.692 10.372c.383 0 .693.312.693.698v1.86c0 4.239 3.41 7.675 7.615 7.675c4.206 0 7.615-3.436 7.615-7.675v-1.86c0-.386.31-.698.693-.698s.692.312.692.698v1.86c0 5.01-4.03 9.07-9 9.07s-9-4.06-9-9.07v-1.86c0-.386.31-.698.692-.698\" clip-rule=\"evenodd\"/>", "cam360": "<path d=\"M2 11.5c0-3.287 0-4.931.908-6.038a4 4 0 0 1 .554-.554C4.57 4 6.212 4 9.5 4c3.287 0 4.931 0 6.038.908a4 4 0 0 1 .554.554C17 6.57 17 8.212 17 11.5v1c0 3.287 0 4.931-.908 6.038a4 4 0 0 1-.554.554C14.43 20 12.788 20 9.5 20c-3.287 0-4.931 0-6.038-.908a4 4 0 0 1-.554-.554C2 17.43 2 15.788 2 12.5z\" opacity=\".5\"/><path d=\"m17 9.5l.658-.329c1.946-.973 2.92-1.46 3.63-1.02c.712.44.712 1.528.712 3.703v.292c0 2.176 0 3.263-.711 3.703c-.712.44-1.685-.047-3.63-1.02L17 14.5z\"/>", "headphones": "<path fill-rule=\"evenodd\" d=\"M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75v2.793a.75.75 0 0 1 1 .707v2a.75.75 0 0 1-1.5 0V17h-1v-5a8.25 8.25 0 0 0-16.5 0v5h-1v.5a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 1 1-.707z\" clip-rule=\"evenodd\" opacity=\".5\"/><path d=\"M8 14.05c0-.85 0-1.274-.21-1.57a1.2 1.2 0 0 0-.409-.358c-.325-.174-.763-.134-1.64-.053c-1.48.134-2.218.202-2.748.571a2.35 2.35 0 0 0-.661.7C2 13.885 2 14.6 2 16.03v1.74c0 1.417 0 2.126.338 2.673c.127.205.286.39.471.547c.495.423 1.217.555 2.662.818c1.016.186 1.525.279 1.9.083q.209-.11.36-.287C8 21.285 8 20.786 8 19.789zm8 0c0-.85 0-1.274.21-1.57c.105-.148.245-.271.409-.358c.325-.174.763-.134 1.64-.053c1.48.134 2.218.202 2.748.571c.268.188.493.426.661.7c.332.544.332 1.26.332 2.69v1.74c0 1.417 0 2.126-.338 2.673c-.127.205-.286.39-.471.547c-.495.423-1.217.555-2.662.818c-1.016.186-1.525.279-1.9.083a1.2 1.2 0 0 1-.36-.287C16 21.285 16 20.786 16 19.789z\"/>", "drone": "<g opacity=\".5\"><circle cx=\"5.5\" cy=\"5.5\" r=\"3.5\"/><circle cx=\"18.5\" cy=\"5.5\" r=\"3.5\"/><circle cx=\"5.5\" cy=\"18.5\" r=\"3.5\"/><circle cx=\"18.5\" cy=\"18.5\" r=\"3.5\"/></g><path d=\"M9 9.2 7 7.2a.75.75 0 0 1 1.06-1.06L10.2 8.3h3.6l2.14-2.16A.75.75 0 0 1 17 7.2L15 9.2v5.6l2 2a.75.75 0 0 1-1.06 1.06l-2.14-2.16h-3.6l-2.14 2.16A.75.75 0 0 1 7 16.8l2-2z\"/>" }
export const turSimge = (t: string, s = 48) => TS[t] ? `<svg class="ts" width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${TS[t]}</svg>` : glyph(t, s)
