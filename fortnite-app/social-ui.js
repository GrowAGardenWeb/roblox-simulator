/* Panel Social (se abre al tocar la foto de perfil): Social, Chats, Settings (Video) y Menú. Todo en inglés. Los amigos son de ejemplo. */
(function () {
  const stage = document.getElementById('stage'); if (!stage) return;
  const st = document.createElement('style');
  st.textContent = `
  #socp{position:absolute;left:1312px;top:16px;width:652px;height:888px;z-index:60;visibility:hidden;opacity:0;translate:70px 0;transition:opacity .28s ease,translate .3s cubic-bezier(.2,.9,.3,1),visibility 0s .3s;pointer-events:none;border-radius:26px;background:linear-gradient(#0a2a78,#07164f 40%,#061245);box-shadow:0 12px 50px rgba(0,0,20,.6);color:#fff;font-family:Montserrat,system-ui;overflow:hidden}
  #socp.on{visibility:visible;opacity:1;translate:0 0;transition:opacity .28s ease,translate .3s cubic-bezier(.2,.9,.3,1),visibility 0s;pointer-events:auto}
  #socdim{position:absolute;inset:0;z-index:59;opacity:0;pointer-events:none;background:rgba(2,8,40,.45);transition:opacity .3s}#socdim.on{opacity:1;pointer-events:auto}
  #socp .tabs{position:absolute;left:12px;top:12px;width:468px;height:88px;border-radius:22px;background:rgba(10,20,70,.8);display:flex;padding:8px;gap:6px;box-sizing:border-box}
  #socp .tb{flex:1;border-radius:16px;display:flex;align-items:center;justify-content:center;cursor:pointer}
  #socp .tb.on{background:#bcd8ff}#socp .tb svg{width:40px;height:40px;fill:#dbe8ff}#socp .tb.on svg{fill:#0a1a55}
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
  #socp .sbox .x{width:46px;height:46px;border-radius:9px;background:#bcd8ff;color:#0a1a55;display:flex;align-items:center;justify-content:center;font:900 24px Montserrat;cursor:pointer}
  #socp .inv{margin-top:12px;height:66px;border-radius:12px;background:linear-gradient(90deg,#8fc6ff,#a8d8ff);color:#0a1a55;display:flex;align-items:center;justify-content:center;font:600 25px Montserrat;cursor:pointer}
  #socp .sr{display:flex;margin:38px 0 10px;font:600 22px Montserrat}#socp .sr span{margin-left:auto;color:#cfe0ff}
  #socp .empty{text-align:center;margin-top:230px;font:600 24px Montserrat;color:#bcd0f5}#socp .empty small{display:block;margin-top:10px;font:500 19px Montserrat;color:#9fb4e8}
  #socp .setrow{display:flex;align-items:center;gap:18px;padding:18px 6px;border-bottom:1px solid rgba(255,255,255,.08);font:600 25px Montserrat;cursor:pointer}
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

  const ico = {
    people: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.4"/><path d="M2.5 19c0-3.6 2.9-5.8 6.500-5.800S15.500 15.400 15.500 19z"/><circle cx="17" cy="9" r="2.6"/><path d="M16.500 13.500c3 .2 5 1.900 5 4.500h-4.400c0-1.700-.2-3.200-.6-4.500z"/></svg>',
    chat: '<svg viewBox="0 0 24 24"><path d="M3 5h12a2 2 0 012 2v6a2 2 0 01-2 2H9l-4 3v-3H3a2 2 0 01-2-2V7a2 2 0 012-2zm15 4h3a2 2 0 012 2v6a2 2 0 01-2 2h-1v3l-3.500-3H12v-1.500h6z"/></svg>',
    gear: '<svg viewBox="0 0 24 24"><path d="M19.400 13a7.800 7.800 0 000-2l2.100-1.600-2-3.400-2.500 1a7.600 7.600 0 00-1.700-1L15 3.400h-4l-.4 2.600a7.600 7.600 0 00-1.700 1l-2.500-1-2 3.400L6.600 11a7.800 7.800 0 000 2l-2.100 1.600 2 3.400 2.500-1a7.600 7.600 0 001.700 1l.4 2.600h4l.4-2.600a7.600 7.600 0 001.700-1l2.500 1 2-3.400zM13 15.500a3.500 3.500 0 110-7 3.500 3.500 0 010 7z"/></svg>',
    menu: '<svg viewBox="0 0 24 24"><path d="M3 5h18v3H3zm0 5.500h18v3H3zM3 16h18v3H3z"/></svg>',
  };
  const p = document.createElement('div'); p.id = 'socp';
  const friends = [['Skyler_R', 'Battle Royale - Solo', 1], ['mia.plays', 'Away', 0], ['ghostN3ko', 'Away', 0], ['TheRealJay', 'In Lobby', 1]];
  const rows = friends.map((f) => '<div class="pl"><div class="av"><i class="' + (f[2] ? '' : 'aw') + '"></i></div><div><b>' + f[0] + '</b><span>' + f[1] + '</span></div></div>').join('');
  p.innerHTML = '<div class="tabs"><div class="tb on" data-p="soc">' + ico.people + '</div><div class="tb" data-p="chat">' + ico.chat + '</div><div class="tb" data-p="set">' + ico.gear + '</div><div class="tb" data-p="menu">' + ico.menu + '</div></div><div class="me"></div>'
    + '<div class="pg on" id="pg-soc"><h2>Social</h2><div class="row2"><div class="card"><div class="av" style="width:46px;height:46px;background:#33509a"></div><div><b>Party</b><span>Just you</span></div></div><div class="card"><div class="av" style="width:46px;height:46px;border-radius:8px;background:#7a6a4a"></div><div><b>Game</b><span>Not in a game yet</span></div></div></div>'
    + '<div class="ic4"><div>&#128274;</div><div>&#127908;</div><div>&#127911;</div><div>&bull;&bull;&bull;</div></div><div class="note">Invite only &middot; Voice reporting off</div>'
    + '<div class="pl"><div class="av me2"><i></i></div><div><b class="nm"></b><span>Battle Royale</span></div></div>'
    + '<div class="fh">Friends<span class="sp"></span><div class="add" id="socadd">+&#9786;</div></div><div class="req" id="socreq"><div class="av" style="background:#3a3f55"></div><div><b style="font:700 24px Montserrat">Friend requests</b><span style="display:block;font:500 20px Montserrat;color:#9fb4e8">3 requests</span></div><div class="badge">3</div></div>' + rows + '</div>'
    + '<div class="pg" id="pg-add"><div class="back" id="socback"><u>&#8249;</u>Add friends</div><div class="sbox"><svg width="30" height="30" viewBox="0 0 24 24"><circle cx="10" cy="10" r="6.500" fill="none" stroke="#fff" stroke-width="3"/><path d="M15 15l6 6" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg><input id="socq" placeholder="Search" autocomplete="off" autocapitalize="off" spellcheck="false"><div class="x" id="socx">&#10005;</div></div><div class="inv">Invite a friend</div><div class="sr">Search results<span id="socn">0</span></div><div id="socres"></div></div>'
    + '<div class="pg" id="pg-chat"><h2>Chats</h2><div class="inv" style="background:rgba(40,70,160,.5);color:#fff;height:58px;font-size:22px">New chat</div><div class="empty">No chats yet<small>Your chats will appear here.</small></div></div>'
    + '<div class="pg" id="pg-set"><h2>Settings</h2><div class="setrow" data-s="video">&#128250; Video</div><div class="setrow">&#128266; Audio</div><div class="setrow">&#127918; Controller</div><div class="setrow">&#128100; Account</div></div>'
    + '<div class="pg" id="pg-menu"><h2>Menu</h2><div class="setrow">Switch account</div><div class="setrow">Parental controls</div><div class="setrow">Help</div></div>';
  const dim = document.createElement('div'); dim.id = 'socdim';
  stage.appendChild(dim); stage.appendChild(p);
  const me = p.querySelector('.me'), me2 = p.querySelector('.me2'), nm = p.querySelector('.nm');
  const syncMe = () => {
    let A = {}; try { A = JSON.parse(localStorage.getItem('fn_avatar') || '{}'); } catch (e) {}
    const img = A.icon ? 'url("' + A.icon + '")' : 'url(assets/avatar.webp)';
    [me, me2].forEach((e) => { if (!e) return; e.style.backgroundImage = img; e.style.backgroundColor = A.color || '#1d6fe0'; e.style.backgroundSize = A.icon ? 'cover' : '150%'; e.style.backgroundPosition = A.icon ? 'center top' : 'center'; });
    const n = document.querySelector('[data-t="player.name"]'); nm.textContent = n ? n.textContent : 'Player';
  };
  const show = (k) => { p.querySelectorAll('.tb').forEach((t) => t.classList.toggle('on', t.dataset.p === k)); p.querySelectorAll('.pg').forEach((g) => g.classList.remove('on')); p.querySelector('#pg-' + k).classList.add('on'); };
  p.querySelectorAll('.tb').forEach((t) => { t.onclick = () => { show(t.dataset.p); window.SFX && SFX.play('click'); }; });
  const open = () => { syncMe(); show('soc'); p.classList.add('on'); dim.classList.add('on'); window.SFX && SFX.play('open'); };
  const close = () => { p.classList.remove('on'); dim.classList.remove('on'); };
  dim.onclick = close;
  // zona táctil sobre la foto de perfil
  const nav = document.getElementById('nav');
  const hit = document.createElement('div'); hit.style.cssText = 'position:absolute;left:1766px;top:16px;width:116px;height:116px;z-index:30;cursor:pointer;pointer-events:auto'; hit.onclick = () => (p.classList.contains('on') ? close() : open()); if (nav) nav.appendChild(hit);
  new MutationObserver(() => { if (document.body.dataset.screen) close(); }).observe(document.body, { attributes: true, attributeFilter: ['data-screen'] });

  p.querySelector('#socadd').onclick = () => { show('soc'); p.querySelectorAll('.pg').forEach((g) => g.classList.remove('on')); p.querySelector('#pg-add').classList.add('on'); p.querySelector('#socq').focus(); window.SFX && SFX.play('click'); };
  p.querySelector('#socreq').onclick = () => window.SFX && SFX.play('click');
  p.querySelector('#socback').onclick = () => { show('soc'); window.SFX && SFX.play('back'); };
  const POOL = ['Nova_Kid', 'xX_Blaze_Xx', 'moonlight9', 'PixelPaul', 'sir_loin', 'KaiTheFox', 'ZeroCool77', 'mariah.b', 'LuckyStrike', 'OnlyAlex', 'SoupDragon', 'gamer_gale', 'TacoTuesday', 'RexOnFire'];
  const res = p.querySelector('#socres'), cntEl = p.querySelector('#socn'), q = p.querySelector('#socq');
  const render = () => {
    const t = q.value.trim().toLowerCase(); res.innerHTML = '';
    const list = t ? POOL.filter((x) => x.toLowerCase().includes(t[0]) || x.toLowerCase().includes(t)).slice(0, 8) : [];
    if (t && !list.length) list.push(q.value.trim());
    cntEl.textContent = t ? list.length : 0;
    list.forEach((n) => { const d = document.createElement('div'); d.className = 'pl'; d.innerHTML = '<div class="av" style="background:#3a3f55"></div><div><b></b></div>'; d.querySelector('b').textContent = n; res.appendChild(d); });
  };
  q.addEventListener('input', render); p.querySelector('#socx').onclick = () => { q.value = ''; render(); q.focus(); };

  // Settings > Video
  const set = document.createElement('div'); set.id = 'socset';
  set.innerHTML = '<div class="cat"><span class="on">VIDEO</span><span>AUDIO</span><span>GAME</span><span>CONTROLS</span><span>ACCOUNT</span></div><div class="side"><div class="on">Display</div><div>Graphics</div><div>Graphics Quality</div><div>Advanced Graphics</div></div>'
    + '<div class="main"><h4>DISPLAY</h4><div class="r">Mobile Framerate<b>60 FPS</b></div><h4>GRAPHICS</h4><div class="r">User Interface Contrast<b>1x</b></div><h4>GRAPHICS QUALITY</h4><div class="r">Auto-Set Quality<b>AUTO-SET</b></div><div class="r">Quality Preset<b>Low</b></div><div class="r">Anti-Aliasing &amp; Super Resolution<b>Off</b></div></div><div class="bk">BACK</div>';
  stage.appendChild(set);
  p.querySelector('[data-s="video"]').onclick = () => { close(); set.classList.add('on'); window.SFX && SFX.play('open'); };
  set.querySelector('.bk').onclick = () => { set.classList.remove('on'); window.SFX && SFX.play('back'); };
})();
