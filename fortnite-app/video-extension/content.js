(() => {
  if (window.__fnvx) return; window.__fnvx = 1;
  const KNOWN_URL = 'https://moneyscripts.shop/fortnite-app/data/videos.json';
  const store = { get: () => new Promise((r) => chrome.storage.local.get('fnv', (o) => r(o.fnv || {}))), set: (v) => new Promise((r) => chrome.storage.local.set({ fnv: v }, r)) };
  let D = {}, U = [], seen = {}, known = new Set(), typed = false, n = 0, stop = false, running = false;
  const id = (u) => (String(u).match(/\/item\/([^/]+)\//) || [])[1] || u;

  const p = document.createElement('div'); p.id = 'fnvx-panel';
  p.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:2147483647;width:300px;background:#0d1530;color:#fff;font:13px/1.4 system-ui,sans-serif;padding:10px;border-radius:12px;box-shadow:0 6px 24px #000a;border:1px solid #3a5bd0';
  p.innerHTML = '<a id="fx_h" style="float:right;color:#9bb;cursor:pointer">ocultar</a><b>Video Grabber</b>'
    + '<div id="fx_s" style="margin:6px 0;min-height:36px;color:#cfe3ff">Abre un artículo, espera a que cargue su video y toca el botón.</div>'
    + '<input id="fx_n" placeholder="Nombre del artículo (se llena solo)" style="width:100%;box-sizing:border-box;padding:6px;border-radius:6px;border:0;margin-bottom:6px">'
    + '<button id="fx_v" style="width:100%;background:#ffd23a;border:0;border-radius:6px;padding:11px;font-weight:800;font-size:14px;color:#241a00">Copiar link del video</button>'
    + '<div style="display:flex;gap:6px;margin-top:6px"><button id="fx_c" style="flex:1;background:#33d9fe;border:0;border-radius:6px;padding:7px;font-weight:700">Copiar todos los vistos</button><button id="fx_x" style="background:#ff6b6b;border:0;border-radius:6px;padding:7px;font-weight:700">Borrar</button></div>';
  document.documentElement.appendChild(p);
  const $ = (s) => p.querySelector(s), st = $('#fx_s'), inp = $('#fx_n');
  inp.addEventListener('input', (e) => { if (e.isTrusted) typed = true; });
  $('#fx_h').onclick = () => { p.style.display = 'none'; };

  const badge = (x) => { x = (x || '').trim(); return !x || /^[¡!]|!$|DESCUENTO|V-?BUCKS|MONEDAS|DESAPAREC|DISAPPEAR|LEAVING|\bHOY\b|TODAY|ANIMAD|REACTIV|PERSONALIZ|CUSTOMI|ESTILO|STYLE|NUEV[OA]|^NEW|DESTACAD|OFERTA|^(LOTE|BUNDLE|PACK)$/i.test(x); };
  const ok = (u) => u && u.indexOf('blob:') !== 0 && u.indexOf('/cdn-cgi/image/') < 0 && !/\/png(\?|$)|\.(png|jpe?g|webp)(\?|$)/i.test(u) && /\/(mp4|webm)|\.webm|\.mp4/i.test(u);
  const norm = (u) => u.replace(/\/webm-/, '/mp4-'); // se guarda siempre la versión mp4 (la app usa webm en PC por su cuenta)
  const guess = () => { const e = document.querySelector('[role=dialog] h1,[role=dialog] h2,[aria-modal=true] h1,[aria-modal=true] h2') || document.querySelector('h1'); const t = e && (e.innerText || '').trim(); return t && t.length < 60 && !badge(t) ? t : ''; };
  const counts = () => { let nw = 0, all = 0; Object.values(D).forEach((a) => a.forEach((u) => { all++; if (!known.has(id(u))) nw++; })); U.forEach((u) => { all++; if (!known.has(id(u))) nw++; }); return { nw, all }; };
  const show = (extra) => { const c = counts(); st.innerHTML = '<b>' + c.nw + ' nuevos</b> · ' + c.all + ' capturados' + (known.size ? ' · ' + known.size + ' ya conocidos' : '') + (extra ? '<br>' + extra : ''); };
  const save = () => store.set({ D, U });
  const add = (u0) => { const u = norm(u0), k = id(u); if (seen[k]) return; seen[k] = 1; if (!typed) { const g = guess(); if (g) inp.value = g; } const name = inp.value.trim(); if (name) { (D[name] = D[name] || []); if (!D[name].includes(u)) D[name].push(u); } else U.push(u); n++; show('Último: ' + (name || 'sin nombre')); save(); };
  const scan = () => { document.querySelectorAll('video').forEach((v) => { const s = [v.currentSrc, v.src]; v.querySelectorAll('source').forEach((x) => s.push(x.src)); s.forEach((u) => { if (ok(u)) add(u); }); }); performance.getEntriesByType('resource').forEach((r) => { if (ok(r.name)) add(r.name); }); };

  // video que se está viendo ahora: el que se reproduce; si no, el último que cargó
  const cur = () => { const vs = [].slice.call(document.querySelectorAll('video')), u = (v) => v.currentSrc || v.src; const b = vs.filter((v) => !v.paused && !v.ended && ok(u(v)))[0] || vs.filter((v) => { const r = v.getBoundingClientRect(); return r.width > 40 && ok(u(v)); })[0]; if (b) return u(b); const e = performance.getEntriesByType('resource').filter((r) => ok(r.name)); return e.length ? e[e.length - 1].name : ''; };
  $('#fx_v').onclick = async () => {
    const l = cur(); if (!l) { show('No encuentro ningún video. Abre el artículo y deja que cargue.'); return; }
    const u = norm(l), name = (inp.value || '').trim() || 'SIN NOMBRE';
    (D[name] = D[name] || []); if (!D[name].includes(u)) D[name].push(u); seen[id(u)] = 1; save();
    const t = '"' + name.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '": ["' + u + '"],';
    try { await navigator.clipboard.writeText(t); } catch (e) { prompt('Copia esto:', t); }
    show((known.has(id(u)) ? 'Ya estaba en la app, pero se copió. ' : 'NUEVO copiado: ') + name);
  };

  // salida: solo lo nuevo, listo para pegar
  const lines = (onlyNew) => { const out = []; Object.keys(D).forEach((name) => { const us = D[name].filter((u) => !onlyNew || !known.has(id(u))); if (us.length) out.push('"' + name.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '": [' + us.map((u) => '"' + u + '"').join(', ') + '],'); }); const un = U.filter((u) => !onlyNew || !known.has(id(u))); if (un.length) out.push('// sin nombre: ' + un.join(' ')); return out.join('\n'); };
  $('#fx_c').onclick = async () => { const t = lines(true) || lines(false); if (!t) { show('No hay nada capturado todavía.'); return; } try { await navigator.clipboard.writeText(t); show('Copiado (' + t.split('\n').length + ' líneas). Pégalo en el chat.'); } catch (e) { prompt('Copia esto:', t); } };
  const _unused = () => { const obj = {}; Object.keys(D).forEach((k) => { obj[k] = D[k]; }); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 1)], { type: 'application/json' })); a.download = 'videos-nuevos.json'; a.click(); };
  $('#fx_x').onclick = async () => { D = {}; U = []; seen = {}; n = 0; await store.set({ D, U }); show('Borrado.'); };

  (async () => {
    const o = await store.get(); D = o.D || {}; U = o.U || []; Object.values(D).forEach((a) => a.forEach((u) => { seen[id(u)] = 1; })); U.forEach((u) => { seen[id(u)] = 1; });
    try { const kn = await (await fetch(KNOWN_URL + '?' + Date.now())).json(); Object.values(kn).forEach((a) => [].concat(a).forEach((u) => known.add(id(u)))); } catch (e) { /* sin lista conocida: se copia todo */ }
    performance.getEntriesByType('resource').forEach((r) => { if (ok(r.name)) seen[id(r.name)] = 1; });
    show(); setInterval(scan, 600);
  })();
})();
