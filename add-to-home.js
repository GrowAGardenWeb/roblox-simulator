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

  window.MS_showOnboarding = function (onDone) {
    var FLAG = 'ms_seen_a2hs_' + (window.MS_REQUIRED_PRODUCT || 'app');
    function seen() {
      try { return !!localStorage.getItem(FLAG); } catch (e) { return false; }
    }
    function markSeen() {
      try { localStorage.setItem(FLAG, '1'); } catch (e) {}
    }

    if (seen() || window.innerWidth > 640) { onDone(); return; }

    var ios = isIOS();
    var steps = ios
      ? [
          { icon: '&#8679;', text: 'Tap the <b>Share</b> icon (the square with an arrow up) in Safari’s toolbar below.' },
          { icon: '&#10133;', text: 'Scroll down the menu and tap <b>"Add to Home Screen"</b>.' },
          { icon: '&#9989;', text: 'Tap <b>Add</b>. The icon now opens full-screen, like a real app — no browser bar.' },
        ]
      : [
          { icon: '&#8942;', text: 'Tap the <b>⋮</b> menu (three dots), top right of Chrome.' },
          { icon: '&#10133;', text: 'Tap <b>"Add to Home screen"</b> (or "Install app").' },
          { icon: '&#9989;', text: 'Confirm. The icon now opens full-screen, like a real app — no browser bar.' },
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
      '.ms-ob-skip{background:none;border:none;color:#55555f;font-size:13px;padding:8px;cursor:pointer}';
    document.head.appendChild(style);

    var overlay = document.createElement('div');
    overlay.className = 'ms-ob';
    document.body.appendChild(overlay);

    var idx = 0;
    function render() {
      var step = steps[idx];
      var dots = steps.map(function (_, i) { return '<div class="ms-ob-dot' + (i === idx ? ' on' : '') + '"></div>'; }).join('');
      overlay.innerHTML =
        '<div class="ms-ob-dots">' + dots + '</div>' +
        '<div class="ms-ob-icon">' + step.icon + '</div>' +
        '<div class="ms-ob-kicker">Make this feel like a real app</div>' +
        '<div class="ms-ob-text">' + step.text + '</div>' +
        '<div class="ms-ob-row">' +
        '<button class="ms-ob-continue" id="msObContinue">' + (idx === steps.length - 1 ? 'Done' : 'Continue') + '</button>' +
        '<button class="ms-ob-skip" id="msObSkip">Skip</button>' +
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
