/* Animaciones y sonidos del simulador.
   Sonidos: archivos en assets/sfx/<nombre>.(mp3|wav|ogg|m4a). Sin archivo = silencio. Ver assets/sfx/README.txt */
(function () {
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
  #cfdone{animation:fxPop .55s cubic-bezier(.2,1.2,.4,1) both}
  #cfdone h3{animation:fxPop .6s .12s cubic-bezier(.2,1.3,.4,1) both}
  #cfdone p{animation:fxFade .4s .3s both}
  #cfsend{animation:fxFade .25s both}
  #cfsend span{animation:fxPulse 1s ease-in-out infinite}
  #cferr{animation:fxShake .45s both}
  #wrp{animation:fxFade .25s both}
  #shoprow.dyn .dt{animation:fxTile .45s cubic-bezier(.2,.9,.3,1) both;animation-delay:calc(var(--i,0)*22ms);transition:translate .15s,scale .15s,filter .15s}
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
  const SFX = (window.SFX = {
    vol: 0.9, active: {},
    async play(name, opts) {
      try {
        const b = await load(name); if (!b) return;
        const c = ac(); if (c.state === 'suspended') c.resume();
        const src = c.createBufferSource(), g = c.createGain();
        src.buffer = b; g.gain.value = (opts && opts.vol != null ? opts.vol : 1) * SFX.vol; src.connect(g).connect(c.destination);
        src.start(0); SFX.active[name] = src; return src;
      } catch (e) {}
    },
    stop(name) { try { SFX.active[name] && SFX.active[name].stop(); } catch (e) {} },
    names: ['click', 'tab', 'open', 'back', 'tick', 'buy-hold', 'gift-sending', 'gift-sent', 'error', 'wrap', 'chat'],
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
    if (t.closest('.hz,.gl.btn,.grow,#wopt,.opn')) { SFX.play('click'); }
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
  const init = () => {
    watch('cfsend', () => SFX.play('gift-sending'));
    watch('cfdone', () => { SFX.play('gift-sent'); confetti(document.getElementById('cfm') || document.getElementById('stage')); });
    watch('cferr', () => SFX.play('error'));
  };
  if (document.readyState === 'complete') setTimeout(init, 0); else addEventListener('load', () => setTimeout(init, 0));
})();
