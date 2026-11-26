/* Communities for the Roblox app clone (Drawer > Communities).
   Plain JS overlay (no React): list -> community page -> "..." menu -> Configure, all editable.
   Data lives in localStorage ("comm.v1"); the app's Edit panel has a "Communities" section that edits everything. */
(function () {
  'use strict';
  if (window.RoCm) return;
  var KEY = 'comm.v1';
  var REV = ['day', 'd7', 'd30', 'yr'];
  var REV_LAB = ['Sale of Goods', 'Publishing Advance Rebates', 'Commissions', 'Community Revenue Payouts', 'Community Creator Rewards'];
  var PERIODS = [['day', 'Past Day'], ['d7', 'Past 7 Days'], ['d30', 'Past 30 Days'], ['yr', 'Past Year']];

  function uid() { return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function seed() {
    return {
      list: [
        { id: 'c1', gid: '815273515', name: 'Munfuja UGC', by: 'munfuja', members: 136, role: 'owner', primary: true, bio: '', emblem: '', cover: '', funds: 555, pending: 5222,
          posts: [], store: [{ id: 's1', name: 'friks', price: 76, limited: false, asset: '' }, { id: 's2', name: 'Cocardo', price: 72, limited: false, asset: '' }, { id: 's3', name: 'Ben Steal an egg Shirt', price: 5, limited: false, asset: '' }, { id: 's4', name: 'Chonky Shoulder Kitty', price: 52, limited: false, asset: '' }],
          rev: { day: [246, 0, 0, 0, 0], d7: [1200, 310, 0, -850, 0], d30: [3150, 980, 0, -2400, 0], yr: [6415, 3532, 0, -9392, 0] } },
        { id: 'c2', name: 'Munfujitas', by: 'munfuja', members: 270, role: 'member', primary: false, bio: '', emblem: '', cover: '', funds: 0, pending: 0,
          posts: [], store: [], rev: { day: [0, 0, 0, 0, 0], d7: [0, 0, 0, 0, 0], d30: [0, 0, 0, 0, 0], yr: [0, 0, 0, 0, 0] } }
      ]
    };
  }
  function norm(c) {
    c.posts = c.posts || []; c.store = c.store || []; c.games = c.games || []; c.gen = c.gen || { min: 100000, max: 1000000 }; c.rev = c.rev || {};
    REV.forEach(function (k) { if (!c.rev[k]) c.rev[k] = [0, 0, 0, 0, 0]; });
    c.members = Number(c.members) || 0; c.funds = Number(c.funds) || 0; c.pending = Number(c.pending) || 0;
    c.by = c.by || 'munfuja'; c.gid = c.gid || String(800000000 + Math.floor(Math.random() * 99999999)); c.bio = c.bio || ''; c.emblem = c.emblem || ''; c.cover = c.cover || '';
    return c;
  }
  function load() {
    try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.list)) { s.list.forEach(norm); return s; } } catch (e) {}
    var d = seed(); d.list.forEach(norm); return d;
  }
  var S = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function find(id) { for (var i = 0; i < S.list.length; i++) if (S.list[i].id === id) return S.list[i]; return null; }
  function fmt(n) { return Number(n).toLocaleString('en-US'); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]; }); }
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function ic(name, cls) { return '<i class="cm-i' + (cls ? ' ' + cls : '') + '" style="--m:url(/robloxapp/icons/roblox/regular/' + name + '.svg)"></i>'; }
  function icf(name, cls) { return '<i class="cm-i' + (cls ? ' ' + cls : '') + '" style="--m:url(/robloxapp/icons/roblox/filled/' + name + '.svg)"></i>'; }

  /* ---- images: URL / data URL / Roblox asset id (thumbnail) ---- */
  var thumbCache = {};
  function thumb(id, cb) {
    if (thumbCache[id] !== undefined) return cb(thumbCache[id]);
    try {
      fetch('/rbx/thumbs/v1/assets?assetIds=' + id + '&size=420x420&format=Png&isCircular=false').then(function (r) { return r.json(); }).then(function (j) {
        var u = j && j.data && j.data[0] && j.data[0].imageUrl || null; thumbCache[id] = u; cb(u);
      }).catch(function () { cb(null); });
    } catch (e) { cb(null); }
  }
  function setImg(box, val) {
    if (!box) return;
    val = String(val || '').trim();
    if (!val) return;
    function put(u) {
      if (!u || !box.isConnected) return;
      var im = new Image(); im.alt = ''; im.draggable = false;
      im.onload = function () { if (box.isConnected) { var o = box.querySelector('img'); if (o) o.remove(); box.insertBefore(im, box.firstChild); } };
      im.src = u;
    }
    if (/^\d+$/.test(val)) thumb(val, put); else put(val);
  }

  function gameIcon(box, id) {
    if (!/^\d+$/.test(String(id))) return;
    try {
      fetch('/rbx/thumbs/v1/games/icons?universeIds=' + id + '&returnPolicy=PlaceHolder&size=256x256&format=Png&isCircular=false').then(function (r) { return r.json(); }).then(function (j) {
        var u = j && j.data && j.data[0] && j.data[0].imageUrl; if (u) setImg(box, u);
      }).catch(function () {});
    } catch (e) {}
  }

  /* ---- navigation stack ---- */
  var rootEl = null, stack = [], ddEl = null;
  function frame() { return document.querySelector('#root > div'); }
  function ensureRoot() {
    if (rootEl && rootEl.isConnected) return rootEl;
    var f = frame(); if (!f) return null;
    rootEl = h('div', 'cm-root'); f.appendChild(rootEl); return rootEl;
  }
  function top() { return stack[stack.length - 1]; }
  function push(en) {
    if (!ensureRoot()) return;
    en.hist = en.hist || [];
    en.el = h('div', 'cm-screen cm-in');
    en.el.addEventListener('click', closeDD);
    build(en);
    rootEl.appendChild(en.el); stack.push(en);
    setTimeout(function () { en.el.classList.remove('cm-in'); }, 320);
  }
  function pop() {
    var en = stack.pop(); if (!en) return;
    closeDD();
    en.el.classList.add('cm-out');
    setTimeout(function () { en.el.remove(); }, 230);
    if (!stack.length) { var r = rootEl; rootEl = null; setTimeout(function () { r && r.remove(); }, 240); }
  }
  function closeAll() { while (stack.length) pop(); }
  function refresh(en) {
    if (!en || !en.el) return;
    var sc = en.el.querySelector('.cm-sc,.cm-lb'), t = sc ? sc.scrollTop : 0;
    en.el.innerHTML = ''; build(en);
    var sc2 = en.el.querySelector('.cm-sc,.cm-lb'); if (sc2) sc2.scrollTop = t;
  }
  function refreshAll() { stack.forEach(function (en) { if (en.type !== 'cfg' || !en.loading) { if (en.id && !find(en.id)) return; refresh(en); } }); }
  function build(en) { if (en.type === 'list') buildList(en); else if (en.type === 'comm') buildComm(en); else if (en.type === 'pay') buildPay(en); else buildCfg(en); }

  function toast(msg) {
    if (!rootEl) return;
    var t = h('div', 'cm-toast', esc(msg)); rootEl.appendChild(t);
    setTimeout(function () { t.remove(); }, 2000);
  }
  function closeDD() { if (ddEl) { ddEl.remove(); ddEl = null; } }

  /* ---- sheet (bottom panel) ---- */
  function sheet(en, title, bodyHtml, wire) {
    var sc = h('div', 'cm-sheet-scrim'), sh = h('div', 'cm-sheet', '<h3>' + esc(title) + '</h3>' + bodyHtml);
    function close() { sc.remove(); sh.remove(); }
    sc.addEventListener('click', close);
    en.el.appendChild(sc); en.el.appendChild(sh);
    wire(sh, close);
  }

  /* ---- dropdown ---- */
  function dd(cls, text, opts, onPick, en, cur) {
    var b = h('button', 'cm-dd ' + (cls || ''), esc(text) + ic('chevron-small-down'));
    b.addEventListener('click', function (ev) {
      ev.stopPropagation(); var had = ddEl; closeDD(); if (had) return;
      var l = h('div', 'cm-ddl');
      opts.forEach(function (o) {
        var x = h('button', (cur != null && o[0] === cur) ? 'sel' : null, esc(o[1] != null ? o[1] : o));
        x.addEventListener('click', function (e2) { e2.stopPropagation(); closeDD(); onPick(o[0] != null && o.length ? o[0] : o); });
        l.appendChild(x);
      });
      var sr = en.el.getBoundingClientRect(), r = b.getBoundingClientRect(), s = sr.width / 360 || 1;
      l.style.left = ((r.left - sr.left) / s) + 'px'; l.style.top = ((r.bottom - sr.top) / s + 2) + 'px'; l.style.minWidth = (r.width / s) + 'px';
      en.el.appendChild(l); ddEl = l;
    });
    return b;
  }

  /* ---- list ---- */
  function rowHtml(c) {
    return '<span class="cm-em"></span><span class="cm-rn"><b>' + esc(c.name) + '</b><span>' + fmt(c.members) + ' member' + (c.members === 1 ? '' : 's') + '</span></span><span class="cm-pill' + (c.role === 'owner' ? ' on' : '') + '">' + (c.role === 'owner' ? 'Owned' : 'Member') + '</span>';
  }
  function buildList(en) {
    var el = en.el;
    var hd = h('div', 'cm-lh', '<button class="cm-bk" aria-label="Back">' + ic('arrow-large-left') + '</button><b>Communities</b><button class="cm-all">See All</button>');
    hd.querySelector('.cm-bk').addEventListener('click', function () { pop(); });
    hd.querySelector('.cm-all').addEventListener('click', function () { var lb = el.querySelector('.cm-lb'); if (lb) lb.scrollTop = 0; });
    var lb = h('div', 'cm-lb');
    var sb = h('label', 'cm-search', ic('magnifying-glass') + '<input type="text" placeholder="Search My Communities" autocomplete="off" autocapitalize="off" spellcheck="false">');
    var inp = sb.querySelector('input'); inp.value = en.q || '';
    var cb = h('button', 'cm-create', 'Create Community');
    var rows = h('div');
    lb.appendChild(sb); lb.appendChild(cb); lb.appendChild(rows);
    function fill() {
      rows.innerHTML = '';
      var q = (en.q || '').trim().toLowerCase();
      var all = S.list.filter(function (c) { return !q || c.name.toLowerCase().indexOf(q) >= 0; });
      var prim = all.filter(function (c) { return c.primary; }), rest = all.filter(function (c) { return !c.primary; });
      function add(c) {
        var b = h('button', 'cm-row', rowHtml(c)); setImg(b.querySelector('.cm-em'), c.emblem);
        b.addEventListener('click', function () { push({ type: 'comm', id: c.id, tab: 'Home' }); });
        rows.appendChild(b);
      }
      if (prim.length) { rows.appendChild(h('div', 'cm-h3', 'Primary')); prim.forEach(add); }
      if (rest.length) { rows.appendChild(h('div', 'cm-h3', 'My Communities')); rest.forEach(add); }
      if (!all.length) rows.appendChild(h('div', 'cm-none', q ? 'No communities found' : 'You are not in any communities yet'));
    }
    inp.addEventListener('input', function () { en.q = inp.value; fill(); });
    cb.addEventListener('click', function () {
      var c = norm({ id: uid(), name: 'New Community', by: 'munfuja', members: 1, role: 'owner', primary: false });
      S.list.push(c); save(); refresh(en); push({ type: 'cfg', id: c.id, loading: true });
    });
    fill();
    el.appendChild(hd); el.appendChild(lb);
  }

  /* ---- community page ---- */
  function header(en, withBack, onBack) {
    var hd = h('div', 'cm-hd', '<button class="cm-x" aria-label="Close">' + ic('x') + '</button>' + (withBack ? '<button class="cm-bk" aria-label="Back">' + ic('chevron-small-left') + '</button>' : ''));
    hd.querySelector('.cm-x').addEventListener('click', closeAll);
    var bk = hd.querySelector('.cm-bk'); if (bk) bk.addEventListener('click', onBack);
    return hd;
  }
  function buildComm(en) {
    var c = find(en.id); if (!c) { pop(); return; }
    var owner = c.role === 'owner';
    var hd = header(en, en.hist.length > 0, function () { en.tab = en.hist.pop(); refresh(en); });
    var sc = h('div', 'cm-sc');
    var tp = h('div', 'cm-top', '<div class="cm-em2"></div><h1>' + esc(c.name) + '</h1><div class="cm-by">By ' + esc(c.by) + '</div><button class="cm-dots" aria-label="More">' + ic('three-dots-horizontal') + '</button>' +
      '<div class="cm-chips"><span>' + fmt(c.members) + ' Member' + (c.members === 1 ? '' : 's') + '</span><span>Member Rank</span></div><div class="cm-bio">' + (c.bio ? esc(c.bio) : 'No bio yet.') + '</div>');
    setImg(tp.querySelector('.cm-em2'), c.emblem);
    tp.querySelector('.cm-dots').addEventListener('click', function (ev) { ev.stopPropagation(); openMenu(en, c); });
    var tabs = h('div', 'cm-tabs');
    ['Home', 'Posts', 'Events', 'Store'].forEach(function (t) {
      var b = h('button', t === en.tab ? 'on' : '', t);
      b.addEventListener('click', function () { if (t === en.tab) return; en.hist.push(en.tab); en.tab = t; refresh(en); });
      tabs.appendChild(b);
    });
    var pane = h('div', 'cm-pane');
    sc.appendChild(tp); sc.appendChild(tabs); sc.appendChild(pane);
    en.el.appendChild(hd); en.el.appendChild(sc);
    var bar = null;
    function postsHtml() {
      return c.posts.slice().reverse().map(function (p) { return '<div class="cm-post"><p>' + esc(p.text) + '</p><small>' + esc(p.date) + '</small></div>'; }).join('');
    }
    function newPost() {
      sheet(en, 'Create post', '<label>Announcement</label><textarea id="cmp" maxlength="500" placeholder="What do you want to tell your community?"></textarea><div class="cm-bts"><button class="cmc">Cancel</button><button class="pri cmo">Post</button></div>', function (sh, close) {
        sh.querySelector('.cmc').addEventListener('click', close);
        sh.querySelector('.cmo').addEventListener('click', function () {
          var t = sh.querySelector('#cmp').value.trim(); if (!t) return;
          c.posts.push({ text: t, date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }); save(); close(); refresh(en);
        });
      });
    }
    if (en.tab === 'Home') {
      pane.innerHTML = '<div class="cm-ph"><h2>Announcements</h2>' + (owner ? '<button class="cm-gbtn">Create</button>' : '') + '</div>' + (c.posts.length ? postsHtml() : '<p class="cm-empty">No announcements yet...</p>');
      var cr = pane.querySelector('.cm-gbtn'); if (cr) cr.addEventListener('click', newPost);
      if (c.games.length) {
        pane.appendChild(h('div', 'cm-ph', '<h2>Games</h2>'));
        var gg = h('div', 'cm-grid');
        c.games.forEach(function (g) {
          var b = h('button', 'cm-it', '<div class="cm-img"></div><b>' + esc(g.name || 'Game') + '</b>');
          gameIcon(b.querySelector('.cm-img'), g.id);
          b.addEventListener('click', function () { window.dispatchEvent(new CustomEvent('ro-opengame', { detail: { id: g.id, title: g.name || '' } })); });
          gg.appendChild(b);
        });
        pane.appendChild(gg);
      }
    } else if (en.tab === 'Posts') {
      pane.innerHTML = '<span class="cm-chip">Announcements</span>' + (c.posts.length ? postsHtml() : ic('speech-bubble-align-center', 'cm-bub') + '<p class="cm-empty cm-pe">No announcements yet...</p>');
      if (owner) { bar = h('div', 'cm-bar', '<button>Create post</button>'); bar.querySelector('button').addEventListener('click', newPost); en.el.appendChild(bar); }
    } else if (en.tab === 'Events') {
      pane.innerHTML = '<div class="cm-ph"><h2>Events</h2></div><div class="cm-evt"><div class="cm-tilt">' + ic('calendar-star') + '</div>' +
        (owner ? '<h3>Engage your community with events</h3><p>Visit the Creator Hub to begin creating events for your members</p><button>Create event</button>' : '<h3>No events yet</h3><p>Events from this community will show up here</p>') + '</div>';
      var ce = pane.querySelector('.cm-evt button'); if (ce) ce.addEventListener('click', function () { toast('Events are created in the Creator Hub'); });
    } else {
      pane.innerHTML = '<div class="cm-ph"><h2>Store</h2><button class="cm-sa">See All ' + ic('arrow-small-right') + '</button></div>';
      var g = h('div', 'cm-grid');
      c.store.forEach(function (it) {
        var b = h('button', 'cm-it', '<div class="cm-img">' + (it.limited ? '<span class="cm-lim">Limited</span>' : '') + '</div><b>' + esc(it.name) + '</b><span>' + icf('robux') + fmt(it.price) + '</span>');
        setImg(b.querySelector('.cm-img'), it.asset);
        b.addEventListener('click', function () { toast(it.name + ' - ' + fmt(it.price) + ' Robux'); });
        g.appendChild(b);
      });
      if (!c.store.length) pane.appendChild(h('p', 'cm-empty', 'No items for sale yet'));
      pane.appendChild(g);
      var sa = pane.querySelector('.cm-sa'); if (sa) sa.addEventListener('click', function () { toast('Showing all ' + c.store.length + ' items'); });
    }
  }
  function openMenu(en, c) {
    var owner = c.role === 'owner';
    var items = [];
    if (owner) items.push(['Configure Community', function () { push({ type: 'cfg', id: c.id, loading: true }); }]);
    items.push([c.primary ? 'Remove Primary' : 'Set as Primary', function () { var was = c.primary; S.list.forEach(function (x) { x.primary = false; }); c.primary = !was; save(); refreshAll(); toast(c.primary ? 'Set as primary community' : 'Primary removed'); }]);
    if (owner) { items.push(['Transfer Group', function () { toast('This opens roblox.com in the real app'); }, 1]); items.push(['Deactivate Group', function () { toast('This opens roblox.com in the real app'); }, 1]); }
    else items.push(['Leave Community', function () { S.list = S.list.filter(function (x) { return x !== c; }); save(); closeAll(); }]);
    items.push(['Copy link', function () { try { navigator.clipboard && navigator.clipboard.writeText('https://www.roblox.com/communities/' + c.id); } catch (e) {} toast('Link copied'); }]);
    items.push(['Report abuse', function () { toast('Thanks, we will review it'); }]);
    var sc = h('div', 'cm-pop-scrim'), pp = h('div', 'cm-pop');
    function close() { sc.remove(); pp.remove(); }
    sc.addEventListener('click', close);
    items.forEach(function (it) {
      var b = h('button', null, esc(it[0]) + (it[2] ? ic('arrow-up-right-from-square') : ''));
      b.addEventListener('click', function () { close(); it[1](); });
      pp.appendChild(b);
    });
    en.el.appendChild(sc); en.el.appendChild(pp);
  }


  /* ---- Payouts (dark web page inside Configure > Revenue) ---- */
  function usd(n) { return '$' + (Number(n) * 0.0038).toFixed(2); }
  function userSearch(q, cb) {
    q = String(q || '').trim(); if (!q) return cb([]);
    function head(list) {
      var ids = list.map(function (u) { return u.id; }).filter(function (x) { return /^\d+$/.test(String(x)); });
      if (!ids.length) return cb(list);
      fetch('/rbx/thumbs/v1/users/avatar-headshot?userIds=' + ids.join(',') + '&size=150x150&format=Png').then(function (r) { return r.json(); }).then(function (j) {
        (j.data || []).forEach(function (d) { list.forEach(function (u) { if (String(u.id) === String(d.targetId)) u.img = d.imageUrl; }); }); cb(list);
      }).catch(function () { cb(list); });
    }
    function fallback() { cb([{ id: q, name: q, handle: q.replace(/\s/g, '') }]); }
    try {
      if (/^\d+$/.test(q)) {
        fetch('/rbx/users/v1/users/' + q).then(function (r) { return r.json(); }).then(function (u) { if (!u || !u.name) return fallback(); head([{ id: u.id, name: u.displayName || u.name, handle: u.name }]); }).catch(fallback);
      } else {
        fetch('/rbx/users/v1/users/search?keyword=' + encodeURIComponent(q) + '&limit=5').then(function (r) { return r.json(); }).then(function (j) {
          var l = (j.data || []).map(function (u) { return { id: u.id, name: u.displayName || u.name, handle: u.name }; });
          if (!l.length) return fallback(); head(l);
        }).catch(fallback);
      }
    } catch (e) { fallback(); }
  }
  function pfpSrc() { var i = document.querySelector('.nav-avatar,.h-head,.dr-avatar'); return i ? i.src : ''; }
  function buildPay(en) {
    var c = find(en.id); if (!c) { pop(); return; }
    var hd = header(en, true, function () { pop(); });
    var wv = h('div', 'cm-pay');
    var pf = pfpSrc();
    wv.innerHTML = '<div class="cm-pt"><span class="cm-hb"><i></i><i></i><i></i></span><b>Payouts</b><span class="cm-pi s">' + ic('magnifying-glass') + '</span><span class="cm-pi b">' + ic('bell') + '</span>' + (pf ? '<img class="cm-pa" src="' + esc(pf) + '" alt="">' : '<i class="cm-pa"></i>') + '</div><div class="cm-ps"></div>';
    var ps = wv.querySelector('.cm-ps');
    var open = !!en.ratesOpen;
    var empty = c.funds <= 0;
    ps.innerHTML = '<h1>Payouts</h1><p class="cm-pp">Group payouts enables you to distribute Earned Robux with collaborators who helped you develop content on Roblox. Only Group members that have participated in collaborating on this content are eligible for payouts.</p>' +
      '<div class="cm-pc cm-fc' + (open ? ' open' : '') + '"><h3>Group Funds</h3><small>Robux in your group\'s account</small><div class="cm-am">' + icf('robux') + '<b>' + fmt(c.funds) + '</b>' + (empty ? '' : '<button class="cm-chv" aria-label="Details">' + ic(open ? 'chevron-small-up' : 'chevron-small-down') + '</button>') + '</div>' + (empty ? '' : '<div class="cm-usd">' + usd(c.funds) + '</div>') +
      (open && !empty ? '<div class="cm-rates"><h4>Earned rates</h4><p>Your cash-out rates depend on how and when you earned your Robux.</p><h4>Standard rates</h4><div class="cm-el">Eligible at $0.0038 rate ' + ic('circle-i') + '</div><div class="cm-ea">' + icf('robux') + '<b>' + fmt(c.funds) + '</b></div><hr><div class="cm-ei">' + ic('circle-i') + '<span>Eligible rates may be different than your group balance. <u>Learn More</u></span></div></div>' : '') + '</div>' +
      '<div class="cm-pc cm-sc2"><h3>Send a One-Time Payout</h3><small>Give Robux to your collaborators</small><button class="cm-sb' + (empty ? ' off' : '') + '">Send Robux</button></div>' +
      '<div class="cm-pch"><span class="on">Group</span><span>Experiences</span></div>' +
      '<div class="cm-dn"><svg viewBox="0 0 270 270"><circle cx="135" cy="135" r="114.5" fill="none" stroke="#3b63ff" stroke-width="41"/></svg><div class="cm-dt"><span>Total Splits</span><b>1</b></div></div>' +
      '<div class="cm-sph"><h4>Splits</h4><button class="cm-pe2" aria-label="Edit splits">' + icf('pencil') + '</button></div><hr class="cm-hr"><div class="cm-spl"><i class="cm-bar2"></i><span class="cm-sem"></span><div class="cm-sn"><b>' + esc(c.name) + '</b><small>' + esc(c.gid) + '</small></div><em>100 <span>%</span></em></div>' +
      '<div class="cm-ft"><p>&copy;2026 Roblox Corporation. All rights reserved.</p><p>Terms <i>&middot;</i> Privacy <i>&middot;</i> Accessibility <i>&middot;</i> Support <i>&middot;</i></p><p>Your Privacy Choices <span class="cm-pcx"></span></p><div class="cm-so">' + ic('twitter') + ic('facebook') + ic('linkedin') + ic('instagram') + ic('youtube') + '</div><div class="cm-lg">' + ic('globe-simplified') + 'English</div></div>';
    setImg(ps.querySelector('.cm-sem'), c.emblem);
    var chv = ps.querySelector('.cm-chv'); if (chv) chv.addEventListener('click', function () { en.ratesOpen = !en.ratesOpen; refresh(en); });
    ps.querySelector('.cm-pe2').addEventListener('click', function () { toast('Splits are edited on roblox.com'); });
    var sb = ps.querySelector('.cm-sb'); if (!empty) sb.addEventListener('click', function () { payModal(en, wv, c); });
    en.el.appendChild(hd); en.el.appendChild(wv);
  }
  function payModal(en, wv, c) {
    var st = { rec: null, amt: c.funds, q: '' };
    var sc = h('div', 'cm-pm-scrim'), md = h('div', 'cm-pm');
    function close() { sc.remove(); md.remove(); }
    wv.appendChild(sc); wv.appendChild(md);
    function viewSearch() {
      md.innerHTML = '<h2>Send a one-time payout</h2><label class="cm-pq">' + ic('magnifying-glass') + '<input type="text" placeholder="Search by username or ID" autocomplete="off" autocapitalize="off" spellcheck="false"><i class="cm-tri"></i></label><div class="cm-rs"></div><div class="cm-pb"><button class="cm-b1 off">Continue to review</button><button class="cm-b2">Upload .csv</button></div>';
      var inp = md.querySelector('input'), rs = md.querySelector('.cm-rs'), t = null;
      inp.value = st.q; inp.focus();
      function run() {
        userSearch(inp.value, function (list) {
          rs.innerHTML = '';
          list.slice(0, 3).forEach(function (u) {
            var r = h('button', 'cm-ur', '<span class="cm-ua"></span><span class="cm-un"><b>' + esc(u.name) + '</b><small>@' + esc(u.handle) + '</small></span>');
            if (u.img) { var im = new Image(); im.src = u.img; r.querySelector('.cm-ua').appendChild(im); }
            r.addEventListener('click', function () { st.rec = u; st.q = ''; viewAmount(); });
            rs.appendChild(r);
          });
        });
      }
      inp.addEventListener('input', function () { st.q = inp.value; clearTimeout(t); if (!inp.value.trim()) { rs.innerHTML = ''; return; } t = setTimeout(run, 350); });
      md.querySelector('.cm-b2').addEventListener('click', function () { toast('Upload .csv works on roblox.com'); });
    }
    function viewAmount() {
      var u = st.rec;
      md.innerHTML = '<h2>Send a one-time payout</h2><label class="cm-pq">' + ic('magnifying-glass') + '<input type="text" placeholder="Search by username or ID" autocomplete="off"><i class="cm-tri"></i></label>' +
        '<div class="cm-rec"><span class="cm-ua"></span><span class="cm-un"><b>' + esc(u.name) + '</b><small>@' + esc(u.handle) + '</small></span><button class="cm-rm" aria-label="Remove">' + ic('circle-minus') + '</button></div>' +
        '<label class="cm-ai">' + icf('robux') + '<input type="text" inputmode="numeric" class="cm-an"></label><div class="cm-d2"></div><hr class="cm-hr2"><div class="cm-tt2">Total ' + ic('chevron-small-down') + '</div><label class="cm-ai off">' + icf('robux') + '<input type="text" disabled class="cm-at"></label><div class="cm-d3"></div>' +
        '<div class="cm-pb"><button class="cm-b1">Continue to review</button><button class="cm-b2">Upload .csv</button></div>';
      if (u.img) { var im = new Image(); im.src = u.img; md.querySelector('.cm-ua').appendChild(im); }
      var an = md.querySelector('.cm-an'), at = md.querySelector('.cm-at'), b1 = md.querySelector('.cm-b1');
      function upd() { var n = Number(st.amt) || 0; an.value = n ? fmt(n) : ''; at.value = n ? fmt(n) : ''; md.querySelector('.cm-d2').textContent = usd(n); md.querySelector('.cm-d3').textContent = usd(n); b1.classList.toggle('off', !(n > 0 && n <= c.funds)); md.querySelector('.cm-ai').classList.toggle('bad', n > c.funds); }
      an.addEventListener('input', function () { st.amt = Math.min(9999999, Number(an.value.replace(/\D/g, '')) || 0); var p = an.selectionStart; upd(); });
      upd();
      md.querySelector('.cm-rm').addEventListener('click', function () { st.rec = null; viewSearch(); });
      md.querySelector('.cm-b2').addEventListener('click', function () { toast('Upload .csv works on roblox.com'); });
      b1.addEventListener('click', function () { if (b1.classList.contains('off')) return; viewReview(); });
    }
    function viewReview() {
      var u = st.rec, n = Number(st.amt) || 0;
      md.innerHTML = '<h2>Review one-time payout</h2><div class="cm-rt">From</div><div class="cm-fr"><span class="cm-ua cm-ue"></span><span class="cm-un"><b>' + esc(c.name) + '</b><small>' + esc(c.gid) + '</small></span></div><div class="cm-rt cm-rto">To</div>' +
        '<div class="cm-to"><span class="cm-ua"></span><span class="cm-un"><b>' + esc(u.name) + '</b><small>@' + esc(u.handle) + '</small></span></div><div class="cm-ar"><span>Amount</span><div>' + icf('robux') + fmt(n) + '<small>' + usd(n) + '</small></div></div>' +
        '<div class="cm-tb">Total ' + ic('chevron-small-down') + '</div><div class="cm-ar"><span>Amount</span><div class="bd">' + icf('robux') + fmt(n) + '<small>' + usd(n) + '</small></div></div>' +
        '<div class="cm-pb"><button class="cm-b1 go">Confirm and send</button><button class="cm-b2">Back</button></div>';
      if (u.img) { var im = new Image(); im.src = u.img; md.querySelector('.cm-to .cm-ua').appendChild(im); }
      setImg(md.querySelector('.cm-ue'), c.emblem);
      md.querySelector('.cm-b2').addEventListener('click', viewAmount);
      md.querySelector('.cm-b1').addEventListener('click', function () {
        c.funds = Math.max(0, c.funds - n); save(); close(); refreshAll();
        var t = h('div', 'cm-ptoast', ic('circle-check') + 'Payout Sent'); en.el.appendChild(t); setTimeout(function () { t.remove(); }, 2600);
      });
    }
    sc.addEventListener('click', close);
    viewSearch();
  }

  /* ---- configure ---- */
  function pickFile(cb) {
    var f = document.createElement('input'); f.type = 'file'; f.accept = 'image/*';
    f.onchange = function () {
      var file = f.files && f.files[0]; if (!file) return;
      var r = new FileReader();
      r.onload = function () {
        var im = new Image();
        im.onload = function () {
          var s = Math.min(1, 320 / Math.max(im.width, im.height)), cv = document.createElement('canvas'); cv.width = Math.round(im.width * s); cv.height = Math.round(im.height * s);
          cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); cb(cv.toDataURL('image/jpeg', 0.85));
        };
        im.src = r.result;
      };
      r.readAsDataURL(file);
    };
    f.click();
  }
  function buildCfg(en) {
    var c = find(en.id); if (!c) { pop(); return; }
    var hd = header(en, true, function () { pop(); });
    var sc = h('div', 'cm-sc'), box = h('div', 'cm-cfg');
    sc.appendChild(box); en.el.appendChild(hd); en.el.appendChild(sc);
    if (en.loading) {
      // skeleton loading (same shimmer as the rest of the app)
      function skb(l, t, w, hh, r) { return '<div class="cm-sk" style="position:absolute;left:' + l + 'px;top:' + t + 'px;width:' + w + ';height:' + hh + 'px' + (r ? ';border-radius:' + r + 'px' : '') + '"></div>'; }
      box.innerHTML = skb(12.5, 27, '215px', 22) + skb(12.5, 58, '90px', 13) + skb(12.5, 76, '150px', 13) + skb(12.5, 193, 'calc(100% - 25px)', 32, 8) +
        '<div style="position:absolute;left:12.5px;right:12.5px;top:262px">' + [0, 1, 2, 3, 4].map(function (i) { return '<div class="cm-sk" style="height:' + (i === 0 ? 120 : 30) + 'px;margin-bottom:14px;width:' + (i === 0 ? '100%' : (92 - i * 9) + '%') + '"></div>'; }).join('') + '</div>';
      setTimeout(function () { en.loading = false; if (stack.indexOf(en) >= 0) refresh(en); }, 650);
      return;
    }
    en.section = en.section || 'Information';
    box.innerHTML = '<h1>Configure ' + esc(c.name) + '</h1><div class="cm-by2">By ' + esc(c.by) + '</div><div class="cm-fund">Community Funds: ' + icf('robux') + '<b>' + fmt(c.funds) + '</b></div><button class="cm-back2">Back to Community ' + ic('arrow-small-right') + '</button>';
    box.querySelector('.cm-back2').addEventListener('click', function () { pop(); });
    var body = h('div', 'cm-body'), sec = h('div', 'cm-sec');
    body.appendChild(sec); box.appendChild(body);
    sec.appendChild(dd('', en.section, [['Information', 'Information'], ['Revenue', 'Revenue']], function (v) { en.section = v; refresh(en); }, en));
    if (en.section === 'Revenue') {
      en.period = en.period || 'day'; en.rev = en.rev || 'Summary';
      var sp = h('div'); sp.style.marginTop = '14px';
      sp.appendChild(dd('', en.rev, [['Summary', 'Summary'], ['Sales', 'Sales'], ['Publishing Advance Rebates', 'Publishing Advance Rebates'], ['Payouts', 'Payouts']], function (v) {
        en.rev = v;
        if (v === 'Payouts') { refresh(en); setTimeout(function () { if (stack.indexOf(en) < 0) return; en.rev = 'Summary'; push({ type: 'pay', id: c.id }); refresh(en); }, 900); }
        else refresh(en);
      }, en, en.rev)); sec.appendChild(sp);
      if (en.rev === 'Payouts') { sec.appendChild(h('div', 'cm-skl', [0, 1, 2, 3, 4].map(function (i) { return '<div class="cm-sk" style="height:' + (i === 0 ? 26 : 22) + 'px;width:' + (i === 0 ? '55%' : (96 - i * 12) + '%') + '"></div>'; }).join(''))); return; }
      var rv = h('div', 'cm-rev'), hh = h('div', 'cm-rvh', '<h2>' + esc(en.rev) + '</h2>');
      var pn = ''; PERIODS.forEach(function (p) { if (p[0] === en.period) pn = p[1]; });
      hh.appendChild(dd('sm', pn, PERIODS, function (v) { en.period = v; refresh(en); }, en));
      rv.appendChild(hh);
      var vals = c.rev[en.period], total = 0; vals.forEach(function (v) { total += Number(v) || 0; });
      var only = en.rev === 'Sales' ? [0] : en.rev === 'Publishing Advance Rebates' ? [1] : null;
      if (only) { total = Number(vals[only[0]]) || 0; }
      var tb = h('div', 'cm-tbl', '<div class="cm-tr cm-th"><div>Categories</div><div>Community Amount</div></div>' +
        REV_LAB.map(function (l, i) { return (only && only.indexOf(i) < 0) ? '' : '<div class="cm-tr"><div>' + l + '</div><div>' + icf('robux') + fmt(vals[i]) + '</div></div>'; }).join('') +
        '<div class="cm-tr cm-tt"><div>Total</div><div>' + icf('robux') + fmt(total) + '</div></div>' + (only ? '' : '<div class="cm-tr cm-tp"><div>Pending Robux</div><div>' + icf('robux') + fmt(c.pending) + '</div></div>'));
      rv.appendChild(tb); sec.appendChild(rv);
      return;
    }
    // Information: Emblem, Cover Photo, Description, Information
    var pend = { emblem: null, cover: null };
    function imgBlock(label, key, cap, note, canDelete) {
      var w = h('div');
      w.innerHTML = '<div class="cm-lab">' + label + '</div>' + (note ? '<div class="cm-note">' + note + '</div>' : '') +
        '<div class="cm-drop"><div class="cm-prev"><div class="cm-cap">' + cap + '</div></div><button class="cm-sel">Select an image from your device</button></div>' +
        '<div class="cm-acts"><button class="cm-sv">Save</button>' + (canDelete ? '<button class="cm-sv cmdel">Delete</button>' : '') + '</div>';
      var prev = w.querySelector('.cm-prev'), save_ = w.querySelector('.cm-sv');
      setImg(prev, c[key]);
      w.querySelector('.cm-sel').addEventListener('click', function () {
        pickFile(function (d) { pend[key] = d; var o = prev.querySelector('img'); if (o) o.remove(); setImg(prev, d); save_.classList.add('on'); });
      });
      save_.addEventListener('click', function () { if (pend[key]) { c[key] = pend[key]; pend[key] = null; save(); save_.classList.remove('on'); toast(label + ' saved'); refreshAll(); } });
      var dl = w.querySelector('.cmdel'); if (dl) { dl.classList.toggle('on', !!c[key]); dl.addEventListener('click', function () { if (!c[key]) return; c[key] = ''; save(); refreshAll(); }); }
      return w;
    }
    sec.appendChild(imgBlock('Emblem', 'emblem', 'Emblem', '', false));
    sec.appendChild(imgBlock('Cover Photo', 'cover', 'Cover Photo', 'Cover photo must be one of the available dimensions: 720x228, 1440x456', true));
    var dsc = h('div');
    dsc.innerHTML = '<div class="cm-lab">Description</div><textarea class="cm-ta" maxlength="1000"></textarea><div class="cm-cnt"><span class="cn">' + (c.bio || '').length + '</span> / 1000</div><div class="cm-acts"><button class="cm-sv">Save</button></div>';
    var ta = dsc.querySelector('textarea'); ta.value = c.bio || '';
    var dsv = dsc.querySelector('.cm-sv');
    ta.addEventListener('input', function () { dsc.querySelector('.cn').textContent = ta.value.length; dsv.classList.toggle('on', ta.value !== (c.bio || '')); });
    dsv.addEventListener('click', function () { if (ta.value === (c.bio || '')) return; c.bio = ta.value; save(); dsv.classList.remove('on'); toast('Description saved'); refreshAll(); });
    sec.appendChild(dsc);
    var inf = h('div', 'cm-info');
    inf.innerHTML = '<h2>Information</h2><div class="cm-ir"><span>Owner</span><div class="cm-bt"><button class="cm-ob cmt">Transfer Group ' + ic('arrow-up-right-from-square') + '</button><button class="cm-ob red cmd">Deactivate Group ' + ic('arrow-up-right-from-square') + '</button></div></div><div class="cm-val">' + esc(c.by) + '</div>' +
      '<div class="cm-ir"><span>Name</span><button class="cm-edit" aria-label="Edit name">' + ic('pencil-square', 'cm-edit') + '</button></div><div class="cm-val cmname">' + esc(c.name) + '</div>';
    inf.querySelector('.cmt').addEventListener('click', function () { toast('This opens roblox.com in the real app'); });
    inf.querySelector('.cmd').addEventListener('click', function () { toast('This opens roblox.com in the real app'); });
    inf.querySelector('.cm-edit').addEventListener('click', function () {
      var v = inf.querySelector('.cmname'); v.innerHTML = '<input type="text" maxlength="50"> <button class="cm-sv on" style="height:30px;padding:0 10px">Save</button>';
      var i = v.querySelector('input'); i.value = c.name; i.focus();
      v.querySelector('button').addEventListener('click', function () { var n = i.value.trim(); if (!n) return; c.name = n; save(); refreshAll(); });
    });
    sec.appendChild(inf);
  }

  /* ---- load everything public about a Roblox group from its ID ---- */
  function loadGroup(c, done) {
    var id = String(c.gid || '').replace(/\D/g, ''); if (!id) return done('Enter a Group ID first');
    function jget(u) { return fetch(u).then(function (r) { return r.json(); }); }
    jget('/rbx/groups/v1/groups/' + id).then(function (g) {
      if (!g || !g.name) return done('Group not found');
      c.name = g.name; c.bio = g.description || ''; c.members = Number(g.memberCount) || 0; c.by = (g.owner && (g.owner.username || g.owner.displayName)) || c.by; c.gid = id;
      var p1 = jget('/rbx/thumbs/v1/groups/icons?groupIds=' + id + '&size=420x420&format=Png&isCircular=false').then(function (j) { var u = j.data && j.data[0] && j.data[0].imageUrl; if (u) c.emblem = u; }).catch(function () {});
      var p2 = jget('/rbx/games/v2/groups/' + id + '/games?accessFilter=Public&limit=10&sortOrder=Desc').then(function (j) { c.games = (j.data || []).map(function (x) { return { id: String(x.id), name: x.name }; }); }).catch(function () {});
      var p3 = jget('/rbx/catalog/v1/search/items/details?CreatorTargetId=' + id + '&CreatorType=2&Limit=30&SortType=3').then(function (j) {
        c.store = (j.data || []).filter(function (i) { return i.itemType === 'Asset'; }).slice(0, 12).map(function (i) {
          return { id: 's' + i.id, name: i.name, price: Number(i.price != null ? i.price : i.lowestPrice) || 0, limited: (i.itemRestrictions || []).some(function (x) { return /Limited|Collectible/.test(x); }), asset: String(i.id) };
        });
      }).catch(function () {});
      Promise.all([p1, p2, p3]).then(function () { save(); refreshAll(); done('Loaded "' + g.name + '": name, owner, members, bio, emblem, games and store'); });
    }).catch(function () { done('Could not load that group'); });
  }

  /* ---- editor section (used by the app's Edit panel) ---- */
  function editor(root) {
    function draw() {
      root.innerHTML = '';
      var wrap = h('div', 'cmed');
      S.list.forEach(function (c) {
        var card = h('div', 'cmc');
        card.innerHTML = '<h5>' + esc(c.name) + '</h5>' +
          '<div class="r"><label>Name<input type="text" data-k="name"></label><label>By (owner)<input type="text" data-k="by"></label></div>' +
          '<div class="r"><label>Group ID<input type="text" data-k="gid"></label></div><div class="r fit"><button class="pri" data-act="load">Load from Roblox</button><span class="gmsg" style="font-size:11.5px;color:#6a6f81"></span></div><label style="font-size:11px">Funds, Pending and Revenue are private on Roblox, so they stay editable here.</label><div class="r"><label>Members<input type="number" min="0" data-k="members"></label><label>Funds (Robux)<input type="number" data-k="funds"></label><label>Pending Robux<input type="number" data-k="pending"></label></div>' +
          '<label>Bio<textarea data-k="bio"></textarea></label><label>Emblem (image URL or asset ID)<input type="text" data-k="emblem"></label>' +
          '<div class="r fit"><label class="chk"><input type="checkbox" data-k="own"> Owned by me</label><label class="chk"><input type="checkbox" data-k="prim"> Primary</label></div>';
        card.querySelectorAll('[data-k]').forEach(function (i) {
          var k = i.getAttribute('data-k');
          if (k === 'own') i.checked = c.role === 'owner'; else if (k === 'prim') i.checked = !!c.primary; else i.value = c[k] == null ? '' : (k === 'emblem' && /^data:/.test(c[k]) ? '(uploaded image)' : c[k]);
          i.addEventListener('change', function () {
            if (k === 'own') c.role = i.checked ? 'owner' : 'member';
            else if (k === 'prim') { S.list.forEach(function (x) { x.primary = false; }); c.primary = i.checked; }
            else if (k === 'members' || k === 'funds' || k === 'pending') c[k] = Math.max(0, Math.floor(Number(i.value) || 0));
            else if (k === 'emblem') { if (i.value === '(uploaded image)') return; c.emblem = i.value.trim(); }
            else c[k] = i.value;
            save(); refreshAll(); if (k === 'prim' || k === 'own' || k === 'name') draw();
          });
        });
        card.querySelector('[data-act=load]').addEventListener('click', function (ev) {
          var btn = ev.currentTarget, msg = card.querySelector('.gmsg'); btn.disabled = true; msg.textContent = 'Loading...';
          loadGroup(c, function (m) { btn.disabled = false; msg.textContent = m; setTimeout(draw, 1400); });
        });
        // revenue generator: pick a range and the numbers are made realistic automatically
        var gn = h('div', 'st'); gn.innerHTML = '<label>Generate revenue (realistic) - pick a range for Sale of Goods</label><div class="r"><label>From<input type="number" min="0" data-g="min"></label><label>To<input type="number" min="0" data-g="max"></label><label>Period<select data-g="per"></select></label></div><div class="r fit"><button class="pri" data-g="one">Generate this period</button><button class="pri" data-g="all">Generate all periods</button></div>';
        var sel = gn.querySelector('select'); PERIODS.forEach(function (p) { var o = document.createElement('option'); o.value = p[0]; o.textContent = p[1]; sel.appendChild(o); }); sel.value = 'yr';
        gn.querySelector('[data-g=min]').value = c.gen.min; gn.querySelector('[data-g=max]').value = c.gen.max;
        ['min', 'max'].forEach(function (k) { gn.querySelector('[data-g=' + k + ']').addEventListener('change', function (e) { c.gen[k] = Math.max(0, Math.floor(Number(e.target.value) || 0)); save(); }); });
        function rr(a, b) { return a + Math.random() * (b - a); }
        function row(sale) {
          sale = Math.round(sale);
          var reb = Math.round(sale * rr(0.25, 0.7)), com = Math.random() < 0.4 ? Math.round(sale * rr(0, 0.04)) : 0, rew = Math.random() < 0.5 ? Math.round(sale * rr(0, 0.03)) : 0;
          var pay = -Math.round((sale + reb + com + rew) * rr(0.6, 1.1));
          return [sale, reb, com, pay, rew];
        }
        gn.querySelector('[data-g=one]').addEventListener('click', function () {
          var lo = Math.min(c.gen.min, c.gen.max), hi = Math.max(c.gen.min, c.gen.max);
          c.rev[sel.value] = row(rr(lo, hi)); save(); refreshAll(); draw();
        });
        gn.querySelector('[data-g=all]').addEventListener('click', function () {
          // the range is for the whole year; month, week and day come out as realistic fractions of it
          var lo = Math.min(c.gen.min, c.gen.max), hi = Math.max(c.gen.min, c.gen.max);
          var yr = rr(lo, hi), m = yr * rr(0.07, 0.11), w = m * rr(0.2, 0.3), d = w * rr(0.11, 0.16);
          c.rev.yr = row(yr); c.rev.d30 = row(m); c.rev.d7 = row(w); c.rev.day = row(d); save(); refreshAll(); draw();
        });
        card.appendChild(gn);
        // revenue
        var rv = h('div', 'st'); rv.innerHTML = '<label>Revenue by period: Sale of Goods / Advance Rebates / Commissions / Payouts / Creator Rewards</label>';
        REV.forEach(function (rk, ri) {
          var row = h('div', 'rv'); row.appendChild(h('span', null, PERIODS[ri][1]));
          REV_LAB.forEach(function (l, li) {
            var i = h('input'); i.type = 'number'; i.title = l; i.value = c.rev[rk][li];
            i.addEventListener('change', function () { c.rev[rk][li] = Math.floor(Number(i.value) || 0); save(); refreshAll(); });
            row.appendChild(i);
          });
          rv.appendChild(row);
        });
        card.appendChild(rv);
        // games of this community (they open the real game page when tapped)
        var gm = h('div', 'st'); gm.innerHTML = '<label>Games (universe ID / name) - shown in Home</label>';
        c.games.forEach(function (g) {
          var r = h('div', 'sti', '<input type="text" inputmode="numeric" data-q="id" placeholder="universe ID"><input type="text" data-q="name" placeholder="name"><span></span><span></span><button class="del">x</button>');
          r.querySelectorAll('[data-q]').forEach(function (i) { var k = i.getAttribute('data-q'); i.value = g[k] || ''; i.addEventListener('change', function () { g[k] = k === 'id' ? i.value.replace(/\D/g, '') : i.value; save(); refreshAll(); }); });
          r.querySelector('.del').addEventListener('click', function () { c.games = c.games.filter(function (x) { return x !== g; }); save(); refreshAll(); draw(); });
          gm.appendChild(r);
        });
        var ga = h('button', 'pri', '+ Add game'); ga.addEventListener('click', function () { c.games.push({ id: '', name: '' }); save(); draw(); });
        gm.appendChild(ga); card.appendChild(gm);
        // store items
        var st = h('div', 'st'); st.innerHTML = '<label>Store items (name / price / asset ID / limited)</label>';
        c.store.forEach(function (it) {
          var r = h('div', 'sti', '<input type="text" data-s="name"><input type="number" min="0" data-s="price"><input type="text" inputmode="numeric" data-s="asset" placeholder="asset ID"><label class="chk"><input type="checkbox" data-s="limited"> Ltd</label><button class="del">x</button>');
          r.querySelectorAll('[data-s]').forEach(function (i) {
            var k = i.getAttribute('data-s');
            if (k === 'limited') i.checked = !!it.limited; else i.value = it[k] == null ? '' : it[k];
            i.addEventListener('change', function () {
              if (k === 'limited') it.limited = i.checked; else if (k === 'price') it.price = Math.max(0, Math.floor(Number(i.value) || 0)); else if (k === 'asset') it.asset = i.value.replace(/\D/g, ''); else it.name = i.value;
              save(); refreshAll();
            });
          });
          r.querySelector('.del').addEventListener('click', function () { c.store = c.store.filter(function (x) { return x !== it; }); save(); refreshAll(); draw(); });
          st.appendChild(r);
        });
        var add = h('button', 'pri', '+ Add item'); add.addEventListener('click', function () { c.store.push({ id: 's' + Date.now().toString(36), name: 'New item', price: 0, limited: false, asset: '' }); save(); refreshAll(); draw(); });
        st.appendChild(add); card.appendChild(st);
        var del = h('button', 'del', 'Delete community'); del.addEventListener('click', function () { S.list = S.list.filter(function (x) { return x !== c; }); save(); closeAll(); draw(); });
        card.appendChild(del);
        wrap.appendChild(card);
      });
      var nb = h('button', 'pri', '+ Add community');
      nb.addEventListener('click', function () { S.list.push(norm({ id: uid(), name: 'New Community', by: 'munfuja', members: 1, role: 'member', primary: false })); save(); draw(); });
      wrap.appendChild(nb);
      root.appendChild(wrap);
    }
    draw();
  }

  /* ---- hook: Drawer > Communities opens this ---- */
  function open() {
    closeAll();
    var scrim = document.querySelector('[data-testid="drawer-scrim"]');
    if (scrim) scrim.click();
    setTimeout(function () { push({ type: 'list', q: '' }); }, 60);
  }
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest && e.target.closest('[data-testid="drawer-communities"]');
    if (t) { e.stopPropagation(); e.preventDefault(); open(); }
  }, true);

  window.RoCm = { open: open, editor: editor, state: function () { return S; } };
})();
