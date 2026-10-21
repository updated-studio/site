/**
 * Sitenin tek istemci betiği. Sayfa sunucuda tam basılır; bu dosya yalnız etkileşim ekler.
 * Kit hareket kuralları: 120/200/320 ms, cubic-bezier(.2,0,0,1); otomatik dönen slayt yok; azaltılmış harekete saygı.
 */
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches
const FINE = matchMedia('(hover: hover)').matches
const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T | null
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll(s)] as T[]
const ICO: Record<string, string> = {
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>', x: '<path d="M5 5l14 14M19 5L5 19"/>',
  sun: '<path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM12 1v3M12 20v3M1 12h3M20 12h3M4 4l2 2M18 18l2 2M4 20l2-2M18 6l2-2"/>',
  moon: '<path d="M20 15A8 8 0 0 1 9 4a8 8 0 1 0 11 11Z"/>', auto: '<path d="M12 3a9 9 0 1 0 0 18V3Z" fill="currentColor"/><path d="M12 3a9 9 0 1 1 0 18"/>',
}
const ico = (k: string) => `<svg class="ico" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">${ICO[k]}</svg>`
/** Site GitHub Pages proje adresinde (/site) çalışırken yolların önüne eklenir. */
const BASE = (document.documentElement.dataset.base || '').replace(/\/$/, '')
const store = { get: (k: string) => { try { return localStorage.getItem(k) } catch { return null } }, set: (k: string, v: string) => { try { localStorage.setItem(k, v) } catch {} } }

/* ---------- görünüm: Sistem / Açık / Koyu ---------- */
function theme() {
  let t = store.get('up-theme') || 'system'
  const apply = (v: string) => {
    t = v; const r = document.documentElement
    if (v === 'system') delete r.dataset.theme; else r.dataset.theme = v
    store.set('up-theme', v)
    const label = 'Görünüm: ' + ({ system: 'Sistem', light: 'Açık', dark: 'Koyu' } as any)[v] + ' (değiştir)'
    $$('[data-theme-btn]').forEach((b) => { b.innerHTML = ico(v === 'dark' ? 'moon' : v === 'light' ? 'sun' : 'auto'); b.setAttribute('aria-label', label); b.title = label })
  }
  apply(t)
  $$('[data-theme-btn]').forEach((b) => b.addEventListener('click', () => apply(({ system: 'light', light: 'dark', dark: 'system' } as any)[t] || 'system')))
}

/* ---------- mobil menü, arama ---------- */
function menu() {
  const b = $('[data-menu]'), s = $('#sheet'); if (!b || !s) return
  const set = (open: boolean) => { s.hidden = !open; b.setAttribute('aria-expanded', String(open)); b.innerHTML = ico(open ? 'x' : 'menu') }
  b.addEventListener('click', () => set(!!s.hidden))
  s.addEventListener('click', (e) => { if ((e.target as HTMLElement).tagName === 'A') set(false) })
}
/* ---------- arama: statik dizin (/ara-dizin.json) tarayıcıda taranır ---------- */
type Row = [string, string, string, string, string]
let idx: Promise<Row[]> | null = null
const index = () => (idx ||= fetch(`${BASE}/ara-dizin.json`).then((r) => r.json()).catch(() => []))
const fold = (x: string) => x.toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const escH = (x: string) => x.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as any)[c])
async function find(q: string, n = 12) {
  const words = fold(q).split(/\s+/).filter((w) => w.length > 1); if (!words.length) return []
  return (await index()).filter((r: Row) => { const t = fold(r[1] + ' ' + r[3]); return words.every((w) => t.includes(w)) }).slice(0, n)
}
const rowHtml = (r: Row) => `<li><a href="${BASE}${escH(r[2])}"><span class="k">${escH(r[3])}</span><b>${escH(r[1])}</b></a></li>`
function searchPage() {
  const form = $<HTMLFormElement>('[data-search-page]'); if (!form) return
  const inp = $<HTMLInputElement>('input', form)!, out = $('[data-search-results]')!, cnt = $('[data-search-count]')!
  const run = async () => { const v = inp.value.trim(); const r = await find(v, 100); out.innerHTML = r.map(rowHtml).join(''); cnt.textContent = v.length < 2 ? '' : r.length ? `${r.length} sonuç` : 'Sonuç yok. Ürün adını ya da markayı deneyin.' }
  inp.value = new URLSearchParams(location.search).get('q') || ''
  form.addEventListener('submit', (e) => { e.preventDefault(); history.replaceState(null, '', `?q=${encodeURIComponent(inp.value.trim())}`); run() })
  inp.addEventListener('input', run); run()
}
function search() {
  const s = $('#search'), q = $<HTMLInputElement>('#sq'), res = $('#sres'); if (!s || !q || !res) return
  q.addEventListener('input', async () => { const v = q.value.trim(); res.innerHTML = v.length < 2 ? '' : (await find(v)).map(rowHtml).join('') || '<li class="meta" style="padding:12px 0">Sonuç yok. Başka bir model ya da kategori deneyin.</li>' })
  const open = () => { s.hidden = false; q.value = ''; res.innerHTML = ''; index(); setTimeout(() => q.focus(), 10) }
  const close = () => { s.hidden = true }
  $$('[data-open-search]').forEach((b) => b.addEventListener('click', open))
  $$('[data-close-search]').forEach((b) => b.addEventListener('click', close))
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close()
    else if (s.hidden && e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement as HTMLElement)?.tagName || '')) { e.preventDefault(); open() }
  })
}

