/* Panel Social (se abre al tocar la foto de perfil): Social, Chats, Settings (Video) y Menú. Todo en inglés. Los amigos son de ejemplo. */
(function () {
  const stage = document.getElementById('stage'); if (!stage) return;
  const st = document.createElement('style');
  st.textContent = `
  #socp{position:absolute;left:1312px;top:16px;width:652px;height:888px;z-index:60;visibility:hidden;opacity:0;translate:70px 0;transition:opacity .28s ease,translate .3s cubic-bezier(.2,.9,.3,1),visibility 0s .3s;pointer-events:none;border-radius:26px;background:linear-gradient(#0a2a78,#07164f 40%,#061245);box-shadow:0 12px 50px rgba(0,0,20,.6);color:#fff;font-family:Montserrat,system-ui;overflow:hidden}
  #socp.on{visibility:visible;opacity:1;translate:0 0;transition:opacity .28s ease,translate .3s cubic-bezier(.2,.9,.3,1),visibility 0s;pointer-events:auto}
  #socdim{position:absolute;inset:0;z-index:59;opacity:0;pointer-events:none;background:rgba(2,8,40,.45);transition:opacity .3s}#socdim.on{opacity:1;pointer-events:auto}
  .si{display:inline-block;background:currentColor;-webkit-mask:var(--m) center/contain no-repeat;mask:var(--m) center/contain no-repeat;flex:none}
  #socp .tabs{position:absolute;left:12px;top:12px;width:468px;height:88px;border-radius:22px;background:rgba(10,20,70,.8);display:flex;padding:8px;gap:6px;box-sizing:border-box}
  #socp .tb{flex:1;border-radius:16px;display:flex;align-items:center;justify-content:center;cursor:pointer}
  #socp .tb.on{background:#bcd8ff}#socp .tb{color:#dbe8ff}#socp .tb.on{color:#0a1a55}
  #socp .me{position:absolute;right:20px;top:14px;width:80px;height:80px;border-radius:50%;background:#1d6fe0 center/cover no-repeat;border:4px solid #0a2461;box-sizing:border-box}
  #socp .me::after{content:'';position:absolute;right:-2px;bottom:-2px;width:22px;height:22px;border-radius:50%;background:#33d65a;border:4px solid #0a2461;box-sizing:border-box}
  #socp .pg{position:absolute;left:0;right:0;top:112px;bottom:0;display:none;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:0 22px 24px}
  #socp .pg.on{display:block;animation:fxFade .25s both}#socp .pg::-webkit-scrollbar{display:none}
  #socp h2{margin:6px 0 14px;font:700 38px Montserrat}
  #socp .row2{display:flex;gap:12px}#socp .card{flex:1;height:76px;border-radius:14px;background:rgba(40,70,160,.45);display:flex;align-items:center;gap:14px;padding:0 16px;box-sizing:border-box}
  #socp .card b{display:block;font:700 22px Montserrat}#socp .card span{font:500 20px Montserrat;color:#a9bde8}
  #socp .ic4{display:flex;gap:10px;margin-top:12px}#socp .ic4 div{flex:1;height:68px;border-radius:12px;background:rgba(40,70,160,.4);display:flex;align-items:center;justify-content:center;font:900 26px Montserrat;color:#dbe8ff}
  #socp .note{text-align:center;margin:12px 0;font:500 21px Montserrat;color:#d3e0ff}
  #socp .pl{display:flex;align-items:center;gap:14px;padding:8px 0}
  #socp .av{width:64px;height:64px;border-radius:50%;background:#3a4f8f center/cover no-repeat;flex:none;position:relative}
  #socp .av i{position:absolute;right:-1px;bottom:-1px;width:18px;height:18px;border-radius:50%;border:3px solid #07164f;background:#33d65a}#socp .av i.aw{background:#ffd23a}
  #socp .pl b{display:block;font:700 24px Montserrat}#socp .pl span{font:500 20px Montserrat;color:#9fb4e8}
  #socp .you{background:#ffe92e;color:#1a1a00;border-radius:5px;padding:0 6px;font:900 13px Montserrat;margin-left:8px;vertical-align:middle}
  #socp .fh{display:flex;align-items:center;margin:8px 0 4px;padding-top:10px;border-top:1px solid rgba(255,255,255,.1);font:600 22px Montserrat;color:#cfe0ff}
  #socp .fh .sp{flex:1}#socp .fh .add{width:54px;height:54px;border-radius:12px;background:rgba(40,70,160,.55);display:flex;align-items:center;justify-content:center;cursor:pointer;font:700 30px Montserrat}
  #socp .req{display:flex;align-items:center;gap:14px;padding:8px 0;cursor:pointer}
  #socp .badge{margin-left:auto;background:#ffe92e;color:#1a1a00;border-radius:50%;width:32px;height:32px;text-align:center;font:900 19px/32px Montserrat}
  #socp .back{display:flex;align-items:center;gap:20px;margin:6px 0 14px;font:700 38px Montserrat;cursor:pointer}
  #socp .back u{width:62px;height:62px;border-radius:12px;background:rgba(40,70,160,.55);text-decoration:none;display:flex;align-items:center;justify-content:center;font:700 34px Montserrat}
  #socp .sbox{display:flex;align-items:center;gap:12px;height:76px;border-radius:16px;border:3px solid #cfe9d0;background:#0a1d62;padding:0 14px;box-sizing:border-box}
  #socp .sbox input{flex:1;min-width:0;background:none;border:0;outline:0;color:#fff;font:600 26px Montserrat}
  .xx{position:relative;width:20px;height:20px;display:block}.xx::before,.xx::after{content:'';position:absolute;left:-2px;right:-2px;top:8px;height:5px;border-radius:2px;background:#0a1a55;transform:rotate(45deg)}.xx::after{transform:rotate(-45deg)}
  #socp .me{cursor:pointer}
  #socp .sbox .x{width:46px;height:46px;border-radius:9px;background:#bcd8ff;color:#0a1a55;display:flex;align-items:center;justify-content:center;font:900 24px Montserrat;cursor:pointer}
  #socp .inv{margin-top:12px;height:66px;border-radius:12px;background:linear-gradient(90deg,#8fc6ff,#a8d8ff);color:#0a1a55;display:flex;align-items:center;justify-content:center;font:600 25px Montserrat;cursor:pointer}
  #socp .sr{display:flex;margin:38px 0 10px;font:600 22px Montserrat}#socp .sr span{margin-left:auto;color:#cfe0ff}
  #socp .pbig{width:80px;height:80px;border-radius:50%;background:#4a4a55;margin:-34px auto 0}
  #socp .pnm{text-align:center;font:700 32px Montserrat;margin-top:22px}#socp .ptag{margin:16px auto 20px;width:max-content;padding:6px 18px;border-radius:20px;background:rgba(40,70,160,.5);font:600 22px Montserrat}
  #socp .psent{display:none;text-align:center;color:#f4ff2a;font:800 27px Montserrat;margin:6px 0 18px}
  #socp .pbtn{height:70px;border-radius:10px;background:rgba(60,95,170,.5);display:flex;align-items:center;justify-content:center;margin-top:10px;font:500 25px Montserrat;cursor:pointer}
  #socp .padd{margin-left:auto;display:flex;align-items:center;gap:8px;padding:0 20px;height:68px;border-radius:10px;background:rgba(60,95,170,.5);font:500 22px Montserrat;cursor:pointer}
  #socp .srch{display:flex;align-items:center;gap:16px;padding:26px 6px;font:600 23px Montserrat;color:#bcd0f5}
  #socp .srch i{width:28px;height:28px;border-radius:50%;border:4px solid rgba(255,255,255,.25);border-top-color:#fff;animation:socspin .8s linear infinite}
  @keyframes socspin{to{transform:rotate(360deg)}}
  #socp .empty{text-align:center;margin-top:230px;font:600 24px Montserrat;color:#bcd0f5}#socp .empty small{display:block;margin-top:10px;font:500 19px Montserrat;color:#9fb4e8}
  #socp .setrow{display:flex;align-items:center;gap:18px;padding:18px 6px;border-bottom:1px solid rgba(255,255,255,.08);font:600 25px Montserrat;cursor:pointer}
  #soctoast{position:absolute;left:0;top:178px;width:740px;height:86px;z-index:80;background:linear-gradient(118deg,transparent 0 50%,rgba(150,225,160,.16) 50% 63%,transparent 63% 100%),linear-gradient(62deg,transparent 0 58%,rgba(255,255,255,.55) 58% 74%,transparent 74% 100%),linear-gradient(100deg,#fff 0,#fff 44%,#e8fbe9 66%,#d3f6d8 86%,#c4f2cb 100%);clip-path:polygon(0 0,100% 0,97% 100%,0 100%);transform:translateX(-112%);transition:transform .4s cubic-bezier(.16,.9,.3,1);display:flex;align-items:center;padding-left:230px;box-sizing:border-box;color:#111;font-family:Montserrat,system-ui;pointer-events:none}
  #soctoast.on{transform:none}
  #soctoast .ic{position:absolute;left:112px;top:12px;width:62px;height:62px;border-radius:50%;background:#2c78c4 center/cover no-repeat;overflow:hidden}
    #soctoast b{display:block;font:900 24px/1 Montserrat,system-ui;letter-spacing:-.4px;transform:scaleX(.86);transform-origin:left;text-transform:uppercase}
  #soctoast span{display:block;margin-top:3px;font:700 22px/1.1 Montserrat,system-ui;color:#2f3a35;transform:scaleX(.9);transform-origin:left}#soctoast u{color:#1a8cff;text-decoration:none;text-transform:uppercase;font-weight:800}
  #soctoast .ck{position:absolute;right:34px;top:18px;width:52px;height:50px;scale:.2;opacity:0}
  #soctoast.on .ck{animation:sckpop .4s .55s cubic-bezier(.2,1.5,.4,1) both}
  #soctoast::after{content:'';position:absolute;right:0;top:0;bottom:0;width:26px;background:#2ad45c;transform:skewX(-8deg);transform-origin:right}
  #soctoast.on::after{animation:scbar .9s ease-out both}
  @keyframes sckpop{to{scale:1;opacity:1}}
  @keyframes scbar{0%{width:130px;opacity:1}45%{width:130px;opacity:1}100%{width:26px;opacity:1}}
  #socset{position:absolute;inset:0;z-index:70;display:none;background:#050a24;color:#fff;font-family:Montserrat,system-ui}#socset.on{display:block}
  #socset .cat{position:absolute;left:150px;top:40px;display:flex;gap:26px;font:700 22px Montserrat;color:#6f86c8}
  #socset .cat .on{color:#fff;border-bottom:4px solid #fff;padding-bottom:6px}
  #socset .side{position:absolute;left:150px;top:130px;width:260px;font:600 22px Montserrat;color:#9fb4e8}
  #socset .side div{padding:14px 18px;border-radius:8px}#socset .side .on{background:#2b5fc6;color:#fff}
  #socset .main{position:absolute;left:470px;top:130px;width:1100px;font:600 22px Montserrat}
  #socset .main h4{margin:26px 0 8px;font:900 22px Montserrat;color:#fff;letter-spacing:.04em}
  #socset .main .r{display:flex;align-items:center;padding:14px 18px;margin:6px 0;border-radius:8px;background:rgba(40,70,160,.28)}#socset .main .r b{margin-left:auto;font:700 22px Montserrat;color:#dbe8ff}
  #socset .bk{position:absolute;right:130px;bottom:50px;padding:16px 44px;border-radius:10px;background:#3f86e6;color:#0a1a55;font:italic 400 28px 'Archivo Black';cursor:pointer}
  `;
  document.head.appendChild(st);

  const mi = (n, w, h) => '<i class="si" style="--m:url(assets/soc/' + n + '.webp);width:' + w + 'px;height:' + (h || w) + 'px"></i>';
  const ico = { people: mi('people', 42, 38), chat: mi('chat', 44, 40), gear: mi('gear', 40), menu: mi('menu', 42, 36) };

  const p = document.createElement('div'); p.id = 'socp';
  const friends = [['Skyler_R', 'Battle Royale - Solo', 1], ['mia.plays', 'Away', 0], ['ghostN3ko', 'Away', 0], ['TheRealJay', 'In Lobby', 1]];
  const hs0 = (t) => { let h = 0; for (const c of String(t)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
  const rows = friends.map((f) => '<div class="pl"><div class="av" style="background:url(assets/pa' + (hs0(f[0]) % 14) + '.webp) center/cover"><i class="' + (f[2] ? '' : 'aw') + '"></i></div><div><b>' + f[0] + '</b><span>' + f[1] + '</span></div></div>').join('');
  p.innerHTML = '<div class="tabs"><div class="tb on" data-p="soc">' + ico.people + '</div><div class="tb" data-p="chat">' + ico.chat + '</div><div class="tb" data-p="set">' + ico.gear + '</div><div class="tb" data-p="menu">' + ico.menu + '</div></div><div class="me"></div>'
    + '<div class="pg on" id="pg-soc"><h2>Social</h2><div class="row2"><div class="card"><div class="av" style="width:46px;height:46px;background:#33509a;display:flex;align-items:center;justify-content:center;border-radius:12px">' + mi('people', 30, 27) + '</div><div><b>Party</b><span>Just you</span></div></div><div class="card"><div class="av" style="width:46px;height:46px;border-radius:8px;background:#7a6a4a"></div><div><b>Game</b><span>Not in a game yet</span></div></div></div>'
    + '<div class="ic4"><div>' + mi('lock', 34, 40) + '</div><div>' + mi('mic', 30, 40) + '</div><div>' + mi('head', 40, 40) + '</div><div>' + mi('dots', 38, 11) + '</div></div><div class="note">Invite only &middot; Voice reporting off</div>'
    + '<div class="pl"><div class="av me2"><i></i></div><div><b class="nm"></b><span>Battle Royale</span></div></div>'
    + '<div class="fh">Friends<span class="sp"></span><div class="add" id="socadd">' + mi('addf', 34, 32) + '</div></div><div class="req" id="socreq"><div class="av" style="background:#3a3f55"></div><div><b style="font:700 24px Montserrat">Friend requests</b><span style="display:block;font:500 20px Montserrat;color:#9fb4e8">3 requests</span></div><div class="badge">3</div><span style="margin-left:12px;display:inline-flex">' + mi('chev', 12, 19) + '</span></div>' + rows + '</div>'
    + '<div class="pg" id="pg-add"><div class="back" id="socback"><u>' + mi('back', 22, 30) + '</u>Add friends</div><div class="sbox"><svg width="30" height="30" viewBox="0 0 24 24"><circle cx="10" cy="10" r="6.500" fill="none" stroke="#fff" stroke-width="3"/><path d="M15 15l6 6" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg><input id="socq" placeholder="Search by display name" autocomplete="off" autocapitalize="off" spellcheck="false"><div class="x" id="socx"><span class="xx"></span></div></div><div class="inv">Invite a friend</div><div class="sr"><b id="socttl" style="font-weight:600">Recent players</b><span id="socn">0</span></div><div id="socres"></div></div>'
    + '<div class="pg" id="pg-prof"><div class="back" id="profback" style="margin-bottom:0"><u>' + mi('back', 22, 30) + '</u></div><div class="pbig"></div><div class="pnm" id="pnm"></div><div class="ptag" id="ptag"></div><div class="psent" id="psent">Friend request sent!</div><div class="pbtn" id="padd">Add friend</div><div class="pbtn">Block</div><div class="pbtn">Report</div></div>'
    + '<div class="pg" id="pg-chat"><h2>Chats</h2><div class="inv" style="background:rgba(40,70,160,.5);color:#fff;height:58px;font-size:22px">New chat</div><div class="empty">No chats yet<small>Your chats will appear here.</small></div></div>'
    + '<div class="pg" id="pg-set"><h2>Settings</h2><div class="setrow" data-s="video">Video</div><div class="setrow">Audio</div><div class="setrow">Controller</div><div class="setrow">Account</div></div>'
    + '<div class="pg" id="pg-menu"><h2>Menu</h2><div class="setrow">Switch account</div><div class="setrow">Parental controls</div><div class="setrow">Help</div></div>';
  const dim = document.createElement('div'); dim.id = 'socdim';
  stage.appendChild(dim); stage.appendChild(p);
  let q0 = null;
  const me = p.querySelector('.me'), me2 = p.querySelector('.me2'), nm = p.querySelector('.nm');
  const syncMe = () => {
    let A = {}; try { A = JSON.parse(localStorage.getItem('fn_avatar') || '{}'); } catch (e) {}
    const img = A.icon ? 'url("' + A.icon + '")' : 'url(assets/avatar.webp)';
    [me, me2].forEach((e) => { if (!e) return; e.style.backgroundImage = img; e.style.backgroundColor = A.color || '#1d6fe0'; e.style.backgroundSize = A.icon ? 'cover' : '150%'; e.style.backgroundPosition = A.icon ? 'center top' : 'center'; });
    const n = document.querySelector('[data-t="player.name"]'); nm.textContent = n ? n.textContent : 'Player';
  };
  const show = (k) => { p.querySelectorAll('.tb').forEach((t) => t.classList.toggle('on', t.dataset.p === k)); p.querySelectorAll('.pg').forEach((g) => g.classList.remove('on')); p.querySelector('#pg-' + k).classList.add('on'); };
  p.querySelectorAll('.tb').forEach((t) => { t.onclick = () => { show(t.dataset.p); }; });
  const open = () => { syncMe(); show('soc'); p.classList.add('on'); dim.classList.add('on'); window.SFX && SFX.play('social-open'); };
  const close = () => { if (!p.classList.contains('on')) return; p.classList.remove('on'); dim.classList.remove('on'); window.SFX && SFX.play('social-close'); };
  // Un solo manejador por toque (pointerup + respaldo de click con antirrebote) para que no se abra y cierre a la vez
  let lastT = 0;
  const once = (fn) => (e) => { const t = Date.now(); if (t - lastT < 350) return; lastT = t; if (e && e.preventDefault && e.cancelable) e.preventDefault(); fn(e); };
  const tap = (el, fn) => { const h = once(fn); el.addEventListener('pointerup', h); el.addEventListener('click', h); };
  tap(dim, () => close());
  tap(me, () => close());
  // zona táctil de la foto: encima de todo (z-index 58, justo debajo del fondo oscuro) y más grande que la foto
  const hit = document.createElement('div'); hit.id = 'sochit'; hit.style.cssText = 'position:absolute;left:1750px;top:0;width:200px;height:150px;z-index:58;cursor:pointer;pointer-events:auto;-webkit-tap-highlight-color:transparent;touch-action:manipulation';
  tap(hit, () => (p.classList.contains('on') ? close() : open())); stage.appendChild(hit);
  // solo se cierra cuando la pantalla CAMBIA de verdad (antes se cerraba con cualquier reescritura del atributo)
  let lastScr = document.body.dataset.screen;
  new MutationObserver(() => { const cur = document.body.dataset.screen; if (cur !== lastScr) { lastScr = cur; close(); } }).observe(document.body, { attributes: true, attributeFilter: ['data-screen'] });
  // la foto solo se puede tocar donde la barra de arriba es visible (no en ficha ni regalos)
  const sync = () => { const sc = document.body.dataset.screen; hit.style.display = (sc === 'detail' || sc === 'gift' || sc === 'locker' && document.body.classList.contains('lkopen')) ? 'none' : 'block'; };
  new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['data-screen', 'class'] }); sync();

  p.querySelector('#socadd').onclick = () => { show('soc'); p.querySelectorAll('.pg').forEach((g) => g.classList.remove('on')); p.querySelector('#pg-add').classList.add('on'); q0 && q0(); };
  p.querySelector('#socreq').onclick = () =>
  p.querySelector('#socback').onclick = () => { show('soc'); window.SFX && SFX.play('back'); };
  const POOL = ['Nova_Kid', 'xX_Blaze_Xx', 'moonlight9', 'PixelPaul', 'sir_loin', 'KaiTheFox', 'ZeroCool77', 'mariah.b', 'LuckyStrike', 'OnlyAlex', 'SoupDragon', 'gamer_gale', 'TacoTuesday', 'RexOnFire'];
  const RECENT = ['Drojas_03', 'char_345der', 'DefiantSquid', 'colmillo_30', 'pzbnlx_27', 'RiftRunner', 'LunaPlays'];
  // fotos de perfil: los iconos de todos los personajes (outfits.json); mientras carga o si falla, las 14 de siempre
  let faces = null; fetch('data/outfits.json?' + Date.now()).then((r) => (r.ok ? r.json() : [])).then((l) => { faces = (l || []).map((x) => x.icon).filter(Boolean); }).catch(() => {});
  window.fnPic = (name) => { let h = 0; for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return faces && faces.length ? faces[h % faces.length] : 'assets/pa' + (h % 14) + '.webp'; };
  const hs = (t) => { let h = 0; for (const c of String(t)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
  const pic = (n) => 'url(' + window.fnPic(n) + ')';
  const sent = new Set(); let qt = 0, qn = 0;
  const res = p.querySelector('#socres'), cntEl = p.querySelector('#socn'), ttl = p.querySelector('#socttl'), q = p.querySelector('#socq');
  const toast = document.createElement('div'); toast.id = 'soctoast'; toast.innerHTML = '<div class="ic"></div><div><b>FRIEND REQUEST SENT</b><span>Sent friend request to <u id="sctn"></u></span></div><div class="ck"><i class="si" style="--m:url(assets/soc/check.webp);width:52px;height:50px;color:#6fe08a"></i></div>'; stage.appendChild(toast);
  let tt = 0; const showToast = (n) => { toast.querySelector('#sctn').textContent = n; toast.querySelector('.ic').style.backgroundImage = pic(n); toast.classList.add('on'); window.SFX && SFX.play('friend-sent'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('on'), 2600); };
  const openProf = (n) => {
    p.querySelectorAll('.pg').forEach((g) => g.classList.remove('on')); p.querySelector('#pg-prof').classList.add('on');
    p.querySelector('#pnm').textContent = n; p.querySelector('.pbig').style.cssText = 'background:#4a4a55 ' + pic(n) + ' center/cover no-repeat'; p.querySelector('#ptag').textContent = n.replace(/[^A-Za-z]/g, '').slice(0, 12) + Math.floor(100 + (n.length * 37) % 900);
    const was = sent.has(n); p.querySelector('#psent').style.display = was ? 'block' : 'none'; p.querySelector('#padd').style.display = was ? 'none' : 'flex'; p.querySelector('#padd').dataset.n = n;
  };
  const mkRow = (n, sub, addBtn) => { const d = document.createElement('div'); d.className = 'pl'; d.style.cursor = 'pointer'; d.innerHTML = '<div class="av"></div><div><b></b>' + (sub ? '<span></span>' : '') + '</div>' + (addBtn && !sent.has(n) ? '<div class="padd"><i class="si" style="--m:url(assets/soc/addf.webp);width:28px;height:26px"></i>Add</div>' : ''); d.querySelector('b').textContent = n; d.querySelector('.av').style.backgroundImage = pic(n); d.querySelector('.av').style.backgroundSize = 'cover'; if (sub) d.querySelector('span').textContent = sub;
    d.onclick = (e) => { if (e.target.closest('.padd')) { sent.add(n); e.target.closest('.padd').remove(); showToast(n); } else openProf(n); }; return d; };
  const render = () => {
    const t = q.value.trim().toLowerCase(); res.innerHTML = '';
    if (!t) { ttl.textContent = 'Recent players'; cntEl.textContent = RECENT.length; RECENT.forEach((n, i) => res.appendChild(mkRow(n, 'Played together ' + (1 + i % 3) + 'w ago', i % 3 !== 2))); return; }
    ttl.textContent = 'Search results';
    // búsqueda "con red": tarda ~1 s; luego salen el usuario exacto y 0-2 con nombre parecido
    cntEl.textContent = ''; res.innerHTML = '<div class="srch"><i></i>Searching…</div>';
    clearTimeout(qt); const mine = ++qn;
    qt = setTimeout(() => {
      if (mine !== qn || q.value.trim().toLowerCase() !== t) return;
      const raw = q.value.trim(), h = hs(t), base = raw.replace(/\s+/g, '_'), tails = ['_', '07', 'xd', '_YT', '99', 'TTV', '_off', 'x'], heads = ['xX', 'The', 'Its', 'iam', 'Mr'];
      const sim = [base + tails[h % tails.length], (heads[(h >>> 3) % heads.length]) + base.charAt(0).toUpperCase() + base.slice(1), base + (10 + h % 89), base.toLowerCase() + tails[(h >>> 5) % tails.length]];
      const n = 1 + (h % 3); // 1 a 3 resultados
      const list = [base]; for (const x of sim) { if (list.length >= n) break; if (!list.some((y) => y.toLowerCase() === x.toLowerCase())) list.push(x); }
      res.innerHTML = ''; cntEl.textContent = list.length; list.forEach((nm, i) => { const row = mkRow(nm, '', false); row.style.animation = 'fxSlideL .3s ' + (i * 90) + 'ms both'; res.appendChild(row); });
    }, 1000);
  };
  q.addEventListener('input', render); p.querySelector('#socx').onclick = () => { q.value = ''; render(); q.focus(); };
  p.querySelector('#padd').onclick = () => { const n = p.querySelector('#padd').dataset.n; sent.add(n); p.querySelector('#padd').style.display = 'none'; p.querySelector('#psent').style.display = 'block'; showToast(n); };
  p.querySelector('#profback').onclick = () => { p.querySelectorAll('.pg').forEach((g) => g.classList.remove('on')); p.querySelector('#pg-add').classList.add('on'); render(); window.SFX && SFX.play('back'); };
  render(); q0 = () => { render(); };

  // Settings > Video
  const set = document.createElement('div'); set.id = 'socset';
  set.innerHTML = '<div class="cat"><span class="on">VIDEO</span><span>AUDIO</span><span>GAME</span><span>CONTROLS</span><span>ACCOUNT</span></div><div class="side"><div class="on">Display</div><div>Graphics</div><div>Graphics Quality</div><div>Advanced Graphics</div></div>'
    + '<div class="main"><h4>DISPLAY</h4><div class="r">Mobile Framerate<b>60 FPS</b></div><h4>GRAPHICS</h4><div class="r">User Interface Contrast<b>1x</b></div><h4>GRAPHICS QUALITY</h4><div class="r">Auto-Set Quality<b>AUTO-SET</b></div><div class="r">Quality Preset<b>Low</b></div><div class="r">Anti-Aliasing &amp; Super Resolution<b>Off</b></div></div><div class="bk">BACK</div>';
  stage.appendChild(set);
  p.querySelector('[data-s="video"]').onclick = () => { close(); set.classList.add('on'); window.SFX && SFX.play('open'); };
  set.querySelector('.bk').onclick = () => { set.classList.remove('on'); window.SFX && SFX.play('back'); };
})();
