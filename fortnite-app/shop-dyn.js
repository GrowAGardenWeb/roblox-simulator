/* Tienda dinámica: reemplaza las imágenes fijas de la tienda por tarjetas generadas desde data/shop.json
   y las conecta a la ficha de objeto y al flujo de regalo existentes (ITEMS_ALL). Si algo falla, queda la tienda anterior. */
(function () {
  const BAD = (e) => !e.image || /placeholder|^\[VIRTUAL\]|\bTBD\b/i.test((e.name || '') + ' ' + (e.devName || ''));
  const hex = (c) => (c ? '#' + String(c).slice(0, 6) : null);
  const mix = (h, k) => { const n = parseInt(h.slice(1), 16), f = (x) => Math.max(0, Math.min(255, Math.round(x * k))); return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join(''); };
  const span = (s) => { const m = /Size_(\d+)_x_/.exec(s || ''); return Math.min(4, m ? +m[1] : 1); };
  const css = document.createElement('style');
  css.textContent = `
  #shoprow.dyn{position:relative;width:945px;height:auto;padding-bottom:60px}
  #shoprow.dyn .dsec{font:italic 400 34px 'Archivo Black';color:#fff;text-shadow:0 3px 4px rgba(0,0,40,.35);margin:22px 0 10px;white-space:nowrap}
  #shoprow.dyn .dgrid{display:grid;grid-template-columns:repeat(4,230px);grid-auto-flow:dense;gap:10px 8px}
  #shoprow.dyn .dt{position:relative;height:237px;border-radius:14px;overflow:hidden;cursor:pointer;pointer-events:auto;background:linear-gradient(160deg,var(--a,#3a63c4),var(--b,#1b3a8a));box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)}
  #shoprow.dyn .dt .di{position:absolute;inset:0 0 30px 0;background-position:center 60%;background-size:contain;background-repeat:no-repeat;filter:drop-shadow(0 6px 8px rgba(0,0,30,.35))}
  #shoprow.dyn .dt.bundle .di{inset:0 0 28px 0;background-size:auto 100%;background-position:center 30%;background-repeat:no-repeat;filter:none}
  #shoprow.dyn .dt.bundle .di::before{content:'';position:absolute;inset:-20px;background-image:inherit;background-size:cover;background-position:center;filter:blur(18px) brightness(.8) saturate(1.2);z-index:-1}
  #shoprow.dyn .dt.bundle .di{isolation:isolate}
  #shoprow.dyn .dt::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 38%,rgba(255,255,255,.28),rgba(255,255,255,0) 62%);pointer-events:none}
  #shoprow.dyn .dt.jam .di{inset:10px 10px auto 10px;aspect-ratio:1;border-radius:6px;box-shadow:0 6px 14px rgba(0,0,0,.4);background-size:cover;filter:none}
  #shoprow.dyn .dt .sh{position:absolute;left:0;right:0;bottom:0;height:78px;background:linear-gradient(transparent,rgba(5,15,50,.6))}
  #shoprow.dyn .dt .nm{position:absolute;left:12px;right:10px;bottom:34px;font:italic 400 19px 'Archivo Black';color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-transform:uppercase}
  #shoprow.dyn .dt .pr{position:absolute;left:12px;bottom:8px;display:flex;align-items:center;gap:6px;font:italic 400 18px 'Archivo Black';color:#fff}
  #shoprow.dyn .dt .pr i.coin{position:static;width:20px;height:20px;display:inline-block}
  #shoprow.dyn .dt .pr s{font-size:12px;opacity:.7}
  #shoprow.dyn .dt .bd{position:absolute;top:8px;left:8px;padding:2px 8px;border-radius:4px;font:800 11px Montserrat;background:#ffd23a;color:#241a00}
  #shoprow.dyn .dt .bd.jam{background:#ff4fa3;color:#fff}
  #shoprow.dyn .dt.bundle{box-shadow:inset 0 0 0 3px rgba(255,210,58,.75)}

  #shoprail{position:absolute;left:214.78px;top:248.26px;width:85.08px;height:639.47px;border-radius:16px;background:rgba(5,22,84,.92);box-shadow:inset 0 0 0 1px rgba(255,255,255,.06);z-index:3;pointer-events:auto}
  #shoprail .dots{position:absolute;left:0;top:14px;width:56px;bottom:14px}
  #shoprail .dots i{position:absolute;left:50%;width:13px;height:13px;margin:-6.5px 0 0 -6.5px;border-radius:50%;background:rgba(150,170,215,.65);transition:all .22s cubic-bezier(.2,1.4,.4,1);cursor:pointer}
  #shoprail .dots i.on{width:21px;height:21px;margin:-10.5px 0 0 -10.5px;background:#e3ebff;box-shadow:0 0 10px rgba(200,220,255,.8)}
  #shoprail .trk{position:absolute;right:16px;top:14px;bottom:14px;width:6px;border-radius:3px;background:rgba(255,255,255,.14)}
  #shoprail .trk b{position:absolute;left:0;right:0;border-radius:3px;background:#c9d6f5;min-height:26px;transition:top .08s linear}
  #shoprow.dyn .dt .pl{position:absolute;right:10px;bottom:9px;width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.92);box-shadow:0 2px 6px rgba(0,0,40,.35)}
  #shoprow.dyn .dt .pl::before,#shoprow.dyn .dt .pl::after{content:'';position:absolute;left:50%;top:50%;background:#2a58c8;border-radius:2px;translate:-50% -50%}
  #shoprow.dyn .dt .pl::before{width:14px;height:4px}#shoprow.dyn .dt .pl::after{width:4px;height:14px}
  #shoprow.dyn .dt .bd.nw{background:#fbff2a;color:#1a1a00;box-shadow:0 2px 6px rgba(0,0,0,.3)}
  #shoprow.dyn .dt.outfit .di{inset:-4px 0 14px 0;background-size:auto 116%;background-position:center 18%}
  #shoprow.dyn .dt.comp .di{display:none}
  #shoprow.dyn .dt .cmp{position:absolute;inset:0 0 30px 0}
  #shoprow.dyn .dt .cmp .ic{position:absolute;width:56px;height:56px;border-radius:8px;background-size:cover;background-position:center;box-shadow:0 4px 8px rgba(0,0,30,.4)}
  #shoprow.dyn .dt .cmp .hero{position:absolute;right:-6px;top:-6px;bottom:0;width:62%;background-size:auto 112%;background-position:right 30%;background-repeat:no-repeat;filter:drop-shadow(0 6px 10px rgba(0,0,30,.4))}
  #shopbg{position:absolute;inset:-70px -300px;pointer-events:none;z-index:0}
  #shopbg i{position:absolute;inset:0;opacity:0;transition:opacity .9s ease}#shopbg i.on{opacity:1}
  #dynart{position:absolute;left:1020px;top:120px;width:820px;height:690px;object-fit:contain;display:none;z-index:1;pointer-events:none;filter:drop-shadow(0 18px 24px rgba(0,0,40,.35))}`;
  document.head.appendChild(css);

  Promise.all([
    fetch('data/shop.json?' + Date.now()).then((r) => { if (!r.ok) throw 0; return r.json(); }),
    fetch('data/videos.json?' + Date.now()).then((r) => (r.ok ? r.json() : {})).catch(() => ({})),
    fetch('data/backgrounds.json?' + Date.now()).then((r) => (r.ok ? r.json() : {})).catch(() => ({})).then((b) => { window.__bgFile = b; }),
  ]).then(([shop, vids]) => build(shop, vids)).catch(() => {});

  function build(shop, vids) {
    const old = document.getElementById('shopscroll');
    const ITEMS = window.ITEMS_ALL && window.ITEMS_ALL();
    const norm = (x) => String(x || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    let local = {}; try { local = JSON.parse(localStorage.getItem('fnVideos') || '{}'); } catch (e) {}
    const all = Object.assign({}, vids, local), byNorm = {}; Object.keys(all).forEach((k) => { byNorm[norm(k)] = all[k]; });
    let bgLocal = {}; try { bgLocal = JSON.parse(localStorage.getItem('fnBackgrounds') || '{}'); } catch (e) {}
    const bgAll = Object.assign({}, shop.backgrounds || {}, window.__bgFile || {}, bgLocal), bgNorm = {}; Object.keys(bgAll).forEach((k) => { bgNorm[norm(k)] = bgAll[k]; });
    const bgFor = (name) => bgNorm[norm(name)] || '';
    const arr = (v) => (v ? [].concat(v) : []);
    const vidsFor = (e) => { const o = [...arr(all[e.offerId]), ...arr(all[e.name]), ...arr(byNorm[norm(e.name)]), ...arr(byNorm[norm(e.nameEs)])]; e.items.forEach((i) => o.push(...arr(byNorm[norm(i.name)]), ...arr(byNorm[norm(i.nameEs)]))); return [...new Set(o)]; };
    const vidFor = (e) => vidsFor(e)[0] || '';
    const E = (shop.entries || []).filter((e) => !BAD(e));
    if (!old || !ITEMS || !E.length) return;

    const sc = old.cloneNode(false);                 // sin los oyentes de la tienda anterior (ajuste por filas)
    const shopin = document.createElement('div'); shopin.className = 'shopin'; shopin.style.height = 'auto';
    const pt = document.getElementById('ptcard'); if (pt) shopin.appendChild(pt);
    const row = document.createElement('div'); row.id = 'shoprow'; row.className = 'dyn';
    shopin.appendChild(row); sc.appendChild(shopin); old.replaceWith(sc);

    const groups = new Map();
    for (const e of E) { const k = e.sectionId || e.section || '-'; if (!groups.has(k)) groups.set(k, { name: e.section || 'DESTACADOS', idx: e.sectionIndex ?? 999, items: [] }); groups.get(k).items.push(e); }
    const secs = [...groups.values()].sort((a, b) => a.idx - b.idx);
    const lazy = new IntersectionObserver((es) => es.forEach((x) => { if (x.isIntersecting) { const d = x.target; d.style.backgroundImage = 'url("' + d.dataset.img + '")'; lazy.unobserve(d); } }), { root: sc, rootMargin: '400px' });
    const heads = [], secCols = [];
    for (const s of secs) {
      s.items.sort((a, b) => (b.sortPriority ?? 0) - (a.sortPriority ?? 0) || a.order - b.order);
      const h = document.createElement('div'); h.className = 'dsec'; h.textContent = s.name.trim().toUpperCase(); row.appendChild(h); heads.push([h, h.textContent]); { const c = {}; s.items.forEach((i) => { const k = hex(i.colors?.color1); if (k) c[k] = (c[k] || 0) + 1; }); const top = Object.keys(c).sort((x, y) => c[y] - c[x])[0]; secCols.push(top || '#2a58c8'); }
      const g = document.createElement('div'); g.className = 'dgrid'; row.appendChild(g);
      for (const e of s.items) {
        const key = 'd_' + (e.offerId || e.order);
        const title = String(e.name).toUpperCase();
        const thumbs = (e.kind === 'jam' ? [e.image] : e.items.map((i) => i.icon || i.featured).filter(Boolean));
        const n = Math.max(1, e.items.length || e.tracks.length || 1);
        ITEMS[key] = { pl: [320, 600, 1.28], th: 'dyn', n, url: vidFor(e), urls: vidsFor(e), src: '', title, title2: title, desc: e.info || '', price: String(e.finalPrice ?? 0), tag: '',
          sub: e.kind === 'bundle' ? 'BUNDLE' : e.kind === 'jam' ? 'JAM TRACK' : String(e.items[0]?.type || 'ITEM').toUpperCase(), dyn: { image: e.image, thumbs: thumbs.length ? thumbs : [e.image], jam: e.kind === 'jam' } };
        const t = document.createElement('div'); t.className = 'dt ' + e.kind; t.dataset.go2 = 'detail';
        const a = hex(e.colors?.color1), b = hex(e.colors?.color3) || hex(e.colors?.color2);
        if (a) t.style.setProperty('--a', mix(a, 1.12)); if (b || a) t.style.setProperty('--b', mix(b || a, .8));
        const w = span(e.tileSize); t.style.gridColumn = 'span ' + w;
        const comp = e.kind === 'bundle' && e.items.length > 1 && (e.image === e.items[0].featured || e.image === e.items[0].icon);
        const isNew = e.inDate && (Date.now() - new Date(e.inDate)) < 36 * 3600e3;
        const lead = e.items.find((i) => i.type === 'outfit') || e.items[0];
        if (comp) t.classList.add('comp');
        if (!comp && e.kind === 'item' && e.items[0]?.type === 'outfit') t.classList.add('outfit');
        t.innerHTML = (comp ? '<div class="cmp"></div>' : '') + '<div class="di"></div><div class="sh"></div><div class="nm"></div><div class="pr"><i class="coin"></i><span></span></div>' + (isNew ? '<div class="bd nw">NEW!</div>' : e.kind === 'bundle' && !comp ? '<div class="bd">BUNDLE</div>' : e.kind === 'jam' ? '<div class="bd jam">JAM TRACK</div>' : '') + '<i class="pl"></i>';
        t.style.setProperty('--i', Math.min(g.children.length + (heads.length === 1 ? 0 : 0), 24));
        t.querySelector('.nm').textContent = title;
        t.querySelector('.pr span').textContent = (e.finalPrice ?? 0).toLocaleString('en-US');
        if (e.regularPrice > e.finalPrice) { const s2 = document.createElement('s'); s2.textContent = e.regularPrice.toLocaleString('en-US'); t.querySelector('.pr').appendChild(s2); }
        const di = t.querySelector('.di'); di.dataset.img = e.image; lazy.observe(di);
        if (comp) {
          const cm = t.querySelector('.cmp'), hr = document.createElement('div'); hr.className = 'hero'; hr.dataset.img = lead.featured || lead.icon || e.image; cm.appendChild(hr); lazy.observe(hr);
          e.items.filter((i) => i !== lead && i.icon).slice(0, 6).forEach((i, k) => { const ic = document.createElement('div'); ic.className = 'ic'; ic.dataset.img = i.icon; ic.style.left = (10 + (k % 3) * 50 + (k > 2 ? 14 : 0)) + 'px'; ic.style.top = (16 + Math.floor(k / 3) * 62 + (k % 2) * 8) + 'px'; ic.style.rotate = (k % 2 ? 5 : -4) + 'deg'; cm.appendChild(ic); lazy.observe(ic); });
        }
        t.addEventListener('click', () => { window.curItem = key; });
        g.appendChild(t);
      }
    }
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
    new MutationObserver(() => { if (document.body.dataset.screen === 'shop') { [30, 250, 900].forEach((ms) => setTimeout(() => { railUpd(); upd(); }, ms)); } }).observe(document.body, { attributes: true, attributeFilter: ['data-screen'] });
    // fondo de la sección actual (color de sus artículos)
    const shopScr = document.querySelector('.screen[data-screen="shop"]');
    const bgW = document.createElement('div'); bgW.id = 'shopbg'; bgW.innerHTML = '<i></i><i></i>'; shopScr.insertBefore(bgW, shopScr.firstChild);
    let bgI = 0, bgCur = '';
    const setBg = (c, url) => { const key = (url || '') + '|' + c; if (!c || key === bgCur) return; bgCur = key; const el = bgW.children[bgI = 1 - bgI]; el.style.background = url ? 'linear-gradient(rgba(4,14,52,.35),rgba(4,14,52,.6)),url("' + url + '") center/cover no-repeat' : 'radial-gradient(ellipse at 62% 42%,' + mix(c, .95) + '80 0,' + mix(c, .5) + '48 48%,transparent 82%)'; bgW.children[0].classList.toggle('on', bgI === 0); bgW.children[1].classList.toggle('on', bgI === 1); };
    // título de la sección actual
    const ttl = document.querySelector('[data-t="shop.title"]'); let last = '';
    const upd = () => { let cur = heads[0]; for (const h of heads) if (h[0].offsetTop <= sc.scrollTop + 70) cur = h; setBg(secCols[heads.indexOf(cur)], bgFor(cur[1])); if (ttl && cur && cur[1] !== last) { last = cur[1]; ttl.style.transition = 'opacity .18s'; ttl.style.opacity = 0; setTimeout(() => { ttl.textContent = cur[1]; ttl.style.opacity = 1; }, 180); } };
    sc.addEventListener('scroll', upd, { passive: true }); setTimeout(upd, 50);
    window.shopPT && window.shopPT(false);

    // ficha de objeto: miniaturas y arte propios
    const APPLE = !!window.__APPLE;
    const art = document.createElement('img'); art.id = 'dynart'; art.alt = ''; art.draggable = false;
    const detail = document.querySelector('.screen[data-screen="detail"]'); if (detail) { const f = detail.querySelector('.full'); f ? f.after(art) : detail.appendChild(art); }
    const apply = () => {
      const scr = document.body.dataset.screen, it = ITEMS[window.curItem];
      const dyn = it && it.dyn && scr === 'detail';
      art.style.display = dyn && !(APPLE && it.url) ? 'block' : 'none';
      if (!dyn) return;
      if (art.dataset.src !== it.dyn.image) { art.dataset.src = it.dyn.image; art.src = it.dyn.image; }
      const lab = { det5: it.sub === 'BUNDLE' ? 'The price for included items is:' : 'The price is:', det9: it.sub === 'BUNDLE' ? 'VIEW BUNDLE' : it.dyn.jam ? 'PREVIEW TRACK' : 'VIEW ITEM' };
      for (const k in lab) { const el = document.querySelector('[data-t="det.' + k + '"]'); if (el && el.textContent !== lab[k]) { el.removeAttribute('data-w'); el.textContent = lab[k]; } }
      document.querySelectorAll('#thumbs .tsl').forEach((el, i) => {
        const u = it.dyn.thumbs[i]; if (!u || i >= it.n) return;
        el.classList.toggle('cov', !!it.dyn.jam); el.dataset.k = 'dyn' + i;
        if (el.dataset.u !== u) { el.dataset.u = u; el.innerHTML = '<img src="' + u + '" alt="" draggable="false">'; }
      });
    };
    new MutationObserver(() => { setTimeout(apply, 40); setTimeout(apply, 250); }).observe(document.body, { attributes: true, attributeFilter: ['data-screen'] });
    window.__shopDyn = { count: E.length, sections: secs.length };
  }
})();
