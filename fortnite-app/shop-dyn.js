/* Tienda dinámica: reemplaza las imágenes fijas de la tienda por tarjetas generadas desde data/shop.json
   y las conecta a la ficha de objeto y al flujo de regalo existentes (ITEMS_ALL). Si algo falla, queda la tienda anterior. */
(function () {
  // protección contra cierres repetidos: si la carga anterior no terminó (Safari cerró la página), se carga una tienda ligera
  // nivel 0 = tienda completa (siempre). Los modos ahorro (1 y 2) solo se activan a mano con ?lvl=1 o ?lvl=2.
  let lvl = 0;
  try {
    const q = location.search, m = q.match(/[?&]lvl=(\d)/);
    let st = {}; try { st = JSON.parse(localStorage.getItem('fnLvl2') || '{}'); } catch (e) {}
    if (/[?&]full=1/.test(q)) st = {};
    if (m) st = { l: +m[1], t: Date.now() };
    else st = {}; // siempre la tienda completa (la carga progresiva ya cuida la memoria); el modo ahorro solo se activa con ?lvl=1 o ?lvl=2
    if (st.t && Date.now() - st.t > 12 * 3600e3) st = {};
    lvl = st.l || 0;
    localStorage.setItem('fnLvl2', JSON.stringify(st));
    localStorage.setItem('fnBoot', String(Date.now()));
    setTimeout(() => { try { localStorage.removeItem('fnBoot'); } catch (e) {} }, 7000);
    const clean = () => { try { localStorage.removeItem('fnBoot'); } catch (e) {} };
    addEventListener('pagehide', clean); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') clean(); });
  } catch (e) {}
  const light = lvl >= 1;
  const stat = () => { try { const q = (x) => document.querySelectorAll(x).length, m = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB' : ''; return 't' + q('#shoprow .dt') + ' i' + q('#shoprow .di[style*=\"background-image\"]') + (m ? ' ' + m : ''); } catch (e) { return ''; } };
  const step = (x) => { try { let h = []; try { h = JSON.parse(localStorage.getItem('fnHist') || '[]'); } catch (e) {} h.push(x + ' · ' + (document.body && document.body.dataset.screen || '-') + ' · ' + new Date().toISOString().slice(11, 19) + ' · ' + stat()); localStorage.setItem('fnHist', JSON.stringify(h.slice(-9))); localStorage.setItem('fnStep', h[h.length - 1]); } catch (e) {} };
  window.__fnStep = step;
  // el "último paso" ahora anota cada cambio de pantalla y el artículo abierto, para ver exactamente dónde se cierra
  try { new MutationObserver(() => step('pantalla ' + (document.body.dataset.screen || '-') + (window.curItem ? ' · ' + String(window.curItem).slice(0, 22) : ''))).observe(document.documentElement.querySelector('body') || document.documentElement, { attributes: true, attributeFilter: ['data-screen'] }); } catch (e) {}
  try {
    if (/[?&]nodyn=1/.test(location.search)) return;
    // aviso de cierre: se marca "viva" la página y se desmarca solo al salir o pasar a segundo plano; si al abrir sigue marcada, se cerró sola
    const was = localStorage.getItem('fnAlive'); let hist = []; try { hist = JSON.parse(localStorage.getItem('fnHist') || '[]'); } catch (e) {}
    localStorage.setItem('fnAlive', '1'); localStorage.setItem('fnHist', '[]');
    const bye = () => { try { localStorage.removeItem('fnAlive'); } catch (e) {} };
    addEventListener('pagehide', bye); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') bye(); else try { localStorage.setItem('fnAlive', '1'); } catch (e) {} });
    if (was && hist.length) { const bn = document.createElement('div'); bn.innerHTML = '<b>Se cerró la vez pasada.</b> Últimos pasos:<br>' + hist.slice(-7).map((x) => x.replace(/</g, '')).join('<br>') + '<br><i>(toca para ocultar)</i>'; bn.style.cssText = 'position:fixed;left:8px;right:8px;bottom:8px;z-index:99999;background:#400;color:#fff;font:11px/1.35 system-ui;padding:8px 10px;border-radius:8px;max-height:45vh;overflow:auto'; bn.onclick = () => bn.remove(); addEventListener('DOMContentLoaded', () => document.body.appendChild(bn)); if (document.body) document.body.appendChild(bn); }

  } catch (e) {}
  step('inicio');
  window.__shopLight = lvl; if (light) document.documentElement.classList.add('shoplite');

  const BAD = (e) => !e.image || !String(e.name || '').trim() || /placeholder|^\[VIRTUAL\]|\bTBD\b/i.test(e.name || ''); // se juzga por el NOMBRE visible; el campo interno devName puede traer "TBD" en artículos reales
  const hex = (c) => (c ? '#' + String(c).slice(0, 6) : null);
  const mix = (h, k) => { const n = parseInt(h.slice(1), 16), f = (x) => Math.max(0, Math.min(255, Math.round(x * k))); return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join(''); };
  const span = (s) => { const m = /Size_(\d+)_x_/.exec(s || ''); return Math.min(4, m ? +m[1] : 1); };
  const css = document.createElement('style');
  css.textContent = `
  #shoprow.dyn{position:relative;width:945px;height:auto;padding-bottom:60px}
  #shoprow.dyn .dsec{font:italic 400 34px 'Archivo Black';color:#fff;text-shadow:0 3px 4px rgba(0,0,40,.35);margin:22px 0 10px;white-space:nowrap}
  #shoprow.dyn .dgrid{display:grid;grid-template-columns:repeat(4,230px);grid-auto-flow:dense;gap:30px 8px}
  #shoprow.dyn .dt{position:relative;height:237px;border-radius:14px;overflow:visible;cursor:pointer;pointer-events:auto;background:linear-gradient(160deg,var(--a,#3a63c4),var(--b,#1b3a8a));box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)}
  #shoprow.dyn .dt .di{opacity:0;transition:opacity .28s ease;position:absolute;inset:-26px -8px 14px -8px;background-position:center bottom;background-size:contain;background-repeat:no-repeat}
  #shoprow.dyn .dt.bundle .di{inset:-24px 0 10px 0;background-size:auto 100%;background-position:center bottom;background-repeat:no-repeat;filter:none}
  #shoprow.dyn .dt.map{background:url(assets/maptex_soft.webp) center/cover,linear-gradient(160deg,var(--a,#3a63c4),var(--b,#1b3a8a));background-blend-mode:overlay}
  #shoprow.dyn .dt.solid{clip-path:inset(0 round 14px)}
  #shoprow.dyn .dt.dev{height:262px}
  #shoprow.dyn .dt .ownlbl{position:absolute;left:12px;bottom:10px;font:800 14px Montserrat;color:#5cff7a;letter-spacing:.03em;text-shadow:0 1px 3px rgba(0,0,0,.5)}
  #shoprow.dyn .dt.bundle.wide{height:262px;margin-bottom:34px}
  html.shoplite #shoprow.dyn .dt{animation:none!important}
  #shoprow.dyn .dt::before{content:'';position:absolute;inset:0;border-radius:14px;background:radial-gradient(ellipse at 50% 38%,rgba(255,255,255,.28),rgba(255,255,255,0) 62%);pointer-events:none}
  #shoprow.dyn .dt.jam .di{inset:10px 10px auto 10px;aspect-ratio:1;border-radius:6px;box-shadow:0 6px 14px rgba(0,0,0,.4);background-size:cover;filter:none}
  #shoprow.dyn .dt .sh{position:absolute;left:0;right:0;bottom:0;height:78px;border-radius:0 0 14px 14px;background:linear-gradient(transparent,rgba(5,15,50,.6))}
  #shoprow.dyn .dt .nm{position:absolute;left:12px;right:10px;bottom:34px;font:700 24px Montserrat,system-ui;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 4px rgba(0,0,30,.45)}
  #shoprow.dyn .dt .pr{position:absolute;left:12px;bottom:8px;display:flex;align-items:center;gap:6px;font:700 21px Montserrat,system-ui;color:#fff}
  #shoprow.dyn .dt .pr i.coin{position:static;width:20px;height:20px;display:inline-block}
  #shoprow.dyn .dt .pr s{font-size:16px;opacity:.7}
  #shoprow.dyn .dt .bd{position:absolute;bottom:62px;left:10px;z-index:2;padding:2px 9px;border-radius:12px;font:800 12px Montserrat;background:#ffd23a;color:#241a00}
  #shoprow.dyn .dt .bd.jam{background:#ff4fa3;color:#fff}
  #shoprow.dyn .dt.bundle{box-shadow:inset 0 0 0 3px rgba(255,210,58,.75)}

  #shoprail{position:absolute;left:214.78px;top:248.26px;width:85.08px;height:639.47px;border-radius:16px;background:rgba(5,22,84,.92);box-shadow:inset 0 0 0 1px rgba(255,255,255,.06);z-index:3;pointer-events:auto}
  #shoprail .dots{position:absolute;left:0;top:14px;width:56px;bottom:14px}
  #shoprail .dots i{position:absolute;left:50%;width:13px;height:13px;margin:-6.5px 0 0 -6.5px;border-radius:50%;background:rgba(150,170,215,.65);transition:all .22s cubic-bezier(.2,1.4,.4,1);cursor:pointer}
  #shoprail .dots i.on{width:21px;height:21px;margin:-10.5px 0 0 -10.5px;background:#e3ebff;box-shadow:0 0 10px rgba(200,220,255,.8)}
  #shoprail .trk{position:absolute;right:16px;top:14px;bottom:14px;width:6px;border-radius:3px;background:rgba(255,255,255,.14)}
  #shoprail .trk b{position:absolute;left:0;right:0;border-radius:3px;background:#c9d6f5;min-height:26px;transition:top .08s linear}
  #shoprow.dyn .dt .pl{position:absolute;right:12px;bottom:12px;width:22px;height:22px;filter:drop-shadow(0 1px 3px rgba(0,0,40,.6))}
  #shoprow.dyn .dt .pl::before,#shoprow.dyn .dt .pl::after{content:'';position:absolute;left:50%;top:50%;background:#fff;border-radius:2px;translate:-50% -50%}
  #shoprow.dyn .dt .pl::before{width:16px;height:4px}#shoprow.dyn .dt .pl::after{width:4px;height:16px}
  #shoprow.dyn .dt .bd.bn{background:#fff;color:#16203f;font:italic 800 12px Montserrat;text-transform:uppercase;box-shadow:0 2px 6px rgba(0,0,0,.25)}
  #shoprow.dyn .dt .bd.nw{background:#fbff2a;color:#1a1a00;box-shadow:0 2px 6px rgba(0,0,0,.3)}
  #shoprow.dyn .dt.outfit .di{inset:-30px -10px 8px -10px;background-size:auto 100%;background-position:center bottom}
  #shoprow.dyn .dt.comp .di{display:none}
  #shoprow.dyn .dt .cmp{position:absolute;inset:0 0 30px 0}
  #shoprow.dyn .dt .cmp .ic{position:absolute;width:56px;height:56px;border-radius:8px;background-size:cover;background-position:center;box-shadow:0 4px 8px rgba(0,0,30,.4)}
  #shoprow.dyn .dt .cmp .hero{position:absolute;right:-6px;top:-6px;bottom:0;width:62%;background-size:auto 112%;background-position:right 30%;background-repeat:no-repeat}
  #shopbg{position:absolute;inset:-70px -300px;pointer-events:none;z-index:0}
  #shopbg i{position:absolute;inset:0;opacity:0;transition:opacity .9s ease}#shopbg i.on{opacity:1}
  #dynart{position:absolute;left:1020px;top:120px;width:820px;height:690px;object-fit:contain;display:none;z-index:1;pointer-events:none}`;
  document.head.appendChild(css);


  // si la tienda dinámica no pudo armarse, se cargan las imágenes de la tienda vieja
  const restoreOld = () => document.querySelectorAll('#shopscroll img[data-lz]').forEach((im) => { im.src = im.dataset.lz; im.removeAttribute('data-lz'); });
  Promise.all([
    fetch('data/shop.json?' + Date.now()).then((r) => { if (!r.ok) throw 0; return r.json(); }),
    fetch('data/videos.json?' + Date.now()).then((r) => (r.ok ? r.json() : {})).catch(() => ({})),
    fetch('data/backgrounds.json?' + Date.now()).then((r) => (r.ok ? r.json() : {})).catch(() => ({})).then((b) => { window.__bgFile = b; }),
    fetch('data/outfits.json?' + Date.now()).then((r) => (r.ok ? r.json() : [])).catch(() => []),
  ]).then(([shop, vids, , outfits]) => { step('datos'); return build(shop, vids, outfits); }).then((ok) => { if (ok === false) restoreOld(); }).catch(() => { restoreOld(); });

  function build(shop, vids, outfits) {
    const old = document.getElementById('shopscroll');
    const ITEMS = window.ITEMS_ALL && window.ITEMS_ALL();
    const norm = (x) => String(x || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '').replace(/^lote(del|de)?(?=.{4})/, '').replace(/bundle$/, '');
    let local = {}; try { local = JSON.parse(localStorage.getItem('fnVideos') || '{}'); } catch (e) {}
    const all = Object.assign({}, vids, local), byNorm = {}; Object.keys(all).forEach((k) => { byNorm[norm(k)] = all[k]; });
    let bgLocal = {}; try { bgLocal = JSON.parse(localStorage.getItem('fnBackgrounds') || '{}'); } catch (e) {}
    const bgAll = Object.assign({}, shop.backgrounds || {}, window.__bgFile || {}, bgLocal), bgNorm = {}; Object.keys(bgAll).forEach((k) => { bgNorm[norm(k)] = bgAll[k]; });
    const bgFor = (name) => (light ? '' : bgNorm[norm(name)] || '');
    const arr = (v) => (v ? [].concat(v) : []);
    const vidsFor = (e) => { const o = [...arr(all[e.offerId]), ...arr(all[e.name]), ...arr(byNorm[norm(e.name)]), ...arr(byNorm[norm(e.nameEs)])]; e.items.forEach((i) => o.push(...arr(byNorm[norm(i.name)]), ...arr(byNorm[norm(i.nameEs)]))); return [...new Set(o)]; };
    const lead = (e) => e.items.find((i) => i.type === 'outfit') || e.items[0];
    const ownOf = (i) => (NOVID ? '' : i ? [...arr(byNorm[norm(i.nameEs)]), ...arr(byNorm[norm(i.name)])][0] || '' : '');
    // video por defecto: el del artículo o el de su pieza principal. Nunca el de una pieza acompañante (mochila, pico...)
    const NOVID = /[?&]novid=1/.test(location.search);
    const vidFor0 = (e) => arr(all[e.offerId])[0] || arr(all[e.name])[0] || arr(byNorm[norm(e.name)])[0] || arr(byNorm[norm(e.nameEs)])[0] || ownOf(lead(e)) || '';
    const vidFor = (e) => (NOVID ? '' : vidFor0(e));
    const E = (shop.entries || []).filter((e) => !BAD(e)).slice(0, lvl >= 2 ? 80 : 1e9);
    if (!old || !ITEMS || !E.length) return false;

    const sc = old.cloneNode(false);                 // sin los oyentes de la tienda anterior (ajuste por filas)
    const shopin = document.createElement('div'); shopin.className = 'shopin'; shopin.style.height = 'auto';
    const pt = document.getElementById('ptcard'); if (pt) shopin.appendChild(pt);
    const row = document.createElement('div'); row.id = 'shoprow'; row.className = 'dyn';
    shopin.appendChild(row); sc.appendChild(shopin); old.replaceWith(sc);

    const groups = new Map();
    for (const e of E) { const k = e.sectionId || e.section || '-'; if (!groups.has(k)) groups.set(k, { name: e.section || 'DESTACADOS', idx: e.sectionIndex ?? 999, items: [] }); groups.get(k).items.push(e); }
    // sección DEVELOPER: Pirate Token (si está activo en el panel) + los 3 Solid Gold; siempre "OWNED"
    // la sección DEVELOPER (Pirate Token + skins Solid Gold) va unida al interruptor PIRATE TOKEN del panel
    let devTok = null; const ptOn = (() => { try { return JSON.parse(localStorage.getItem('fn_mod') || '{}').pt === '1'; } catch (e) { return false; } })(), devOn = ptOn;
    if (devOn) {
      const gold = { color1: 'f2c230ff', color2: 'e0a31cff', color3: 'f8d24cff' }, mkE = (o) => Object.assign({ order: -1, kind: 'item', info: '', tileSize: 'Size_2_x_1', sortPriority: 0, regularPrice: 0, finalPrice: 0, giftable: true, inDate: null, banner: null, tracks: [], images: [], display: [], colors: gold, sectionId: '__dev', section: 'DEVELOPER', sectionIndex: -1, dev: true }, o);
      const dev = [mkE({ offerId: 'dev_pirate', devKey: 'pirate', name: 'Pirate Token', nameEs: null, image: 'assets/pirate_token.webp', items: [{ id: 'pirate', name: 'Pirate Token', type: 'currency', icon: 'assets/pirate_token.webp', featured: null }], sortPriority: 100 })];
      [['Solid Gold Rugahand', 'Solid Gold A$AP Rocky'], ['Solid Gold Lil Uzi Vert', 'Solid Gold Lil Uzi Vert'], ['Solid Gold Miku', 'Solid Gold Miku']].forEach(([src, label], i) => {
        const o = (outfits || []).find((x) => x.name === src); if (!o) return;
        dev.push(mkE({ offerId: 'dev_' + o.id, name: label, nameEs: o.nameEs || null, info: o.desc || '', image: o.full || o.icon, items: [{ id: o.id, name: label, nameEs: o.nameEs || null, type: 'outfit', icon: o.icon, featured: o.full || null }], sortPriority: 99 - i }));
      });
      groups.set('__dev', { name: 'DEVELOPER', idx: -1, items: dev });
    }
    // secciones fijadas arriba (debajo de DEVELOPER), en este orden
    const PIN = [/naruto/i];
    for (const g of groups.values()) { const p = PIN.findIndex((r) => r.test(g.name || '')); if (p >= 0) g.idx = -0.9 + p * 0.01; }
    const secs = [...groups.values()].sort((a, b) => a.idx - b.idx);
    // Imágenes: bajan de a poco (máx. 4 a la vez), se reducen a un tamaño ligero y se quedan cargadas (no se borran ni se vuelven a crear).
    // En bundles además se mide el área visible de la imagen (sin márgenes transparentes) para encajarla en la casilla.
    const jobs = []; let active = 0;
    const next = () => { while (active < 4 && jobs.length) { active++; jobs.shift()(() => { active--; next(); }); } };
    const paint = (d, url) => { d.style.backgroundImage = 'url("' + url + '")'; if (d.parentNode && d.parentNode.dataset && d.parentNode.dataset.key) (window.__tileImg = window.__tileImg || {})[d.parentNode.dataset.key] = url; };
    // ---- imágenes de las casillas: caché en disco (miniatura 300/480 px + medidas), así al volver a entrar o bajar salen al instante ----
    const TK = (u) => 'https://fn-tile.local/' + encodeURIComponent(u).slice(-170);
    const tileGet = (u) => (window.caches ? caches.open('fn-tile-v1').then(async (c) => { const [r, m] = await Promise.all([c.match(TK(u)), c.match(TK(u) + '.json')]); return r && m ? { blob: await r.blob(), meta: await m.json() } : null; }).catch(() => null) : Promise.resolve(null));
    const tilePut = (u, bl, meta) => { try { if (window.caches) caches.open('fn-tile-v1').then((c) => { c.put(TK(u), new Response(bl, { headers: { 'content-type': 'image/webp' } })); c.put(TK(u) + '.json', new Response(JSON.stringify(meta), { headers: { 'content-type': 'application/json' } })); }).catch(() => {}); } catch (e) {} };
    // genera la miniatura y mide el arte (sin márgenes transparentes) a partir de la versión reducida (900 px); no pinta nada
    const makeTile = (url, tm) => new Promise((res) => {
      shrink(url, 900).then((u) => {
        const im = new Image(); im.crossOrigin = 'anonymous'; im.decoding = 'async';
        im.onerror = () => res(null);
        im.onload = () => {
          try {
            const w = im.naturalWidth, h = im.naturalHeight, fit = tm.bundle && !tm.comp, r = Math.min(1, (fit ? 480 : 300) / Math.max(w, h)), cw = Math.max(1, Math.round(w * r)), ch = Math.max(1, Math.round(h * r));
            const c = document.createElement('canvas'); c.width = cw; c.height = ch; c.getContext('2d').drawImage(im, 0, 0, cw, ch);
            const meta = { ar: w / h, solid: false, bb: null };
            if (!tm.jam && !tm.comp) {
              const sw = 96, sh = Math.max(1, Math.round(96 * h / w)), sc2 = document.createElement('canvas'); sc2.width = sw; sc2.height = sh;
              const cx = sc2.getContext('2d', { willReadFrequently: true }); cx.drawImage(c, 0, 0, sw, sh);
              const px = cx.getImageData(0, 0, sw, sh).data; let x0 = sw, y0 = sh, x1 = 0, y1 = 0, solid = 0;
              for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) { const al = px[(y * sw + x) * 4 + 3]; if (al > 235) solid++; if (al > 150) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
              meta.solid = solid / (sw * sh) > 0.9; if (x1 > x0 && y1 > y0) meta.bb = [x0 / sw, (x1 + 1) / sw, y0 / sh, (y1 + 1) / sh]; sc2.width = sc2.height = 0;
            }
            c.toBlob((bl) => { c.width = c.height = 0; if (bl) tilePut(url, bl, meta); res(bl ? { blob: bl, meta } : null); }, 'image/webp', 0.85);
          } catch (e) { res(null); }
        };
        im.src = u;
      });
    });
    const paintTile = (d, tile, tm, url) => {
      const t = d.parentNode, m = tile.meta;
      if (m.solid && !tm.jam) { d.style.inset = '0'; d.style.backgroundSize = 'cover'; d.style.backgroundPosition = 'center'; if (t) t.classList.add('solid'); }
      else if (tm.bundle && !tm.comp && m.bb && d.clientWidth) {
        const W = d.clientWidth, H = d.clientHeight, [fx0, fx1, fy0, fy1] = m.bb, w = 1000 * m.ar, h = 1000;
        const k = Math.min((W * 0.98) / ((fx1 - fx0) * w), (H * 1.0) / ((fy1 - fy0) * h)), dw = w * k, dh = h * k;
        d.style.backgroundSize = dw.toFixed(1) + 'px ' + dh.toFixed(1) + 'px'; d.style.backgroundPosition = (W / 2 - ((fx0 + fx1) / 2) * dw).toFixed(1) + 'px ' + (H - fy1 * dh).toFixed(1) + 'px';
      }
      paint(d, URL.createObjectURL(tile.blob)); d.style.opacity = 1;
    };
    const loadDi = (d) => { jobs.push((done) => {
      const url = d.dataset.img, t = d.parentNode;
      // elementos sueltos (collage de bundles): imagen chica, sin medir
      if (!d.classList.contains('di')) { const im = new Image(); im.crossOrigin = 'anonymous'; im.decoding = 'async'; im.onload = () => { try { const r = Math.min(1, 240 / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.naturalWidth * r)); c.height = Math.max(1, Math.round(im.naturalHeight * r)); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); c.toBlob((b) => { paint(d, b ? URL.createObjectURL(b) : url); c.width = c.height = 0; done(); }, 'image/webp', 0.85); } catch (e) { paint(d, url); done(); } }; im.onerror = () => { paint(d, url); done(); }; im.src = url; return; }
      const tm = { jam: !!(t && t.classList.contains('jam')), bundle: !!(t && t.classList.contains('bundle')), comp: !!(t && t.classList.contains('comp')) };
      tileGet(url).then((hit) => { if (hit) { paintTile(d, hit, tm, url); done(); return; } makeTile(url, tm).then((tile) => { if (tile) paintTile(d, tile, tm, url); else { paint(d, url); d.style.opacity = 1; } done(); }); });
    }); next(); };
    const lazy = new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) { lazy.unobserve(x.target); loadDi(x.target); } }), { root: sc, rootMargin: '1100px 0px' });
    let firstG = null; const pend = new Map();
    const pump = (g) => {
      const st = pend.get(g); if (!st || st.run) return; st.run = true;
      const tick = () => {
        if (document.body.dataset.screen !== 'shop') { setTimeout(tick, 400); return; }
        if (st.i >= st.items.length) { g.style.minHeight = ''; secObs.unobserve(g); pend.delete(g); return; }
        const end = Math.min(st.i + (light ? 10 : 18), st.items.length);
        for (; st.i < end; st.i++) st.mk(st.items[st.i]);
        try { railUpd(); upd(); } catch (e) {}
        setTimeout(tick, 45);
      };
      tick();
    };
    const secObs = new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) pump(x.target); }), { root: sc, rootMargin: '3000px 0px' });
    const heads = [], secCols = [];
    // aunque no bajes, el resto de la tienda se va armando solo, una sección a la vez
    setInterval(() => { if (document.body.dataset.screen !== 'shop' || ![...pend.values()].length || [...pend.values()].some((x) => x.run)) return; const g = [...pend.keys()][0]; if (g) pump(g); }, 700);
    for (const s of secs) {
      s.items.sort((a, b) => (b.sortPriority ?? 0) - (a.sortPriority ?? 0) || a.order - b.order);
      const h = document.createElement('div'); h.className = 'dsec'; h.textContent = s.name.trim().toUpperCase(); row.appendChild(h); heads.push([h, h.textContent]); { const c = {}; s.items.forEach((i) => { const k = hex(i.colors?.color1); if (k) c[k] = (c[k] || 0) + 1; }); const top = Object.keys(c).sort((x, y) => c[y] - c[x])[0]; secCols.push(top || '#2a58c8'); }
      const g = document.createElement('div'); g.className = 'dgrid'; row.appendChild(g);
      if (!firstG) firstG = g;
      const mk = (e) => {
        const key = 'd_' + (e.offerId || e.order);
        const title = String(e.name).toUpperCase();
        const thumbs = (e.kind === 'jam' ? [e.image] : e.items.map((i) => i.icon || i.featured).filter(Boolean));
        const n = Math.max(1, e.items.length || e.tracks.length || 1);
        ITEMS[key] = { pl: [320, 600, 1.28], th: 'dyn', n, url: vidFor(e), vdef: vidFor(e), iv: e.items.map((i) => ownOf(i)), ty: e.items.map((i) => i.type), urls: vidsFor(e), src: '', title, title2: title, desc: e.info || '', price: String(e.finalPrice ?? 0), owned: !!e.dev, nameRaw: e.name, reg: e.regularPrice > e.finalPrice ? e.regularPrice : null, tag: '',
          sub: e.kind === 'bundle' ? 'BUNDLE' : e.kind === 'jam' ? 'JAM TRACK' : (/^vehicle:/.test(e.items[0]?.type || '') ? 'VEHICLE' : String(e.items[0]?.type || 'ITEM').toUpperCase()), dyn: { image: e.image, thumbs: thumbs.length ? thumbs : [e.image], feat: e.items.map((i) => i.featured || i.icon || e.image), jam: e.kind === 'jam' } };
        const t = document.createElement('div'); t.className = 'dt ' + e.kind; t.dataset.go2 = 'detail'; t.dataset.key = key;
        const a = hex(e.colors?.color1), b = hex(e.colors?.color3) || hex(e.colors?.color2);
        if (a) t.style.setProperty('--a', mix(a, 1.12)); if (b || a) t.style.setProperty('--b', mix(b || a, .8));
        const w = span(e.tileSize); t.style.gridColumn = 'span ' + w;
        const comp = e.kind === 'bundle' && e.items.length > 1 && (e.image === e.items[0].featured || e.image === e.items[0].icon);
        const isNew = e.inDate && (Date.now() - new Date(e.inDate)) < 36 * 3600e3;
        const lead = e.items.find((i) => i.type === 'outfit') || e.items[0];
        if (shop.textures && shop.textures[e.sectionId]) t.classList.add('map');
        ITEMS[key].dyn.tm = { jam: e.kind === 'jam', bundle: e.kind === 'bundle', comp };
        if (comp) t.classList.add('comp'); if (e.kind === 'bundle' && w >= 3) t.classList.add('wide');
        if (!comp && e.kind === 'item' && e.items[0]?.type === 'outfit') t.classList.add('outfit');
        t.innerHTML = (comp ? '<div class="cmp"></div>' : '') + '<div class="di"></div><div class="sh"></div><div class="nm"></div><div class="pr"><i class="coin"></i><span></span></div>' + (e.banner ? '<div class="bd bn"></div>' : isNew ? '<div class="bd nw">NEW</div>' : e.kind === 'bundle' && !comp ? '<div class="bd">BUNDLE</div>' : e.kind === 'jam' ? '<div class="bd jam">JAM TRACK</div>' : '') + '<i class="pl"></i>';
        t.style.setProperty('--i', Math.min(g.children.length, 24)); if (g !== firstG || g.children.length > 11) t.style.animation = 'none';
        t.querySelector('.nm').textContent = e.name;
        if (e.banner) t.querySelector('.bd.bn').textContent = e.banner;
        t.querySelector('.pr span').textContent = String(e.finalPrice ?? 0);
        if (e.regularPrice > e.finalPrice) { const s2 = document.createElement('s'); s2.textContent = String(e.regularPrice); t.querySelector('.pr').appendChild(s2); }
        const di = t.querySelector('.di'); di.dataset.img = e.image; lazy.observe(di);
        if (comp) {
          const cm = t.querySelector('.cmp'), hr = document.createElement('div'); hr.className = 'hero'; hr.dataset.img = lead.featured || lead.icon || e.image; cm.appendChild(hr); lazy.observe(hr);
          e.items.filter((i) => i !== lead && i.icon).slice(0, 6).forEach((i, k) => { const ic = document.createElement('div'); ic.className = 'ic'; ic.dataset.img = i.icon; ic.style.left = (10 + (k % 3) * 50 + (k > 2 ? 14 : 0)) + 'px'; ic.style.top = (16 + Math.floor(k / 3) * 62 + (k % 2) * 8) + 'px'; ic.style.rotate = (k % 2 ? 5 : -4) + 'deg'; cm.appendChild(ic); lazy.observe(ic); });
        }
        t.addEventListener('click', () => { window.curItem = e.devKey || key; });
        if (e.dev) { t.classList.add('dev', 'map'); const pr = t.querySelector('.pr'); pr.className = 'ownlbl'; pr.textContent = 'OWNED'; if (e.devKey === 'pirate') devTok = t; }
        g.appendChild(t);
      };
      // carga progresiva: la sección reserva su alto y sus casillas se crean por tandas al acercarse
      { const cols = s.items.reduce((n, e) => n + Math.min(4, span(e.tileSize)), 0), rows = Math.ceil(cols / 4); g.style.minHeight = Math.floor(rows * 245 * 0.9) + 'px'; pend.set(g, { items: s.items, mk, i: 0, run: false }); secObs.observe(g); }
    }
    step('casillas');
    // riel izquierdo: un punto por sección y barra de posición reales
    const oldRail = document.querySelector('.screen[data-screen="shop"] > img.px[style*="height:639.47px"]');
    if (oldRail) oldRail.style.display = 'none';
    const rail = document.createElement('div'); rail.id = 'shoprail'; rail.innerHTML = '<div class="dots"></div><div class="trk"><b></b></div>';
    (oldRail ? oldRail.parentNode : document.querySelector('.screen[data-screen="shop"]')).appendChild(rail);
    const dotsEl = rail.querySelector('.dots'), thumb = rail.querySelector('.trk b'), N = heads.length, dotEls = [];
    heads.forEach((h, i) => { const d = document.createElement('i'); d.style.top = (N > 1 ? (i / (N - 1)) * 100 : 0) + '%'; d.title = h[1]; d.addEventListener('click', () => sc.scrollTo({ top: Math.max(0, h[0].offsetTop - 8), behavior: 'smooth' })); dotsEl.appendChild(d); dotEls.push(d); });
    let curDot = -1;
    const railUpd = () => {
      const max = Math.max(1, sc.scrollHeight - sc.clientHeight), pr = Math.min(1, Math.max(0, sc.scrollTop / max));
      let idx = 0; heads.forEach((h, i) => { if (h[0].offsetTop <= sc.scrollTop + 70) idx = i; });
      if (sc.scrollTop <= 4) idx = 0;
      if (sc.scrollTop >= max - 4) idx = N - 1;
      if (idx !== curDot) { curDot = idx; dotEls.forEach((d, i) => d.classList.toggle('on', i === idx)); window.SFX && SFX.play('tick'); }
      const trkH = thumb.parentNode.clientHeight || 600, th = Math.max(26, trkH * sc.clientHeight / Math.max(sc.scrollHeight, 1));
      thumb.style.height = th + 'px'; thumb.style.top = (pr * (trkH - th)) + 'px';
    };
    sc.addEventListener('scroll', railUpd, { passive: true }); setTimeout(railUpd, 80); setTimeout(railUpd, 600);
    new MutationObserver(() => { if (document.body.dataset.screen === 'shop') { step('tienda'); [30, 250, 900].forEach((ms) => setTimeout(() => { railUpd(); upd(); }, ms)); } }).observe(document.body, { attributes: true, attributeFilter: ['data-screen'] });
    // fondo de la sección actual (color de sus artículos)
    const shopScr = document.querySelector('.screen[data-screen="shop"]');
    const bgW = document.createElement('div'); bgW.id = 'shopbg'; bgW.innerHTML = '<i></i><i></i>'; shopScr.insertBefore(bgW, shopScr.firstChild);
    let bgI = 0, bgCur = '';
    // fondos de sección: se bajan una vez, se reducen a 960 px y se conservan máx. 3 (se libera el resto)
    const bgCache = new Map();
    const getBg = (url) => new Promise((res) => {
      if (bgCache.has(url)) { res(bgCache.get(url)); return; }
      const im = new Image(); im.crossOrigin = 'anonymous'; im.decoding = 'async';
      im.onload = () => {
        try {
          const r = Math.min(1, 960 / im.naturalWidth), c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * r); c.height = Math.round(im.naturalHeight * r);
          c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
          c.toBlob((bl) => { const u = bl ? URL.createObjectURL(bl) : url; c.width = c.height = 0; bgCache.set(url, u); while (bgCache.size > 3) { const k = bgCache.keys().next().value, old = bgCache.get(k); bgCache.delete(k); if (old.startsWith('blob:') && !Array.from(bgW.children).some((e) => e.style.background.includes(old))) URL.revokeObjectURL(old); } res(u); }, 'image/jpeg', 0.8);
        } catch (e) { bgCache.set(url, url); res(url); }
      };
      im.onerror = () => res(url); im.src = url;
    });
    const setBg = (c, url) => { if (url) getBg(url).then((u) => rawSetBg(c, u, url)); else rawSetBg(c, '', ''); };
    const rawSetBg = (c, url, orig) => { const key = (orig || url || '') + '|' + c; if (!c || key === bgCur) return; bgCur = key; const el = bgW.children[bgI = 1 - bgI]; el.style.background = url ? 'linear-gradient(rgba(4,14,52,.35),rgba(4,14,52,.6)),url("' + url + '") center/cover no-repeat' : 'none'; bgW.children[0].classList.toggle('on', bgI === 0); bgW.children[1].classList.toggle('on', bgI === 1); };
    // título de la sección actual
    const ttl = document.querySelector('[data-t="shop.title"]'); let last = '';
    let fHi = null;
    const upd = () => { let cur = heads[0]; for (const h of heads) if (h[0].offsetTop <= sc.scrollTop + 70) cur = h; setBg(secCols[heads.indexOf(cur)], bgFor(cur[1])); heads.forEach((h) => { if (h) h[0].style.opacity = h === cur ? 0 : 1; }); if (fHi) fHi(heads.indexOf(cur)); if (ttl && cur && cur[1] !== last) { last = cur[1]; ttl.style.transition = 'opacity .18s'; ttl.style.opacity = 0; setTimeout(() => { ttl.textContent = cur[1]; ttl.style.opacity = 1; }, 180); } };
    sc.addEventListener('scroll', () => { window.__lastScroll = Date.now(); }, { passive: true });
    sc.addEventListener('scroll', upd, { passive: true }); setTimeout(upd, 50);
    // panel FILTERS: lista de secciones; al tocar una salta a ella y la actual queda marcada
    {
      const st = document.createElement('style');
      st.textContent = `#fbtn{position:absolute;left:217px;top:147px;width:82px;height:80px;z-index:8;cursor:pointer}
      #fpan{position:absolute;left:217px;top:147px;width:407px;z-index:9;visibility:hidden;opacity:0;pointer-events:none;transform-origin:41px 40px;transform:scale(.2,.12);transition:transform .42s cubic-bezier(.2,1.15,.3,1),opacity .22s ease,visibility 0s .42s}
      #fpan .fh{height:80px;border-radius:14px;background:#a9b9f6;color:#0a1a55;font:italic 400 32px 'Archivo Black';display:flex;align-items:center;gap:16px;padding-left:24px;cursor:pointer}
      #fpan .fh i{width:36px;height:28px;background:linear-gradient(#0a1a55 0 5px,transparent 5px 11px,#0a1a55 11px 16px,transparent 16px 22px,#0a1a55 22px 27px);border-radius:2px}
      #fpan .fl{margin-top:22px;height:520px;overflow-y:auto;touch-action:pan-y;overscroll-behavior:contain;background:rgba(8,22,86,.9);border-radius:14px;padding:8px;-webkit-overflow-scrolling:touch}
      #fpan .fl div{padding:15px 18px;font:600 28px/1.15 Montserrat,system-ui;color:#8da3e6;border-radius:10px;cursor:pointer}
      #fpan .fl div.on{background:#9fb4f2;color:#0a1a55}
      .screen[data-screen="shop"].fopen #fpan{visibility:visible;opacity:1;pointer-events:auto;transform:scale(1,1);transition:transform .42s cubic-bezier(.2,1.15,.3,1),opacity .18s ease,visibility 0s}
      #fpan .fl{opacity:0;translate:0 -18px;transition:opacity .25s .12s,translate .38s .1s cubic-bezier(.2,.9,.3,1)}
      .screen[data-screen="shop"].fopen #fpan .fl{opacity:1;translate:0 0}
      #fpan .fl div{transition:background .2s,color .2s}
      .screen[data-screen="shop"] #shoprail,.screen[data-screen="shop"] img.px[src*="shop_filter"],.screen[data-screen="shop"] img.px[src*="shop_rail"]{transition:opacity .2s}
      .screen[data-screen="shop"].fopen #fbtn{pointer-events:none}
      .screen[data-screen="shop"].fopen #shoprail,.screen[data-screen="shop"].fopen img.px[src*="shop_rail"]{opacity:0;pointer-events:none}
      .screen[data-screen="shop"] #shopscroll,.screen[data-screen="shop"] [data-t="shop.title"]{transition:translate .42s cubic-bezier(.2,1.05,.3,1)}
      .screen[data-screen="shop"].fopen #shopscroll,.screen[data-screen="shop"].fopen [data-t="shop.title"]{translate:330px 0}`;
      document.head.appendChild(st);
      const fbtn = document.createElement('div'); fbtn.id = 'fbtn';
      const fpan = document.createElement('div'); fpan.id = 'fpan'; fpan.innerHTML = '<div class="fh"><i></i>FILTERS</div><div class="fl"></div>';
      shopScr.appendChild(fbtn); shopScr.appendChild(fpan);
      const fl = fpan.querySelector('.fl'), items = [];
      heads.forEach((h, i) => { const d = document.createElement('div'); d.textContent = (secs[i] && secs[i].name || h[1]).trim(); d.onclick = () => { sc.scrollTo({ top: Math.max(0, h[0].offsetTop - 8), behavior: 'smooth' }); window.SFX && SFX.play('click'); }; fl.appendChild(d); items.push(d); });
      const toggle = (on) => { shopScr.classList.toggle('fopen', on); window.SFX && SFX.play(on ? 'open' : 'back'); };
      fbtn.onclick = () => toggle(true); fpan.querySelector('.fh').onclick = () => toggle(false);
      let lastI = -1;
      fHi = (i) => { if (i === lastI) return; lastI = i; items.forEach((d, k) => d.classList.toggle('on', k === i)); if (shopScr.classList.contains('fopen') && items[i]) items[i].scrollIntoView({ block: 'nearest', behavior: 'smooth' }); };
      new MutationObserver(() => { if (document.body.dataset.screen !== 'shop') shopScr.classList.remove('fopen'); }).observe(document.body, { attributes: true, attributeFilter: ['data-screen'] });
    }

    // al cambiar PIRATE TOKEN en el panel, la tienda se vuelve a armar para mostrar u ocultar DEVELOPER
    { let built = ptOn; const orig = window.shopPT; window.shopPT = (on) => { const pc = document.getElementById('ptcard'); if (pc) pc.style.display = 'none'; if (devOn) row.style.top = '0px'; if (!!on !== built) { built = !!on; setTimeout(() => location.reload(), 250); } }; window.shopPT(ptOn); }

    // ficha de objeto: miniaturas y arte propios
    const APPLE = !!window.__APPLE;
    const art = document.createElement('img'); art.id = 'dynart'; art.alt = ''; art.draggable = false;
    // imágenes grandes de la ficha: se reducen a 900 px antes de mostrarse (el original puede medir 2000+ px = decenas de MB en memoria). Se guardan máx. 5.
    const shrinkCache = new Map();
    const CK = (u) => 'https://fn-art.local/' + encodeURIComponent(u).slice(-180);
    const diskGet = (u) => (window.caches ? caches.open('fn-art-v1').then((c) => c.match(CK(u))).then((r) => (r ? r.blob() : null)).catch(() => null) : Promise.resolve(null));
    const diskPut = (u, bl) => { try { if (window.caches && bl) caches.open('fn-art-v1').then((c) => c.put(CK(u), new Response(bl, { headers: { 'content-type': bl.type || 'image/webp' } }))).catch(() => {}); } catch (e) {} };
    const shrink = (url, max) => new Promise((res) => {
      if (shrinkCache.has(url)) { res(shrinkCache.get(url)); return; }
      if (!/^https?:/.test(url)) { res(url); return; }
      diskGet(url).then((cb) => { if (cb) { const u = URL.createObjectURL(cb); shrinkCache.set(url, u); res(u); return; } fresh(); });
      const fresh = () => {
      const done = (src, w, h) => { try { const r = Math.min(1, max / Math.max(w, h)), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * r)); c.height = Math.max(1, Math.round(h * r)); c.getContext('2d').drawImage(src, 0, 0, c.width, c.height); if (src.close) src.close(); c.toBlob((bl) => { c.width = c.height = 0; diskPut(url, bl); const u = bl ? URL.createObjectURL(bl) : url; shrinkCache.set(url, u); while (shrinkCache.size > 5) { const k = shrinkCache.keys().next().value, old = shrinkCache.get(k); shrinkCache.delete(k); if (old.startsWith('blob:') && art.src !== old) URL.revokeObjectURL(old); } res(u); }, 'image/webp', 0.88); } catch (e) { res(url); } };
      const viaImg = () => { const im = new Image(); im.crossOrigin = 'anonymous'; im.decoding = 'async'; im.onload = () => done(im, im.naturalWidth, im.naturalHeight); im.onerror = () => res(url); im.src = url; };
      // primero se intenta decodificar directamente a tamaño reducido (no ocupa la memoria del original completo)
      if (window.createImageBitmap && window.fetch) fetch(url, { mode: 'cors' }).then((r) => r.blob()).then((bl) => createImageBitmap(bl, { resizeWidth: max, resizeQuality: 'medium' })).then((bm) => done(bm, bm.width, bm.height)).catch(viaImg);
      else viaImg();
      };
    });
    const detail = document.querySelector('.screen[data-screen="detail"]'); if (detail) { const f = detail.querySelector('.full'); f ? f.after(art) : detail.appendChild(art); }
    // al tocar una miniatura del bundle, se reproduce el video de esa pieza (personaje, mochila, pico…)
    document.addEventListener('click', (ev) => {
      const th = ev.target.closest && ev.target.closest('#thumbs .tsl'); if (!th) return;
      const it = ITEMS[window.curItem]; if (!it || !it.iv) return;
      const i = [...th.parentNode.children].indexOf(th), u = it.iv[i] || '';
      it.dyn.cur = i; it.url = u; window.itemVid && window.itemVid(true); apply();
    }, true);
    const apply = () => {
      const scr = document.body.dataset.screen, it = ITEMS[window.curItem];
      const dyn = it && it.dyn && scr === 'detail';
      art.style.display = dyn && !it.url ? 'block' : 'none';
      if (!dyn) return;
      const shownImg = (it.dyn.cur != null && it.dyn.feat && it.dyn.feat[it.dyn.cur]) || it.dyn.image; if (art.dataset.src !== shownImg) { art.dataset.src = shownImg; const pv = window.__tileImg && window.__tileImg[window.curItem]; if (pv) art.src = pv; else art.removeAttribute('src'); shrink(shownImg, 900).then((u) => { if (art.dataset.src === shownImg) art.src = u; }); }
      const lab = { det5: it.sub === 'BUNDLE' ? 'The price for included items is:' : 'The price is:', det9: it.sub === 'BUNDLE' ? 'VIEW BUNDLE' : it.dyn.jam ? 'PREVIEW TRACK' : 'VIEW ITEM' };
      for (const k in lab) { const el = document.querySelector('[data-t="det.' + k + '"]'); if (el && el.textContent !== lab[k]) { el.removeAttribute('data-w'); el.textContent = lab[k]; } }
      document.querySelectorAll('#thumbs .tsl').forEach((el, i) => {
        const u = it.dyn.thumbs[i]; if (!u || i >= it.n) return;
        el.classList.toggle('cov', !!it.dyn.jam); el.dataset.k = 'dyn' + i;
        if (el.dataset.u !== u) { el.dataset.u = u; el.innerHTML = '<img src="' + u + '" alt="" draggable="false">'; }
      });
    };
    // al salir de la ficha y de los regalos se liberan el arte grande, las miniaturas y el video (antes se quedaban en memoria y se acumulaban)
    new MutationObserver(() => {
      const sc = document.body.dataset.screen; if (sc === 'detail' || sc === 'gift') return;
      art.removeAttribute('src'); art.dataset.src = ''; document.querySelectorAll('#thumbs .tsl').forEach((el) => { if (el.dataset.u) { el.innerHTML = ''; el.dataset.u = ''; } });
      if (sc !== 'lobby' && sc !== 'locker') { try { const v = document.getElementById('itemvid'); if (v && (v.getAttribute('src') || v.dataset.want)) { v.pause(); v.removeAttribute('src'); v.load(); delete v.dataset.want; } } catch (e) {} }
    }).observe(document.body, { attributes: true, attributeFilter: ['data-screen'] });
    new MutationObserver(() => { const k = ITEMS[window.curItem]; if (k && k.dyn && document.body.dataset.screen === 'detail') { k.dyn.cur = undefined; k.url = k.vdef; } setTimeout(apply, 40); setTimeout(apply, 250); }).observe(document.body, { attributes: true, attributeFilter: ['data-screen'] });
    step('listo'); setTimeout(() => step('estable'), 3000);
    window.__isCharVid = (it) => { if (!it) return false; if (!it.dyn) return it.sub === undefined || /OUTFIT/.test(it.sub); const i = it.iv ? it.iv.indexOf(it.url) : -1, t = i >= 0 ? it.ty[i] : (it.ty && it.ty.includes('outfit') ? 'outfit' : it.ty && it.ty[0]); return t === 'outfit'; };
    // migas de pan del video del artículo
    { const v = document.getElementById('itemvid'); if (v) ['loadstart', 'loadedmetadata', 'loadeddata', 'playing', 'emptied', 'error', 'stalled', 'abort'].forEach((ev) => v.addEventListener(ev, () => step('video ' + ev + (v.videoWidth ? ' ' + v.videoWidth + 'x' + v.videoHeight : '') + ' ' + String(v.getAttribute('src') || '').split('/').slice(-2, -1)[0]?.slice(0, 6)))); }
    // pre-descarga manual (botón PRE-DOWNLOAD del panel): baja varias imágenes a la vez y reporta el avance; no corre sola
    window.__preload = (() => {
      let run = 0;
      const list = () => E.filter((e) => /^https?:/.test(e.image || '')).map((e) => ({ url: e.image, tm: { jam: e.kind === 'jam', bundle: e.kind === 'bundle', comp: e.kind === 'bundle' && e.items.length > 1 && (e.image === e.items[0].featured || e.image === e.items[0].icon) } }));
      return {
        total: () => list().length,
        stop: () => { run++; },
        start: (onProg, conc) => new Promise((res) => {
          const my = ++run, ks = list(), N = ks.length; let i = 0, done = 0, active = 0, t0 = Date.now();
          if (!N) { res({ done: 0, total: 0, ms: 0 }); return; }
          const pump = () => {
            if (my !== run) { res({ done, total: N, ms: Date.now() - t0, stopped: true }); return; }
            while (active < (conc || 4) && i < N) {
              const it = ks[i++], url = it.url, tm = it.tm;
              active++;
              tileGet(url).then((have) => (have ? 1 : makeTile(url, tm))).catch(() => 0).then(() => { active--; done++; onProg && onProg(done, N); if (done >= N) { step('pre-descarga lista ' + N + ' en ' + Math.round((Date.now() - t0) / 1000) + 's'); res({ done, total: N, ms: Date.now() - t0 }); } else pump(); });
            }
          };
          pump();
        }),
      };
    })();
    // si el video no carga o no se puede reproducir, se muestra la imagen del artículo (nunca queda vacío)
    { const v = document.getElementById('itemvid'); if (v) v.addEventListener('error', () => { const it = ITEMS[window.curItem]; if (it && it.dyn && document.body.dataset.screen === 'detail') art.style.display = 'block'; }); }
    window.__shopDyn = { count: E.length, sections: secs.length };
  }
})();