/* ---------- son dakika şeridi: elle ileri/geri ---------- */
function breaking() {
  const sd = $('#sd'); if (!sd) return
  const items = JSON.parse(sd.dataset.items || '[]') as { t: string; h: string; at: string }[]
  let i = 0
  const a = $<HTMLAnchorElement>('[data-sd-link]', sd)!, tm = $('[data-sd-time]', sd)!
  $$('[data-sd]', sd).forEach((b) => b.addEventListener('click', () => {
    i = (i + Number(b.dataset.sd) + items.length) % items.length
    a.textContent = items[i].t; a.href = items[i].h; tm.textContent = items[i].at
    a.classList.remove('fade'); void a.offsetWidth; a.classList.add('fade')
  }))
}

/* ---------- şeritler: oklar + noktalar ---------- */
function strips(root: ParentNode = document) {
  $$('[data-strip]', root).forEach((s) => {
    if (s.dataset.ready) return; s.dataset.ready = '1'
    const tr = $('.track', s)!, pv = $<HTMLButtonElement>('.pv', s)!, nx = $<HTMLButtonElement>('.nx', s)!, dots = $('.dots', s)!
    const sync = () => {
      const max = tr.scrollWidth - tr.clientWidth - 2
      pv.disabled = tr.scrollLeft <= 2; nx.disabled = tr.scrollLeft >= max
      const n = Math.max(1, Math.ceil(tr.scrollWidth / Math.max(1, tr.clientWidth))), cur = Math.round(tr.scrollLeft / Math.max(1, tr.clientWidth))
      if (dots.children.length !== n) dots.innerHTML = '<i></i>'.repeat(n)
      ;[...dots.children].forEach((d, k) => d.classList.toggle('on', k === Math.min(n - 1, cur)))
    }
    pv.addEventListener('click', () => tr.scrollBy({ left: -tr.clientWidth * 0.9, behavior: RM ? 'auto' : 'smooth' }))
    nx.addEventListener('click', () => tr.scrollBy({ left: tr.clientWidth * 0.9, behavior: RM ? 'auto' : 'smooth' }))
    tr.addEventListener('scroll', sync, { passive: true }); addEventListener('resize', sync); requestAnimationFrame(sync)
  })
}

