/* ===== core helpers shared by site and Kulüp ===== */
(() => {
  document.documentElement.lang = 'tr';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const I = {
    search: '<path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4"/>', menu: '<path d="M3 6h18M3 12h18M3 18h18"/>', x: '<path d="M5 5l14 14M19 5L5 19"/>',
    left: '<path d="M15 5l-7 7 7 7"/>', right: '<path d="M9 5l7 7-7 7"/>', play: '<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>',
    book: '<path d="M6 3h12v18l-6-5-6 5z"/>', sun: '<path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10ZM12 1v3M12 20v3M1 12h3M20 12h3M4 4l2 2M18 18l2 2M4 20l2-2M18 6l2-2"/>',
    moon: '<path d="M20 15A8 8 0 0 1 9 4a8 8 0 1 0 11 11Z"/>', auto: '<path d="M12 3a9 9 0 1 0 0 18V3Z" fill="currentColor"/><path d="M12 3a9 9 0 1 1 0 18"/>',
    vol: '<path d="M4 9v6h4l5 4V5L8 9H4ZM17 9a4 4 0 0 1 0 6"/>', ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>', check: '<path d="M4 12l5 5L20 6"/>'
  };
  const ico = (k, s = 20) => `<svg class="ico" width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true">${I[k]}</svg>`;
  const logo = (k = 'yatay', label = 'UPDATED') => { const [vb, d] = (window.UP_LOGO || {})[k] || ['0 0 10 10', '']; return `<svg viewBox="${vb}" role="img" aria-label="${label}"><path fill-rule="evenodd" d="${d}"/></svg>`; };
  const img = (k, alt = '', cls = '', lazy = true) => k && UP.IMG && UP.IMG[k] ? `<img class="${cls}" src="${UP.IMG[k]}" alt="${esc(alt)}" width="1200" height="800"${lazy ? ' loading="lazy"' : ''} decoding="async">` : '';
  /* saved items (per-viewer convenience) */
  let saved = []; try { saved = JSON.parse(localStorage.getItem('up-saved') || '[]'); } catch (e) {}
  const listeners = [];
  const persist = () => { try { localStorage.setItem('up-saved', JSON.stringify(saved)); } catch (e) {} listeners.forEach(f => f()); };
  const isSaved = id => saved.some(s => s.id === id);
  const toggleSave = it => { if (isSaved(it.id)) saved = saved.filter(s => s.id !== it.id); else { saved.unshift(it); toast('Kaydedildi'); } persist(); };
  const saveBtn = it => { const b = document.createElement('button'); b.type = 'button'; b.className = 'save'; b.innerHTML = ico('book', 16); const sync = () => { const on = isSaved(it.id); b.setAttribute('aria-pressed', on); b.setAttribute('aria-label', on ? 'Kaydedilenlerden çıkar' : 'Kaydet'); }; sync(); listeners.push(sync); b.onclick = e => { e.preventDefault(); toggleSave(it); }; return b; };
  let tT; const toast = msg => { let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); } t.innerHTML = `<span class="ck">✓</span><span></span>`; t.lastChild.textContent = msg; t.hidden = false; clearTimeout(tT); tT = setTimeout(() => t.hidden = true, 5000); };
  /* theme: Sistem / Açık / Koyu (kit 12b) */
  let theme = 'system'; try { theme = localStorage.getItem('up-theme') || 'system'; } catch (e) {}
  const applyTheme = v => { theme = v; const r = document.documentElement; if (v === 'system') delete r.dataset.theme; else r.dataset.theme = v; try { localStorage.setItem('up-theme', v); } catch (e) {} $$('[data-theme-btn]').forEach(b => { b.innerHTML = ico(v === 'dark' ? 'moon' : v === 'light' ? 'sun' : 'auto'); b.setAttribute('aria-label', 'Görünüm: ' + ({ system: 'Sistem', light: 'Açık', dark: 'Koyu' }[v]) + ' (değiştir)'); b.title = b.getAttribute('aria-label'); }); };
  applyTheme(theme);
  const cycleTheme = () => applyTheme({ system: 'light', light: 'dark', dark: 'system' }[theme] || 'system');
  /* ad slots (kit 10b: "Reklam" label, never looks like content) */
  const C = {};
  const AD = { lb: ['970 × 250', 'Masaüstü 970 × 250 · mobil 320 × 100'], mr: ['300 × 250', 'Kutu 300 × 250'], in: ['Akış içi', 'Akış içi yerel reklam · 1 / 20 haber'] };
  C.ad = el => {
    const s = el.dataset.size || 'lb', bare = el.dataset.bare === '1';
    const html = `<div class="ad ad-${s}" role="complementary" aria-label="Reklam"><span class="k">Reklam</span><div class="slot">${AD[s][1]}</div></div>`;
    if (bare) { el.outerHTML = html; return; }
    el.className = 'ad-wrap'; el.innerHTML = html;
  };
  /* small video ad (outstream): muted, no autoplay sound, skippable after 5 s */
  C.vidad = el => {
    el.className = 'ad-wrap';
    el.innerHTML = `<div class="ad ad-vid" role="complementary" aria-label="Video reklam" style="width:100%;max-width:640px"><span class="k">Reklam · video · sessiz başlar</span><div class="slot"><span>Video reklam alanı · 15 sn · 16:9</span><span class="bar"></span><span class="ctl"><button type="button" class="vol">${'Sesi aç'}</button><button type="button" class="skip" disabled>Geç (5)</button></span></div></div>`;
    const sk = $('.skip', el), bar = $('.bar', el), vol = $('.vol', el); let t0 = 0, run = false, done = false;
    vol.onclick = () => { vol.textContent = vol.textContent === 'Sesi aç' ? 'Sesi kapat' : 'Sesi aç'; };
    sk.onclick = () => { done = true; el.querySelector('.slot').innerHTML = '<span>Reklam geçildi</span>'; };
    const io = new IntersectionObserver(es => { run = es[0].isIntersecting; if (run && !t0) t0 = performance.now(); }, { threshold: .6 }); io.observe(el);
    const loop = now => { if (done) return; if (run && t0) { const e = (now - t0) / 1000; bar.style.width = Math.min(100, e / 15 * 100) + '%'; const left = Math.max(0, 5 - Math.floor(e)); sk.disabled = left > 0; sk.textContent = left > 0 ? `Geç (${left})` : 'Reklamı geç'; } requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  };
  Object.assign(UP, { RM, $, $$, esc, ico, logo, img, isSaved, toggleSave, saveBtn, listeners, toast, applyTheme, cycleTheme, C, s20: s => Math.round(s * 4) + '/20' });
})();
