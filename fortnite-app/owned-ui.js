/* Modo "OWNED": todo lo de la tienda ya es tuyo y solo se puede regalar. Se activa en el panel MOD. */
(function () {
  const P = document.getElementById('modp'); if (!P) return;
  const KEY = 'fn_owned'; let on = false; try { on = localStorage.getItem(KEY) === '1'; } catch (e) {}
  const st = document.createElement('style');
  st.textContent = `
  body.owned #shoprow.dyn .dt .pr > *{display:none}
  body.owned #shoprow.dyn .dt .pr::after{content:'\\2713  OWNED';font:800 18px Montserrat;color:#5cff7a;letter-spacing:.02em}
  body.owned #shoprow.dyn .dt .bd.bn{display:none}
  body.owned .screen[data-screen="detail"] [data-t="det.det5"],body.owned .screen[data-screen="detail"] [data-t="det.det6"],body.owned .screen[data-screen="detail"] [data-t="det.det12"],body.owneditem .screen[data-screen="detail"] [data-t="det.det5"],body.owneditem .screen[data-screen="detail"] [data-t="det.det6"],body.owneditem .screen[data-screen="detail"] [data-t="det.det12"]{visibility:hidden}
  #ownbtn{position:absolute;left:131px;top:798px;width:458px;height:74px;border-radius:12px;background:#4a64a8;display:none;align-items:center;justify-content:center;gap:10px;color:#7dff9a;font:italic 400 30px 'Archivo Black';z-index:5;pointer-events:auto}
  body.owned .screen[data-screen="detail"] #ownbtn,body.owneditem .screen[data-screen="detail"] #ownbtn{display:flex}
  #ownrow label{display:block}
  `;
  document.head.appendChild(st);
  const det = document.querySelector('.screen[data-screen="detail"]');
  if (det) { const b = document.createElement('div'); b.id = 'ownbtn'; b.innerHTML = '<span>&#10003;</span><span>OWNED</span>'; det.appendChild(b); }
  const apply = () => document.body.classList.toggle('owned', on);
  const row = document.createElement('div'); row.id = 'ownrow';
  row.innerHTML = '<label>SHOP MODE</label><select id="ownsel"><option value="0">NORMAL (BUY WITH V-BUCKS)</option><option value="1">OWNED (EVERYTHING OWNED, GIFT ONLY)</option></select>';
  const bar = P.querySelector('.b'); (bar ? bar.parentNode : P.firstChild).insertBefore(row, bar || null);
  const sel = row.querySelector('#ownsel'); sel.value = on ? '1' : '0';
  sel.onchange = () => { on = sel.value === '1'; try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {} apply(); };
  // oculta la moneda suelta del precio en la ficha (queda solo "OWNED")
  const coin = () => { document.querySelectorAll('.screen[data-screen="detail"] .coin').forEach((c) => { const t = parseFloat(c.style.top), l = parseFloat(c.style.left); if (t > 540 && t < 600 && l < 260) c.style.visibility = on ? 'hidden' : ''; }); };
  new MutationObserver(() => { [60, 300, 900].forEach((ms) => setTimeout(coin, ms)); }).observe(document.body, { attributes: true, attributeFilter: ['data-screen'] });
  const _apply = apply; sel.addEventListener('change', coin);
  // artículos que siempre son tuyos (sección DEVELOPER): la ficha dice OWNED aunque el modo sea normal
  setInterval(() => { const it = window.ITEMS_ALL && window.ITEMS_ALL()[window.curItem]; document.body.classList.toggle('owneditem', document.body.dataset.screen === 'detail' && !!(it && it.owned)); }, 250);
  // PRE-DOWNLOAD: baja y guarda las imágenes de la tienda con una barra de progreso
  { const r3 = document.createElement('div'); r3.id = 'prerow';
    r3.innerHTML = '<style>#prerow .bar{height:14px;border-radius:7px;background:#0a1d62;overflow:hidden;margin-top:8px;display:none}#prerow .bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#33d9fe,#7dff9a);transition:width .15s}#prerow .st{font:700 12px Montserrat;color:#cfe3ff;margin-top:6px;min-height:14px}</style><label>PRE-DOWNLOAD (SHOP IMAGES)</label><button type="button" id="prebtn" style="width:100%;background:#7dff9a;color:#04210f">PRE-DOWNLOAD NOW</button><div class="bar"><i></i></div><div class="st" id="prest"></div>';
    const b3 = P.querySelector('.b'); (b3 ? b3.parentNode : P.firstChild).insertBefore(r3, b3 || null);
    const btn = r3.querySelector('#prebtn'), bar = r3.querySelector('.bar'), fill = bar.firstChild, st = r3.querySelector('#prest'); let busy = false;
    btn.onclick = () => {
      const pl = window.__preload; if (!pl) { st.textContent = 'Open the shop first.'; return; }
      if (busy) { pl.stop(); return; }
      busy = true; btn.textContent = 'CANCEL'; bar.style.display = 'block'; fill.style.width = '0'; const t0 = Date.now();
      pl.start((d, n) => { const p = Math.round(d / n * 100), el = (Date.now() - t0) / 1000, eta = d ? Math.max(0, Math.round(el / d * (n - d))) : 0; fill.style.width = p + '%'; st.textContent = d + ' / ' + n + ' (' + p + '%) · ~' + eta + 's left'; }, 4).then((r) => {
        busy = false; btn.textContent = 'PRE-DOWNLOAD NOW'; st.textContent = r.stopped ? 'Cancelled at ' + r.done + ' / ' + r.total : 'Done: ' + r.total + ' items in ' + Math.round(r.ms / 1000) + 's'; if (!r.stopped) fill.style.width = '100%';
      });
    };
  }
  apply();
})();