/* ---------- YouTube: tıklayınca yerinde oynat (youtube-nocookie) ---------- */
function youtube(root: ParentNode = document) {
  $$<HTMLAnchorElement>('[data-yt]', root).forEach((a) => {
    if (a.dataset.ready) return; a.dataset.ready = '1'
    a.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey) return
      e.preventDefault()
      const box = $('.c-img', a)!; const id = a.dataset.yt!
      box.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0" title="${a.textContent?.trim() || 'YouTube'}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe>`
    })
  })
}

/* ---------- akordeon manşet ---------- */
function accordion() {
  $$('[data-ak]').forEach((ak) => {
    const ps = $$('.akp', ak)
    const open = (i: number) => ps.forEach((p, k) => p.setAttribute('aria-expanded', String(k === i)))
    ps.forEach((p, i) => {
      p.addEventListener('click', (e) => { if (!(e.target as HTMLElement).closest('a')) open(i) })
      p.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === p) { e.preventDefault(); open(i) } })
      if (FINE) p.addEventListener('pointerenter', () => open(i))
    })
  })
}

/* ---------- akış manşet: yeni haber düğmesi (sayfa kendiliğinden kaymaz) ---------- */
function newPill() {
  const pill = $<HTMLButtonElement>('[data-newpill]'); if (!pill) return
  const since = pill.dataset.since || new Date().toISOString()
  const check = async () => {
    try {
      const r = await fetch(`${BASE}/parca/akis/son/1`); const html = await r.text()
      const tmp = document.createElement('div'); tmp.innerHTML = html
      const n = $$('time[datetime]', tmp).filter((t) => (t.getAttribute('datetime') || '') > since).length
      if (n) { pill.textContent = `${n} yeni haber · göster`; pill.hidden = false }
    } catch {}
  }
  setInterval(check, 120e3)
  pill.addEventListener('click', () => location.reload())
}

/* ---------- saat ---------- */
function clocks() {
  const els = $$('[data-clock]'); if (!els.length) return
  const tick = () => { const d = new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()).replace(':', '.'); els.forEach((e) => (e.textContent = d)) }
  tick(); setInterval(tick, 20e3)
}

/* ---------- sonsuz akış: 20 haber → videolar → reels → tekrar ---------- */
function feeds() {
  $$('[data-feed]').forEach((f) => {
    const sentinel = $('[data-sentinel]', f)!, more = $<HTMLAnchorElement>('[data-more]', f)
    let busy = false, end = false
    if (more) more.hidden = true // JS varken otomatik; yoksa bağlantı kalır
    const load = async () => {
      if (busy || end) return; busy = true
      const page = Number(f.dataset.next || '2')
      try {
        const r = await fetch(`${BASE}/parca/akis/${encodeURIComponent(f.dataset.feed!)}/${page}`)
        const html = (await r.text()).trim()
        if (!r.ok || !html || !html.includes('inf-chunk')) { end = true; sentinel.innerHTML = '<p class="meta" style="text-align:center">Akışın sonuna geldiniz.</p>'; return }
        const box = document.createElement('div'); box.innerHTML = html
        const chunk = box.firstElementChild as HTMLElement
        f.insertBefore(chunk, sentinel)
        f.dataset.next = String(page + 1)
        hydrate(chunk)
      } catch { if (more) more.hidden = false }
      finally { setTimeout(() => (busy = false), 300) }
    }
    new IntersectionObserver((es) => { if (es[0].isIntersecting) load() }, { rootMargin: '600px 0px' }).observe(sentinel)
  })
}

/* ---------- video reklam: görünürken sessiz başlar, 5 sn sonra geçilebilir ---------- */
function videoAds(root: ParentNode = document) {
  $$('[data-vidad]', root).forEach((el) => {
    if (el.dataset.ready) return; el.dataset.ready = '1'
    const sk = $<HTMLButtonElement>('.skip', el)!, bar = $('.bar', el)!, vol = $<HTMLButtonElement>('.vol', el)!, v = $<HTMLVideoElement>('video', el)
    let t0 = 0, run = false, done = false
    vol.addEventListener('click', () => { const on = vol.textContent === 'Sesi aç'; vol.textContent = on ? 'Sesi kapat' : 'Sesi aç'; if (v) v.muted = !on })
    sk.addEventListener('click', () => { done = true; v?.pause(); $('.slot', el)!.innerHTML = '<span>Reklam geçildi</span>' })
    new IntersectionObserver((es) => { run = es[0].isIntersecting; if (run && !t0) t0 = performance.now(); if (v) run ? v.play().catch(() => {}) : v.pause() }, { threshold: 0.6 }).observe(el)
    const loop = (now: number) => {
      if (done) return
      if (run && t0) {
        const e = v && v.duration ? v.currentTime : (now - t0) / 1000, dur = v && v.duration ? v.duration : 15
        bar.style.width = Math.min(100, (e / dur) * 100) + '%'
        const left = Math.max(0, 5 - Math.floor(e)); sk.disabled = left > 0; sk.textContent = left > 0 ? `Geç (${left})` : 'Reklamı geç'
      }
      requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
  })
}

/* ---------- künye kartı: masaüstünde etiketin üzerine gelince ---------- */
function kunyeCard() {
  if (!FINE) return
  const cache = new Map<string, string>()
  let card: HTMLDivElement | null = null, hideT: any, cur = ''
  const hide = () => { hideT = setTimeout(() => { if (card) card.hidden = true; cur = '' }, 160) }
  const show = async (a: HTMLElement) => {
    clearTimeout(hideT); const slug = a.dataset.p!; if (cur === slug && card && !card.hidden) return; cur = slug
    if (!card) { card = document.createElement('div'); card.className = 'pcard'; card.setAttribute('role', 'tooltip'); document.body.appendChild(card); card.addEventListener('pointerenter', () => clearTimeout(hideT)); card.addEventListener('pointerleave', hide) }
    if (!cache.has(slug)) { try { const r = await fetch(`${BASE}/parca/kunye/${encodeURIComponent(slug)}`); cache.set(slug, r.ok ? await r.text() : '') } catch { return } }
    if (cur !== slug) return
    const html = cache.get(slug)!.trim(); if (!html) return
    card.innerHTML = html; card.hidden = false
    const r = a.getBoundingClientRect(), w = 300
    const x = Math.min(innerWidth - w - 12, Math.max(12, r.left)); let y = r.bottom + 8
    const h = card.offsetHeight || 260; if (y + h > innerHeight - 10) y = r.top - h - 8
    card.style.left = x + 'px'; card.style.top = Math.max(72, y) + 'px'
  }
  document.addEventListener('pointerover', (e) => { const a = (e.target as HTMLElement).closest?.('.pk') as HTMLElement; if (a) show(a) })
  document.addEventListener('pointerout', (e) => { const a = (e.target as HTMLElement).closest?.('.pk'); if (a && !a.contains(e.relatedTarget as Node)) hide() })
  document.addEventListener('focusin', (e) => { const a = (e.target as HTMLElement).closest?.('.pk') as HTMLElement; if (a) show(a) })
  document.addEventListener('focusout', (e) => { if ((e.target as HTMLElement).closest?.('.pk')) hide() })
  addEventListener('scroll', () => { if (card && !card.hidden) { card.hidden = true; cur = '' } }, { passive: true })
}

/* ---------- 60 saniye: okur oynatır ---------- */
function sixty() {
  $$('[data-s60]').forEach((box) => {
    const S = JSON.parse(box.dataset.s60 || '[]') as { c: string; t: string; s: string; h: string }[]
    const segs = $$('.segs b', box), play = $('[data-play]', box)!
    let i = 0, t0 = 0, run = false
    const show = (k: number) => {
      i = (k + S.length) % S.length; t0 = performance.now(); const n = S[i]
      $('[data-m]', box)!.textContent = `${n.c} · ${i + 1}/${S.length}`; $('[data-h]', box)!.textContent = n.t; $('[data-p]', box)!.textContent = n.s
      $<HTMLAnchorElement>('[data-open]', box)!.href = n.h
      segs.forEach((s, q) => (s.style.width = q < i ? '100%' : '0%'))
    }
    const loop = (now: number) => {
      if (!run) return; const e = now - t0; segs[i].style.width = Math.min(100, (e / 10000) * 100) + '%'
      if (e > 10000) { if (i === S.length - 1) { run = false; play.textContent = 'Baştan'; return } show(i + 1) }
      requestAnimationFrame(loop)
    }
    play.addEventListener('click', () => {
      if (play.textContent === 'Baştan') show(0)
      run = !run; play.textContent = run ? 'Duraklat' : 'Oynat'
      if (run) { t0 = performance.now() - ((parseFloat(segs[i].style.width) || 0) / 100) * 10000; requestAnimationFrame(loop) }
    })
    $('[data-prev]', box)!.addEventListener('click', () => show(i - 1)); $('[data-next]', box)!.addEventListener('click', () => show(i + 1))
  })
}

/* ---------- Kıyas Robotu ---------- */
function robot() {
  $$('[data-robot]').forEach((box) => {
    const D = JSON.parse(box.dataset.robot || '[]') as { s: string; n: string; sp: Record<string, string> }[]
    const a = $<HTMLSelectElement>('#rb1', box)!, b = $<HTMLSelectElement>('#rb2', box)!, only = $('[data-only]', box)!, go = $<HTMLAnchorElement>('[data-go]', box)!
    const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as any)[c])
    const draw = () => {
      const A = D.find((x) => x.s === a.value)!, B = D.find((x) => x.s === b.value)!, o = only.getAttribute('aria-pressed') === 'true'
      $('[data-h1]', box)!.textContent = A.n; $('[data-h2]', box)!.textContent = B.n
      const keys = [...new Set([...Object.keys(A.sp), ...Object.keys(B.sp)])]
      $('[data-rows]', box)!.innerHTML = keys.filter((k) => !o || A.sp[k] !== B.sp[k]).map((k) => `<tr><th scope="row" style="font-family:var(--f-body);font-weight:600">${esc(k)}</th><td>${esc(A.sp[k] || 'Bilinmiyor')}</td><td>${esc(B.sp[k] || 'Bilinmiyor')}</td></tr>`).join('')
      go.href = `${BASE}/karsilastirma/${[A.s, B.s].sort().join('-vs-')}`; go.hidden = A.s === B.s
    }
    a.addEventListener('change', draw); b.addEventListener('change', draw)
    only.addEventListener('click', () => { only.setAttribute('aria-pressed', String(only.getAttribute('aria-pressed') !== 'true')); draw() })
    draw()
  })
}

/* ---------- kıyas tablosu: sadece farklar ---------- */
function onlyDiff() {
  $$('[data-only-diff]').forEach((btn) => {
    const t = $('[data-cmp]')!
    btn.addEventListener('click', () => {
      const on = btn.getAttribute('aria-pressed') !== 'true'; btn.setAttribute('aria-pressed', String(on))
      $$('tr[data-same]', t).forEach((r) => (r.hidden = on))
      $$('tr.grp', t).forEach((g) => { let n = g.nextElementSibling as HTMLElement | null, any = false; while (n && !n.classList.contains('grp')) { if (!n.hidden) any = true; n = n.nextElementSibling as HTMLElement | null } g.hidden = !any })
    })
  })
}

/* ---------- künye sayfası: söküm ---------- */
function sokum() {
  const sk = $('[data-sokum]'); if (!sk) return
  const tog = $('.ku-tog')
  setTimeout(() => sk.classList.add('open'), RM ? 0 : 350)
  tog?.addEventListener('click', () => { const on = !sk.classList.contains('open'); sk.classList.toggle('open', on); tog.textContent = on ? 'Topla' : 'Sök'; tog.setAttribute('aria-pressed', String(on)) })
  $$('.ku-tabs button').forEach((b) => b.addEventListener('click', () => {
    const foto = b.dataset.m === 'foto'
    $$('.ku-tabs button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)))
    $('.ku-photo')!.hidden = !foto; sk.hidden = foto; if (tog) tog.hidden = foto
  }))
}

/* ---------- bülten ---------- */
function newsletter() {
  const f = $<HTMLFormElement>('#bulten'), msg = $('#nlmsg'); if (!f || !msg) return
  f.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = ($<HTMLInputElement>('#nlmail')!.value || '').trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg.textContent = 'Geçerli bir e-posta yazın, ör. ad@alanadi.com'; return }
    const url = f.dataset.endpoint
    if (!url) { msg.textContent = 'Bülten kaydı henüz açılmadı.'; return }
    try { const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, source: location.hostname }) }); msg.textContent = r.ok ? 'Kaydınız alındı. Onay e-postasını kontrol edin.' : 'Şu an kaydedemedik, birazdan tekrar deneyin.' } catch { msg.textContent = 'Şu an kaydedemedik, birazdan tekrar deneyin.' }
  })
}

/** Sonradan eklenen parçalara (sonsuz akış) davranış bağla. */
function hydrate(root: ParentNode) { strips(root); youtube(root); videoAds(root) }

theme(); menu(); search(); searchPage(); breaking(); accordion(); newPill(); clocks(); feeds(); kunyeCard(); sixty(); robot(); onlyDiff(); sokum(); newsletter()
hydrate(document)
