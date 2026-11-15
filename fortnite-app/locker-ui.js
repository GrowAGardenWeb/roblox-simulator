/* Casillero funcional: lista de personajes con video 3D y botón para equiparlos (se ven en el casillero y en el lobby). */
(function () {
  const L = document.querySelector('.screen[data-screen="locker"]'); if (!L) return;
  const KEY = 'fn_equip';
  const norm = (x) => String(x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
  const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const items = () => (window.ITEMS_ALL ? window.ITEMS_ALL() : {});

  // fnChar: si hay un personaje equipado desde el casillero manda sobre el del panel MOD
  { let v = window.fnChar; Object.defineProperty(window, 'fnChar', { configurable: true, get() { return window.__previewKey || window.__equipKey || v; }, set(x) { v = x; } }); window.__realChar = () => window.__equipKey || v; }
  // el botón APPLY del panel MOD vuelve a mandar su personaje
  const mpa = document.getElementById('mpa'); if (mpa) mpa.addEventListener('click', () => { window.__equipKey = null; try { localStorage.removeItem(KEY); } catch (e) {} }, true);

  const register = (o) => { // o: {key,name,icon,full,url}
    const I = items(); if (I[o.key]) return;
    const t = String(o.name).toUpperCase();
    I[o.key] = { pl: [320, 600, 1.28], th: 'dyn', n: 1, url: o.url, src: '', title: t, title2: t, desc: '', price: '0', tag: '', sub: 'OUTFIT', dyn: { image: o.full || o.icon, thumbs: [o.icon], feat: [o.full || o.icon], jam: false } };
  };
  let eq = null; try { eq = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
  const boot = () => { if (!eq) return; if (eq.url) register(eq); if (items()[eq.key]) window.__equipKey = eq.key; };
  boot(); setTimeout(boot, 500);

  // la miniatura de "lockThumb" sabe de las imágenes de los personajes nuevos
  const wrapThumb = () => { const o = window.lockThumb; if (!o || o.__w) return; const f = function () { o(); const it = items()[window.fnChar]; if (it && it.dyn) { const box = document.getElementById('lkth'); if (box && box.firstChild) { box.firstChild.src = it.dyn.thumbs[0]; box.style.display = 'block'; } } }; f.__w = 1; window.lockThumb = f; };
  wrapThumb(); setTimeout(wrapThumb, 800);

  const st = document.createElement('style');
  st.textContent = `
  body.lkopen #nav,body.lkopen #lkt1,body.lkopen #lkt2,body.lkopen #lkth,body.lkopen #lkcnt{display:none!important}
  #lkbg{position:absolute;inset:0;display:none;background:radial-gradient(ellipse at 30% 40%,#0b6ad6,#0a4cb8 55%,#083a9c)}
  body.lkopen #lkbg{display:block}
  body.lkopen #itemcv,body.lkopen #itemvid.nat{left:40px!important}
  #lkout{position:absolute;inset:0;display:none;color:#fff;font-family:Montserrat,system-ui}
  body.lkopen #lkout{display:block;animation:fxFade .25s both}
  #lkout .tt{position:absolute;left:1115px;top:34px;font:italic 400 40px 'Archivo Black'}
  #lkout .tb{position:absolute;top:123px;height:62px;border-radius:8px;display:flex;align-items:center;justify-content:center;font:800 24px Montserrat;cursor:pointer}
  #lkout .ar{width:62px;background:#3b78d8;color:#0a1a55}
  #lkout .tab{padding:0 16px;color:#fff;white-space:nowrap}#lkout .tab.on{background:#bfe3ff;color:#0a1a55}
  #lkout .tab i{position:absolute;right:-6px;top:2px;width:11px;height:11px;border-radius:50%;background:#ffe92e}
  #lkout .sr{position:absolute;left:1105px;top:200px;width:280px;height:53px;border-radius:8px;background:#2f78dc;display:flex;align-items:center;padding:0 14px;gap:12px}
  #lkout .sr input{flex:1;min-width:0;background:none;border:0;outline:0;color:#fff;font:600 22px Montserrat}
  #lkout .sr input::placeholder{color:#d8e8ff}
  #lkout .sq{position:absolute;top:200px;width:58px;height:53px;border-radius:8px;background:#2f78dc;display:flex;align-items:center;justify-content:center;font:900 22px Montserrat}
  #lkout .sort{position:absolute;right:360px;top:203px;text-align:right;font:600 19px/1.15 Montserrat;color:#eaf3ff;white-space:nowrap}
  #lkout .al{position:absolute;left:1112px;top:268px;font:600 19px Montserrat;color:#fff}
  #lkout .al::after{content:'';position:absolute;left:62px;right:-640px;top:12px;height:1px;background:rgba(255,255,255,.35)}
  #lkout .gridw{position:absolute;left:1100px;top:296px;width:720px;height:520px;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;display:grid;grid-template-columns:repeat(6,100px);grid-auto-rows:124px;gap:21px 13px;padding:6px 8px 20px;align-content:start}
  #lkout .gridw::-webkit-scrollbar{display:none}
  #lkout .tl{position:relative;width:100px;height:124px;border-radius:9px;overflow:hidden;background:#4aa6f2;cursor:pointer;box-sizing:border-box}
  #lkout .tl img{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;object-position:center top;display:block}
  #lkout .tl.sel{box-shadow:0 0 0 4px #ffe92e,0 0 0 7px rgba(255,255,255,.55);z-index:2}
  #lkout .tl .eq{position:absolute;right:6px;bottom:5px;width:20px;height:20px;border-radius:50%;background:#33d65a;color:#06361a;font:900 14px/20px Montserrat;text-align:center}
  #lkout .tl.ic{display:flex;align-items:center;justify-content:center;font:900 50px Montserrat;color:#fff}
  #lkout .tl.ic svg{width:64px;height:64px;fill:#fff}
  #lkout .tl .pl{position:absolute;right:7px;bottom:5px;font:900 20px/20px Montserrat;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.4)}
  #lkout .nm1{position:absolute;left:95px;top:678px;font:italic 400 21px 'Archivo Black';color:#d7e6ff}
  #lkout .nm2{position:absolute;left:90px;top:704px;font:italic 400 38px 'Archivo Black';white-space:nowrap;max-width:700px}
  #lkout .ds{position:absolute;left:90px;top:752px;width:430px;font:500 21px/1.3 Montserrat;color:#fff}
  #lkout .bb{position:absolute;top:826px;height:66px;border-radius:9px;background:#3f86e6;display:flex;align-items:center;justify-content:center;font:italic 400 28px 'Archivo Black';color:#0a1a55;cursor:pointer}
  #lkout .bb.off{background:#2f6fd0;color:#5c86cf;pointer-events:none;opacity:.8}
  #lkout .mic{position:absolute;left:1622px;top:826px;width:66px;height:66px;border-radius:9px;background:#3f86e6}
  #lkout .mic::before{content:'';position:absolute;left:25px;top:14px;width:16px;height:26px;border:3px solid #0a1a55;border-radius:9px}
  #lkout .mic::after{content:'';position:absolute;left:32px;top:46px;width:3px;height:8px;background:#0a1a55}
  #lkcnt{position:absolute;left:527px;top:254px;font:800 17px Montserrat;color:#bfe0ff;z-index:3;display:none}
  `;
  document.head.appendChild(st);

  const bg = document.createElement('div'); bg.id = 'lkbg';
  const fullImg = L.querySelector('.full'); if (fullImg) fullImg.after(bg); else L.insertBefore(bg, L.firstChild);
  const out = document.createElement('div'); out.id = 'lkout';
  out.innerHTML = '<div class="tt">CHARACTER</div>'
    + '<div class="tb ar" style="left:1107px">&#8249;</div><div class="tb tab on" style="left:1185px;width:126px">OUTFIT</div><div class="tb tab" style="left:1338px;width:170px">BACK BLING<i></i></div><div class="tb tab" style="left:1543px;width:120px">PICKAXE<i></i></div><div class="tb ar" style="left:1730px">&#8250;</div>'
    + '<div class="sr"><svg width="22" height="22" viewBox="0 0 24 24"><circle cx="10" cy="10" r="6.5" fill="none" stroke="#fff" stroke-width="3"/><path d="M15 15l6 6" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg><input type="search" id="lkq" placeholder="Search" autocomplete="off" autocapitalize="off" spellcheck="false"></div>'
    + '<div class="sq" style="left:1400px">&#9825;</div><div class="sort">Sort By:<br>Latest Acquired</div><div class="sq" style="left:1652px">&#8645;</div><div class="sq" style="left:1722px;width:73px">&#8801; <span style="margin-left:6px;background:#ffe92e;color:#1a1a00;border-radius:50%;width:24px;height:24px;font:900 16px/24px Montserrat;text-align:center">1</span></div>'
    + '<div class="al" id="lkal">All (0)</div><div class="gridw" id="lkg"></div>'
    + '<div class="nm1">OUTFIT - FORTNITE STYLE</div><div class="nm2" id="lkn2"></div><div class="ds" id="lkds"></div>'
    + '<div class="bb off" id="lkeq" style="left:1143px;width:134px">EQUIP</div><div class="bb off" style="left:1297px;width:112px">EDIT</div><div class="bb" style="left:1431px;width:168px">OPTIONS</div><div class="mic"></div><div class="bb" id="lkbk" style="left:1710px;width:128px">BACK</div>';
  L.appendChild(out);
  const cnt = document.createElement('div'); cnt.id = 'lkcnt'; L.appendChild(cnt);
  const grid = out.querySelector('#lkg'), q = out.querySelector('#lkq'), alEl = out.querySelector('#lkal');
  const n2 = out.querySelector('#lkn2'), ds = out.querySelector('#lkds'), eqb = out.querySelector('#lkeq');

  let owned = 0, list = null, view = [], shown = 0;
  const fetchJ = (u) => fetch(u + '?' + Date.now()).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const build = async () => {
    if (list) return list;
    const [outfits, vids] = await Promise.all([fetchJ('data/outfits.json'), fetchJ('data/videos.json')]);
    owned = (outfits || []).length;
    let local = {}; try { local = JSON.parse(localStorage.getItem('fnVideos') || '{}'); } catch (e) {}
    const all = Object.assign({}, vids || {}, local), byN = {}; Object.keys(all).forEach((k) => { byN[norm(k)] = [].concat(all[k])[0]; });
    list = [];
    // 1) personajes con video que ya estaban en la app (los de siempre)
    const I = items(), seen = new Set();
    ['luffy', 'ball', 'usopp', 'nami', 'sanji', 'zoro', 'flacko', 'rocky', 'tung', 'pumpkin', 'sally', 'jack', 'kawaii'].forEach((k) => {
      const it = I[k]; if (!it) return; const kk = it.th + (it.th === 't' ? 2 : 0);
      list.push({ key: k, name: it.title.replace(/\b(\w)(\w*)/g, (m, a, b) => a + b.toLowerCase()), icon: 'assets/items/t_' + kk + '.webp', legacy: true }); seen.add(norm(it.title));
    });
    // 2) el resto de personajes de Fortnite que tengan video 3D guardado
    (outfits || []).forEach((o) => {
      const u = byN[norm(o.name)] || byN[norm(o.nameEs)]; if (!u || seen.has(norm(o.name))) return; seen.add(norm(o.name));
      list.push({ key: 'lk_' + o.id, name: o.name, icon: o.icon, full: o.full, url: u });
    });
    list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  };
  let preview = null;
  const SHIRT = '<svg viewBox="0 0 24 24"><path d="M4 7l5-3c.6 1.4 1.7 2 3 2s2.4-.6 3-2l5 3-2 4-2-1v10H8V10l-2 1z"/></svg>';
  const SHUF = '<svg viewBox="0 0 24 24"><path d="M3 7h4c2 0 3 1 4 3l2 4c1 2 2 3 4 3h3v-2l4 3.5-4 3.5v-2h-3c-3 0-4.5-1.5-5.5-3.7L9 10c-.6-1.3-1.2-1.8-2-1.8H3zM3 16h4c1 0 1.7-.4 2.3-1.4l.9-1.6.9 1.9c-.9 1.7-2 2.9-4.1 2.9H3zM17 4.5V3l4 3.5-4 3.5V8.5h-3c-1 0-1.800.5-2.400 1.400l-.9-2C11.400 6.300 12.600 5.500 14 5.500z"/></svg>';
  const real = () => (window.__realChar ? window.__realChar() : window.__equipKey);
  const cur = () => (preview ? preview.key : real());
  const info = (it) => {
    n2.textContent = it ? it.name.toUpperCase() : '';
    const t = n2; t.style.fontSize = '38px'; { const w = t.getBoundingClientRect().width / (document.getElementById('stage').getBoundingClientRect().width / 2000); if (w > 700) t.style.fontSize = (38 * 700 / w) + 'px'; }
    ds.innerHTML = it ? ((it.desc ? it.desc + '<br>' : '') + (it.intro ? it.intro : '')) : '';
    const equipped = it && real() === it.key; eqb.classList.toggle('off', !it || equipped);
  };
  const show = (it) => {
    preview = it; if (it.url) { register({ key: it.key, name: it.name, icon: it.icon, full: it.full, url: it.url }); const I = items(); if (I[it.key]) I[it.key].url = it.url; }
    window.__previewKey = it.key; info(it);
    grid.querySelectorAll('.tl.sel').forEach((x) => x.classList.remove('sel')); const t = grid.querySelector('[data-k="' + it.key + '"]'); if (t) t.classList.add('sel');
    if (window.itemVid) { window.itemVid(false); window.itemVid(true); }
  };
  const mkTile = (it) => {
    const d = document.createElement('div'); d.className = 'tl' + (cur() === it.key ? ' sel' : ''); d.dataset.k = it.key;
    d.innerHTML = '<img loading="lazy" decoding="async" alt="">' + (real() === it.key ? '<b class="eq">&#10003;</b>' : ''); d.firstChild.src = it.icon;
    d.onclick = () => { show(it); window.SFX && SFX.play('click'); };
    return d;
  };
  const more = () => {
    const end = Math.min(view.length, shown + 80), frag = document.createDocumentFragment();
    for (; shown < end; shown++) frag.appendChild(mkTile(view[shown]));
    grid.appendChild(frag);
  };
  const render = () => {
    const t = q.value.trim().toLowerCase(); view = (list || []).filter((x) => !t || x.name.toLowerCase().includes(t)); shown = 0; grid.innerHTML = ''; grid.scrollTop = 0;
    const a = document.createElement('div'); a.className = 'tl ic'; a.innerHTML = SHIRT + '<span class="pl">+</span>'; grid.appendChild(a);
    const r = document.createElement('div'); r.className = 'tl ic'; r.innerHTML = SHUF; r.onclick = () => { if (view.length) { const it = view[Math.floor(Math.random() * view.length)]; show(it); const tt = grid.querySelector('[data-k="' + it.key + '"]'); if (tt) tt.scrollIntoView({ block: 'nearest' }); window.SFX && SFX.play('click'); } }; grid.appendChild(r);
    alEl.textContent = 'All (' + view.length + ')'; more();
  };
  grid.addEventListener('scroll', () => { if (shown < view.length && grid.scrollTop + grid.clientHeight > grid.scrollHeight - 300) more(); }, { passive: true });
  q.addEventListener('input', render);

  function equip(it) {
    if (it.url) { register({ key: it.key, name: it.name, icon: it.icon, full: it.full, url: it.url }); const I = items(); if (I[it.key]) I[it.key].url = it.url; }
    window.__equipKey = it.key; preview = it; window.__previewKey = null;
    try { localStorage.setItem(KEY, JSON.stringify({ key: it.key, name: it.name, icon: it.icon, full: it.full || null, url: it.url || null })); } catch (e) {}
    window.SFX && SFX.play('click'); render(); info(it);
    if (window.itemVid) { window.itemVid(false); window.itemVid(true); }
  }
  eqb.onclick = () => { if (preview && !eqb.classList.contains('off')) equip(preview); };
  const closeOut = () => { document.body.classList.remove('lkopen'); preview = null; window.__previewKey = null; if (window.itemVid) { window.itemVid(false); window.itemVid(true); } if (window.lockThumb) window.lockThumb(); };
  out.querySelector('#lkbk').onclick = closeOut;
  const open = async () => {
    await build(); document.body.classList.add('lkopen'); q.value = '';
    const k = real(); preview = (list || []).find((x) => x.key === k) || null; render(); info(preview);
    if (window.itemVid) { window.itemVid(false); window.itemVid(true); }
  };
  const hit = document.createElement('div'); hit.style.cssText = 'position:absolute;left:520px;top:288px;width:122px;height:122px;z-index:6;cursor:pointer'; hit.onclick = open; L.appendChild(hit);

  const updCnt = async () => { if (!owned) { const o = await fetchJ('data/outfits.json'); owned = (o || []).length; } cnt.textContent = fmt(owned) + ' OUTFITS OWNED'; cnt.style.display = owned ? 'block' : 'none'; };
  new MutationObserver(() => { if (L.hidden) { document.body.classList.remove('lkopen'); window.__previewKey = null; return; } updCnt(); }).observe(L, { attributes: true, attributeFilter: ['hidden'] });
})();
