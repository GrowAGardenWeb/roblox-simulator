/* Casillero funcional: lista de personajes con video 3D y botón para equiparlos (se ven en el casillero y en el lobby). */
(function () {
  const L = document.querySelector('.screen[data-screen="locker"]'); if (!L) return;
  const KEY = 'fn_equip';
  const norm = (x) => String(x || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
  const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const items = () => (window.ITEMS_ALL ? window.ITEMS_ALL() : {});

  // fnChar: si hay un personaje equipado desde el casillero manda sobre el del panel MOD
  { let v = window.fnChar; Object.defineProperty(window, 'fnChar', { configurable: true, get() { return window.__equipKey || v; }, set(x) { v = x; } }); }
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
  #lkpan{position:absolute;left:497px;top:278px;width:650px;height:520px;z-index:7;display:none;flex-direction:column;background:rgba(6,22,92,.94);border-radius:14px;box-shadow:0 10px 40px rgba(0,0,30,.5);color:#fff;font-family:Montserrat,system-ui;overflow:hidden}
  #lkpan.on{display:flex;animation:fxPop .3s cubic-bezier(.2,1.2,.4,1) both}
  #lkpan .h{display:flex;align-items:center;gap:14px;padding:14px 18px 8px}
  #lkpan .h b{font:italic 400 30px 'Archivo Black'}#lkpan .h .n{font:700 18px Montserrat;color:#9fd2ff;flex:1}
  #lkpan .h .x{padding:8px 16px;border-radius:8px;background:#a9b9f6;color:#0a1a55;font:800 16px Montserrat;cursor:pointer}
  #lkpan input{margin:0 18px 10px;padding:10px 14px;border-radius:8px;border:0;background:#112a78;color:#fff;font:700 18px Montserrat;outline:0}
  #lkpan .lkg{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;display:grid;grid-template-columns:repeat(5,1fr);grid-auto-rows:112px;gap:10px;padding:0 18px 18px;align-content:start}
  #lkpan .lkc{position:relative;width:100%;height:112px;border-radius:8px;overflow:hidden;background:#2f6ee0;cursor:pointer}
  #lkpan .lkc img{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;object-position:center top;display:block}
  #lkpan .lkc.cur{box-shadow:0 0 0 4px #fff}
  #lkpan .lkc span{position:absolute;left:0;right:0;bottom:0;padding:12px 4px 3px;font:700 12px Montserrat;text-align:center;background:linear-gradient(transparent,#000b);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #lkpan .lkc i{position:absolute;right:4px;top:4px;padding:1px 6px;border-radius:5px;background:#ffe45c;color:#241a00;font:900 10px Montserrat;font-style:normal}
  #lkpan .none{grid-column:1/-1;padding:30px 10px;text-align:center;font:600 16px Montserrat;color:#bcd2ff}
  #lkcnt{position:absolute;left:527px;top:254px;font:800 17px Montserrat;color:#bfe0ff;z-index:3;display:none}
  `;
  document.head.appendChild(st);

  const pan = document.createElement('div'); pan.id = 'lkpan';
  pan.innerHTML = '<div class="h"><b>OUTFITS</b><span class="n" id="lkn"></span><div class="x" id="lkx">CLOSE</div></div><input type="search" id="lkq" placeholder="Search outfit…" autocomplete="off" autocapitalize="off" spellcheck="false"><div class="lkg" id="lkg"></div>';
  L.appendChild(pan);
  const cnt = document.createElement('div'); cnt.id = 'lkcnt'; L.appendChild(cnt);
  const grid = pan.querySelector('#lkg'), q = pan.querySelector('#lkq'), nEl = pan.querySelector('#lkn');

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
  const more = () => {
    const end = Math.min(view.length, shown + 80), frag = document.createDocumentFragment();
    for (; shown < end; shown++) {
      const it = view[shown], d = document.createElement('div'); d.className = 'lkc' + (window.__equipKey === it.key || (!window.__equipKey && it.key === (window.fnChar)) ? ' cur' : '');
      d.innerHTML = '<img loading="lazy" decoding="async" alt=""><span></span><i>3D</i>'; d.firstChild.src = it.icon; d.children[1].textContent = it.name;
      d.onclick = () => equip(it, d); frag.appendChild(d);
    }
    grid.appendChild(frag);
  };
  const render = () => {
    const t = q.value.trim().toLowerCase(); view = (list || []).filter((x) => !t || x.name.toLowerCase().includes(t)); shown = 0; grid.innerHTML = ''; grid.scrollTop = 0;
    nEl.textContent = fmt(view.length) + ' 3D OUTFITS';
    if (!view.length) { const n = document.createElement('div'); n.className = 'none'; n.textContent = t ? 'No 3D outfit found' : 'No 3D videos yet'; grid.appendChild(n); } else more();
  };
  grid.addEventListener('scroll', () => { if (shown < view.length && grid.scrollTop + grid.clientHeight > grid.scrollHeight - 300) more(); }, { passive: true });
  q.addEventListener('input', render);

  function equip(it, d) {
    if (it.url) { register({ key: it.key, name: it.name, icon: it.icon, full: it.full, url: it.url }); const I = items(); if (I[it.key]) I[it.key].url = it.url; }
    window.__equipKey = it.key;
    try { localStorage.setItem(KEY, JSON.stringify({ key: it.key, name: it.name, icon: it.icon, full: it.full || null, url: it.url || null })); } catch (e) {}
    grid.querySelectorAll('.cur').forEach((x) => x.classList.remove('cur')); d.classList.add('cur');
    if (window.itemVid) { window.itemVid(false); window.itemVid(true); } if (window.lockThumb) window.lockThumb();
    window.SFX && SFX.play('click');
  }
  const open = async () => { pan.classList.add('on'); nEl.textContent = 'Loading…'; await build(); render(); };
  pan.querySelector('#lkx').onclick = () => pan.classList.remove('on');
  const hit = document.createElement('div'); hit.style.cssText = 'position:absolute;left:520px;top:288px;width:122px;height:122px;z-index:6;cursor:pointer'; hit.onclick = open; L.appendChild(hit);

  const updCnt = async () => { if (!owned) { const o = await fetchJ('data/outfits.json'); owned = (o || []).length; } cnt.textContent = fmt(owned) + ' OUTFITS OWNED'; cnt.style.display = owned ? 'block' : 'none'; };
  new MutationObserver(() => { if (L.hidden) { pan.classList.remove('on'); return; } updCnt(); }).observe(L, { attributes: true, attributeFilter: ['hidden'] });
})();
