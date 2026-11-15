/* Casillero: todos los personajes (outfits) con su imagen completa. Tocar la casilla del personaje abre la lista. */
(function () {
  const L = document.querySelector('.screen[data-screen="locker"]'); if (!L) return;
  const KEY = 'fn_locker_outfit';
  let sel = null; try { sel = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
  window.__lkOutfit = sel;

  const st = document.createElement('style');
  st.textContent = `
  #lkfull{position:absolute;left:1120px;top:110px;width:820px;height:640px;object-fit:contain;object-position:center bottom;display:none;z-index:2;pointer-events:none;filter:drop-shadow(0 18px 24px rgba(0,0,40,.35))}
  #lkpan{position:absolute;left:497px;top:278px;width:650px;height:520px;z-index:7;display:none;flex-direction:column;background:rgba(6,22,92,.94);border-radius:14px;box-shadow:0 10px 40px rgba(0,0,30,.5);color:#fff;font-family:Montserrat,system-ui;overflow:hidden}
  #lkpan.on{display:flex;animation:fxPop .3s cubic-bezier(.2,1.2,.4,1) both}
  #lkpan .h{display:flex;align-items:center;gap:14px;padding:14px 18px 8px}
  #lkpan .h b{font:italic 400 30px 'Archivo Black'}#lkpan .h .n{font:700 20px Montserrat;color:#9fd2ff;flex:1}
  #lkpan .h .x{padding:8px 16px;border-radius:8px;background:#a9b9f6;color:#0a1a55;font:800 16px Montserrat;cursor:pointer}
  #lkpan input{margin:0 18px 10px;padding:10px 14px;border-radius:8px;border:0;background:#112a78;color:#fff;font:700 18px Montserrat;outline:0}
  #lkpan .g{flex:1;overflow-y:auto;overscroll-behavior:contain;display:grid;grid-template-columns:repeat(5,1fr);gap:10px;padding:0 18px 18px;align-content:start;-webkit-overflow-scrolling:touch}
  #lkpan .i{position:relative;aspect-ratio:1;border-radius:8px;overflow:hidden;background:#2f6ee0;cursor:pointer}
  #lkpan .i img{width:100%;height:100%;object-fit:cover;display:block}
  #lkpan .i.cur{box-shadow:0 0 0 4px #fff}
  #lkpan .i span{position:absolute;left:0;right:0;bottom:0;padding:12px 4px 3px;font:700 12px Montserrat;text-align:center;background:linear-gradient(transparent,#000b);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #lkcnt{position:absolute;left:527px;top:254px;font:800 17px Montserrat;color:#bfe0ff;z-index:3;display:none}
  `;
  document.head.appendChild(st);

  const full = document.createElement('img'); full.id = 'lkfull'; full.alt = ''; full.draggable = false; L.appendChild(full);
  const pan = document.createElement('div'); pan.id = 'lkpan';
  pan.innerHTML = '<div class="h"><b>OUTFITS</b><span class="n" id="lkn"></span><div class="x" id="lkx">CLOSE</div></div><input type="search" id="lkq" placeholder="Search outfit…" autocomplete="off" autocapitalize="off" spellcheck="false"><div class="g" id="lkg"></div>';
  L.appendChild(pan);
  const cnt = document.createElement('div'); cnt.id = 'lkcnt'; L.appendChild(cnt);

  let all = null, list = [], shown = 0; const grid = pan.querySelector('#lkg'), q = pan.querySelector('#lkq'), nEl = pan.querySelector('#lkn');
  const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const load = async () => {
    if (all) return all;
    try { const r = await fetch('data/outfits.json?' + Date.now()); if (r.ok) all = await r.json(); } catch (e) {}
    if (!all || !all.length) all = [];
    return all;
  };
  const showSel = () => {
    const on = !!sel, t1 = document.getElementById('lkt1'), t2 = document.getElementById('lkt2'), box = document.getElementById('lkth');
    full.style.display = on ? 'block' : 'none';
    if (!on) return;
    full.src = sel.full || sel.icon;
    if (t1) { t1.textContent = 'OUTFIT - FORTNITE STYLE'; t1.style.display = 'block'; } if (t2) { t2.textContent = sel.name.toUpperCase(); t2.style.display = 'block'; }
    if (box) { box.style.display = 'block'; const im = box.firstChild; if (im) im.src = sel.icon; }
    const cv = document.getElementById('itemcv'), v = document.getElementById('itemvid'); if (cv) cv.style.opacity = 0; try { v && v.pause(); } catch (e) {}
  };
  const more = () => {
    const end = Math.min(list.length, shown + 80), frag = document.createDocumentFragment();
    for (; shown < end; shown++) {
      const it = list[shown], d = document.createElement('div'); d.className = 'i' + (sel && sel.id === it.id ? ' cur' : '');
      d.innerHTML = '<img loading="lazy" decoding="async" alt=""><span></span>'; d.firstChild.src = it.icon; d.lastChild.textContent = it.name;
      d.onclick = () => { sel = { id: it.id, name: it.name, icon: it.icon, full: it.full }; window.__lkOutfit = sel; try { localStorage.setItem(KEY, JSON.stringify(sel)); } catch (e) {} grid.querySelectorAll('.cur').forEach((x) => x.classList.remove('cur')); d.classList.add('cur'); showSel(); window.SFX && SFX.play('click'); };
      frag.appendChild(d);
    }
    grid.appendChild(frag);
  };
  const render = () => { const t = q.value.trim().toLowerCase(); list = all.filter((x) => !t || x.name.toLowerCase().includes(t)); shown = 0; grid.innerHTML = ''; grid.scrollTop = 0; nEl.textContent = fmt(list.length) + ' / ' + fmt(all.length) + ' OWNED'; more(); };
  grid.addEventListener('scroll', () => { if (shown < list.length && grid.scrollTop + grid.clientHeight > grid.scrollHeight - 300) more(); }, { passive: true });
  q.addEventListener('input', render);
  const open = async () => { pan.classList.add('on'); nEl.textContent = 'Loading…'; await load(); render(); };
  pan.querySelector('#lkx').onclick = () => pan.classList.remove('on');
  // casilla del personaje (primera del loadout): zona táctil sobre la imagen
  const hit = document.createElement('div'); hit.style.cssText = 'position:absolute;left:520px;top:288px;width:122px;height:122px;z-index:6;cursor:pointer'; hit.onclick = open; L.appendChild(hit);

  // contador siempre visible en el casillero
  const updCnt = async () => { await load(); cnt.textContent = fmt(all.length) + ' OUTFITS OWNED'; cnt.style.display = all.length ? 'block' : 'none'; };
  new MutationObserver(() => {
    if (L.hidden) { pan.classList.remove('on'); return; }
    updCnt(); [80, 400, 1200].forEach((ms) => setTimeout(() => { if (!L.hidden) showSel(); }, ms));
  }).observe(L, { attributes: true, attributeFilter: ['hidden'] });
})();
