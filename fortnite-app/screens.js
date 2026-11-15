/* Pantallas Search y Library (barra superior: lupa y corazón). Textos en inglés.
   Imágenes opcionales en assets/discover/<nombre>.webp (si no existen se ve el degradado). */
(function () {
  const stage = document.getElementById('stage'), nav = document.getElementById('nav');
  if (!stage || !nav || typeof window.go !== 'function') return;
  const st = document.createElement('style');
  st.textContent = `
  body[data-screen="search"] #vwrap,body[data-screen="library"] #vwrap{display:none}
  body[data-screen="search"] #bgfx,body[data-screen="library"] #bgfx{background:radial-gradient(ellipse at 30% 10%,#2a1a8a,#120a4a 60%,#0b0638);filter:none}
  body[data-screen="search"] #bgfill,body[data-screen="library"] #bgfill{background:#150c52}
  body[data-screen="search"] img[src*="ic_search"],body[data-screen="library"] img[src*="ic_heart"]{filter:brightness(0) opacity(.85)}
  .ntile2{position:absolute;top:24px;width:102px;height:76px;border-radius:8px;background:rgba(190,206,238,.92);display:none}
  .nlab2{display:none;position:absolute;top:121px;transform:translate(-50%,-50%);font:800 24.4px Montserrat;color:#fff;text-shadow:0 3px 4px rgba(0,0,0,.45)}
  body[data-screen="search"] .on-search,body[data-screen="library"] .on-library{display:block}
  .dsc{position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;padding:0 0 120px;font-family:Montserrat,system-ui;color:#fff}
  .dsc::-webkit-scrollbar{display:none}
  .dsc h2{margin:0;font:700 32px Montserrat;letter-spacing:.2px}
  .dsc .sub{font:500 22px Montserrat;color:#c9c9ee;margin-top:2px}
  .dsc .row{display:flex;gap:20px;padding-left:152px;overflow:visible}
  .dc{position:relative;flex:none;width:425px;height:238px;border-radius:10px;overflow:hidden;background:var(--g,#2b2b6a) center/cover no-repeat;cursor:pointer;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);transition:scale .15s}
  .dc:active{scale:.97}
  .dc.s{height:190px}
  .dc .t{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font:italic 400 54px/.95 'Archivo Black';text-shadow:0 4px 10px rgba(0,0,0,.45);padding:10px;color:var(--c,#fff)}
  .dc .t small{font:400 22px 'Archivo Black';display:block;margin-top:8px;font-style:normal}
  .dc .pl{position:absolute;left:6px;bottom:5px;min-width:96px;box-sizing:border-box;background:#0c0c30;border-radius:12px;padding:3px 12px;font:600 19px Montserrat;color:#fff}
  .dc .ep{position:absolute;left:10px;top:10px;width:26px;height:30px;background:rgba(255,255,255,.88);border-radius:5px;color:#222;font:900 15px/30px Montserrat;text-align:center;font-style:normal}
  .search-in{position:absolute;left:155px;top:165px;width:1763px;height:75px;border:3px solid #aeb6ec;border-radius:14px;background:#3b2f86;box-sizing:border-box;display:flex;align-items:center;padding:0 24px}
  .search-in input{flex:1;background:none;border:0;outline:0;color:#fff;font:600 26px Montserrat;caret-color:#fff}
  .search-in input::placeholder{color:#c7c9ef;opacity:.9}
  .search-in i{width:20px;height:20px;border:3px solid #fff;border-radius:50%;position:relative}
  .search-in i::after{content:'';position:absolute;right:-9px;bottom:-8px;width:10px;height:3px;background:#fff;transform:rotate(45deg);border-radius:2px}
  .lib-t{position:absolute;left:162px;top:165px;font:italic 400 50px 'Archivo Black'}
  .lc{position:relative;flex:none;border-radius:8px;overflow:hidden;background:var(--g,#2b2b6a) center/cover no-repeat;cursor:pointer}
  .lc.cur{box-shadow:0 0 0 4px #e8ecff}
  .lc .nm{position:absolute;left:12px;top:92px;font:500 22px Montserrat;text-shadow:0 1px 4px #000}
  .lc .lk{position:absolute;left:10px;bottom:8px;background:rgba(10,10,40,.7);border-radius:12px;padding:3px 10px;font:600 19px Montserrat}
  .lc .mo{position:absolute;right:8px;bottom:8px;width:34px;height:30px;border-radius:7px;background:#e6e9ff;color:#2a2a7a;text-align:center;font:900 22px/22px Montserrat;letter-spacing:-1px}
  .empty{display:flex;gap:20px;padding-left:158px;position:relative}
  .empty b{flex:none;width:217px;height:122px;border-radius:12px;background:rgba(60,60,160,.22)}
  .emsg{position:absolute;left:0;right:0;top:36px;text-align:center}
  .emsg h3{margin:0;font:italic 400 34px 'Archivo Black';letter-spacing:.3px}.emsg p{margin:4px 0 0;font:500 22px Montserrat;color:#d4d4f4}
  .bbar{position:absolute;right:62px;bottom:52px;display:flex;gap:20px;align-items:center}
  .bbar div{height:68px;padding:0 28px;border-radius:10px;background:rgba(96,90,206,.78);color:#17134f;font:italic 400 27px/68px 'Archivo Black';cursor:pointer}
  .bbar div.m{width:68px;padding:0;position:relative}
  .bbar div.m::before{content:'';position:absolute;left:25px;top:14px;width:18px;height:28px;border:3px solid #17134f;border-radius:10px}
  .bbar div.m::after{content:'';position:absolute;left:33px;top:48px;width:3px;height:9px;background:#17134f}
  @keyframes dscIn{from{opacity:0;translate:0 40px}to{opacity:1;translate:0 0}}
  .screen:not([hidden]) .dc,.screen:not([hidden]) .lc{animation:dscIn .45s cubic-bezier(.2,.9,.3,1) backwards;animation-delay:calc(var(--k,0)*55ms + .1s)}
  .screen:not([hidden]) .search-in{animation:dscIn .4s both}
  `;
  document.head.appendChild(st);

  const mk = (g, c, k, o) => `<div class="dc ${o.s ? 's' : ''}" style="--g:${g};--c:${c};--k:${k};background-image:url(assets/discover/${o.img}.webp),${g}">${o.p ? '<span class="pl">' + o.p + '</span>' : ''}</div>`;
  const picks = [
    ['linear-gradient(135deg,#c9b894,#8a7656)', '#e7b52a', 0, { img: 'br', t: 'BATTLE<br>ROYALE<small style="color:#2a2418">TREASURE HOURS</small>', ep: 1, p: '3.7M' }],
    ['linear-gradient(135deg,#1c67c9,#0f3f8a)', '#f2c230', 1, { img: 'reload', t: 'RELOAD', ep: 1, p: '45.1K' }],
    ['linear-gradient(135deg,#40b7ab,#c9bd9b)', '#fff', 2, { img: 'festival', t: 'FESTIVAL<small style="color:#f2c230">MAIN STAGE</small>', ep: 1, p: '8.3K' }],
    ['linear-gradient(135deg,#171717,#4b3a05)', '#f2c230', 3, { img: 'blitz', t: 'BLITZ<br>ROYALE<small style="color:#fff">ONE PIECE</small>', ep: 1, p: '11.7K' }],
    ['linear-gradient(135deg,#3a4a8f,#1a2250)', '#fff', 4, { img: 'next', t: '', ep: 1, p: '12.1K' }],
  ].map((a) => mk(...a)).join('');
  const cols = [
    ['linear-gradient(135deg,#1c4f63,#0b1d2b)', '#ff8a3c', 5, { img: 'thrills', t: 'THRILLS<br>&amp; CHILLS', s: 1 }],
    ['linear-gradient(135deg,#2b2b2b,#0d0d0d)', '#fff', 6, { img: 'starwars', t: 'STAR<br>WARS', s: 1 }],
    ['linear-gradient(135deg,#2a8de6,#6ac3f7)', '#2b3fb5', 7, { img: 'fallguys', t: 'FALL<br>GUYS', s: 1 }],
  ].map((a) => mk(...a)).join('');

  const search = document.createElement('section');
  search.className = 'screen'; search.dataset.screen = 'search'; search.hidden = true;
  search.innerHTML = `<div class="search-in"><input id="dsin" type="text" placeholder="Explore Discover..." autocomplete="off" autocapitalize="off" spellcheck="false"><i></i></div>
  <div class="dsc" style="top:262px"><h2 style="padding-left:152px;margin-top:6px">Epic's Picks</h2><div class="row" style="margin-top:20px">${picks}</div>
  <h2 style="padding-left:152px;margin-top:44px">Game Collections</h2><div class="sub" style="padding-left:152px">Games created through popular collaborations</div><div class="row" style="margin-top:14px">${cols}</div></div>
  <div class="bbar"><div class="m"></div><div>CHAT</div></div>`;

  const lc = (g, k, o) => `<div class="lc ${o.sel ? 'cur' : ''}" style="--g:${g};--k:${k};width:${o.w}px;height:${o.h}px;background-image:url(assets/discover/${o.img}.webp),${g}"></div>`;
  const lib = document.createElement('section');
  lib.className = 'screen'; lib.dataset.screen = 'library'; lib.hidden = true;
  lib.innerHTML = `<div class="lib-t">LIBRARY</div>
  <div class="dsc" style="top:250px"><h2 style="padding-left:152px">Continue Playing</h2>
  <div class="row" style="margin-top:14px;align-items:center;padding-left:148px;gap:18px">${lc('linear-gradient(135deg,#c2209a,#3b2a8f)', 0, { img: 'p1', w: 284, h: 160, sel: 1, n: 'Piece Control 1v1', l: '94%', d: 1 })}${lc('linear-gradient(135deg,#6b2fa3,#1b2a6b)', 1, { img: 'p2', w: 270, h: 152, l: '94%' })}${lc('linear-gradient(135deg,#c9b894,#8a7656)', 2, { img: 'p3', w: 274, h: 154, l: '80%' })}</div>
  <div class="empty" style="margin-top:78px"><b></b><b></b><b></b><b></b><b></b><b></b><b></b><div class="emsg"><h3>NO FOLLOWED CREATORS</h3><p>This category is empty at the moment</p></div></div></div>
  <div class="bbar"><div class="m"></div><div>CHAT</div><div>OPTIONS</div><div data-go="lobby">BACK</div></div>`;
  stage.appendChild(search); stage.appendChild(lib);

  // barra superior: cuadro de selección, etiqueta y zona de toque para la lupa y el corazón
  [['search', 68, 119, 'SEARCH'], ['library', 171, 222, 'LIBRARY']].forEach(([id, tl, cx, label]) => {
    const t = document.createElement('div'); t.className = 'ntile2 on-' + id; t.style.left = tl + 'px'; nav.insertBefore(t, nav.firstChild);
    const l = document.createElement('div'); l.className = 'nlab2 on-' + id; l.style.left = cx + 'px'; l.textContent = label; nav.appendChild(l);
    const z = document.createElement('div'); z.className = 'hit'; z.dataset.go = id;
    z.style.cssText = 'position:absolute;left:' + (cx - 48) + 'px;top:0;width:96px;height:130px;z-index:30;cursor:pointer;pointer-events:auto;-webkit-tap-highlight-color:transparent'; nav.appendChild(z);
  });

  // ===== Treasure (Adventure): mapa actualizado y tarjetas que se abren al tocar cada semana =====
  const tr = document.querySelector('.screen[data-screen="treasure"]');
  if (tr) {
    const st2 = document.createElement('style');
    st2.textContent = `
    .screen[data-screen="treasure"] .t,.screen[data-screen="treasure"] .ul{display:none!important}
    #trmap{position:absolute;left:0;top:140px;width:2000px;height:781px;pointer-events:none;-webkit-mask-image:linear-gradient(transparent,#000 10px);mask-image:linear-gradient(transparent,#000 10px)}
    .trc{position:absolute;display:none;pointer-events:none;transform-origin:var(--ox,50%) var(--oy,50%)}
    .trc.on{display:block;animation:trpop .32s cubic-bezier(.2,1.25,.4,1) both}
    @keyframes trpop{from{opacity:0;scale:.55}to{opacity:1;scale:1}}
    .trh{position:absolute;z-index:6;cursor:pointer}
    `;
    document.head.appendChild(st2);
    const map = document.createElement('img'); map.id = 'trmap'; map.src = 'assets/tr_map.webp'; map.alt = ''; map.draggable = false; tr.appendChild(map);
    // [imagen, x, y, w, h] de cada tarjeta abierta · zona táctil de la tarjeta cerrada
    const C = [[320, 360, 340, 385, 435, 580, 108, 116], [605, 115, 330, 385, 715, 337, 108, 116], [825, 330, 315, 375, 912, 548, 110, 130], [1020, 120, 330, 380, 1127, 340, 110, 116], [1225, 420, 315, 370, 1327, 630, 110, 114], [1445, 100, 325, 395, 1508, 235, 200, 220]];
    const cards = [];
    C.forEach(([x, y, w, h, hx, hy, hw, hh], i) => {
      const im = document.createElement('img'); im.className = 'trc'; im.src = 'assets/tr_c' + (i + 1) + '.webp'; im.alt = ''; im.draggable = false;
      im.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;--ox:' + ((hx + hw / 2 - x) / w * 100).toFixed(0) + '%;--oy:' + ((hy + hh / 2 - y) / h * 100).toFixed(0) + '%;z-index:5';
      tr.appendChild(im); cards.push(im);
      const z = document.createElement('div'); z.className = 'trh'; z.style.cssText = 'left:' + hx + 'px;top:' + hy + 'px;width:' + hw + 'px;height:' + hh + 'px';
      z.onclick = () => { const was = im.classList.contains('on'); cards.forEach((c) => c.classList.remove('on')); if (!was) { void im.offsetWidth; im.classList.add('on'); } };
      tr.appendChild(z);
    });
    // tocar fuera cierra la tarjeta abierta
    tr.addEventListener('click', (e) => { if (!e.target.closest('.trh')) cards.forEach((c) => c.classList.remove('on')); });
    new MutationObserver(() => { if (tr.hidden) cards.forEach((c) => c.classList.remove('on')); }).observe(tr, { attributes: true, attributeFilter: ['hidden'] });
  }

  // ===== Compete (trofeo) =====
  const cmp = document.createElement('section'); cmp.className = 'screen'; cmp.dataset.screen = 'compete'; cmp.hidden = true;
  cmp.innerHTML = '<img src="assets/cp_main.webp" alt="" draggable="false" style="position:absolute;left:0;top:130px;width:2000px;height:791px;-webkit-mask-image:linear-gradient(transparent,#000 10px);mask-image:linear-gradient(transparent,#000 10px)">';
  stage.appendChild(cmp);
  const st3 = document.createElement('style');
  st3.textContent = `
  body[data-screen="compete"] #vwrap{display:none}
  body[data-screen="compete"] #bgfx{background:linear-gradient(#0a1655,#070f3d 60%,#050a2c);filter:none}
  body[data-screen="compete"] #bgfill{background:#070f3d}
  body[data-screen="compete"] img[src*="ic_trophy"]{filter:brightness(0) opacity(.85)}
  body[data-screen="compete"] .on-compete{display:block}`;
  document.head.appendChild(st3);
  { const id = 'compete', tl = 898, cx = 949, label = 'COMPETE';
    const t = document.createElement('div'); t.className = 'ntile2 on-' + id; t.style.left = tl + 'px'; nav.insertBefore(t, nav.firstChild);
    const l = document.createElement('div'); l.className = 'nlab2 on-' + id; l.style.left = cx + 'px'; l.textContent = label; nav.appendChild(l);
    const z = document.createElement('div'); z.className = 'hit'; z.dataset.go = id;
    z.style.cssText = 'position:absolute;left:' + (cx - 48) + 'px;top:0;width:96px;height:130px;z-index:30;cursor:pointer;pointer-events:auto;-webkit-tap-highlight-color:transparent'; nav.appendChild(z); }

  // los botones BACK de estas pantallas
  stage.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('.bbar [data-go]'); if (b) window.go(b.dataset.go); });
  // al volver al lobby desde otra pantalla el icono de tienda etc. se maneja con go(); aquí solo hay que ocultar los iconos .tab seleccionados
})();
