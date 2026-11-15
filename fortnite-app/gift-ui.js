/* Pantallas "Confirm purchase" y "Wrap zone" con el diseño de la tienda real (en inglés). */
(function () {
  const C = document.getElementById('cfm'), W = document.getElementById('wrp'); if (!C || !W) return;
  const st = document.createElement('style');
  st.textContent = `
  #cfm,#wrp{background:#02050f}
  #cfm::before{content:'';position:absolute;left:0;right:0;top:360px;height:376px;pointer-events:none;background:linear-gradient(#1b5cf0,#1b5cf0) 0 356px/100% 16px no-repeat,linear-gradient(#071c6c,#0a2a9c 25%,#0a2a9c 80%,#0b30b4)}
  #wrp::before{content:'';position:absolute;left:0;right:0;top:205px;height:436px;pointer-events:none;background:linear-gradient(#1b5cf0,#1b5cf0) 0 416px/100% 18px no-repeat,linear-gradient(#071c6c,#0a2a9c 22%,#0a2a9c 80%,#0b30b4)}
  .gl-logo{position:absolute;left:176px;top:108px;width:82px;height:76px;mix-blend-mode:screen;pointer-events:none}
  .gl-sl{position:absolute;left:268px;top:114px;width:4px;height:66px;background:#19bfff;transform:skewX(-12deg);pointer-events:none}
  .gl-h1{position:absolute;left:290px;top:106px;font:italic 400 46px 'Archivo Black';transform:scaleX(.9);transform-origin:left;white-space:nowrap}
  .gl-h2{position:absolute;left:285px;top:154px;font:italic 400 21px 'Archivo Black';color:#33d9fe}
  .gl-bal{position:absolute;left:1830px;top:30px;width:128px;height:90px;box-sizing:border-box;background:#0b4fe0;border:3px solid #2a6bff;display:flex;align-items:center;justify-content:center;gap:8px;font:700 34px Montserrat;color:#fff;pointer-events:none}
  .gl-bal i{width:26px;height:26px;border-radius:50%;background:radial-gradient(#dfe8ff,#8fa8e8);box-shadow:inset 0 0 0 3px #6f8be0;flex:none}
  .gl-user{position:absolute;right:46px;top:124px;font:italic 800 23px Montserrat;color:#fff;white-space:nowrap;pointer-events:none}
  #cfm .av{left:710px;top:224px;width:98px;height:98px}
  #cfm .who{left:836px;top:218px;font-size:32px;transform:scaleX(.9)}
  #cfm .cnt{left:822px;top:252px;font-size:80px;transform:scaleX(.9)}
  #cfm .iname{top:392px;font:italic 700 38px Montserrat;color:#58a6ff;text-transform:none}
  #cfm .th{top:458px;width:108px;height:136px;background:linear-gradient(160deg,#1fc7d6,#0a7f9c)}
  #cfm .pbox{left:765px;top:653px;width:470px;height:62px;background:#0b55f0;font:italic 400 38px 'Archivo Black'}
  #cfm .pbox s{margin-left:10px;font-size:26px;opacity:.6;font-weight:400}
  #cfm .buy{left:765px;top:715px;width:470px;height:76px}
  #cfm .buy b{top:6px;font-size:28px}#cfm .buy u{top:46px;font-size:16px}
  #cfm .buy.poor{height:56px;background:#ffee00;cursor:pointer}#cfm .buy.poor b{top:10px;font-size:30px}#cfm .buy.poor u,#cfm .buy.poor i{display:none}
  #cfm .refund{left:616px;top:802px;width:900px;text-align:left;font:italic 600 19px/1.25 Montserrat;color:#d8e2ff;white-space:normal}
  #cfm .wopt,#cfm .back,#wrp .wback{height:44px;box-sizing:border-box;background:#0a5ad8;border:3px solid #19bfff;color:#4fe3ff;font:800 21px/38px Montserrat;font-style:normal;text-align:center;cursor:pointer;display:block}
  #cfm .wopt{left:1563px;top:825px;width:219px}#cfm .back{left:1795px!important;top:825px!important;width:163px}
  #wrp .wback{left:1795px;top:825px;width:163px}
  #wrp h2{top:222px;font-size:84px;transform:scaleX(.86)}
  #wrp .wt{top:342px;width:204px;height:204px;border:0;overflow:visible;box-sizing:border-box;transform:none;transition:scale .15s}
  #wrp .wt img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  #wrp .wt .v{opacity:0;transition:opacity .15s}
  #wrp .wt.sel{transform:none;scale:1.1;outline:8px solid #fff;outline-offset:0;box-shadow:none;z-index:2}#wrp .wt.sel .v{opacity:1}
  #wrp .ok{left:800px;top:595px;width:420px;height:86px;background:#0a52ff;font-size:34px}
  `;
  document.head.appendChild(st);

  // encabezado, saldo y nombre (iguales en las dos pantallas)
  const dec = (host, title) => {
    host.insertAdjacentHTML('afterbegin', '<img class="gl-logo" src="assets/giftlogo.webp" alt=""><i class="gl-sl"></i><div class="gl-h1">' + title + '</div><div class="gl-h2">GIFTING</div><div class="gl-bal"><i></i><span></span></div><div class="gl-user"></div>');
  };
  dec(C, 'CONFIRM PURCHASE'); dec(W, 'WRAP ZONE');
  C.querySelector('.h1') && (C.querySelector('.h1').style.display = 'none'); C.querySelector('.h2') && (C.querySelector('.h2').style.display = 'none');
  const bal = () => { const el = document.querySelector('[data-t="nav.vbucks"]'); return el ? el.textContent.trim() : '0'; };
  const who = () => { const el = document.querySelector('[data-t="player.name"]'); return el ? el.textContent.trim() : ''; };
  const sync = (h) => { h.querySelector('.gl-bal span').textContent = bal(); h.querySelector('.gl-user').textContent = who(); };

  // regalos: arte nuevo (apagado / vivo) y posiciones
  W.querySelectorAll('.wt').forEach((d, i) => {
    d.style.left = [542, 779, 1017, 1255][i] + 'px';
    if (!d.querySelector('.v')) d.insertAdjacentHTML('beforeend', '<img class="v" src="assets/wrapv' + i + '.webp" alt="" draggable="false">');
  });
  const wb = document.createElement('div'); wb.className = 'wback'; wb.textContent = 'BACK'; wb.onclick = () => W.classList.remove('on'); W.appendChild(wb);
  const h2 = W.querySelector('h2'); if (h2) h2.textContent = 'PERSONALIZE YOUR GIFT!';

  const pretty = (t) => String(t || '').toLowerCase().replace(/\b(\w)/g, (m) => m.toUpperCase());
  const refreshC = () => {
    sync(C);
    const it = window.__itm || {};
    const cnt = document.getElementById('cfcnt'); if (cnt) cnt.textContent = 'THE FOLLOWING:';
    const nm = document.getElementById('cfname'); if (nm) nm.textContent = it.nameRaw || pretty(it.title);
    const ths = [...document.querySelectorAll('#cfth .th')], w = 108, gap = 14, tot = ths.length * w + (ths.length - 1) * gap;
    ths.forEach((d, i) => { d.style.left = (1000 - tot / 2 + i * (w + gap)) + 'px'; });
    const pb = document.querySelector('#cfm .pbox'); pb.querySelectorAll('s').forEach((e) => e.remove());
    if (it.reg) { const s = document.createElement('s'); s.textContent = String(it.reg); pb.appendChild(s); }
    const price = +String(it.price || 0).replace(/\D/g, ''), have = +bal().replace(/\D/g, '');
    const buy = document.getElementById('cfbuy'), poor = have < price;
    buy.classList.toggle('poor', poor); buy.querySelector('b').textContent = poor ? 'GET V-BUCKS' : 'PURCHASE GIFT!';
    const rf = C.querySelector('.refund'); rf.innerHTML = 'Gifts purchased are not refundable. For more info visit:<br>fn.gg/giftingpolicy'; rf.style.top = poor ? '782px' : '802px';
  };
  new MutationObserver(() => { if (C.classList.contains('on')) refreshC(); }).observe(C, { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(() => { if (W.classList.contains('on')) sync(W); }).observe(W, { attributes: true, attributeFilter: ['class'] });
  // sin saldo: el botón amarillo lleva a V-Bucks
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest && e.target.closest('#cfbuy.poor'); if (!b) return;
    e.stopImmediatePropagation(); e.preventDefault(); C.classList.remove('on'); window.go && window.go('vbucks');
  }, true);
})();
