/* Ficha de objeto con muchas piezas (más de 6): una sola fila que se desliza, con flechas ‹ › (suenan al tocarlas) y bordes difuminados. */
(function () {
  const det = document.querySelector('.screen[data-screen="detail"]'); if (!det) return;
  const st = document.createElement('style');
  st.textContent = `
  #thcar{position:absolute;left:128px;top:432px;width:540px;height:92px;z-index:4;display:none}
  #thcar .vp{position:absolute;inset:0;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;-webkit-overflow-scrolling:touch;scroll-behavior:smooth;-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 34px,#000 calc(100% - 34px),transparent 100%);mask-image:linear-gradient(90deg,transparent 0,#000 34px,#000 calc(100% - 34px),transparent 100%);padding:6px 36px}
  #thcar .vp::-webkit-scrollbar{display:none}
  #thcar .tr{display:flex;gap:9px;width:max-content}
  #thcar .it{position:relative;flex:none;width:66px;height:80px;border-radius:7px;overflow:hidden;background:#4f6fb8;cursor:pointer;box-sizing:border-box}
  #thcar .it img{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;display:block}
  #thcar .it.on{box-shadow:0 0 0 3px #fff,0 0 12px 3px rgba(190,255,200,.55)}
  #thcar .ar{position:absolute;top:14px;width:44px;height:64px;border-radius:10px;display:none;align-items:center;justify-content:center;cursor:pointer;z-index:2;font:900 30px/1 Montserrat;color:#0a1a55}
  #thcar .ar.l{left:-14px;background:rgba(90,118,196,.95)}#thcar .ar.r{right:-14px;background:rgba(116,178,248,.97)}
  #thcar .ar.show{display:flex}
  body.carousel #thumbs{visibility:hidden}
  `;
  document.head.appendChild(st);
  const car = document.createElement('div'); car.id = 'thcar';
  car.innerHTML = '<div class="vp"><div class="tr"></div></div><div class="ar l">&#8249;</div><div class="ar r">&#8250;</div>';
  det.appendChild(car);
  const vp = car.querySelector('.vp'), tr = car.querySelector('.tr'), L = car.querySelector('.ar.l'), R = car.querySelector('.ar.r');
  const PITCH = 75;
  let sig = '';
  const arrows = () => { L.classList.toggle('show', vp.scrollLeft > 4); R.classList.toggle('show', vp.scrollLeft < vp.scrollWidth - vp.clientWidth - 4); };
  vp.addEventListener('scroll', arrows, { passive: true });
  const go = (dir) => { window.SFX && SFX.play('click'); vp.scrollBy({ left: dir * PITCH * 3, behavior: 'smooth' }); };
  L.onclick = () => go(-1); R.onclick = () => go(1);

  const build = () => {
    const I = window.ITEMS_ALL ? window.ITEMS_ALL() : {}, it = I[window.curItem], scr = document.body.dataset.screen;
    const slots = [...document.querySelectorAll('#thumbs .tsl')], n = it ? (it.n || 3) : 0;
    const on = scr === 'detail' && it && n > 6;
    document.body.classList.toggle('carousel', !!on); car.style.display = on ? 'block' : 'none';
    if (!on) return;
    const srcs = slots.slice(0, n).map((e) => { const im = e.querySelector('img'); return im ? im.getAttribute('src') : ''; });
    if (srcs.some((x) => !x)) return; // aún cargando
    const key = window.curItem + '|' + srcs.join(',');
    if (key === sig) { arrows(); return; }
    sig = key; tr.innerHTML = '';
    srcs.forEach((u, i) => {
      const d = document.createElement('div'); d.className = 'it' + (i === 0 ? ' on' : ''); d.innerHTML = '<img alt="" draggable="false" decoding="async">'; d.firstChild.src = u;
      d.onclick = () => { tr.querySelectorAll('.on').forEach((x) => x.classList.remove('on')); d.classList.add('on'); window.SFX && SFX.play('click'); const s = slots[i]; if (s) s.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); };
      tr.appendChild(d);
    });
    vp.style.scrollBehavior = 'auto'; vp.scrollLeft = 0; setTimeout(() => { vp.style.scrollBehavior = ''; arrows(); }, 30);
  };
  new MutationObserver(() => { [60, 300, 800].forEach((ms) => setTimeout(build, ms)); }).observe(document.body, { attributes: true, attributeFilter: ['data-screen'] });
  setInterval(() => { if (document.body.dataset.screen === 'detail') build(); }, 700);
})();
