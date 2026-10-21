/** Kit §7 imla: 19 Ekim 2026 · 14.30 */
const AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
const tz = 'Europe/Istanbul'
const parts = (iso: string) => {
  const d = new Date(iso)
  const f = new Intl.DateTimeFormat('tr-TR', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d)
  const g = (t: string) => Number(f.find((p) => p.type === t)?.value)
  return { y: g('year'), m: g('month'), d: g('day'), h: String(g('hour')).padStart(2, '0'), mi: String(g('minute')).padStart(2, '0') }
}
export const date = (iso: string) => { const p = parts(iso); return `${p.d} ${AY[p.m - 1]} ${p.y}` }
export const time = (iso: string) => { const p = parts(iso); return `${p.h}.${p.mi}` }
export const short = (iso: string) => { const p = parts(iso); const today = parts(new Date().toISOString()); return p.d === today.d && p.m === today.m && p.y === today.y ? `${p.h}.${p.mi}` : `${p.d} ${AY[p.m - 1].slice(0, 3)}` }
/** Son dakika etiketi: yayından sonra 24 saat; şerit: 2 saat (kit §7, 10b). */
export const isBreaking = (n: { label: string; publishedAt: string }, hours = 24) => n.label === 'son-dakika' && Date.now() - +new Date(n.publishedAt) < hours * 3600e3
export const LABEL_TEXT: Record<string, [string, string]> = { 'son-dakika': ['Son dakika', 'l-son'], sizinti: ['Sızıntı', 'l-siz'], rehber: ['Rehber', 'l-reh'], sponsorlu: ['Sponsorlu', 'l-spo'] }
export const STATUS_TEXT: Record<string, string> = { soylenti: 'Söylenti', sizinti: 'Sızıntı', test: 'Test kaydı', takvim: 'Takvimde', duyuruldu: 'Duyuruldu', satista: 'Satışta', eol: 'Satıştan kalktı' }
export const SOURCE_TEXT: Record<string, string> = { uretici: 'Üretici beyanı', olcum: 'Updated ölçümü', test: 'Test kaydı', sizinti: 'Sızıntı', takvim: 'Takvim', diger: 'Diğer yayın' }
export const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
/** Sayfalama yolu: undefined → 1, "sayfa/3" → 3, başka her şey → null (404). */
export const pageOf = (rest?: string) => { if (!rest) return 1; const m = rest.match(/^sayfa\/(\d{1,4})$/); return m && +m[1] >= 2 ? +m[1] : null }
