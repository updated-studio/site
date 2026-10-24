/** Sunucu tarafı küçük HTML parçaları (ikon, kesinlik çubuğu, künye etiketi). Partial uçlarında da kullanılır. */
import type { ProductRef } from './types'
import { esc, LABEL_TEXT } from './format'

const I: Record<string, string> = {
  search: '<path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4"/>', menu: '<path d="M3 6h18M3 12h18M3 18h18"/>', x: '<path d="M5 5l14 14M19 5L5 19"/>',
  left: '<path d="M15 5l-7 7 7 7"/>', right: '<path d="M9 5l7 7-7 7"/>', play: '<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>',
  sun: '<path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM12 1v3M12 20v3M1 12h3M20 12h3M4 4l2 2M18 18l2 2M4 20l2-2M18 6l2-2"/>',
  moon: '<path d="M20 15A8 8 0 0 1 9 4a8 8 0 1 0 11 11Z"/>', auto: '<path d="M12 3a9 9 0 1 0 0 18V3Z" fill="currentColor"/><path d="M12 3a9 9 0 1 1 0 18"/>',
  ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>', check: '<path d="M4 12l5 5L20 6"/>',
  user: '<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21c0-4 4-6 8-6s8 2 8 6"/>',
}
export const ico = (k: string, s = 20) => `<svg class="ico" width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true">${I[k] || ''}</svg>`

const G: Record<string, string> = {
  phone: '<rect x="38" y="14" width="24" height="44" rx="4"/><rect x="42" y="18" width="9" height="9" rx="2"/>',
  pad: '<path d="M26 40 Q20 58 32 56 L40 50 L60 50 L68 56 Q80 58 74 40 Q50 32 26 40Z"/><circle cx="38" cy="44" r="3"/><circle cx="62" cy="42" r="2"/><circle cx="66" cy="46" r="2"/>',
  audio: '<path d="M30 46 V40 a20 20 0 0 1 40 0 V46"/><rect x="26" y="44" width="10" height="14" rx="3"/><rect x="64" y="44" width="10" height="14" rx="3"/>',
  drone: '<circle cx="34" cy="26" r="9"/><circle cx="66" cy="26" r="9"/><circle cx="34" cy="52" r="9"/><circle cx="66" cy="52" r="9"/><rect x="44" y="32" width="12" height="14" rx="3"/>',
  camera: '<rect x="24" y="26" width="52" height="32" rx="4"/><circle cx="50" cy="42" r="10"/><circle cx="50" cy="42" r="5"/><rect x="30" y="20" width="12" height="6"/>',
  cam360: '<rect x="40" y="12" width="20" height="50" rx="9"/><circle cx="50" cy="24" r="6"/><rect x="44" y="38" width="12" height="16" rx="2"/>',
  laptop: '<rect x="28" y="18" width="44" height="30" rx="2"/><path d="M20 56 H80"/>',
}
export const glyph = (t: string, s = 22) => `<svg class="pk-svg" width="${s}" height="${Math.round(s * 0.78)}" viewBox="0 0 100 78" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="5">${G[t] || G.phone}</svg>`
export const LVN = ['', 'Söylenti', 'Sızıntı', 'Test / takvim', 'Resmî']
export const conf = (lv: number) => `<span class="conf" aria-label="Kesinlik ${lv}/4">${[1, 2, 3, 4].map((q) => `<i class="${q <= lv ? 'on' : ''}"></i>`).join('')}</span>`
/** Künye etiketi: metinde ve kartlarda ürüne bağlantı; masaüstünde üzerine gelince kart açılır. */
export const chip = (p: Pick<ProductRef, 'slug' | 'name' | 'type'>, label?: string) => `<a class="pk" href="/urun/${esc(p.slug)}" data-p="${esc(p.slug)}">${glyph(p.type, 16)}<span>${esc(label || p.name)}</span></a>`
export const label = (l?: string) => { const x = l && LABEL_TEXT[l]; return x ? `<span class="lbl ${x[1]}">${x[0]}</span>` : '' }
export const s20 = (n?: number) => (n == null ? '' : `${Math.round(n)}/20`)
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
