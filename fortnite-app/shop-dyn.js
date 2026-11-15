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
  #shoprow.dyn .dt.bundle .di{inset:0 0 28px 0;background-size:cover;background-position:center;filter:none}
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
  #dynart{position:absolute;left:1020px;top:120px;width:820px;height:690px;object-fit:contain;display:none;z-index:1;pointer-events:none;filter:drop-shadow(0 18px 24px rgba(0,0,40,.35))}`;
  document.head.appendChild(css);

  Promise.all([
    fetch('data/shop.json?' + Date.now()).then((r) => { if (!r.ok) throw 0; return r.json(); }),
    fetch('data/videos.json?' + Date.now()).then((r) => (r.ok ? r.json() : {})).catch(() => ({})),
  ]).then(([shop, vids]) => build(shop, vids)).catch(() => {});

  function build(shop, vids) {
    const old = document.getElementById('shopscroll');
    const ITEMS = window.ITEMS_ALL && window.ITEMS_ALL();
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
    const heads = [];
    for (const s of secs) {
      s.items.sort((a, b) => (b.sortPriority ?? 0) - (a.sortPriority ?? 0) || a.order - b.order);
      const h = document.createElement('div'); h.className = 'dsec'; h.textContent = s.name.trim().toUpperCase(); row.appendChild(h); heads.push([h, h.textContent]);
      const g = document.createElement('div'); g.className = 'dgrid'; row.appendChild(g);
      for (const e of s.items) {
        const key = 'd_' + (e.offerId || e.order);
        const title = String(e.name).toUpperCase();
        const thumbs = (e.kind === 'jam' ? [e.image] : e.items.map((i) => i.icon || i.featured).filter(Boolean));
        const n = Math.max(1, e.items.length || e.tracks.length || 1);
        ITEMS[key] = { pl: [320, 600, 1.28], th: 'dyn', n, url: vids[e.offerId] || vids[e.name] || '', src: '', title, title2: title, desc: e.info || '', price: String(e.finalPrice ?? 0), tag: '',
          sub: e.kind === 'bundle' ? 'BUNDLE' : e.kind === 'jam' ? 'JAM TRACK' : String(e.items[0]?.type || 'ITEM').toUpperCase(), dyn: { image: e.image, thumbs: thumbs.length ? thumbs : [e.image], jam: e.kind === 'jam' } };
        const t = document.createElement('div'); t.className = 'dt ' + e.kind; t.dataset.go2 = 'detail';
        const a = hex(e.colors?.color1), b = hex(e.colors?.color3) || hex(e.colors?.color2);
        if (a) t.style.setProperty('--a', mix(a, 1.12)); if (b || a) t.style.setProperty('--b', mix(b || a, .8));
        const w = span(e.tileSize); t.style.gridColumn = 'span ' + w;
        t.innerHTML = '<div class="di"></div><div class="sh"></div><div class="nm"></div><div class="pr"><i class="coin"></i><span></span></div>' + (e.kind === 'bundle' ? '<div class="bd">BUNDLE</div>' : e.kind === 'jam' ? '<div class="bd jam">JAM TRACK</div>' : '');
        t.querySelector('.nm').textContent = title;
        t.querySelector('.pr span').textContent = (e.finalPrice ?? 0).toLocaleString('en-US');
        if (e.regularPrice > e.finalPrice) { const s2 = document.createElement('s'); s2.textContent = e.regularPrice.toLocaleString('en-US'); t.querySelector('.pr').appendChild(s2); }
        const di = t.querySelector('.di'); di.dataset.img = e.image; lazy.observe(di);
        t.addEventListener('click', () => { window.curItem = key; });
        g.appendChild(t);
      }
    }
    // título de la sección actual
    const ttl = document.querySelector('[data-t="shop.title"]'); let last = '';
    const upd = () => { let cur = heads[0]; for (const h of heads) if (h[0].offsetTop <= sc.scrollTop + 70) cur = h; if (ttl && cur && cur[1] !== last) { last = cur[1]; ttl.style.transition = 'opacity .18s'; ttl.style.opacity = 0; setTimeout(() => { ttl.textContent = cur[1]; ttl.style.opacity = 1; }, 180); } };
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
