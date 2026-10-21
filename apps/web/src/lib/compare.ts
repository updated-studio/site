/** Kıyas tablosu ve "can alıcı farklar": iki künyenin özelliklerinden üretilir. */
import type { ProductRef, Spec } from './types'

export type Row = { group: string; key: string; a: string; b: string; win: '' | 'a' | 'b' }
export function rows(A: ProductRef, B: ProductRef): Row[] {
  const ma = new Map((A.specs || []).map((s) => [s.key, s])), mb = new Map((B.specs || []).map((s) => [s.key, s]))
  const keys = [...new Set([...ma.keys(), ...mb.keys()])]
  return keys.map((k) => {
    const a = ma.get(k), b = mb.get(k)
    let win: Row['win'] = ''
    if (a?.num != null && b?.num != null && a.num !== b.num) { const hi = (a.higherIsBetter ?? b.higherIsBetter) !== false; win = (a.num > b.num) === hi ? 'a' : 'b' }
    return { group: a?.group || b?.group || 'Genel', key: k, a: a?.value || 'Bilinmiyor', b: b?.value || 'Bilinmiyor', win }
  }).sort((x, y) => x.group.localeCompare(y.group, 'tr'))
}
export type Bar = { label: string; a: number; b: number; max: number }
export function bars(A: ProductRef, B: ProductRef, n = 3): Bar[] {
  const mb = new Map((B.specs || []).map((s) => [s.key, s]))
  return (A.specs || []).filter((s) => s.num != null && mb.get(s.key)?.num != null)
    .sort((x, y) => (y.searchWeight || 3) - (x.searchWeight || 3)).slice(0, n)
    .map((s) => { const b = mb.get(s.key)!.num!; return { label: s.unit ? `${s.key} (${s.unit})` : s.key, a: s.num!, b, max: Math.max(s.num!, b) } })
}
/** Elle girilmediyse: aranma önemi × fark büyüklüğü → en fazla 3 fark. */
export function autoDiffs(A: ProductRef, B: ProductRef) {
  const mb = new Map((B.specs || []).map((s) => [s.key, s]))
  return (A.specs || []).flatMap((s: Spec) => {
    const o = mb.get(s.key); if (s.num == null || o?.num == null || s.num === o.num) return []
    const hi = (s.higherIsBetter ?? true)
    const [w, l] = (s.num > o.num) === hi ? [s.num, o.num] : [o.num, s.num]
    const pct = Math.round((Math.abs(w - l) / Math.max(1e-9, Math.min(w, l))) * 100)
    return [{ score: (s.searchWeight || 3) * Math.min(pct, 300), big: `%${pct}`, label: `${hi ? 'daha yüksek' : 'daha düşük'} ${s.key.toLocaleLowerCase('tr-TR')}`, winner: ((s.num > o.num) === hi ? 'a' : 'b') as 'a' | 'b' }]
  }).sort((x, y) => y.score - x.score).slice(0, 3)
}
