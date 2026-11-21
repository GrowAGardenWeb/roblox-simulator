/* Tienda: barra superior con textos (como la versión de PC) en lugar de iconos */
(function () {
  var nav = document.getElementById('nav');
  if (!nav) return;
  var css = document.createElement('style');
  css.textContent =
    '#txnav{display:none;position:absolute;inset:0;pointer-events:none}' +
    'body[data-screen="shop"] #txnav{display:block}' +
    'body[data-screen="shop"] #nav>img.ic,body[data-screen="shop"] #nav>img.tile,body[data-screen="shop"] #nav>.hit,' +
    'body[data-screen="shop"] #nav .navlabel,body[data-screen="shop"] #nav [data-t="nav.vbucks"],' +
    'body[data-screen="shop"] #shirttile,body[data-screen="shop"] #lockl,body[data-screen="shop"] #startile,' +
    'body[data-screen="shop"] #starsel,body[data-screen="shop"] #starlab{display:none!important}' +
    '#txrow{position:absolute;left:92px;top:69px;transform:translateY(-50%);display:flex;align-items:center;gap:30px;pointer-events:none}' +
    '#txnav .tn{font:800 23px Montserrat,sans-serif;color:#fff;' +
    'text-shadow:0 2px 3px rgba(0,20,60,.35);letter-spacing:.01em;white-space:nowrap;pointer-events:auto;cursor:pointer;' +
    'display:flex;align-items:center;gap:7px;padding:0 4px}' +
    '#txnav .tn.cur{color:#10203c;text-shadow:none;background:var(--pill,rgb(190,206,238));border-radius:12px;height:46px;padding:0 24px;transition:background .5s}' +
    '#txnav .tn img{height:27px;width:auto;display:block}' +
    '#txnav .ti{height:30px;width:auto;opacity:.95;margin-right:6px}';
  document.head.appendChild(css);
  var box = document.createElement('div');
  box.id = 'txnav';
  var items = [
    ['PLAY', 260, 'lobby'], ['TREASURE', 400, 'treasure', 'assets/ic_chest.webp'], ['SHOP', 543, 'shop'],
    ['LOCKER', 690, 'locker'], ['PASSES', 829, 'passes'], ['QUESTS', 964, ''],
    ['COMPETE', 1122, ''], ['CAREER', 1276, '']
  ];
  var h = '<div id="txrow"><img class="ti" src="assets/ic_search.webp" alt=""><img class="ti" src="assets/ic_heart.webp" style="height:26px" alt="">';
  items.forEach(function (it) {
    h += '<div class="tn' + (it[2] === 'shop' ? ' cur' : '') + '"' + (it[2] ? ' data-go="' + it[2] + '"' : '') + '>' +
      (it[3] ? '<img src="' + it[3] + '" alt="">' : '') + it[0] + '</div>';
  });
  h += '<div class="tn" id="txvb"><img src="assets/ic_vbucks.webp" alt=""><span></span></div></div>';
  box.innerHTML = h;
  nav.appendChild(box);
  function vb() {
    var s = document.querySelector('#txvb span'), n = document.querySelector('[data-t="nav.vbucks"]');
    if (s && n) s.textContent = n.textContent;
  }
  vb();
  new MutationObserver(vb).observe(document.body, { attributes: true, attributeFilter: ['data-screen'] });
  setInterval(vb, 1500);
})();
