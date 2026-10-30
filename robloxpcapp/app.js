(function(){
var $=function(id){return document.getElementById(id)};
function e2(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function fmt(n){return Number(n).toLocaleString('en-US')}

/* ---------- state (saved in this browser / app) ---------- */
var KEY='pc.state.v2';
function def(){return {user:{id:0,name:'munfuja',display:'munfuja',img:''},robux:1000,friends:[],req:'45',total:''}}
var S=def();
try{var r0=JSON.parse(localStorage.getItem(KEY)||'null');if(r0)S=Object.assign(def(),r0)}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}

/* ---------- Roblox web API (same-origin proxy on the site, direct inside Electron) ---------- */
var PX=/^https?:$/.test(location.protocol)&&!window.pc;
var HOST={apis:'apis',thumbs:'thumbnails',users:'users',friends:'friends',games:'games',catalog:'catalog'};
function D(p){var m=p.match(/^\/rbx\/([a-z]+)\/(.*)$/);return 'https://'+HOST[m[1]]+'.roblox.com/'+m[2]}
function F1(u){return fetch(u).then(function(r){if(!r.ok)throw Error(r.status);return r.json()})}
function J(p){
 if(!PX)return F1(D(p));
 return F1(p).catch(function(){return F1('/rbxproxy?u='+encodeURIComponent(D(p)))}).catch(function(){return F1('/api/rbx?u='+encodeURIComponent(D(p)))});
}
function findUser(q){
 q=String(q||'').trim();if(!q)return Promise.reject(Error('Type a username or ID.'));
 if(/^\d+$/.test(q))return J('/rbx/users/v1/users/'+q).then(function(u){return {id:u.id,name:u.name,display:u.displayName||u.name}});
 return J('/rbx/users/v1/users/search?keyword='+encodeURIComponent(q)+'&limit=10').then(function(s){
  var l=s.data||[],u=l.filter(function(x){return String(x.name).toLowerCase()===q.toLowerCase()})[0]||l[0];
  if(!u)throw Error('No user found.');return {id:u.id,name:u.name,display:u.displayName||u.name}});
}
function heads(ids){
 if(!ids.length)return Promise.resolve({});
 return J('/rbx/thumbs/v1/users/avatar-headshot?userIds='+ids.join(',')+'&size=150x150&format=Webp').then(function(t){var m={};(t.data||[]).forEach(function(x){if(x.imageUrl)m[x.targetId]=x.imageUrl});return m}).catch(function(){return {}});
}
function withHead(u){return heads([u.id]).then(function(m){u.img=m[u.id]||'';return u})}

/* ---------- home: header, friends ---------- */
function renderMe(){
 $('meName').textContent=S.user.display||S.user.name;
 var im=S.user.img||'img/av_me.webp';$('meAv').src=im;$('sideAv').src=S.user.img||'img/av_side.webp';
 $('rbU').textContent=S.user.name+': 13+';
}
function renderFriends(){
 var req=String(S.req||'').trim();
 var h='<div class="fr"><div class="add">'+I('plusp-r',56)+(req?'<i class="n">'+e2(req)+'</i>':'')+'</div><b>Add Friends</b><small></small></div>';
 S.friends.forEach(function(f){h+='<div class="fr"><img class="ph" src="'+e2(f.img||'')+'" alt=""><b>'+e2(f.display||f.name)+'</b><small></small></div>'});
 $('friends').innerHTML=h;
}
function setBal(){$('rbBal').textContent=fmt(S.robux);$('rbPill').textContent=fmt(S.robux)}

/* ---------- home: games from the API (static cards while loading / offline) ---------- */
function pct(g){var t=(g.totalUpVotes||0)+(g.totalDownVotes||0);return t?Math.round(100*g.totalUpVotes/t):0}
function gcard(name,rate,img){
 return '<div class="g"><img class="t" src="'+e2(img||'')+'" alt=""><b>'+e2(name)+'</b><div class="r">'+I('like-f',15)+'<span>'+e2(rate)+'</span></div>'+
  '<div class="hv"><img class="t" src="'+e2(img||'')+'" alt=""><b>'+e2(name)+'</b><div class="r">'+I('like-f',15)+'<span>'+e2(rate)+'</span></div><button class="pb" aria-label="Play">'+I('play-f',26)+'</button></div></div>';
}
var STATIC=[['[NUCLEAR WARFARE] God Simulati...','79% Rating'],['[🍀] Spin To Upgrade! [GUILDS + GO...','68% Rating'],['Prison Life','85% Rating'],['[🎃] 📱 Build a Phone Empire','87% Rating'],['[EVENT] San Diego Roleplay','85% Rating'],['🍀 Tower Of Luck [1.8]','54% Rating']];
$('games').innerHTML=STATIC.map(function(g,i){return gcard(g[0],g[1],'img/g'+i+'.webp')}).join('');
var FALL=[['top-trending','Recommended For You',12],['top-playing-now','Top Playing Now',6],['up-and-coming','Up-and-Coming',6]];
function loadGames(){
 var sid=Math.random().toString(36).slice(2,12),q='&device=computer&country=all';
 return J('/rbx/apis/explore-api/v1/get-sorts?sessionId='+sid+q).then(function(r){
  var s=(r.sorts||[]).filter(function(x){return x.sortId&&/game/i.test(x.contentType||'Games')}).slice(0,4).map(function(x,i){return [x.sortId,x.sortDisplayName||x.sortId,i?6:12]});
  return s.length?s:FALL}).catch(function(){return FALL}).then(function(sorts){
  return Promise.all(sorts.map(function(s){return J('/rbx/apis/explore-api/v1/get-sort-content?sessionId='+sid+'&sortId='+encodeURIComponent(s[0])+q).then(function(r){return {t:s[1],n:s[2],g:(r.games||[]).slice(0,s[2])}}).catch(function(){return null})}))}).then(function(secs){
  secs=secs.filter(function(x){return x&&x.g.length});if(!secs.length)throw Error('no games');
  var ids=[];secs.forEach(function(x){x.g.forEach(function(g){ids.push(g.universeId)})});
  var ch=[];for(var i=0;i<ids.length;i+=50)ch.push(J('/rbx/thumbs/v1/games/multiget/thumbnails?universeIds='+ids.slice(i,i+50).join(',')+'&countPerUniverse=1&size=768x432&format=Webp&isCircular=false').catch(function(){return {data:[]}}));
  return Promise.all(ch).then(function(rs){
   var im={};rs.forEach(function(r){(r.data||[]).forEach(function(x){if(x.thumbnails&&x.thumbnails[0])im[x.universeId]=x.thumbnails[0].imageUrl})});
   var h='';secs.forEach(function(x,i){h+='<h3 class="rh'+(i?' r2':' first')+'">'+e2(x.t)+'</h3><div class="games">'+x.g.map(function(g){return gcard(g.name,pct(g)+'% Rating',im[g.universeId])}).join('')+'</div>'});
   var old=document.querySelector('#s-home .rh'),g0=$('games');if(old)old.remove();g0.insertAdjacentHTML('beforebegin',h);g0.remove()})});
}
document.addEventListener('load',function(e){var t=e.target;if(t&&t.tagName==='IMG'&&(t.classList.contains('t')||t.classList.contains('ph')))t.classList.add('ld')},true);
[].forEach.call(document.querySelectorAll('img.t,img.ph'),function(i){if(i.complete)i.classList.add('ld')});

/* sidebar / tabs */
[].forEach.call(document.querySelectorAll('.sb'),function(b){b.addEventListener('click',function(){[].forEach.call(document.querySelectorAll('.sb'),function(x){x.classList.toggle('on',x===b)})})});
[].forEach.call(document.querySelectorAll('.tabs button'),function(b){b.addEventListener('click',function(){[].forEach.call(document.querySelectorAll('.tabs button'),function(x){x.classList.toggle('on',x===b)})})});

/* ---------- Robux page ---------- */
var PK=[[24000,22500,1500,'$4,999.00'],[11000,10000,1000,'$2,499.00'],[5250,4500,750,'$1,299.00'],[3625,3150,475,'$799.00'],[2000,1700,300,'$499.00']];
function rrow(p,x,blue){return '<div class="rr"><div class="a">'+I('robux-r',30)+'<b>'+fmt(p[0])+'</b><s>'+I('robux-r',22)+'<span>'+fmt(p[1])+'</span></s></div><span class="pl">+ '+fmt(p[2])+' more</span>'+(x||'')+'<button class="bt'+(blue?' b':'')+'">'+p[3]+'</button></div>'}
$('rbRows').innerHTML=PK.map(function(p){return rrow(p)}).join('');
$('rbPk').innerHTML=rrow([1500,1200,300,'$299.00'],'<span class="pl">'+I('star-r',14)+'For you</span>',true);
function openRb(){$('rb').hidden=false}
function closeRb(){$('rb').hidden=true}
$('openRb').addEventListener('click',openRb);$('rbX').addEventListener('click',closeRb);

/* ---------- Send Robux modal ---------- */
var sr=$('sr'),box=$('srBox'),pick=null,amt='',peopleTimer=null;
function pav(f){return '<img src="'+e2(f.img||'')+'" alt="">'}
function head(){return '<div class="sh"><span class="ti">'+I('rplus-r',26)+'Send Robux</span><span class="bl">'+I('robux-r',20)+fmt(S.robux)+'</span><button class="cl" id="srX" aria-label="Close">'+I('x-r',24)+'</button></div>'}
function bindX(){$('srX').addEventListener('click',closeSr)}
function openSr(){pick=null;amt='';sr.hidden=false;viewPick('')}
function closeSr(){sr.hidden=true;clearTimeout(peopleTimer)}
function rowHtml(f,i,src){return '<div class="fx" data-s="'+src+'" data-i="'+i+'"><span class="p">'+pav(f)+'</span>'+e2(f.display||f.name)+'</div>'}
function viewPick(q){
 box.className='sr-box pick';
 box.innerHTML=head()+'<label class="sr-s">'+I('search-r',24)+'<input id="srQ" type="text" placeholder="Search" autocomplete="off" value="'+e2(q)+'"></label><div id="srBody" class="sr-list"></div>';
 bindX();
 var inp=$('srQ'),people=[],seq=0;
 function fill(){
  var v=inp.value.trim().toLowerCase(),fl=S.friends.filter(function(f){return !v||(f.name+' '+(f.display||'')).toLowerCase().indexOf(v)>=0});
  var total=v?fl.length:Math.max(S.friends.length,Number(S.total)||0);
  var h='<div class="sr-l">My friends ('+total+')</div>'+fl.map(function(f){return rowHtml(f,S.friends.indexOf(f),'f')}).join('');
  var pp=people.filter(function(p){return !S.friends.some(function(f){return String(f.id)===String(p.id)})});
  if(v&&pp.length)h+='<div class="sr-l">People ('+pp.length+')</div>'+pp.map(function(p,i){return rowHtml(p,i,'p')}).join('');
  $('srBody').innerHTML=h;
 }
 function look(){
  var v=inp.value.trim(),my=++seq;if(v.length<2){people=[];fill();return}
  clearTimeout(peopleTimer);peopleTimer=setTimeout(function(){
   J('/rbx/users/v1/users/search?keyword='+encodeURIComponent(v)+'&limit=10').then(function(s){
    var l=(s.data||[]).slice(0,10).map(function(u){return {id:u.id,name:u.name,display:u.displayName||u.name,img:''}});
    if(my!==seq)return;people=l;fill();
    heads(l.map(function(u){return u.id})).then(function(m){if(my!==seq)return;l.forEach(function(u){u.img=m[u.id]||''});fill()})}).catch(function(){})},220)}
 inp.addEventListener('input',function(){fill();look()});fill();
 $('srBody').addEventListener('click',function(e){var t=e.target.closest('.fx');if(!t)return;var f=t.dataset.s==='f'?S.friends[+t.dataset.i]:people.filter(function(p){return !S.friends.some(function(f){return String(f.id)===String(p.id)})})[+t.dataset.i];if(!f)return;pick=f;amt='';viewAmt()});
 inp.focus({preventScroll:true});
}
function viewAmt(){
 box.className='sr-box amt am';
 var chips=[25,50,100,200].map(function(n){return '<button data-v="'+n+'">'+I('robux-r',21)+n+'</button>'}).join('');
 box.innerHTML=head()+'<span class="pf">'+pav(pick)+'</span><div class="nm">'+e2(pick.display||pick.name)+'</div><div class="big">'+I('robux-r',44)+'<span id="amV">0</span><input id="amI" inputmode="numeric" autocomplete="off"></div><div class="chips">'+chips+'</div><button class="nx" id="amN">Next</button><p class="nt">Robux are sent instantly with no fees</p>';
 bindX();
 var inp=$('amI');
 function upd(){var n=+amt||0;$('amV').textContent=fmt(n);$('amN').className='nx'+(n>0&&n<=S.robux?' on':'')}
 inp.addEventListener('input',function(){amt=inp.value.replace(/\D/g,'').replace(/^0+/,'').slice(0,7);inp.value=amt;upd()});
 box.querySelector('.chips').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;amt=b.dataset.v;inp.value=amt;upd()});
 $('amN').addEventListener('click',function(){var n=+amt||0;if(n>0&&n<=S.robux)viewConfirm(n)});
 inp.focus({preventScroll:true});
}
function viewConfirm(n){
 box.className='sr-box cf';
 box.innerHTML=head()+'<div class="c1"><span class="pf">'+pav(pick)+'</span><div class="nm">'+e2(pick.display||pick.name)+'</div><div class="hd">@'+e2(pick.name)+'</div><div class="ln"><span>'+I('cal-f',20)+'Connected 3 months</span><span>'+I('ppl-f',22)+'1 mutual friend</span></div><div class="jn">'+I('info-f',18)+'Joined in 2021</div></div><div class="c2"><div class="v">'+I('robux-r',44)+fmt(n)+'</div><p>The recipient will get '+fmt(n)+' Robux.</p></div><div class="bs"><button class="s" id="cfS">Send</button><button class="e" id="cfE">Edit</button></div><p class="ntt">You need an age check or parental consent to send Robux. Once you send, you cannot cancel.</p>';
 bindX();
 $('cfE').addEventListener('click',viewAmt);
 $('cfS').addEventListener('click',function(){S.robux-=n;save();setBal();closeSr()});
}
$('rbSend').addEventListener('click',openSr);
sr.addEventListener('mousedown',function(e){if(e.target===sr)closeSr()});

