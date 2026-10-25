/**
 * Anlık katman: statik sayfa yeniden derlenene kadar (1–2 dk) yeni haber sitede hemen görünsün.
 * - Son dakika şeridi ve yan sütundaki "Son dakika" listesi panelin /api/canli ucundan tazelenir (açılışta ve 60 sn'de bir).
 * - 404 sayfası: adres panelde yayımlanmış bir habere aitse haber tarayıcıda gösterilir (derleme bitince gerçek sayfa gelir).
 * - Okunma sayacı: haber/inceleme/künye sayfası açılınca panelin /api/okunma ucuna yol gönderilir (çerez yok).
 */
import { lexicalToHtml } from '../lib/rich'

const CMS = document.documentElement.dataset.cms || ''
const BASE = (document.documentElement.dataset.base || '').replace(/\/$/, '')
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as any)[c])
const saat = (iso: string) => new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso)).replace(':', '.')
type Item = { t: string; h: string; at: string; l: string; c: string }

async function tazele() {
  if (!CMS || document.hidden) return
  const r = await fetch(`${CMS}/api/canli`).catch(() => null); if (!r?.ok) return
  const { items } = (await r.json()) as { items: Item[] }
  // Yan sütun: listede olmayan yeni haberleri en üste ekle (en fazla 7 satır)
  document.querySelectorAll<HTMLOListElement>('.sdk ol').forEach((ol) => {
    const var_ = new Set([...ol.querySelectorAll('a')].map((a) => a.getAttribute('href')?.replace(BASE, '')))
    for (const n of items.slice(0, 7).reverse()) {
      if (var_.has(n.h)) continue
      const li = document.createElement('li'); li.className = n.l === 'son-dakika' ? 'hot new' : 'new'
      li.innerHTML = `<span class="t">${saat(n.at)}</span><a href="${BASE}${esc(n.h)}">${esc(n.t)}</a><span class="c">${esc(n.c)}${n.l === 'sizinti' ? ' · sızıntı' : ''}</span>`
      ol.prepend(li)
    }
    while (ol.children.length > 7) ol.lastElementChild!.remove()
  })
  // Son dakika şeridi: son 2 saatte "son dakika" etiketli haber varsa
  const sd = document.getElementById('sd')
  const hot = items.filter((n) => n.l === 'son-dakika' && Date.now() - +new Date(n.at) < 2 * 3600e3)
  if (sd && hot.length) {
    const yeni = JSON.stringify(hot.map((n) => ({ t: n.t, h: BASE + n.h, at: saat(n.at) })))
    if (sd.dataset.items !== yeni) { sd.dataset.items = yeni; sd.dispatchEvent(new Event('sd-yenile')) }
  }
}

/** 404: bu adres yeni yayımlanmış bir haber mi? */
async function yeniHaber() {
  const box = document.querySelector<HTMLElement>('[data-canli-haber]'); if (!box || !CMS) return
  const yol = location.pathname.replace(BASE, '').replace(/\/$/, '')
  const r = await fetch(`${CMS}/api/news?where[path][equals]=${encodeURIComponent(yol)}&depth=2&limit=1`).catch(() => null); if (!r?.ok) return
  const d = (await r.json()).docs?.[0]; if (!d) return
  const media = (m: any) => (m && typeof m === 'object' ? { url: m.sizes?.hero?.url || m.url, alt: m.alt, credit: m.credit } : null)
  const c = media(d.cover)
  document.title = `${d.title} · UPDATED`
  box.innerHTML = `<article class="art"><div class="art-head"><div class="chips"><span class="cat">${esc(d.category?.name)}</span>${d.label === 'son-dakika' ? '<span class="lbl l-son">Son dakika</span>' : d.label === 'sizinti' ? '<span class="lbl l-siz">Sızıntı</span>' : ''}</div><h1>${esc(d.title)}</h1><p class="lead" style="margin:0">${esc(d.spot)}</p><div class="kunye-row"><span>${esc(d.author?.name)}</span><span>·</span><span>${saat(d.publishedAt)}</span></div></div>${c ? `<figure class="cover"><img src="${esc(c.url)}" alt="${esc(c.alt)}"><figcaption>${esc(c.credit)}</figcaption></figure>` : ''}<div class="prose" style="margin-top:24px">${d.shortAnswer ? `<div class="short"><span class="label">Kısa cevap</span><p>${esc(d.shortAnswer)}</p></div>` : ''}${lexicalToHtml(d.body, media)}${(d.sources || []).length ? `<div class="src"><span class="label" style="color:var(--text-3)">Kaynak</span><p style="margin:6px 0 0">${d.sources.map((s: any) => (s.url ? `<a href="${esc(s.url)}" rel="noopener" target="_blank">${esc(s.name)}</a>` : esc(s.name))).join(' · ')}</p></div>` : ''}</div></article>`
  box.hidden = false
  document.querySelector<HTMLElement>('[data-404]')?.setAttribute('hidden', '')
}

function okunma() {
  if (!CMS || !document.querySelector('.art, .ku-hero') || document.querySelector('[data-404]')) return
  const yol = location.pathname.replace(BASE, '').replace(/\/$/, '') || '/'
  try { navigator.sendBeacon(`${CMS}/api/okunma`, new Blob([yol], { type: 'text/plain' })) } catch {}
}

if (CMS) {
  tazele(); setInterval(tazele, 60_000); document.addEventListener('visibilitychange', tazele)
  yeniHaber(); okunma()
}
