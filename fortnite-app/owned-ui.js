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
  apply();
})();
