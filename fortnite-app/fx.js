/* Animaciones y sonidos del simulador.
   Sonidos: archivos en assets/sfx/<nombre>.(mp3|wav|ogg|m4a). Sin archivo = silencio. Ver assets/sfx/README.txt */
(function () {
  if (/[?&]nofx=1/.test(location.search)) return;
  const css = document.createElement('style');
  css.textContent = `
  @keyframes fxScreen{from{opacity:0;translate:0 14px}to{opacity:1;translate:0 0}}
  @keyframes fxPop{0%{opacity:0;scale:.55}55%{opacity:1;scale:1.07}78%{scale:.97}100%{scale:1}}
  @keyframes fxFade{from{opacity:0}to{opacity:1}}
  @keyframes fxShake{0%,100%{translate:0 0}18%{translate:-12px 0}36%{translate:10px 0}54%{translate:-7px 0}72%{translate:4px 0}}
  @keyframes fxTile{from{opacity:0;translate:0 24px;scale:.94}to{opacity:1;translate:0 0;scale:1}}
  @keyframes fxArt{0%{opacity:0;translate:60px 0;scale:.9}100%{opacity:1;translate:0 0;scale:1}}
  @keyframes fxThumb{from{opacity:0;translate:-18px 0}to{opacity:1;translate:0 0}}
  @keyframes fxPulse{0%,100%{opacity:1}50%{opacity:.55}}
  @keyframes fxConf{0%{opacity:1;translate:0 0;rotate:0deg}100%{opacity:0;translate:var(--x) var(--y);rotate:var(--r)}}
  .screen:not([hidden]){animation:fxScreen .3s ease-out both}
  @keyframes fxSlideL{from{opacity:0;translate:-140px 0}to{opacity:1;translate:0 0}}
  @keyframes fxRise{from{opacity:0;translate:0 56px}to{opacity:1;translate:0 0}}
  @keyframes fxSweep{from{translate:-130% 0}to{translate:130% 0}}
  @keyframes fxScan{0%{translate:0 -70px;opacity:0}15%{opacity:1}85%{opacity:1}100%{translate:0 70px;opacity:0}}
  @keyframes fxGrow{from{scale:1 0;opacity:0}to{scale:1 1;opacity:1}}
  @keyframes fxGlow{0%,100%{text-shadow:0 0 0 #4db8ff}50%{text-shadow:0 0 26px #4db8ff}}
  @keyframes fxHolo{0%{-webkit-mask-size:100% 0%;mask-size:100% 0%;opacity:.72;filter:sepia(1) hue-rotate(148deg) saturate(2.6) brightness(1.8)}34%{-webkit-mask-size:100% 100%;mask-size:100% 100%;opacity:.78;filter:sepia(1) hue-rotate(148deg) saturate(2.6) brightness(1.7)}62%{-webkit-mask-size:100% 100%;mask-size:100% 100%;opacity:.9;filter:sepia(.3) hue-rotate(60deg) saturate(.25) brightness(1.6)}100%{-webkit-mask-size:100% 100%;mask-size:100% 100%;opacity:1;filter:none}}
  @keyframes fxFloor{0%{opacity:0;scale:.25 .6}30%{opacity:1;scale:.8 1}100%{opacity:0;scale:1.25 1}}
  @keyframes fxCube{0%{opacity:0;translate:0 0}25%{opacity:.95}100%{opacity:0;translate:var(--dx) var(--dy)}}
  .fxfloor{position:absolute;width:420px;height:84px;z-index:5;pointer-events:none;border-radius:50%;background:radial-gradient(ellipse,rgba(130,255,240,.95) 0,rgba(70,205,255,.45) 42%,transparent 70%),repeating-linear-gradient(0deg,rgba(255,255,255,.18) 0 1px,transparent 1px 9px);animation:fxFloor .55s ease-out both}
  .fxcube{position:absolute;z-index:6;pointer-events:none;background:rgba(130,250,255,.8);box-shadow:0 0 8px #5ff;animation:fxCube .6s ease-out both}
  @keyframes fxBand{from{translate:0 0;opacity:1}to{translate:0 calc(var(--h,900px)*-1 - 40px);opacity:.9}}
  .fxholo{-webkit-mask:linear-gradient(#000 0 0) bottom/100% 100% no-repeat;mask:linear-gradient(#000 0 0) bottom/100% 100% no-repeat;animation:fxHolo .75s cubic-bezier(.3,.7,.3,1) both}
  .fxband{position:absolute;height:44px;z-index:6;pointer-events:none;background:linear-gradient(to top,rgba(110,210,255,.95),rgba(110,210,255,0));box-shadow:0 0 28px 6px rgba(70,180,255,.7);animation:fxBand .75s cubic-bezier(.3,.7,.3,1) forwards}
  /* lista de regalos */
  .grow{overflow:hidden}
  .grow::after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(100deg,transparent 35%,rgba(120,205,255,.5) 50%,transparent 65%);translate:-130% 0}
  .screen[data-screen="gift"]:not([hidden]) .grow::after{animation:fxSweep .7s calc(.25s + var(--i,0)*70ms) ease-out both}
  .screen[data-screen="gift"]:not([hidden]) [data-t^="gif.gif"]{animation:fxSlideL .5s .1s cubic-bezier(.2,.9,.3,1) both}
  /* confirmar compra */
  #cfm.on .h1{animation:fxSlideL .5s cubic-bezier(.2,.9,.3,1) both}
  #cfm.on .h2{animation:fxSlideL .5s .08s cubic-bezier(.2,.9,.3,1) both}
  #cfm.on .av{animation:fxPop .55s .12s cubic-bezier(.2,1.2,.4,1) both}
  #cfm.on .who{animation:fxSlideL .45s .2s cubic-bezier(.2,.9,.3,1) both}
  #cfm.on .cnt{animation:fxPop .6s .28s cubic-bezier(.2,1.3,.4,1) both}
  #cfm.on .iname{animation:fxRise .45s .38s both}
  #cfm.on .th{animation:fxPop .5s calc(.45s + var(--k,0)*90ms) cubic-bezier(.2,1.3,.4,1) both}
  #cfm.on .th::after{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(100deg,transparent 35%,rgba(140,215,255,.55) 50%,transparent 65%);translate:-130% 0;animation:fxSweep .6s calc(.7s + var(--k,0)*90ms) ease-out both}
  #cfm.on .pbox{animation:fxRise .45s .6s both}
  #cfm.on .buy{animation:fxRise .45s .7s both}
  #cfm.on .back,#cfm.on .wopt,#cfm.on .refund{animation:fxFade .4s .85s both}
  /* enviando */
  #cfm .send span{animation:fxRise .5s cubic-bezier(.2,.9,.3,1) both}
  /* regalo enviado */
  #cfm .done::before{content:'';position:absolute;left:0;right:0;top:250px;height:430px;background:linear-gradient(transparent,rgba(60,150,255,.28),transparent);transform-origin:center;animation:fxGrow .6s cubic-bezier(.2,.9,.3,1) both;pointer-events:none}
  #cfm .done p{animation:fxRise .45s .3s both}
  #cfm .done .ok{animation:fxRise .45s .55s both}
  #cfm .done h3{animation:fxPop .6s .12s cubic-bezier(.2,1.3,.4,1) both}
  #cfth .th:nth-child(1){--k:0}
  #cfth .th:nth-child(2){--k:1}
  #cfth .th:nth-child(3){--k:2}
  #cfth .th:nth-child(4){--k:3}
  #cfth .th:nth-child(5){--k:4}
  #cfth .th:nth-child(6){--k:5}
  #cfth .th:nth-child(7){--k:6}
  #cfth .th:nth-child(8){--k:7}
  #cfth .th:nth-child(9){--k:8}
  #cfth .th:nth-child(10){--k:9}
  #cfth .th:nth-child(11){--k:10}
  #cfth .th:nth-child(12){--k:11}
  #cfth .th:nth-child(13){--k:12}
  #cfth .th:nth-child(14){--k:13}
  .screen[data-screen="gift"]:not([hidden]) [data-t="gif.r0n"],.screen[data-screen="gift"]:not([hidden]) [data-t="gif.r0p"],.screen[data-screen="gift"]:not([hidden]) [data-t="gif.r0o"]{animation:fxSlideL .5s 150ms cubic-bezier(.2,.9,.3,1) both}
  .screen[data-screen="gift"]:not([hidden]) [data-t="gif.r1n"],.screen[data-screen="gift"]:not([hidden]) [data-t="gif.r1p"],.screen[data-screen="gift"]:not([hidden]) [data-t="gif.r1o"]{animation:fxSlideL .5s 220ms cubic-bezier(.2,.9,.3,1) both}
  .screen[data-screen="gift"]:not([hidden]) [data-t="gif.r2n"],.screen[data-screen="gift"]:not([hidden]) [data-t="gif.r2p"],.screen[data-screen="gift"]:not([hidden]) [data-t="gif.r2o"]{animation:fxSlideL .5s 290ms cubic-bezier(.2,.9,.3,1) both}
  .screen[data-screen="gift"]:not([hidden]) [data-t="gif.r3n"],.screen[data-screen="gift"]:not([hidden]) [data-t="gif.r3p"],.screen[data-screen="gift"]:not([hidden]) [data-t="gif.r3o"]{animation:fxSlideL .5s 360ms cubic-bezier(.2,.9,.3,1) both}
  .screen[data-screen="gift"]:not([hidden]) [data-t="gif.r4n"],.screen[data-screen="gift"]:not([hidden]) [data-t="gif.r4p"],.screen[data-screen="gift"]:not([hidden]) [data-t="gif.r4o"]{animation:fxSlideL .5s 430ms cubic-bezier(.2,.9,.3,1) both}
  .screen[data-screen="gift"]:not([hidden]) [data-t="gif.r5n"],.screen[data-screen="gift"]:not([hidden]) [data-t="gif.r5p"],.screen[data-screen="gift"]:not([hidden]) [data-t="gif.r5o"]{animation:fxSlideL .5s 500ms cubic-bezier(.2,.9,.3,1) both}

  #cfdone{animation:fxPop .55s cubic-bezier(.2,1.2,.4,1) both}
  #cfdone h3{animation:fxPop .6s .12s cubic-bezier(.2,1.3,.4,1) both}
  #cfdone p{animation:fxFade .4s .3s both}
  #cfsend{animation:fxFade .25s both}
  #cferr{animation:fxShake .45s both}
  #wrp{animation:fxFade .25s both}
  #shoprow.dyn .dt{animation:fxTile .45s cubic-bezier(.2,.9,.3,1) backwards;animation-delay:calc(var(--i,0)*22ms);transition:translate .15s,scale .15s,filter .15s}
  #shoprow.dyn .dt:hover{scale:1.025;filter:brightness(1.08)}
  #shoprow.dyn .dt:active{scale:.97}
  #dynart{animation:fxArt .6s cubic-bezier(.2,1.2,.4,1) both}
  #thumbs .tsl{animation:fxThumb .4s both}
  #thumbs .tsl:nth-child(2){animation-delay:.05s}#thumbs .tsl:nth-child(3){animation-delay:.1s}#thumbs .tsl:nth-child(4){animation-delay:.15s}#thumbs .tsl:nth-child(n+5){animation-delay:.2s}
  .fxconf{position:absolute;left:50%;top:44%;width:14px;height:22px;border-radius:3px;pointer-events:none;z-index:30;animation:fxConf 1.4s cubic-bezier(.1,.7,.3,1) forwards}`;
  document.head.appendChild(css);

  // ---------- sonido ----------
  const EXT = ['mp3', 'wav', 'ogg', 'm4a'];
  const buffers = {}, missing = {}, loading = {};
  let ctx = null, unlocked = false;
  const ac = () => ctx || (ctx = new (window.AudioContext || window.webkitAudioContext)());
  async function load(name) {
    if (buffers[name] || missing[name]) return buffers[name];
    if (loading[name]) return loading[name];
    loading[name] = (async () => {
      for (const ext of EXT) {
        try {
          const r = await fetch('assets/sfx/' + name + '.' + ext);
          if (!r.ok) continue;
          buffers[name] = await ac().decodeAudioData(await r.arrayBuffer());
          return buffers[name];
        } catch (e) {}
      }
      missing[name] = true;
    })();
    return loading[name];
  }
  const FALL = { tab: 'click', open: 'click', back: 'click' };
  const SFX = (window.SFX = {
    vol: 0.9, active: {},
    async play(name, opts) {
      try {
        let b = await load(name); if (!b && FALL[name]) b = await load(FALL[name]); // sin archivo propio, suena el click
        if (!b) return;
        const c = ac(); if (c.state === 'suspended') c.resume();
        const src = c.createBufferSource(), g = c.createGain();
        src.buffer = b; g.gain.value = (opts && opts.vol != null ? opts.vol : 1) * SFX.vol; src.connect(g).connect(c.destination);
        src.start(0); SFX.active[name] = src; return src;
      } catch (e) {}
    },
    stop(name) { try { SFX.active[name] && SFX.active[name].stop(); } catch (e) {} },
    names: ['click', 'tab', 'open', 'back', 'tick', 'buy-hold', 'gift-sending', 'gift-sent', 'gift-open', 'gift-pick', 'social-open', 'social-close', 'friend-sent', 'error', 'wrap', 'chat'],
  });
  const unlock = () => { if (unlocked) return; unlocked = true; try { const c = ac(); if (c.state === 'suspended') c.resume(); } catch (e) {} SFX.names.forEach((n) => load(n)); };
  ['pointerdown', 'touchstart', 'keydown'].forEach((ev) => addEventListener(ev, unlock, { once: false, passive: true }));

  // ---------- disparadores ----------
  const T = (e) => (e.target && e.target.closest ? e.target : document.body);
  document.addEventListener('pointerdown', (e) => {
    const t = T(e);
    if (t.closest('#cfbuy')) { SFX.play('buy-hold'); return; }
    if (t.closest('#cfback,#cfok,.hz[data-go2="shop"],#wok')) { SFX.play('back'); return; }
    if (t.closest('.ic.tab,[data-go]')) { SFX.play('tab'); return; }
    if (t.closest('.dt,.hz[data-go2="detail"]')) { SFX.play('open'); return; }
    if (t.closest('.wt')) { SFX.play('wrap'); return; }
    if (t.closest('.hz,.gl.btn,#wopt,.opn')) { SFX.play('click'); }  // las filas de usuarios (.grow) suenan al abrir Confirm
  }, true);
  document.addEventListener('pointerup', (e) => { if (!(e.target.closest && e.target.closest('#cfbuy'))) return; SFX.stop('buy-hold'); }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target && e.target.id === 'chatin') SFX.play('chat'); }, true);

  const shown = (el) => el && getComputedStyle(el).display !== 'none';
  function watch(id, fn) {
    const el = document.getElementById(id); if (!el) return;
    let was = shown(el);
    new MutationObserver(() => { const now = shown(el); if (now && !was) fn(el); was = now; }).observe(el, { attributes: true, attributeFilter: ['style', 'class'] });
  }
  function confetti(host) {
    const cols = ['#ffd23a', '#ff4fa3', '#5cf2f3', '#7cff6b', '#ffffff', '#7aa2ff'];
    for (let i = 0; i < 44; i++) {
      const p = document.createElement('i'); p.className = 'fxconf';
      const a = Math.random() * Math.PI * 2, d = 260 + Math.random() * 520;
      p.style.setProperty('--x', Math.round(Math.cos(a) * d) + 'px'); p.style.setProperty('--y', Math.round(Math.sin(a) * d * .8 - 90) + 'px'); p.style.setProperty('--r', Math.round(Math.random() * 720 - 360) + 'deg');
      p.style.background = cols[i % cols.length]; p.style.animationDelay = (Math.random() * 0.12).toFixed(2) + 's';
      host.appendChild(p); setTimeout(() => p.remove(), 1700);
    }
  }

  // ---------- video: aparece de abajo hacia arriba con efecto holograma azul ----------
  let lastHolo = 0;
  function holo(el) {
    try {
      if (/[?&]noholo=1/.test(location.search)) return;
      if (Date.now() - lastHolo < 700) return; lastHolo = Date.now(); // evita que se repita dos veces seguidas
      const scr = document.body.dataset.screen;
      if (!['detail', 'gift'].includes(scr)) return; // en el lobby (home) y el casillero el personaje carga normal
      const cv = document.getElementById('itemcv'), ref = el.style.left ? el : cv; if (!ref || !ref.parentNode) return;
      window.__fnStep && window.__fnStep('holograma'); el.classList.remove('fxholo'); void el.offsetWidth; el.classList.add('fxholo');
      el.addEventListener('animationend', function f(e) { if (e.animationName === 'fxHolo') { el.classList.remove('fxholo'); el.removeEventListener('animationend', f); } });
      // disco brillante en el piso + cubitos flotando, como en el juego
      const cx = scr === 'gift' ? 1420 : 1365, fy = scr === 'gift' ? 690 : 765, host = ref.parentNode, els = [];
      const fl = document.createElement('div'); fl.className = 'fxfloor'; fl.style.left = (cx - 210) + 'px'; fl.style.top = (fy - 42) + 'px'; host.appendChild(fl); els.push(fl);
      for (let k = 0; k < 7; k++) {
        const c = document.createElement('i'), sz = 7 + Math.round(Math.random() * 7);
        c.className = 'fxcube'; c.style.cssText = 'width:' + sz + 'px;height:' + sz + 'px;left:' + (cx - 170 + Math.random() * 340) + 'px;top:' + (fy - 520 + Math.random() * 480) + 'px;animation-delay:' + (60 + Math.random() * 260).toFixed(0) + 'ms;--dx:' + (Math.random() * 40 - 20).toFixed(0) + 'px;--dy:' + (-30 - Math.random() * 50).toFixed(0) + 'px';
        host.appendChild(c); els.push(c);
      }
      setTimeout(() => els.forEach((x) => x.remove()), 1100);
    } catch (e) {}
  }

  const initHolo = () => {
    const cv = document.getElementById('itemcv'), v = document.getElementById('itemvid'); if (!cv || !v) return;
    let on = cv.classList.contains('on');
    new MutationObserver(() => { const now = cv.classList.contains('on'); if (now && !on) holo(cv); on = now; }).observe(cv, { attributes: true, attributeFilter: ['class'] });
    v.addEventListener('loadeddata', () => { if (v.classList.contains('nat')) holo(v); });
    // al salir y volver a entrar (ficha o regalos) el efecto se repite
    new MutationObserver(() => {
      const sc = document.body.dataset.screen; if (sc !== 'detail' && sc !== 'gift') return;
      [250].forEach((ms) => setTimeout(() => {
        if (document.body.dataset.screen !== sc) return;
        const el = v.classList.contains('nat') ? v : cv;
        if (el === v ? v.readyState >= 2 : cv.classList.contains('on')) holo(el);
      }, ms));
    }).observe(document.body, { attributes: true, attributeFilter: ['data-screen'] });
  };
  // al entrar a la pantalla de regalos (Gifting) suena gift-open
  // al elegir un usuario se abre Confirm Purchase y suena gift-pick
  const initPickSound = () => {
    const c = document.getElementById('cfm'); if (!c) return; let on = c.classList.contains('on');
    new MutationObserver(() => { const now = c.classList.contains('on'); if (now && !on) SFX.play('gift-pick'); on = now; }).observe(c, { attributes: true, attributeFilter: ['class'] });
  };
  const initGiftSound = () => {
    let last = document.body.dataset.screen;
    new MutationObserver(() => { const now = document.body.dataset.screen; if (now === 'gift' && last !== 'gift') SFX.play('gift-open'); last = now; }).observe(document.body, { attributes: true, attributeFilter: ['data-screen'] });
  };
  const initRows = () => { document.querySelectorAll('.grow').forEach((el, i) => el.style.setProperty('--i', i)); };
  const init = () => {
    initHolo(); initGiftSound(); initPickSound(); setTimeout(initRows, 300);
    watch('cfsend', () => SFX.play('gift-sending'));
    watch('cfdone', () => { SFX.play('gift-sent'); });
    watch('cferr', () => SFX.play('error'));
  };
  if (document.readyState === 'complete') setTimeout(init, 0); else addEventListener('load', () => setTimeout(init, 0));
})();
