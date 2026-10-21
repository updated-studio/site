/* ===== UPDATED KULÜP — lessons, simulators, exercises, assignments, progress =====
   Content is data (TRACKS / QUIZ / TASKS); simulators register in SIMS. The live platform stores
   progress in Supabase (tables listed in the developer note); this preview keeps it in the browser. */
(() => {
  const { $, $$, esc, ico, logo, img, toast, RM } = UP;
  const TRACKS = [
    { id: 'foto', n: 'Fotoğraf', img: 'drone', d: 'Pozlama üçgeni, kompozisyon, ışık ve düzenleme.', mods: [
      { n: 'Pozlamanın temeli', l: [['Diyafram ne işe yarar?', 'Okuma', 4], ['Enstantane ve hareket', 'Okuma', 4], ['ISO ve gürültü', 'Okuma', 3], ['Pozlama simülatörü', 'Simülatör', 6, 'expo'], ['Pozlama alıştırması', 'Alıştırma', 3, 'quiz']] },
      { n: 'Kompozisyon', l: [['Üçler kuralı ve ötesi', 'Okuma', 5], ['Öncü çizgiler', 'Okuma', 4], ['Haftalık görev: öncü çizgi', 'Görev', 0, 'task']] },
      { n: 'Gece ve uzun pozlama', l: [['Tripod ve sabitleme', 'Okuma', 4], ['Işık izi çekimi', 'Simülatör', 6, 'expo'], ['Gece alıştırması', 'Alıştırma', 3, 'quiz']] } ] },
    { id: 'video', n: 'Video', img: 'cam360', d: 'Kare hızı, 180° kuralı, ses ve kurgu.', mods: [
      { n: 'Hareketin dili', l: [['Kare hızı nedir?', 'Okuma', 4], ['180° örtücü kuralı', 'Simülatör', 5, 'shutter'], ['ND filtre ne zaman?', 'Okuma', 4], ['Video alıştırması', 'Alıştırma', 3, 'quiz']] },
      { n: 'Ses', l: [['Yaka mikrofonu yerleşimi', 'Okuma', 4], ['Ses seviyeleri', 'Okuma', 3]] } ] },
    { id: 'dron', n: 'Dron', img: 'fpv', d: 'Mevzuat, uçuş planı, güvenli çekim.', mods: [
      { n: 'Uçmadan önce', l: [['Ağırlık sınıfları ve kayıt', 'Okuma', 5], ['Uçuş öncesi kontrol', 'Simülatör', 5, 'drone'], ['Rüzgâr ve batarya', 'Simülatör', 6, 'drone'], ['Dron alıştırması', 'Alıştırma', 3, 'quiz']] },
      { n: 'Havadan çekim', l: [['Orbit ve takip modları', 'Okuma', 4], ['Haftalık görev: kuş bakışı', 'Görev', 0, 'task']] } ] }
  ];
  const QUIZ = [
    { t: 'foto', q: 'Arka planı daha bulanık yapmak için diyaframı nasıl değiştirirsiniz?', o: ['f/16 yaparım', 'f/1.8 yaparım', 'ISO’yu yükseltirim'], a: 1, w: 'Küçük f sayısı (f/1.8) daha geniş açıklık demek; alan derinliği daralır, arka plan bulanıklaşır.' },
    { t: 'foto', q: 'Hareket eden bir arabayı donmuş göstermek için hangi enstantane daha uygun?', o: ['1/15 sn', '1/1000 sn', '1 sn'], a: 1, w: 'Kısa enstantane (1/1000 sn) hareketi dondurur; uzun enstantane iz bırakır.' },
    { t: 'foto', q: 'ISO 100’den ISO 3200’e çıkınca ne olur?', o: ['Görüntü kararır', 'Gürültü artar', 'Alan derinliği artar'], a: 1, w: 'ISO sinyali güçlendirir; parlaklık artar ama gürültü de artar.' },
    { t: 'video', q: '25 fps çekimde 180° kuralına göre enstantane kaç olmalı?', o: ['1/25 sn', '1/50 sn', '1/250 sn'], a: 1, w: '180° kuralı: enstantane = 1 / (2 × kare hızı). 25 fps için 1/50 sn.' },
    { t: 'video', q: 'Güneşte 1/50 sn’de aşırı pozlanıyorsanız ne kullanırsınız?', o: ['ND filtre', 'Daha yüksek ISO', 'Daha geniş diyafram'], a: 0, w: 'ND filtre ışığı azaltır; enstantaneyi 180° kuralında tutabilirsiniz.' },
    { t: 'dron', q: 'Batarya planında dönüş için ne kadar yedek bırakılmalı?', o: ['Hiç', 'En az %20–30', 'Tam %50'], a: 1, w: 'Rüzgâr ve beklenmedik durumlar için %20–30 yedek yaygın bir güvenlik payıdır. Üretici ve mevzuat kurallarına uyun.' }
  ];
  const TASKS = [
    { n: 'Öncü çizgi', t: 'Fotoğraf', d: 'Bir yol, korkuluk ya da gölgeyle bakışı konuya götüren bir kare çek.', c: ['Tek konu', 'Çizgi kadrajın köşesinden başlıyor', 'Ufuk düz'] },
    { n: 'Kuş bakışı', t: 'Dron', d: 'Tam tepeden (90°) bir desen ya da gölge çek. Yasaklı bölgede uçma.', c: ['Kamera 90° aşağı', 'Desen kadrajın %60’ı', 'İzinli bölge'] }
  ];
  /* progress (browser only in this preview) */
  let S = { xp: 0, done: {}, badges: {}, streak: 3, quiz: {} };
  try { S = Object.assign(S, JSON.parse(localStorage.getItem('kulup-v1') || '{}')); } catch (e) {}
  const save = () => { try { localStorage.setItem('kulup-v1', JSON.stringify(S)); } catch (e) {} drawXP(); };
  const lvl = () => 1 + Math.floor(S.xp / 200);
  const gain = (n, why) => { S.xp += n; save(); toast(`+${n} XP · ${why}`); };
  const badge = (k, why) => { if (S.badges[k]) return; S.badges[k] = 1; save(); toast('Rozet kazanıldı · ' + why); };
  function drawXP() { const x = $('#xp'); if (x) x.innerHTML = `Sv ${lvl()}<i><b style="width:${(S.xp % 200) / 2}%"></b></i>${S.xp} XP`; }

  const VIEWS = [['ana', 'Ana sayfa'], ['dersler', 'Dersler'], ['pratik', 'Pratik'], ['alistirma', 'Alıştırmalar'], ['gorev', 'Görevler'], ['ilerleme', 'İlerlemem']];
  let cur = 'ana', track = 'foto', sim = 'expo';
  function shell() {
    $('#hdr').innerHTML = `<div class="wrap"><a class="kbrand" href="#ana" aria-label="UPDATED Kulüp ana sayfa"><span class="logo">${logo('yatay')}</span><span class="div"></span><b>Kulüp</b></a><nav class="knav" aria-label="Kulüp">${VIEWS.map(([k, t]) => `<button type="button" data-go="${k}">${t}</button>`).join('')}</nav><div class="hdr-r"><span class="xp" id="xp"></span><button class="ibtn" type="button" data-theme-btn></button><a class="btn" href="${UP.SITE_URL}">Siteye dön</a></div></div>`;
    $('#ktabs').innerHTML = VIEWS.map(([k, t]) => `<button type="button" data-go="${k}">${t}</button>`).join('');
    $$('[data-theme-btn]').forEach(b => b.onclick = UP.cycleTheme); UP.applyTheme(document.documentElement.dataset.theme || (() => { try { return localStorage.getItem('up-theme'); } catch (e) { return null; } })() || 'system');
    document.addEventListener('click', e => { const g = e.target.closest('[data-go]'); if (g) { go(g.dataset.go, g.dataset); } });
    drawXP();
  }
  function go(v, ds = {}) { cur = v; if (ds.track) track = ds.track; if (ds.sim) sim = ds.sim; $$('[data-go]').forEach(b => b.tagName === 'BUTTON' && b.closest('nav,.ktabs') ? (b.dataset.go === v ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current')) : 0); render(); scrollTo(0, 0); try { history.replaceState(null, '', '#' + v); } catch (e) {} }
  const pct = t => { const all = t.mods.flatMap(m => m.l), d = all.filter(l => S.done[l[0]]).length; return Math.round(d / all.length * 100); };
  function render() {
    const m = $('#kmain');
    if (cur === 'ana') m.innerHTML = `<div class="wrap"><div class="khero"><div><span class="cat">UPDATED Kulüp · fotoğraf · video · dron</span><h1>Oynayarak öğren, çekerek ilerle</h1><p class="lead" style="margin:16px 0 0">Kısa dersler, gerçek ayarlarla çalışan simülatörler ve haftalık çekim görevleri. Her adım XP ve rozet kazandırır.</p><div class="chips" style="margin-top:24px"><button class="btn btn-p" type="button" data-go="pratik" data-sim="expo">Pozlama simülatörünü aç</button><button class="btn" type="button" data-go="dersler">Derslere göz at</button></div></div>
      <div class="stat3"><div><span class="label" style="color:var(--text-3)">Seviye</span><b>${lvl()}</b></div><div><span class="label" style="color:var(--text-3)">Seri</span><b>${S.streak} gün</b></div><div><span class="label" style="color:var(--text-3)">Rozet</span><b>${Object.keys(S.badges).length}</b></div></div></div>
      <section class="sec"><div class="sh"><h2>Yollar</h2></div><div class="grid3">${TRACKS.map(t => `<button type="button" class="track-c" data-go="dersler" data-track="${t.id}"><span class="c-img">${img(t.img, '')}</span><span class="b"><span class="cat">${t.mods.length} modül · ${t.mods.flatMap(x => x.l).length} adım</span><h3>${t.n}</h3><span style="color:var(--text-2);font-size:15px">${t.d}</span><span class="prog"><b style="width:${pct(t)}%"></b></span><span class="meta">%${pct(t)} tamamlandı</span></span></button>`).join('')}</div></section>
      <section class="sec"><div class="sh"><h2>Bu haftanın görevi</h2><button class="btn" type="button" data-go="gorev">Tüm görevler</button></div><div class="c-std"><div class="b"><span class="cat">${TASKS[0].t} · 7 gün</span><h3>${TASKS[0].n}</h3><p style="margin:0;color:var(--text-2)">${TASKS[0].d}</p></div></div>
      <details class="dev"><summary>Geliştirici notu · altyapı</summary><div class="prose" style="font-size:15px;margin-top:12px"><p><b>İçerik veri olarak:</b> yollar → modüller → adımlar (okuma, simülatör, alıştırma, görev). Stüdyo'dan JSON ile eklenir; tasarım değişmez.</p><p><b>Simülatör eklentisi:</b> her simülatör <code>{ id, ad, kontroller[], ciz(canvas, değerler), hedefler[] }</code> biçiminde kaydolur; yeni simülatör tek dosya.</p><p><b>Supabase tabloları (öneri):</b> kulup_yollar · kulup_moduller · kulup_adimlar · kulup_alistirmalar · kulup_ilerleme (kullanıcı, adım, xp, tarih) · kulup_rozetler · kulup_gorev_teslimleri (görsel, kriter puanı, editör yorumu).</p><p><b>Hesap:</b> site ile ortak oturum; ilerleme cihazlar arası. Bu önizlemede yalnızca bu tarayıcıda saklanır.</p></div></details></section></div>`;
    if (cur === 'dersler') { const t = TRACKS.find(x => x.id === track); m.innerHTML = `<div class="wrap"><div class="khero" style="grid-template-columns:minmax(0,1fr)"><div class="simtabs">${TRACKS.map(x => `<button type="button" aria-pressed="${x.id === track}" data-go="dersler" data-track="${x.id}">${x.n}</button>`).join('')}</div><h1 class="h1">${t.n}</h1><p class="lead" style="margin:0">${t.d}</p><div class="prog" style="max-width:420px"><b style="width:${pct(t)}%"></b></div></div>
      <section class="sec" style="display:flex;flex-direction:column;gap:24px">${t.mods.map((md, mi) => `<div class="mods"><div class="mod-h"><h3>${mi + 1}. ${md.n}</h3><span class="meta">${md.l.filter(l => S.done[l[0]]).length}/${md.l.length}</span></div><ol class="les">${md.l.map((l, li) => { const dn = S.done[l[0]], lock = mi > 0 && !t.mods[mi - 1].l.some(x => S.done[x[0]]) && !dn; return `<li class="${dn ? 'done' : ''} ${lock ? 'lock' : ''}"><span class="s">${dn ? '✓' : li + 1}</span><span><b style="font-size:16px">${esc(l[0])}</b><br><span class="ty">${l[1]}${l[2] ? ' · ' + l[2] + ' dk' : ''}</span></span><span class="ty">${lock ? 'Kilitli' : dn ? 'Tamam' : '+20 XP'}</span>${lock ? '<span></span>' : `<button class="btn" type="button" data-step="${esc(l[0])}" data-kind="${l[3] || 'read'}">${dn ? 'Tekrar' : 'Başla'}</button>`}</li>`; }).join('')}</ol></div>`).join('')}</section></div>`;
      $$('[data-step]', m).forEach(b => b.onclick = () => { const k = b.dataset.kind, n = b.dataset.step; if (k === 'expo' || k === 'shutter' || k === 'drone') { S.done[n] = 1; save(); go('pratik', { sim: k }); } else if (k === 'quiz') { S.done[n] = 1; save(); go('alistirma'); } else if (k === 'task') { S.done[n] = 1; save(); go('gorev'); } else { if (!S.done[n]) { S.done[n] = 1; gain(20, n); } render(); } }); }
    if (cur === 'pratik') { m.innerHTML = `<div class="wrap"><section class="sec"><div class="sh"><div><span class="cat">Pratik · gerçek ayarlarla</span><h2>Simülatörler</h2></div></div><div class="simtabs">${[['expo', 'Fotoğraf · pozlama'], ['shutter', 'Video · 180° kuralı'], ['drone', 'Dron · uçuş planı']].map(([k, t]) => `<button type="button" aria-pressed="${k === sim}" data-go="pratik" data-sim="${k}">${t}</button>`).join('')}</div><div id="simbox"></div></section></div>`; SIMS[sim]($('#simbox')); }
    if (cur === 'alistirma') { m.innerHTML = `<div class="wrap"><section class="sec"><div class="sh"><div><span class="cat">Alıştırmalar · ${QUIZ.length} soru</span><h2>Kendini dene</h2></div><span class="meta" id="qsc"></span></div><div id="qbox"></div></section></div>`; quiz(); }
    if (cur === 'gorev') { m.innerHTML = `<div class="wrap"><section class="sec"><div class="sh"><div><span class="cat">Haftalık çekim görevleri</span><h2>Görevler</h2></div></div><div class="grid3" style="grid-template-columns:repeat(2,minmax(0,1fr))">${TASKS.map((t, i) => `<div class="c-std"><div class="b"><span class="cat">${t.t} · 7 gün · +100 XP</span><h3>${t.n}</h3><p style="margin:0;color:var(--text-2);font-size:16px">${t.d}</p><ul class="chk">${t.c.map(c => `<li><span class="b"></span><span>${esc(c)}</span></li>`).join('')}</ul><label class="drop" for="up${i}" data-i="${i}"><span>Fotoğrafını sürükle ya da seç<br><span class="meta">JPG/PNG · önizleme yalnızca bu tarayıcıda</span></span></label><input id="up${i}" type="file" accept="image/*" class="sr"><button class="btn btn-p" type="button" data-send="${i}" disabled>Teslim et</button></div></div>`).join('')}</div></section></div>`;
      $$('.drop', m).forEach(d => { const i = d.dataset.i, inp = $('#up' + i), send = $(`[data-send="${i}"]`); const show = f => { if (!f || !/^image\//.test(f.type)) return; const r = new FileReader(); r.onload = () => { d.innerHTML = `<img src="${r.result}" alt="Yüklenen fotoğraf önizlemesi">`; send.disabled = false; }; r.readAsDataURL(f); }; inp.onchange = () => show(inp.files[0]); d.ondragover = e => { e.preventDefault(); d.classList.add('over'); }; d.ondragleave = () => d.classList.remove('over'); d.ondrop = e => { e.preventDefault(); d.classList.remove('over'); show(e.dataTransfer.files[0]); }; send.onclick = () => { send.disabled = true; send.textContent = 'Editöre gönderildi'; gain(100, 'görev teslimi'); badge('gorev', 'İlk görev'); }; }); }
    if (cur === 'ilerleme') { const B = [['ilk', 'İlk adım', 'Bir ders bitir'], ['poz', 'Doğru pozlama', 'Pozlama hedefini tuttur'], ['180', '180°', 'Video kuralını yakala'], ['pilot', 'Temkinli pilot', 'Güvenli uçuş planı yap'], ['quiz', 'Bilgi kurdu', 'Alıştırmada 5 doğru'], ['gorev', 'İlk görev', 'Görev teslim et'], ['seri', '7 gün seri', '7 gün üst üste gir'], ['usta', 'Kulüp ustası', 'Seviye 5']];
      if (Object.keys(S.done).length) S.badges.ilk = 1;
      m.innerHTML = `<div class="wrap"><section class="sec"><div class="sh"><div><span class="cat">İlerlemem</span><h2>Seviye ${lvl()} · ${S.xp} XP</h2></div><button class="btn" type="button" id="reset">İlerlemeyi sıfırla</button></div><div class="grid3" style="margin-bottom:32px">${TRACKS.map(t => `<div class="c-std"><div class="b"><h3>${t.n}</h3><div class="prog"><b style="width:${pct(t)}%"></b></div><span class="meta">%${pct(t)}</span></div></div>`).join('')}</div><div class="sh"><h2>Rozetler</h2></div><div class="badges">${B.map(([k, n, d]) => `<div class="badge ${S.badges[k] ? 'on' : 'off'}"><span class="bx">${S.badges[k] ? '✓' : '·'}</span><b>${n}</b><span class="meta">${d}</span></div>`).join('')}</div></section></div>`;
      $('#reset').onclick = () => { if ($('#reset').dataset.c) { S = { xp: 0, done: {}, badges: {}, streak: 3, quiz: {} }; save(); render(); } else { $('#reset').dataset.c = 1; $('#reset').textContent = 'Emin misiniz? Tekrar basın'; } }; }
    $$('[data-go]').forEach(b => { if (b.closest('nav.knav,.ktabs')) b.dataset.go === cur ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'); });
  }

  /* ---------- quiz ---------- */
  function quiz() {
    let i = 0, ok = 0; const box = $('#qbox');
    const draw = () => { if (i >= QUIZ.length) { box.innerHTML = `<div class="q"><h3>${ok} / ${QUIZ.length} doğru</h3><p class="fb">${ok >= 5 ? 'Harika. "Bilgi kurdu" rozeti senin.' : 'Simülatörlere dönüp tekrar deneyebilirsin.'}</p><div class="chips"><button class="btn btn-p" type="button" id="qa">Baştan</button><button class="btn" type="button" data-go="pratik">Simülatörler</button></div></div>`; if (ok >= 5) badge('quiz', 'Bilgi kurdu'); $('#qa').onclick = () => { i = 0; ok = 0; draw(); }; return; }
      const q = QUIZ[i]; $('#qsc').textContent = `Soru ${i + 1} / ${QUIZ.length} · ${ok} doğru`;
      box.innerHTML = `<div class="q"><span class="cat">${({ foto: 'Fotoğraf', video: 'Video', dron: 'Dron' })[q.t]}</span><h3>${esc(q.q)}</h3><div class="opts">${q.o.map((o, k) => `<button type="button" data-k="${k}">${esc(o)}</button>`).join('')}</div><p class="fb" id="fb" aria-live="polite"></p><button class="btn" type="button" id="qn" hidden>Sonraki soru</button></div>`;
      $$('.opts button', box).forEach(b => b.onclick = () => { if ($('#qn').hidden === false) return; const k = +b.dataset.k, r = k === q.a; b.classList.add(r ? 'right' : 'wrong'); if (!r) $$('.opts button', box)[q.a].classList.add('right'); if (r) { ok++; gain(10, 'doğru cevap'); } $('#fb').innerHTML = `<b>${r ? 'Doğru.' : 'Tam değil.'}</b> ${esc(q.w)}`; $('#qn').hidden = false; $('#qn').focus(); });
      $('#qn').onclick = () => { i++; draw(); }; };
    draw();
  }

  /* ---------- simulators ---------- */
  const STOPS = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16], SHUT = [1 / 4000, 1 / 2000, 1 / 1000, 1 / 500, 1 / 250, 1 / 125, 1 / 60, 1 / 30, 1 / 15, 1 / 8, 1 / 4], ISOS = [100, 200, 400, 800, 1600, 3200, 6400];
  const fmtS = s => s >= 1 ? s + ' sn' : '1/' + Math.round(1 / s) + ' sn';
  const loadImg = k => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = UP.IMG[k]; });
  const SIMS = {};
  SIMS.expo = async box => {
    box.innerHTML = `<div class="sim"><div><canvas id="ec" width="960" height="540" role="img" aria-label="Pozlama önizlemesi: şehir önünde uçan dron"></canvas><p class="meta" style="margin-top:8px">Sahne: alacakaranlıkta şehir, önde sağa doğru uçan dron · sahnenin ışığı EV 9 (ISO 100)</p></div>
      <div class="ctrls"><div class="ctl"><div class="r"><label for="ea">Diyafram</label><output id="eao"></output></div><input id="ea" type="range" min="0" max="7" step="1" value="3"><small>Küçük f sayısı: daha çok ışık, daha bulanık arka plan.</small></div>
      <div class="ctl"><div class="r"><label for="es">Enstantane</label><output id="eso"></output></div><input id="es" type="range" min="0" max="10" step="1" value="5"><small>Uzun süre: daha çok ışık, hareket izi.</small></div>
      <div class="ctl"><div class="r"><label for="ei">ISO</label><output id="eio"></output></div><input id="ei" type="range" min="0" max="6" step="1" value="2"><small>Yüksek ISO: daha parlak, daha gürültülü.</small></div>
      <div class="ctl"><div class="r"><span style="font-weight:600;font-size:15px">Pozlama ölçer</span><output id="eev"></output></div><div class="meter" id="em">${'<i></i>'.repeat(7)}</div><div class="mscale"><span>−3</span><span>−2</span><span>−1</span><span>0</span><span>+1</span><span>+2</span><span>+3</span></div></div>
      <div class="goal"><b>Hedef</b><span style="font-size:15px">Arka plan bulanık, dron net, pozlama ±0,5 EV içinde.</span><ul class="chk" id="eg"></ul></div></div></div>`;
    const cv = $('#ec'), x = cv.getContext('2d'), W = 960, H = 540; const [bg, dr] = await Promise.all([loadImg('city'), loadImg('drone_cut')]);
    const a = $('#ea'), s = $('#es'), i = $('#ei'); let won = false;
    const noise = document.createElement('canvas'); noise.width = 240; noise.height = 135; const nx = noise.getContext('2d');
    const draw = () => {
      const N = STOPS[+a.value], t = SHUT[+s.value], iso = ISOS[+i.value];
      const ev = Math.log2(N * N / t) - Math.log2(iso / 100), d = 9 - ev; // >0 brighter than correct
      $('#eao').textContent = 'f/' + N; $('#eso').textContent = fmtS(t); $('#eio').textContent = 'ISO ' + iso; $('#eev').textContent = (d >= 0 ? '+' : '') + d.toFixed(1).replace('.', ',') + ' EV';
      const mi = Math.max(0, Math.min(6, Math.round(d) + 3)); $$('#em i').forEach((el, k) => { el.className = (k === mi ? 'on' : '') + (k === 3 ? ' mid' : ''); });
      const blur = Math.max(0, (8 - N) / 6.6) * 14, bright = Math.pow(2, Math.max(-4, Math.min(3, d)));
      x.save(); x.filter = `blur(${blur.toFixed(1)}px) brightness(${bright})`; if (bg) x.drawImage(bg, -20, -20, W + 40, H + 40); x.restore();
      if (dr) { const dw = 360, dh = dr.height / dr.width * dw, dx = 300, dy = 150, streak = Math.min(220, t * 900 * 12); x.save(); x.filter = `brightness(${bright})`; const n = Math.max(1, Math.min(24, Math.round(streak / 8))); x.globalAlpha = 1 / Math.sqrt(n); for (let k = 0; k < n; k++) x.drawImage(dr, dx + k * streak / n, dy, dw, dh); x.restore(); }
      const amt = Math.max(0, Math.log2(iso / 100)) / 6; if (amt > 0) { const id = nx.createImageData(240, 135); for (let k = 0; k < id.data.length; k += 4) { const v = Math.random() * 255; id.data[k] = id.data[k + 1] = id.data[k + 2] = v; id.data[k + 3] = 255 * amt * .32; } nx.putImageData(id, 0, 0); x.save(); x.imageSmoothingEnabled = false; x.globalCompositeOperation = 'overlay'; x.drawImage(noise, 0, 0, W, H); x.restore(); }
      const G = [[N <= 2.8, 'Arka plan bulanık (f/2.8 veya daha geniş)'], [t <= 1 / 500, 'Dron net (1/500 sn veya daha kısa)'], [Math.abs(d) <= .5, 'Doğru pozlama (±0,5 EV)']];
      $('#eg').innerHTML = G.map(([o, l]) => `<li class="${o ? 'ok' : ''}"><span class="b">${o ? '✓' : ''}</span><span>${l}</span></li>`).join('');
      if (G.every(g => g[0]) && !won) { won = true; gain(50, 'pozlama hedefi'); badge('poz', 'Doğru pozlama'); }
    };
    [a, s, i].forEach(e => e.oninput = draw); draw();
  };
  SIMS.shutter = box => {
    const FPS = [24, 25, 30, 50, 60], SH = [1 / 30, 1 / 48, 1 / 50, 1 / 60, 1 / 100, 1 / 120, 1 / 250, 1 / 1000];
    box.innerHTML = `<div class="sim"><div><canvas id="sc" width="960" height="540" role="img" aria-label="Dönen pervanede hareket bulanıklığı önizlemesi"></canvas><p class="meta" style="margin-top:8px">Pervane dakikada sabit hızla dönüyor · her karede örtücünün açık kaldığı süre kadar iz bırakır</p></div>
      <div class="ctrls"><div class="ctl"><div class="r"><label for="sf">Kare hızı</label><output id="sfo"></output></div><input id="sf" type="range" min="0" max="4" step="1" value="1"></div>
      <div class="ctl"><div class="r"><label for="ss">Enstantane</label><output id="sso"></output></div><input id="ss" type="range" min="0" max="7" step="1" value="6"></div>
      <div class="ctl"><div class="r"><span style="font-weight:600;font-size:15px">Örtücü açısı</span><output id="sa"></output></div><small id="sw"></small></div>
      <div class="goal"><b>Hedef</b><span style="font-size:15px">Doğal görünen hareket için açıyı 180°'ye getir.</span><ul class="chk" id="sg"></ul></div></div></div>`;
    const cv = $('#sc'), x = cv.getContext('2d'); const f = $('#sf'), s = $('#ss'); let won = false, raf, t0 = performance.now();
    const loop = now => { if (!cv.isConnected) return; const fps = FPS[+f.value], sh = SH[+s.value], ang = Math.min(360, sh * fps * 360);
      $('#sfo').textContent = fps + ' fps'; $('#sso').textContent = fmtS(sh); $('#sa').textContent = Math.round(ang) + '°';
      $('#sw').textContent = ang > 200 ? 'Fazla bulanık: hareket yağ gibi akar, detay kaybolur.' : ang < 120 ? 'Kesik kesik: hareket sert ve titrek görünür.' : 'Doğal: göz alışık olduğu bulanıklığı görür.';
      const tf = Math.floor((now - t0) / 1000 * fps) / fps, rps = 1.7, rot0 = tf * rps * 6.283, sweep = sh * rps * 6.283;
      const dark = getComputedStyle(document.documentElement).getPropertyValue('--surface').trim();
      x.fillStyle = dark || '#FFFFFF'; x.fillRect(0, 0, 960, 540); const tx = getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#171717';
      x.save(); x.translate(480, 270); const n = Math.max(1, Math.min(40, Math.round(sweep / .04)));
      for (let k = 0; k < n; k++) { const r = rot0 + sweep * k / n; x.globalAlpha = 1 / Math.sqrt(n) * .9 + .05; for (let b = 0; b < 3; b++) { x.save(); x.rotate(r + b * 2.094); x.fillStyle = tx; x.fillRect(0, -14, 210, 28); x.restore(); } }
      x.globalAlpha = 1; x.fillStyle = '#2563EB'; x.beginPath(); x.arc(0, 0, 26, 0, 6.283); x.fill(); x.restore();
      const G = [[Math.abs(ang - 180) <= 20, 'Örtücü açısı 160°–200° arasında'], [fps >= 24 && fps <= 30, 'Sinematik kare hızı (24–30 fps)']];
      $('#sg').innerHTML = G.map(([o, l]) => `<li class="${o ? 'ok' : ''}"><span class="b">${o ? '✓' : ''}</span><span>${l}</span></li>`).join('');
      if (G.every(g => g[0]) && !won) { won = true; gain(50, '180° kuralı'); badge('180', '180°'); }
      raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
  };
  SIMS.drone = box => {
    box.innerHTML = `<div class="sim"><div style="display:flex;flex-direction:column;gap:16px"><div class="c-std"><div class="b"><span class="cat">Uçuş planı · eğitim amaçlı yaklaşık hesap</span><h3 id="dv">—</h3><div class="plan" id="dp"></div><div class="chips meta" style="gap:16px"><span>■ Gidiş</span><span style="color:var(--blue)">■ Çekim</span><span>■ Dönüş</span><span style="color:var(--orange)">■ Yedek</span></div><div class="verdict" id="dverd"></div></div></div>
      <div class="goal"><b>Uçuş öncesi kontrol</b><ul class="chk" id="dck">${['Uçuşa izinli bölge (harita kontrolü)', 'Pervaneler ve korumalar sağlam', 'Batarya tam takılı, sıcaklık normal', 'Pusula ve GPS kalibre', 'Eve dönüş yüksekliği engellerin üstünde'].map((c, i) => `<li><button type="button" class="b" data-i="${i}" aria-label="İşaretle"></button><span>${c}</span></li>`).join('')}</ul></div></div>
      <div class="ctrls"><div class="ctl"><div class="r"><label for="db">Batarya</label><output id="dbo"></output></div><input id="db" type="range" min="20" max="100" step="5" value="100"></div>
      <div class="ctl"><div class="r"><label for="dw">Rüzgâr</label><output id="dwo"></output></div><input id="dw" type="range" min="0" max="12" step="1" value="4"><small>Rüzgâr uçuş süresini kısaltır; küçük dronlar 8 m/sn üstünde zorlanır.</small></div>
      <div class="ctl"><div class="r"><label for="dd">Çekim noktasına uzaklık</label><output id="ddo"></output></div><input id="dd" type="range" min="50" max="1000" step="50" value="300"></div>
      <div class="ctl"><div class="r"><label for="dc">Planlanan çekim</label><output id="dco"></output></div><input id="dc" type="range" min="1" max="15" step="1" value="6"></div>
      <p class="meta">Örnek: azami ~18 dk uçuş süreli küçük dron · gerçek değerler modele, sıcaklığa ve kullanıma göre değişir</p></div></div>`;
    const b = $('#db'), w = $('#dw'), dd = $('#dd'), dc = $('#dc'); const ck = new Set(); let won = false;
    const draw = () => { const bat = +b.value, wind = +w.value, dist = +dd.value, shoot = +dc.value;
      $('#dbo').textContent = '%' + bat; $('#dwo').textContent = wind + ' m/sn'; $('#ddo').textContent = dist + ' m'; $('#dco').textContent = shoot + ' dk';
      const avail = 18 * bat / 100 * Math.max(.4, 1 - wind * .045), speed = Math.max(2, 8 - wind * .4), leg = dist / speed / 60, back = leg * (1 + wind * .05), res = avail * .25, need = leg + shoot + back + res;
      const tot = Math.max(avail, need); const seg = (v, c, l) => `<span class="${c}" style="width:${v / tot * 100}%" title="${l}">${v >= tot * .08 ? v.toFixed(1).replace('.', ',') + ' dk' : ''}</span>`;
      $('#dp').innerHTML = seg(leg, 'g', 'Gidiş') + seg(shoot, 'c', 'Çekim') + seg(back, 'd', 'Dönüş') + seg(res, 'y', 'Yedek');
      const ok = need <= avail && wind <= 8; $('#dv').textContent = `Kullanılabilir ${avail.toFixed(1).replace('.', ',')} dk · gereken ${need.toFixed(1).replace('.', ',')} dk`;
      const v = $('#dverd'); v.className = 'verdict ' + (ok ? 'ok' : 'no'); v.textContent = ok ? 'Plan güvenli: dönüş için yedek kalıyor.' : wind > 8 ? 'Rüzgâr fazla: uçuşu ertele ya da daha ağır bir dron seç.' : 'Süre yetmiyor: çekimi kısalt ya da yaklaş.';
      if (ok && ck.size === 5 && !won) { won = true; gain(50, 'güvenli uçuş planı'); badge('pilot', 'Temkinli pilot'); } };
    [b, w, dd, dc].forEach(e => e.oninput = draw);
    $$('#dck .b').forEach(x => x.onclick = () => { const i = x.dataset.i; if (ck.has(i)) ck.delete(i); else ck.add(i); x.textContent = ck.has(i) ? '✓' : ''; x.parentElement.classList.toggle('ok', ck.has(i)); draw(); });
    draw();
  };

  UP.kulup = () => { shell(); const h = (location.hash || '').slice(1); go(VIEWS.some(v => v[0] === h) ? h : 'ana'); };
})();