/* ---------- admin panel (hold Home or the logo for 3 seconds) ---------- */
var ap=$('ap'),apb=$('apBox');
function apMsg(id,t,ok){var m=$(id);if(m){m.textContent=t||'';m.className='ap-m'+(ok?' ok':'')}}
function apFriendsHtml(){
 return S.friends.length?S.friends.map(function(f,i){return '<li><img src="'+e2(f.img||'')+'" alt=""><div><b>'+e2(f.display||f.name)+'</b><small>@'+e2(f.name)+'</small></div><button data-rm="'+i+'" aria-label="Remove">'+I('x-r',18)+'</button></li>'}).join(''):'<li class="e">No friends yet</li>';
}
function openAp(){
 ap.hidden=false;
 apb.className='sr-box ap-box';
 apb.innerHTML='<div class="sh"><span class="ti">discord.gg/moneyscripts</span><span class="bl"></span><button class="cl" id="apX" aria-label="Close">'+I('x-r',24)+'</button></div><div class="ap-b">'+
  '<h4>Account</h4><div class="ap-r"><input id="apU" placeholder="Roblox username or ID" value="'+e2(S.user.name)+'" autocomplete="off"><button id="apUB">Load</button></div><p class="ap-m" id="apUM"></p>'+
  '<h4>Robux</h4><div class="ap-r"><input id="apR" inputmode="numeric" value="'+S.robux+'" autocomplete="off"><button id="apRB">Set</button></div>'+
  '<h4>Friends</h4><div class="ap-r"><input id="apF" placeholder="Roblox username or ID" autocomplete="off"><button id="apFB">Add</button></div><p class="ap-m" id="apFM"></p><ul class="ap-l" id="apL">'+apFriendsHtml()+'</ul>'+
  '<h4>Friend requests badge</h4><div class="ap-r"><input id="apQ" placeholder="empty hides it" value="'+e2(S.req)+'" autocomplete="off"><button id="apQB">Set</button></div>'+
  '<h4>Total friends shown in Send Robux</h4><div class="ap-r"><input id="apT" inputmode="numeric" placeholder="empty = list length" value="'+e2(S.total)+'" autocomplete="off"><button id="apTB">Set</button></div>'+
  '</div>';
 $('apX').addEventListener('click',closeAp);
 $('apUB').addEventListener('click',function(){
  var q=$('apU').value;apMsg('apUM','Loading…');
  findUser(q).then(withHead).then(function(u){S.user=u;save();renderMe();apMsg('apUM','Loaded '+(u.display||u.name),1)}).catch(function(e){apMsg('apUM',e&&e.message&&!/^\d+$/.test(e.message)?e.message:'Couldn’t load that user.')})});
 $('apRB').addEventListener('click',function(){var n=Math.max(0,Math.min(999999999,Math.floor(Number(String($('apR').value).replace(/\D/g,''))||0)));S.robux=n;save();setBal();$('apR').value=n});
 $('apFB').addEventListener('click',function(){
  var q=$('apF').value;apMsg('apFM','Loading…');
  findUser(q).then(function(u){if(S.friends.some(function(f){return String(f.id)===String(u.id)}))throw Error('Already added.');return withHead(u)}).then(function(u){S.friends.push(u);save();renderFriends();$('apL').innerHTML=apFriendsHtml();$('apF').value='';apMsg('apFM','Added '+(u.display||u.name),1)}).catch(function(e){apMsg('apFM',e&&e.message&&!/^\d+$/.test(e.message)?e.message:'Couldn’t add that user.')})});
 $('apF').addEventListener('keydown',function(e){if(e.key==='Enter')$('apFB').click()});
 $('apU').addEventListener('keydown',function(e){if(e.key==='Enter')$('apUB').click()});
 $('apL').addEventListener('click',function(e){var b=e.target.closest('[data-rm]');if(!b)return;S.friends.splice(+b.dataset.rm,1);save();renderFriends();$('apL').innerHTML=apFriendsHtml()});
 $('apQB').addEventListener('click',function(){S.req=$('apQ').value.trim();save();renderFriends()});
 $('apTB').addEventListener('click',function(){S.total=$('apT').value.replace(/\D/g,'');save()});
}
function closeAp(){ap.hidden=true}
ap.addEventListener('mousedown',function(e){if(e.target===ap)closeAp()});
function hold(el,fn,ms){
 var t=null,fired=false;
 function stop(){clearTimeout(t);t=null}
 el.addEventListener('pointerdown',function(){fired=false;stop();t=setTimeout(function(){fired=true;fn()},ms)});
 ['pointerup','pointerleave','pointercancel'].forEach(function(n){el.addEventListener(n,stop)});
 el.addEventListener('click',function(e){if(fired){e.stopPropagation();e.preventDefault();fired=false}},true);
}
hold($('sbHome'),openAp,3000);hold($('logo'),openAp,3000);

document.addEventListener('keydown',function(e){if(e.key==='Escape'){if(!ap.hidden)closeAp();else if(!sr.hidden)closeSr();else if(!$('rb').hidden)closeRb()}});

/* ---------- window controls (Electron) ---------- */
var pc=window.pc||null;
function wc(id,fn){$(id).addEventListener('click',function(){if(pc&&pc[fn])pc[fn]()})}
wc('wmin','min');wc('wmax','max');wc('wcls','close');
$('tb').addEventListener('dblclick',function(e){if(!e.target.closest('.tb-btns')&&pc&&pc.max)pc.max()});

renderMe();renderFriends();setBal();
loadGames().catch(function(){});
})();
