/* Foto de perfil personalizable (panel MOD): cualquier personaje + cualquier color de fondo. */
(function () {
  const nav = document.getElementById('nav'), P = document.getElementById('modp'); if (!nav || !P) return;
  const KEY = 'fn_avatar';
  let A = {}; try { A = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(A)); } catch (e) {} };

  const st = document.createElement('style');
  st.textContent = `
  #myav{position:absolute;left:1776px;top:26px;width:94px;height:94px;pointer-events:none;display:none}
  #myav .c{position:absolute;left:3.5px;top:9.5px;width:79px;height:79px;border-radius:50%;box-sizing:border-box;border:6px solid #0a2461;background:var(--bg,#1d6fe0) center top/cover no-repeat;overflow:hidden}
  #myav .g{position:absolute;left:61px;top:63px;width:25px;height:25px;border-radius:50%;box-sizing:border-box;border:5px solid #0a2461;background:#5cff62}
  #myav .b{position:absolute;left:65px;top:1px;width:28px;height:28px;border-radius:50%;box-sizing:border-box;border:3px solid #0a2461;background:#ffe800;color:#2a2a60;font:900 18px/22px Montserrat;text-align:center}
  #avrow{margin-top:12px}#avrow label{display:block}
  #avrow .r{display:flex;gap:8px;align-items:center;margin-top:6px}
  #avrow .pv{width:46px;height:46px;border-radius:50%;border:3px solid #0a2461;background:#1d6fe0 center top/cover no-repeat;flex:none}
  #avrow button{flex:1;margin:0!important}#avrow input[type=color]{width:46px;height:40px;padding:0;border:0;background:none;flex:none}
  #avpick{position:fixed;inset:0;z-index:2147483000;display:none;flex-direction:column;background:#070d2cf2;color:#fff;font-family:Montserrat,system-ui}
  #avpick.on{display:flex}
  #avpick .h{display:flex;gap:10px;padding:14px;align-items:center}
  #avpick input[type=search]{flex:1;padding:12px 14px;border-radius:10px;border:0;font:700 16px Montserrat;background:#16225a;color:#fff;outline:0}
  #avpick .x{padding:12px 16px;border-radius:10px;background:#ffe45c;color:#241a00;font:800 14px Montserrat;cursor:pointer}
  #avpick .avg{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));grid-auto-rows:96px;gap:8px;padding:0 14px 20px;align-content:start}
  #avpick .avc{position:relative;width:100%;height:96px;border-radius:10px;overflow:hidden;background:var(--bg,#1d6fe0);cursor:pointer}
  #avpick .avc img{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;object-position:center top;display:block}
  #avpick .avc span{position:absolute;left:0;right:0;bottom:0;padding:10px 4px 3px;font:700 10px Montserrat;text-align:center;background:linear-gradient(transparent,#000a);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #avpick .m{padding:0 14px 8px;font:600 12px Montserrat;color:#9fb0e8}
  `;
  document.head.appendChild(st);

  const av = document.createElement('div'); av.id = 'myav'; av.innerHTML = '<div class="c"></div><div class="g"></div><div class="b">!</div>'; nav.appendChild(av);
  const orig = () => nav.querySelector('img[src*="avatar.webp"]');
  const apply = () => {
    const on = !!(A.icon || A.color), o = orig(), c = av.querySelector('.c');
    av.style.display = on ? 'block' : 'none'; if (o) o.style.visibility = on ? 'hidden' : '';
    c.style.setProperty('--bg', A.color || '#1d6fe0'); c.style.backgroundImage = A.icon ? 'url("' + A.icon + '")' : 'none';
    const pv = document.querySelector('#avrow .pv'); if (pv) { pv.style.setProperty('background-color', A.color || '#1d6fe0'); pv.style.backgroundImage = A.icon ? 'url("' + A.icon + '")' : 'none'; }
    const col = document.getElementById('avcol'); if (col) col.value = A.color || '#1d6fe0';
    const nm = document.getElementById('avname'); if (nm) nm.textContent = A.name || 'ORIGINAL';
  };

  // bloque dentro del panel MOD
  const row = document.createElement('div'); row.id = 'avrow';
  row.innerHTML = '<label>PROFILE PICTURE: <b id="avname">ORIGINAL</b></label><div class="r"><div class="pv"></div><button type="button" id="avbtn" style="background:#33d9fe">CHOOSE CHARACTER</button></div><label style="margin-top:8px">BACKGROUND COLOR</label><div class="r"><input type="color" id="avcol" value="#1d6fe0"><button type="button" id="avrst" class="g">RESET PICTURE</button></div>';
  const bar = P.querySelector('.b'); (bar ? bar.parentNode : P.firstChild).insertBefore(row, bar || null);

  // selector de personajes (con buscador)
  const pk = document.createElement('div'); pk.id = 'avpick';
  pk.innerHTML = '<div class="h"><input type="search" id="avq" placeholder="Search character…" autocomplete="off" autocapitalize="off" spellcheck="false"><div class="x" id="avx">CLOSE</div></div><div class="m" id="avm"></div><div class="avg" id="avg"></div>';
  document.body.appendChild(pk);
  let all = null, shown = 0, list = [];
  const loadList = async () => {
    if (all) return all;
    try { const r = await fetch('data/outfits.json?' + Date.now()); if (r.ok) all = await r.json(); } catch (e) {}
    if (!all || !all.length) { // sin lista completa: los personajes de la tienda de hoy
      try { const j = await (await fetch('data/shop.json?' + Date.now())).json(); const seen = new Set(); all = []; (j.entries || []).forEach((e) => (e.items || []).forEach((i) => { if (i.type === 'outfit' && i.icon && !seen.has(i.id)) { seen.add(i.id); all.push({ id: i.id, name: i.name, icon: i.icon }); } })); } catch (e) { all = []; }
    }
    return all;
  };
  const grid = pk.querySelector('#avg'), msg = pk.querySelector('#avm'), q = pk.querySelector('#avq');
  const more = () => {
    const end = Math.min(list.length, shown + 90), frag = document.createDocumentFragment();
    for (; shown < end; shown++) {
      const it = list[shown], d = document.createElement('div'); d.className = 'avc'; d.style.setProperty('--bg', A.color || '#1d6fe0');
      d.innerHTML = '<img loading="lazy" decoding="async" alt=""><span></span>'; d.firstChild.src = it.icon; d.lastChild.textContent = it.name;
      d.onclick = () => { A.icon = it.icon; A.name = it.name; A.id = it.id; save(); apply(); pk.classList.remove('on'); };
      frag.appendChild(d);
    }
    grid.appendChild(frag);
  };
  const render = () => {
    const t = q.value.trim().toLowerCase(); list = (all || []).filter((x) => !t || x.name.toLowerCase().includes(t)); shown = 0; grid.innerHTML = ''; grid.scrollTop = 0;
    msg.textContent = list.length + ' characters'; more();
  };
  grid.addEventListener('scroll', () => { if (shown < list.length && grid.scrollTop + grid.clientHeight > grid.scrollHeight - 400) more(); }, { passive: true });
  q.addEventListener('input', render);
  document.getElementById('avbtn').onclick = async () => { pk.classList.add('on'); msg.textContent = 'Loading…'; await loadList(); render(); q.focus(); };
  document.getElementById('avx').onclick = () => pk.classList.remove('on');
  document.getElementById('avcol').addEventListener('input', (e) => { A.color = e.target.value; save(); apply(); grid.querySelectorAll('.avc').forEach((d) => d.style.setProperty('--bg', A.color)); });
  document.getElementById('avrst').onclick = () => { A = {}; save(); apply(); };
  apply(); setTimeout(apply, 600);
})();
