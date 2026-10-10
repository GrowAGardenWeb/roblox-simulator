// MoneyScripts — "Add to Home Screen" step-by-step onboarding.
// Exposes window.MS_showOnboarding(onDone). access-gate.js calls this right
// after granting access, BEFORE revealing the real app content — so new
// visitors see "make this feel like a real app" first, then the app.
// Shown once per device per product (localStorage flag); on a repeat visit
// it calls onDone() immediately with nothing rendered.
(function () {
  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }

  // True once this page is actually launched from a home-screen icon
  // (standalone mode, no browser chrome) — at that point there's nothing
  // left to walk the visitor through, so never show the tutorial again,
  // even if localStorage got cleared or this is a different browser.
  function isStandalone() {
    try {
      if (window.navigator.standalone) return true; // iOS Safari
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
    } catch (e) {}
    return false;
  }

  window.MS_showOnboarding = function (onDone) {
    var FLAG = 'ms_seen_a2hs_' + (window.MS_REQUIRED_PRODUCT || 'app');
    function seen() {
      try { return !!localStorage.getItem(FLAG); } catch (e) { return false; }
    }
    function markSeen() {
      try { localStorage.setItem(FLAG, '1'); } catch (e) {}
    }

    if (isStandalone() || seen() || window.innerWidth > 640) { onDone(); return; }

    var ios = isIOS();
    var steps = ios
      ? [
          { icon: '&#8679;', text: 'Toca el ícono de <b>Compartir</b> (el cuadrado con la flecha hacia arriba) en la barra de abajo.', arrow: 'bottom' },
          { icon: '&#10133;', text: 'Baja en el menú y toca <b>"Agregar a Inicio"</b>.', arrow: 'bottom' },
          { icon: '&#9989;', text: 'Toca <b>Agregar</b> arriba a la derecha. El ícono ahora abre a pantalla completa, como una app real — sin barra del navegador.', arrow: 'top-right' },
        ]
      : [
          { icon: '&#8942;', text: 'Toca el menú <b>⋮</b> (tres puntos), arriba a la derecha.', arrow: 'top-right' },
          { icon: '&#10133;', text: 'Toca <b>"Agregar a pantalla de inicio"</b> (o "Instalar app").', arrow: 'top-right' },
          { icon: '&#9989;', text: 'Confirma. El ícono ahora abre a pantalla completa, como una app real — sin barra del navegador.', arrow: null },
        ];

    var style = document.createElement('style');
    style.textContent =
      '.ms-ob{position:fixed;inset:0;z-index:999999;background:#07070c;display:flex;flex-direction:column;' +
      'align-items:center;justify-content:center;padding:28px 24px;font-family:-apple-system,BlinkMacSystemFont,Inter,system-ui,sans-serif;' +
      'color:#f5f5f7;text-align:center}' +
      '.ms-ob-dots{display:flex;gap:6px;margin-bottom:30px}' +
      '.ms-ob-dot{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.18);transition:background .2s,width .2s}' +
      '.ms-ob-dot.on{background:#0a84ff;width:20px;border-radius:4px}' +
      '.ms-ob-icon{width:84px;height:84px;border-radius:22px;background:#121219;border:1px solid rgba(255,255,255,.1);' +
      'display:flex;align-items:center;justify-content:center;font-size:36px;margin-bottom:24px}' +
      '.ms-ob-kicker{font-size:11px;font-weight:700;color:#0a84ff;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px}' +
      '.ms-ob-text{font-size:16px;line-height:1.55;max-width:300px;margin-bottom:38px}' +
      '.ms-ob-text b{color:#fff}' +
      '.ms-ob-row{display:flex;flex-direction:column;gap:10px;width:100%;max-width:280px}' +
      '.ms-ob-continue{background:#0a84ff;color:#fff;border:none;border-radius:13px;padding:14px;font-size:15px;font-weight:700;cursor:pointer}' +
      '.ms-ob-skip{background:none;border:none;color:#55555f;font-size:13px;padding:8px;cursor:pointer}' +
      '.ms-ob-arrow{position:fixed;font-size:38px;line-height:1;color:#0a84ff;text-shadow:0 0 14px rgba(10,132,255,.6);' +
      'pointer-events:none;z-index:1000000;animation:msObBounce 1.1s ease-in-out infinite}' +
      '.ms-ob-arrow.bottom{left:50%;bottom:14px;transform:translateX(-50%)}' +
      '.ms-ob-arrow.top-right{right:16px;top:14px}' +
      '@keyframes msObBounce{0%,100%{opacity:.55}50%{opacity:1}}';
    document.head.appendChild(style);

    var overlay = document.createElement('div');
    overlay.className = 'ms-ob';
    document.body.appendChild(overlay);

    var idx = 0;
    function render() {
      var step = steps[idx];
      var dots = steps.map(function (_, i) { return '<div class="ms-ob-dot' + (i === idx ? ' on' : '') + '"></div>'; }).join('');
      var arrowHtml = step.arrow
        ? '<div class="ms-ob-arrow ' + step.arrow + '">' + (step.arrow === 'bottom' ? '&#8595;' : '&#8593;') + '</div>'
        : '';
      overlay.innerHTML =
        arrowHtml +
        '<div class="ms-ob-dots">' + dots + '</div>' +
        '<div class="ms-ob-icon">' + step.icon + '</div>' +
        '<div class="ms-ob-kicker">Hazlo sentir como una app real</div>' +
        '<div class="ms-ob-text">' + step.text + '</div>' +
        '<div class="ms-ob-row">' +
        '<button class="ms-ob-continue" id="msObContinue">' + (idx === steps.length - 1 ? 'Listo' : 'Continuar') + '</button>' +
        '<button class="ms-ob-skip" id="msObSkip">Omitir</button>' +
        '</div>';
      document.getElementById('msObContinue').onclick = function () {
        if (idx === steps.length - 1) { finish(); } else { idx++; render(); }
      };
      document.getElementById('msObSkip').onclick = finish;
    }
    function finish() {
      markSeen();
      overlay.remove();
      onDone();
    }
    render();
  };
})();
