// MoneyScripts — "Add to Home Screen" tutorial banner.
// Include after the page's content loads. Shows once per browser
// (localStorage flag), dismissible, explains how to pin this page as a
// home-screen icon so it opens like a real app.
(function () {
  var FLAG = 'ms_seen_a2hs_' + (window.MS_REQUIRED_PRODUCT || 'app');

  function seen() {
    try { return !!localStorage.getItem(FLAG); } catch (e) { return false; }
  }
  function markSeen() {
    try { localStorage.setItem(FLAG, '1'); } catch (e) {}
  }

  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }

  function waitForAccessState(cb) {
    // access-gate.js resolves asynchronously (it has to call the server).
    // If this page doesn't use it at all, MS_ACCESS_STATE is just undefined
    // forever, so don't wait on it — proceed immediately in that case.
    if (typeof window.MS_ACCESS_STATE === 'undefined') { cb(); return; }
    var tries = 0;
    (function poll() {
      if (window.MS_ACCESS_STATE !== 'pending' || tries > 40) { cb(); return; }
      tries++;
      setTimeout(poll, 125);
    })();
  }

  function inject() {
    if (seen()) return;
    // Only worth showing on a phone-sized screen.
    if (window.innerWidth > 640) return;
    // If this page uses access-gate.js, only show the tip once access was
    // actually granted — never on the "you need to buy this" blocker.
    if (window.MS_ACCESS_STATE && window.MS_ACCESS_STATE !== 'granted') return;

    var ios = isIOS();
    var style = document.createElement('style');
    style.textContent =
      '.ms-a2hs{position:fixed;left:12px;right:12px;bottom:12px;z-index:999999;' +
      'background:#121219;border:1px solid rgba(255,255,255,.14);border-radius:16px;padding:16px 16px 14px;' +
      'box-shadow:0 14px 34px -14px rgba(0,0,0,.6);font-family:-apple-system,BlinkMacSystemFont,Inter,system-ui,sans-serif;' +
      'color:#f5f5f7;animation:msA2hsIn .25s ease}' +
      '@keyframes msA2hsIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}' +
      '.ms-a2hs-top{display:flex;align-items:center;gap:8px;margin-bottom:8px}' +
      '.ms-a2hs-title{font-size:13.5px;font-weight:800;flex:1}' +
      '.ms-a2hs-close{width:22px;height:22px;border-radius:50%;background:#1b1b27;border:none;color:#92929e;' +
      'font-size:13px;cursor:pointer;flex-shrink:0}' +
      '.ms-a2hs-steps{display:flex;flex-direction:column;gap:6px}' +
      '.ms-a2hs-step{display:flex;align-items:center;gap:9px;font-size:12.5px;color:#92929e}' +
      '.ms-a2hs-num{width:18px;height:18px;border-radius:50%;background:#0a84ff;color:#fff;font-size:10.5px;font-weight:800;' +
      'display:flex;align-items:center;justify-content:center;flex-shrink:0}' +
      '.ms-a2hs-step b{color:#f5f5f7}';
    document.head.appendChild(style);

    var steps = ios
      ? [
          'Tap the <b>Share</b> icon (the square with an arrow) in Safari’s toolbar',
          'Scroll down and tap <b>"Add to Home Screen"</b>',
          'Tap <b>Add</b> — the icon now opens full-screen like a real app',
        ]
      : [
          'Tap the <b>⋮</b> (three dots) menu, top right of Chrome',
          'Tap <b>"Add to Home screen"</b> (or "Install app")',
          'Confirm — the icon now opens full-screen like a real app',
        ];

    var el = document.createElement('div');
    el.className = 'ms-a2hs';
    el.innerHTML =
      '<div class="ms-a2hs-top"><div class="ms-a2hs-title">Make this feel like a real app</div>' +
      '<button class="ms-a2hs-close" aria-label="Dismiss">✕</button></div>' +
      '<div class="ms-a2hs-steps">' +
      steps.map(function (s, i) { return '<div class="ms-a2hs-step"><div class="ms-a2hs-num">' + (i + 1) + '</div><div>' + s + '</div></div>'; }).join('') +
      '</div>';
    document.body.appendChild(el);

    el.querySelector('.ms-a2hs-close').onclick = function () {
      el.remove();
      markSeen();
    };
  }

  function start() { waitForAccessState(inject); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
