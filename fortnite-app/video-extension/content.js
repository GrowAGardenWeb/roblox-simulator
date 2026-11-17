(() => {
  if (window.__fnvx) return; window.__fnvx = 1;
  const KNOWN_URL = 'https://moneyscripts.shop/fortnite-app/data/videos.json';
  const store = { get: () => new Promise((r) => chrome.storage.local.get('fnv', (o) => r(o.fnv || {}))), set: (v) => new Promise((r) => chrome.storage.local.set({ fnv: v }, r)) };
  let D = {}, U = [], seen = {}, known = new Set(), typed = false, n = 0, stop = false, running = false;
  const id = (u) => (String(u).match(/\/item\/([^/]+)\//) || [])[1] || u;

  const p = document.createElement('div'); p.id = 'fnvx-panel';
  p.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:2147483647;width:300px;background:#0d1530;color:#fff;font:13px/1.4 system-ui,sans-serif;padding:10px;border-radius:12px;box-shadow:0 6px 24px #000a;border:1px solid #3a5bd0';
  p.innerHTML = '<a id="fx_h" style="float:right;color:#9bb;cursor:pointer">ocultar</a><b>Video Grabber</b>'
    + '<div id="fx_s" style="margin:6px 0;min-height:36px;color:#cfe3ff">Abre la tienda y toca "Recorrer todo solo".</div>'
    + '<input id="fx_n" placeholder="Nombre del artículo (se llena solo)" style="width:100%;box-sizing:border-box;padding:6px;border-radius:6px;border:0;margin-bottom:6px">'
    + '<div style="display:flex;gap:6px;flex-wrap:wrap"><button id="fx_a" style="flex:1;background:#2fd067;border:0;border-radius:6px;padding:8px;font-weight:800">Recorrer todo solo</button><button id="fx_c" style="flex:1;background:#ffd23a;border:0;border-radius:6px;padding:8px;font-weight:800">Copiar nuevos</button></div>'
    + '<div style="display:flex;gap:6px;margin-top:6px"><button id="fx_d" style="flex:1;background:#33d9fe;border:0;border-radius:6px;padding:7px;font-weight:700">Descargar .json</button><button id="fx_x" style="background:#ff6b6b;border:0;border-radius:6px;padding:7px;font-weight:700">Borrar</button></div>';
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

  // recorrido automático
  const sl = (ms) => new Promise((r) => setTimeout(r, ms));
  const txt = (e) => (e.innerText || '').trim();
  const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight; };
  const find = () => [].slice.call(document.querySelectorAll('a,button,[role=button],[tabindex]')).filter((e) => { const r = e.getBoundingClientRect(); return r.width > 120 && r.height > 120 && r.width < 900 && e.querySelector('img') && /\d/.test(txt(e)) && !e.closest('[role=dialog],[aria-modal=true]') && !e.closest('#fnvx-panel'); });
  const tname = (e) => { const l = txt(e).split('\n').map((x) => x.trim()).filter((x) => x.length > 1 && !/^[\d.,]+$/.test(x) && !/V-?Bucks|Gift|Regal/i.test(x) && !badge(x)); return l[0] || ''; };
  const key = (k) => { const o = { key: k, code: k, keyCode: 27, which: 27, bubbles: true, cancelable: true }; [document.activeElement, document, window].forEach((t) => { try { t && t.dispatchEvent(new KeyboardEvent('keydown', o)); t && t.dispatchEvent(new KeyboardEvent('keyup', o)); } catch (e) {} }); };
  const closeBtn = () => { const c = [].slice.call(document.querySelectorAll('button,a,[role=button],[tabindex]')).filter(vis); const b = c.filter((e) => /cerrar|close|atr[aá]s|back|volver|salir|dismiss/i.test((e.getAttribute('aria-label') || '') + ' ' + (e.title || '') + ' ' + txt(e)) && txt(e).length < 20)[0]; if (b) return b; return c.filter((e) => { const r = e.getBoundingClientRect(); return e.querySelector('svg') && !txt(e) && r.width < 90 && r.height < 90 && r.top < 140 && !e.closest('#fnvx-panel'); })[0]; };
  const leave = async (h0) => { const tries = [() => { const b = closeBtn(); if (b) b.click(); }, () => key('Escape'), () => { if (location.href !== h0) history.back(); }, () => { const b = closeBtn(); if (b) b.click(); key('Escape'); }]; for (const f of tries) { try { f(); } catch (e) {} await sl(900); if (find().length > 0 && !document.querySelector('[role=dialog],[aria-modal=true]')) return true; } return find().length > 0; };
  async function crawl() {
    if (running) { stop = true; return; }
    running = true; stop = false; const btn = $('#fx_a'); btn.textContent = 'Parar';
    const done = {}; let miss = 0, k = 0, why = '';
    while (!stop && miss < 4) {
      const t = find().filter((e) => !done[txt(e)])[0];
      if (!t) { const all = find(); if (!all.length) { if (!(await leave(location.href))) { why = 'No encuentro las casillas de la tienda (¿estás dentro de un artículo?).'; break; } continue; } all[all.length - 1].scrollIntoView({ block: 'center' }); window.scrollBy(0, 500); miss++; await sl(900); continue; }
      miss = 0; done[txt(t)] = 1; k++; const h0 = location.href; t.scrollIntoView({ block: 'center' }); typed = true; inp.value = tname(t); show('Recorriendo ' + k + ': ' + inp.value);
      t.click(); await sl(1800); const g = guess(); if (g) inp.value = g;
      const d = document.querySelector('[role=dialog],[aria-modal=true]') || document.body;
      const subs = [].slice.call(d.querySelectorAll('button,[role=button],[tabindex],a')).filter((e) => { const r = e.getBoundingClientRect(); return e.querySelector('img') && r.width >= 36 && r.width <= 200 && r.height >= 36 && r.height <= 200 && vis(e) && !e.closest('#fnvx-panel') && !find().includes(e); }).slice(0, 14);
      for (let x = 0; x < subs.length && !stop; x++) { const h1 = location.href; subs[x].click(); await sl(1300); if (location.href !== h1 && !document.querySelector('[role=dialog],[aria-modal=true]')) break; }
      if (!(await leave(h0))) { why = 'No pude salir del artículo "' + inp.value + '". Botones: ' + [].slice.call(document.querySelectorAll('button,a,[role=button]')).filter(vis).slice(0, 8).map((e) => (e.getAttribute('aria-label') || txt(e) || e.className + '').slice(0, 25)).join(' | '); break; }
      await sl(500);
    }
    running = false; btn.textContent = 'Recorrer todo solo'; show(why ? 'Se detuvo en el artículo ' + k + '. ' + why : 'Listo: ' + k + ' artículos recorridos. Toca "Copiar nuevos".');
  }

  // salida: solo lo nuevo, listo para pegar
  const lines = (onlyNew) => { const out = []; Object.keys(D).forEach((name) => { const us = D[name].filter((u) => !onlyNew || !known.has(id(u))); if (us.length) out.push('"' + name.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '": [' + us.map((u) => '"' + u + '"').join(', ') + '],'); }); const un = U.filter((u) => !onlyNew || !known.has(id(u))); if (un.length) out.push('// sin nombre: ' + un.join(' ')); return out.join('\n'); };
  $('#fx_c').onclick = async () => { const t = lines(true) || lines(false); if (!t) { show('No hay nada capturado todavía.'); return; } try { await navigator.clipboard.writeText(t); show('Copiado (' + t.split('\n').length + ' líneas). Pégalo en el chat.'); } catch (e) { prompt('Copia esto:', t); } };
  $('#fx_d').onclick = () => { const obj = {}; Object.keys(D).forEach((k) => { obj[k] = D[k]; }); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 1)], { type: 'application/json' })); a.download = 'videos-nuevos.json'; a.click(); };
  $('#fx_x').onclick = async () => { D = {}; U = []; seen = {}; n = 0; await store.set({ D, U }); show('Borrado.'); };
  $('#fx_a').onclick = crawl;

  (async () => {
    const o = await store.get(); D = o.D || {}; U = o.U || []; Object.values(D).forEach((a) => a.forEach((u) => { seen[id(u)] = 1; })); U.forEach((u) => { seen[id(u)] = 1; });
    try { const kn = await (await fetch(KNOWN_URL + '?' + Date.now())).json(); Object.values(kn).forEach((a) => [].concat(a).forEach((u) => known.add(id(u)))); } catch (e) { /* sin lista conocida: se copia todo */ }
    performance.getEntriesByType('resource').forEach((r) => { if (ok(r.name)) seen[id(r.name)] = 1; });
    show(); setInterval(scan, 600);
  })();
})();
