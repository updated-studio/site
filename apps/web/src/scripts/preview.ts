/** Taslak önizleme: ?tur=haber&id=123&k=PAROLA → panelin /api/onizleme ucundan taslağı okur ve sayfaya basar.
 *  Stüdyo'nun canlı önizleme panelinde (iframe) her kayıttan sonra { updated: 'yenile' } mesajı gelir; sayfa yeniden yüklenmeden yeniden çizilir. */
import { lexicalToHtml } from '../lib/rich'

const root = document.querySelector<HTMLElement>('[data-preview]')!
const $ = (s: string) => document.querySelector<HTMLElement>(s)!
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as any)[c])
const q = new URLSearchParams(location.search)
const tur = q.get('tur') || 'haber', id = q.get('id') || '', k = q.get('k') || ''
const cms = root.dataset.cms || ''
const CHK = JSON.parse(root.dataset.checklist || '[]') as [string, string][]
const LIM = JSON.parse(root.dataset.limits || '{}')
const STATES = JSON.parse(root.dataset.states || '[]') as { label: string; value: string }[]
const LBL: Record<string, [string, string]> = { 'son-dakika': ['Son dakika', 'l-son'], sizinti: ['Sızıntı', 'l-siz'], rehber: ['Rehber', 'l-reh'], sponsorlu: ['Sponsorlu', 'l-spo'] }
const media = (m: any) => (m && typeof m === 'object' ? { url: m.sizes?.hero?.url || m.url, alt: m.alt, credit: m.credit } : null)
const gomulu = window.top !== window
const fail = (msg: string) => { $('[data-pv-title]').textContent = msg; $('[data-pv-state]').textContent = 'Önizleme açılamadı' }

async function run() {
  if (!cms || !id) return fail('Önizleme bağlantısı eksik.')
  const r = await fetch(`${cms}/api/onizleme/${encodeURIComponent(tur)}/${encodeURIComponent(id)}?k=${encodeURIComponent(k)}`, { cache: 'no-store' }).catch(() => null)
  if (!r || !r.ok) return fail(r?.status === 401 ? 'Önizleme bağlantısı geçersiz.' : 'Taslak bulunamadı.')
  const d = await r.json()
  document.title = `Önizleme · ${d.title} · UPDATED`
  const wf = d.workflow || {}, st = STATES.find((s) => s.value === wf.state) || STATES[1]
  const stEl = $('[data-pv-state]'); stEl.textContent = st.label; stEl.className = 'st ' + ({ taslak: 'st-tas', incelemede: 'st-inc', planlandi: 'st-pla', yayinda: 'st-yay', arsiv: 'st-tas' } as any)[st.value]
  const tri = d.triyaj || {}
  $('[data-pv-meta]').textContent = `${tri.importedAt ? `Triyajdan otomatik taslak · öncelik ${tri.priority ?? '–'}/10${tri.cluster ? ` · küme ${tri.cluster}` : ''}` : 'Taslak'} · ${d.author?.name || ''}`
  const coll = ({ haber: 'news', inceleme: 'reviews', karsilastirma: 'comparisons' } as any)[tur]
  const adm = $('[data-pv-admin]') as HTMLAnchorElement; adm.href = `${cms}/admin/collections/${coll}/${id}`; adm.hidden = gomulu

  $('[data-pv-cat]').textContent = d.category?.name || (tur === 'inceleme' ? 'İnceleme' : '')
  const l = LBL[d.label]; $('[data-pv-label]').innerHTML = l ? `<span class="lbl ${l[1]}">${l[0]}</span>` : ''
  $('[data-pv-title]').textContent = d.title; $('[data-pv-spot]').textContent = d.spot || ''
  $('[data-pv-row]').innerHTML = `<span>${esc(d.author?.name)}</span><span>·</span><span>${d.readingTime || 1} dk okuma</span>`
  const c = media(d.cover)
  const f = $('[data-pv-cover]'); f.hidden = !c
  if (c) { const im = f.querySelector('img')!; im.src = c.url; im.alt = c.alt || ''; f.querySelector('figcaption')!.textContent = c.credit || '' }
  const sa = $('[data-pv-short]'); sa.hidden = !d.shortAnswer; if (d.shortAnswer) sa.querySelector('p')!.textContent = d.shortAnswer
  $('[data-pv-body]').innerHTML = lexicalToHtml(d.body, media)
  const so = $('[data-pv-src]'); so.hidden = !d.sources?.length
  if (d.sources?.length) { const s = so; s.querySelector('p')!.innerHTML = d.sources.map((x: any) => (x.url ? `<a href="${esc(x.url)}" rel="noopener" target="_blank">${esc(x.name)}</a>` : esc(x.name))).join(' · ') }

  const fields: [string, string, number][] = [['Başlık (H1)', d.title, LIM.title], ['SEO başlığı', d.seo?.title, LIM.seoTitle], ['Meta açıklama', d.seo?.description, LIM.spot], ['Spot', d.spot, LIM.spot]]
  $('[data-pv-fields]').innerHTML = fields.map(([lb, v, max]) => `<div class="fld" style="margin-bottom:16px"><label>${lb}</label><div class="in">${esc(v || '—')}</div><span class="cnt ${v && String(v).length <= max ? 'ok' : ''}">${String(v || '').length} / ${max}</span></div>`).join('')
    + `<div class="fld" style="margin-bottom:16px"><label>Adres</label><div class="in mono">${esc(location.origin + (d.path || '/(kayıtta üretilir)'))}</div></div>`
    + `<div class="fld"><label>Varlıklar (GEO)</label><div class="in">${esc((d.seo?.geo?.entities || []).join(' · ') || '—')}</div></div>`
  const done = wf.checklist || {}
  $('[data-pv-chk]').innerHTML = CHK.map(([key, lb]) => `<li class="${done[key] ? 'ok' : ''}"><span class="b">${done[key] ? '✓' : ''}</span><span>${esc(lb)}</span></li>`).join('')
  const left = CHK.filter(([key]) => !done[key]).length
  $('[data-pv-left]').textContent = `SEO · GEO ve kontrol ${left ? `(${left} eksik)` : '✓'}`
}
run()
// Stüdyo'dan "yeniden çiz" sinyali (yalnız taslağı yeniden okur; mesajın içeriği kullanılmaz)
let bekleyen = false, calisiyor = false
addEventListener('message', async (e) => {
  if (e.data?.updated !== 'yenile') return
  if (calisiyor) { bekleyen = true; return }
  calisiyor = true
  try { do { bekleyen = false; await run() } while (bekleyen) } finally { calisiyor = false }
})
