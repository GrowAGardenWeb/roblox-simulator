(function(){
var $=function(id){return document.getElementById(id)};
function e2(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function fmt(n){return Number(n).toLocaleString('en-US')}

/* ---------- state (saved in this browser / app) ---------- */
var KEY='pc.state.v2';
function def(){return {user:{id:0,name:'munfuja',display:'munfuja',img:''},robux:1000,friends:[],req:'45',total:'',bell:'3',prem:true,ver:false,dark:false}}
var S=def();
try{var r0=JSON.parse(localStorage.getItem(KEY)||'null');if(r0)S=Object.assign(def(),r0)}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}

/* ---------- Roblox web API (same-origin proxy on the site, direct inside Electron) ---------- */
var PX=/^https?:$/.test(location.protocol)&&!window.pc;
var HOST={apis:'apis',thumbs:'thumbnails',users:'users',friends:'friends',games:'games',catalog:'catalog'};
function D(p){var m=p.match(/^\/rbx\/([a-z]+)\/(.*)$/);return 'https://'+HOST[m[1]]+'.roblox.com/'+m[2]}
var FAILS=[];
function note(u,e){var m=(String(u).replace(/^https?:\/\/[^\/]+/,'').match(/^\/?([a-z]+(?:\/[a-z]+)?)/)||[,'?'])[1];FAILS.push(m+' '+((e&&e.message)||e));if(FAILS.length>6)FAILS.shift()}
function F1(u){return fetch(u).then(function(r){if(!r.ok)throw Error(r.status);return r.json()},function(e){throw Error('blocked')}).catch(function(e){note(u,e);throw e})}
/* the site is static (GitHub Pages), so /rbx/ and /api/ live on the same proxy host the mobile app (/robloxapp/) uses; /rbxproxy is still tried first */
var PB='https://create-app-iota.vercel.app';
var VID='';try{VID=localStorage.getItem('larp-vid-m')||'';if(!/^[a-f0-9]{16}$/.test(VID)){VID='';for(var i=0;i<16;i++)VID+=Math.floor(Math.random()*16).toString(16);localStorage.setItem('larp-vid-m',VID)}}catch(e){VID=''}
function PA(url){return PB+'/api/rbx?u='+encodeURIComponent(url)+(VID?'&_v='+VID:'')}
function J(p){
 if(!PX)return F1(D(p));
 return F1(PB+p).catch(function(){return F1('/rbxproxy?u='+encodeURIComponent(D(p)))}).catch(function(){return F1(PA(D(p)))});
}
function PGET(url){
 if(!PX)return F1(url);
 return F1('/rbxproxy?u='+encodeURIComponent(url)).catch(function(){return F1(PA(url))});
}
function P1(u,body){return fetch(u,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}).then(function(r){if(!r.ok)throw Error(r.status);return r.json()},function(){throw Error('blocked')}).catch(function(e){note(u,e);throw e})}
function PPOST(url,body){
 if(!PX)return P1(url,body);
 return P1('/rbxproxy?u='+encodeURIComponent(url),body).catch(function(){return P1(PA(url),body)});
}
/* same three sources the mobile app uses: exact username, omni-search and user search */
function searchUsers(q){
 q=String(q||'').trim();var enc=encodeURIComponent(q),seen={},order=[],ok=0;
 function add(a){a.forEach(function(x){var k=String(x.id);if(x.id&&!seen[k]){seen[k]=x;order.push(k)}})}
 var jobs=[
  PPOST('https://users.roblox.com/v1/usernames/users',{usernames:[q],excludeBannedUsers:true}).then(function(r){ok++;add((r.data||[]).map(function(e){return {id:e.id,name:e.name,display:e.displayName||e.name}}))}).catch(function(){}),
  PGET('https://apis.roblox.com/search-api/omni-search?searchQuery='+enc+'&verticalType=user&pageType=all&sessionId='+Date.now()).then(function(r){ok++;var o=[];(r.searchResults||[]).forEach(function(t){(t.contents||[]).forEach(function(e){if(e.contentType==='User')o.push({id:e.contentId,name:e.username,display:e.displayName||e.username})})});add(o)}).catch(function(){}),
  PGET('https://users.roblox.com/v1/users/search?keyword='+enc+'&limit=10').then(function(r){ok++;add((r.data||[]).map(function(e){return {id:e.id,name:e.name,display:e.displayName||e.name}}))}).catch(function(){})
 ];
 return Promise.all(jobs).then(function(){
  if(!ok)throw Error('Couldn’t reach Roblox. Try again in a moment. ['+FAILS.slice(-3).join(' · ')+']');
  var l=order.map(function(k){return seen[k]});
  l.sort(function(a,b){return (String(b.name).toLowerCase()===q.toLowerCase())-(String(a.name).toLowerCase()===q.toLowerCase())});
  return l.slice(0,10);
 });
}
function findUser(q){
 q=String(q||'').trim();if(!q)return Promise.reject(Error('Type a username or ID.'));
 if(/^\d+$/.test(q))return J('/rbx/users/v1/users/'+q).then(function(u){return {id:u.id,name:u.name,display:u.displayName||u.name}}).catch(function(){throw Error('No user with that ID.')});
 return searchUsers(q).then(function(l){if(!l.length)throw Error('No user found.');return l[0]});
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
 $('rbU').textContent=S.user.name+': 13+';var bn=String(S.bell==null?'':S.bell).trim();$('bellN').textContent=bn;$('bellN').style.display=bn?'':'none';$('prem').style.display=S.prem===false?'none':'';$('ver').hidden=!S.ver;document.documentElement.classList.toggle('dk',!!S.dark);
}
function renderFriends(){
 var req=String(S.req||'').trim();
 var h='<div class="fr"><div class="add">'+I('plusp-r',56)+(req?'<i class="n">'+e2(req)+'</i>':'')+'</div><b>Add Friends</b><small></small></div>';
 S.friends.forEach(function(f){h+='<div class="fr"><img class="ph" src="'+e2(f.img||'')+'" alt=""><b>'+e2(f.display||f.name)+'</b><small></small></div>'});
 $('friends').innerHTML=h;
 var ad=document.querySelector('#friends .add');if(ad)ad.addEventListener('click',openAdd)
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
/* tabs: For you / Charts */
function showTab(n){$('s-home').hidden=n!=='home';$('s-charts').hidden=n!=='charts';if(n==='charts')loadCharts()}
[].forEach.call(document.querySelectorAll('.tabs button'),function(b){b.addEventListener('click',function(){showTab(/Charts/.test(b.textContent)?'charts':'home')})});

/* ---------- Charts ---------- */
var CH={dev:['Computer','computer'],cty:['Mexico','mx']};
var DEVS=[['Computer','computer'],['Phone','phone'],['Tablet','tablet'],['Console','console']];
var CTYS=[['Mexico','mx'],['United States','us'],['Brazil','br'],['Argentina','ar'],['Spain','es'],['All locations','all']];
var CSEC=[['top-trending','Top Trending',''],['up-and-coming','Up-and-Coming',''],['top-playing-now','Top Playing Now','Results for all devices and locations']];
var CSTAT=[
 [['DONT SPLASH','87%','113K'],['The Strongest Battlegrounds','83%','69...'],['[BUTCHER x 🎃] Violence','92%','39...'],['FATHOM [HORROR]','95%','7.4K'],['Backseat Rally','91%','22...'],['WARDEN 🦖 Sonaria Horr...','92%','12...'],['[🕷️ EVENT] Dead Rails','92%','23...'],['[🎃] Animal Hospital (An...','93%','32...'],['[🎃] Bike Universe','87%','31...'],['🔪 Survive the Killer!','90%','10...']],
 [['DONT SPLASH','87%','113K'],['📷 Say Cheese! [ST...','89%','22...'],['[🌍UPD] +1 Anime Eyes','95%','40...'],['FATHOM [HORROR]','95%','7.4K'],['[💉INJECTION S] Ragdoll Pl...','95%','26K'],['+1 Spider Arm🕷️','97%','42...'],['Bug Evolution [🕷️]','73%','22...'],['[🎃] Realistic Ragdoll Engi...','87%','37...'],['Night Rider 🏍️ [TESTING]','94%','11...'],['Scare Your Neighbor','98%','14...']],
 []
];
function kfmt(e){return e>=1e6?(e/1e6).toFixed(e>=1e7?0:1).replace(/\.0$/,'')+'M':e>=1e3?(e/1e3).toFixed(e>=1e4?0:1).replace(/\.0$/,'')+'K':String(e)}
function ccard(name,r,pl,img){return '<div class="cc"><img class="t" src="'+e2(img||'')+'" alt=""><b>'+e2(name)+'</b><div class="rt">'+I('like-f',15)+'<span>'+e2(r)+'</span>'+I('user-f',15)+'<span>'+e2(pl)+'</span></div></div>'}
function crowHtml(s,cards){return '<div class="crow"><div class="hd"><div><h3>'+e2(s[1])+'<i data-ic="chevr-r">'+I('chevr-r',18)+'</i></h3>'+(s[2]?'<div class="sub">'+e2(s[2])+'</div>':'')+'</div>'+I('info-r',26)+'</div><div class="cards">'+cards+'</div></div>'}
function drawStatic(){
 $('chartRows').innerHTML=CSEC.map(function(s,k){
  var st=CSTAT[k],pre=k===0?'c_t':k===1?'c_u':'',cards='';
  if(st.length)cards=st.map(function(g,i){return ccard(g[0],g[1],g[2],'img/'+pre+i+'.webp')}).join('');
  else for(var i=0;i<10;i++)cards+='<div class="cc"><img class="t" alt=""><b></b></div>';
  return crowHtml(s,cards)}).join('');
 [].forEach.call(document.querySelectorAll('#chartRows img.t'),function(i){i.classList.add('ld')});
}
var chSeq=0;
function loadCharts(){
 var my=++chSeq,sid=Math.random().toString(36).slice(2,12),q='&device='+CH.dev[1]+'&country='+CH.cty[1];
 return Promise.all(CSEC.map(function(s){return J('/rbx/apis/explore-api/v1/get-sort-content?sessionId='+sid+'&sortId='+s[0]+q).then(function(r){return (r.games||[]).slice(0,12)}).catch(function(){return null})})).then(function(res){
  if(my!==chSeq||!res.some(function(x){return x&&x.length}))return;
  var ids=[];res.forEach(function(x){(x||[]).forEach(function(g){ids.push(g.universeId)})});
  var ch=[];for(var i=0;i<ids.length;i+=100)ch.push(J('/rbx/thumbs/v1/games/icons?universeIds='+ids.slice(i,i+100).join(',')+'&returnPolicy=PlaceHolder&size=256x256&format=Webp&isCircular=false').catch(function(){return {data:[]}}));
  return Promise.all(ch).then(function(rs){
   if(my!==chSeq)return;var im={};rs.forEach(function(r){(r.data||[]).forEach(function(x){if(x.imageUrl)im[x.targetId]=x.imageUrl})});
   $('chartRows').innerHTML=CSEC.map(function(s,k){var g=res[k];if(!g||!g.length)return '';return crowHtml(s,g.map(function(x){return ccard(x.name,pct(x)+'%',kfmt(x.playerCount||0),im[x.universeId])}).join(''))}).join('')})}).catch(function(){})}
function closeDd(){[].forEach.call(document.querySelectorAll('.dd'),function(d){d.remove()})}
[].forEach.call(document.querySelectorAll('.chip'),function(b){b.addEventListener('click',function(e){
 e.stopPropagation();var had=b.nextElementSibling&&b.nextElementSibling.classList.contains('dd');closeDd();if(had)return;
 var k=b.dataset.k,L=k==='dev'?DEVS:CTYS,d=document.createElement('div');d.className='dd';
 d.innerHTML=L.map(function(o){return '<button data-v="'+o[1]+'" class="'+(CH[k][1]===o[1]?'on':'')+'">'+o[0]+'</button>'}).join('');
 var r=b.getBoundingClientRect(),w=$('win').getBoundingClientRect();d.style.left=(r.left-w.left)+'px';d.style.top=(r.bottom-w.top+6)+'px';$('win').appendChild(d);
 d.addEventListener('click',function(ev){var o=ev.target.closest('button');if(!o)return;var it=L.filter(function(x){return x[1]===o.dataset.v})[0];CH[k]=it;b.querySelector('span').textContent=it[0];closeDd();drawStatic();loadCharts()})})});
document.addEventListener('click',closeDd);
drawStatic();

/* ---------- left menu drawer ---------- */
var DRI=[['bookmark-r','Favorites',''],['clock-r','Continue Playing',''],['friends-r','Friends','99+'],['people3-r','Communities',''],['bag-r','Inventory',''],['trade-r','Trades',''],['mail-r','Messages','12'],['rplus-r','Roblox Plus',''],['gear-r','Settings',''],['shield-r','Help & Safety','']];
function renderDrawer(){
 var u=S.user,top=168.6,h='<div class="dp"><img src="'+e2(u.img||'img/av_me.webp')+'" alt=""><div><b>'+e2(u.display||u.name)+(S.prem===false?'':'<i>'+I('rplus-r',17)+'</i>')+'</b><small>@'+e2(u.name)+'</small></div></div>';
 h+='<div class="drb">'+I('robux-r',26)+'<span>'+fmt(S.robux)+'</span><button>Buy Robux</button></div>';
 DRI.forEach(function(r,i){h+='<div class="dli" style="top:'+(top+44*i)+'px"><i class="di">'+I(r[0],24)+'</i><span>'+r[1]+'</span>'+(r[2]?'<em>'+r[2]+'</em>':'')+'</div>'});
 h+='<div class="dhr"></div><div class="dli" style="top:633px"><i class="di">'+I('grad-r',24)+'</i><span>Learn</span></div><div class="dli" style="top:677px"><i class="di">'+I('studio-f',24)+'</i><span>Create</span></div><button class="dsw">Switch Accounts</button>';
 $('drw').innerHTML=h;
}
function openDrw(){renderDrawer();$('scrim').hidden=false;$('drw').classList.add('open');$('drw').setAttribute('aria-hidden','false')}
function closeDrw(){$('drw').classList.remove('open');$('drw').setAttribute('aria-hidden','true');$('scrim').hidden=true}
document.querySelector('.menu').addEventListener('click',openDrw);
$('scrim').addEventListener('mousedown',closeDrw);

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
function head(t,nobal){return '<div class="sh"><span class="ti">'+I('rplus-r',26)+(t||'Send Robux')+'</span><span class="bl">'+(nobal?'':I('robux-r',20)+fmt(S.robux))+'</span><button class="cl" id="srX" aria-label="Close">'+I('x-r',24)+'</button></div>'}
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
   searchUsers(v).then(function(s){
    var l=s.map(function(u){return {id:u.id,name:u.name,display:u.display,img:''}});
    if(my!==seq)return;people=l;fill();
    heads(l.map(function(u){return u.id})).then(function(m){if(my!==seq)return;l.forEach(function(u){u.img=m[u.id]||''});fill()})}).catch(function(){})},220)}
 inp.addEventListener('input',function(){fill();look()});fill();
 $('srBody').addEventListener('click',function(e){var t=e.target.closest('.fx');if(!t)return;var f=t.dataset.s==='f'?S.friends[+t.dataset.i]:people.filter(function(p){return !S.friends.some(function(f){return String(f.id)===String(p.id)})})[+t.dataset.i];if(!f)return;pick=f;amt='';closeRb();viewAmt()});
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

/* the Add Friends circle opens the admin panel on its Friends section */
function openAdd(){openAp(true)}

/* ---------- admin panel (hold Home or the logo for 3 seconds) ---------- */
var ap=$('ap'),apb=$('apBox');
function apMsg(id,t,ok){var m=$(id);if(m){m.textContent=t||'';m.className='ap-m'+(ok?' ok':'')}}
function apFriendsHtml(){
 return S.friends.length?S.friends.map(function(f,i){return '<li><img src="'+e2(f.img||'')+'" alt=""><div><b>'+e2(f.display||f.name)+'</b><small>@'+e2(f.name)+'</small></div><button data-rm="'+i+'" aria-label="Remove">'+I('x-r',18)+'</button></li>'}).join(''):'<li class="e">No friends yet</li>';
}
function openAp(focusF){
 ap.hidden=false;
 apb.className='sr-box ap-box';
 apb.innerHTML='<div class="sh"><span class="ti">discord.gg/moneyscripts</span><span class="bl"></span><button class="cl" id="apX" aria-label="Close">'+I('x-r',24)+'</button></div><div class="ap-b">'+
  '<h4>Display name (next to your photo)</h4><div class="ap-r"><input id="apD" value="'+e2(S.user.display||S.user.name)+'" autocomplete="off"></div>'+
  '<h4>Username (shown on the Robux page)</h4><div class="ap-r"><input id="apN" value="'+e2(S.user.name)+'" autocomplete="off"></div>'+
  '<h4>Photo</h4><div class="ap-r"><img class="ap-ph" id="apPh" src="'+e2(S.user.img||'img/av_me.webp')+'" alt=""><label class="ap-fb">Choose photo<input type="file" id="apFile" accept="image/*" hidden></label><button id="apPR" class="g">Reset</button></div>'+
  '<h4>Load everything from a Roblox user</h4><div class="ap-r"><input id="apU" placeholder="Roblox username or ID" value="'+e2(S.user.name)+'" autocomplete="off"><button id="apUB">Load</button></div><p class="ap-m" id="apUM"></p>'+
  '<h4>Appearance</h4><label class="ap-t"><input type="checkbox" id="apP" '+(S.prem!==false?'checked':'')+'> Plus (Premium) icon next to the name</label><label class="ap-t"><input type="checkbox" id="apV" '+(S.ver?'checked':'')+'> Verified badge</label><label class="ap-t"><input type="checkbox" id="apK" '+(S.dark?'checked':'')+'> Dark mode</label>'+
  '<h4>Notifications badge</h4><div class="ap-r"><input id="apB" placeholder="empty hides it" value="'+e2(S.bell)+'" autocomplete="off"></div>'+
  '<h4>Robux</h4><div class="ap-r"><input id="apR" inputmode="numeric" value="'+S.robux+'" autocomplete="off"><button id="apRB">Set</button></div>'+
  '<h4>Friends</h4><div class="ap-r"><input id="apF" placeholder="Roblox username or ID" autocomplete="off"><button id="apFB">Add</button></div><p class="ap-m" id="apFM"></p><div class="ap-s" id="apS"></div><ul class="ap-l" id="apL">'+apFriendsHtml()+'</ul>'+
  '<h4>Friend requests badge</h4><div class="ap-r"><input id="apQ" placeholder="empty hides it" value="'+e2(S.req)+'" autocomplete="off"><button id="apQB">Set</button></div>'+
  '<h4>Total friends shown in Send Robux</h4><div class="ap-r"><input id="apT" inputmode="numeric" placeholder="empty = list length" value="'+e2(S.total)+'" autocomplete="off"><button id="apTB">Set</button></div>'+
  '</div>';
 $('apX').addEventListener('click',closeAp);
 $('apD').addEventListener('input',function(){S.user.display=this.value;save();renderMe()});
 $('apN').addEventListener('input',function(){S.user.name=this.value;save();renderMe()});
 $('apB').addEventListener('input',function(){S.bell=this.value;save();renderMe()});
 $('apP').addEventListener('change',function(){S.prem=this.checked;save();renderMe()});
 $('apV').addEventListener('change',function(){S.ver=this.checked;save();renderMe()});
 $('apK').addEventListener('change',function(){S.dark=this.checked;save();renderMe()});
 $('apFile').addEventListener('change',function(){var f=this.files&&this.files[0];if(!f)return;var rd=new FileReader();rd.onload=function(){var im=new Image();im.onload=function(){var n=Math.min(im.width,im.height),c=document.createElement('canvas');c.width=c.height=256;c.getContext('2d').drawImage(im,(im.width-n)/2,(im.height-n)/2,n,n,0,0,256,256);S.user.img=c.toDataURL('image/jpeg',.92);save();renderMe();$('apPh').src=S.user.img};im.src=rd.result};rd.readAsDataURL(f)});
 $('apPR').addEventListener('click',function(){S.user.img='';save();renderMe();$('apPh').src='img/av_me.webp'});
 $('apUB').addEventListener('click',function(){
  var q=$('apU').value;apMsg('apUM','Loading…');
  findUser(q).then(withHead).then(function(u){S.user=u;save();renderMe();$('apD').value=u.display||u.name;$('apN').value=u.name;$('apPh').src=u.img||'img/av_me.webp';apMsg('apUM','Loaded '+(u.display||u.name),1)}).catch(function(e){apMsg('apUM',e&&e.message||'Couldn’t load that user.')})});
 $('apRB').addEventListener('click',function(){var n=Math.max(0,Math.min(999999999,Math.floor(Number(String($('apR').value).replace(/\D/g,''))||0)));S.robux=n;save();setBal();$('apR').value=n});
 $('apFB').addEventListener('click',function(){
  var q=$('apF').value;apMsg('apFM','Loading…');
  findUser(q).then(function(u){if(S.friends.some(function(f){return String(f.id)===String(u.id)}))throw Error('Already added.');return withHead(u)}).then(function(u){S.friends.push(u);save();renderFriends();$('apL').innerHTML=apFriendsHtml();$('apF').value='';apMsg('apFM','Added '+(u.display||u.name),1)}).catch(function(e){apMsg('apFM',e&&e.message||'Couldn’t add that user.')})});
 $('apF').addEventListener('keydown',function(e){if(e.key==='Enter')$('apFB').click()});
 var sres=[],sseq=0,stm=null;
 function sdraw(msg){
  $('apS').innerHTML=(msg?'<p class="ap-m" style="color:#6d7176">'+e2(msg)+'</p>':'')+sres.map(function(u,i){var on=S.friends.some(function(f){return String(f.id)===String(u.id)});return '<div class="fx ad"><span class="p"><img src="'+e2(u.img||'')+'" alt=""></span><div class="who"><b>'+e2(u.display||u.name)+'</b><small>@'+e2(u.name)+'</small></div><button class="ab'+(on?' on':'')+'" data-i="'+i+'">'+(on?'Added':'Add friend')+'</button></div>'}).join('');
 }
 $('apF').addEventListener('input',function(){
  var v=this.value.trim(),my=++sseq;clearTimeout(stm);apMsg('apFM','');
  if(v.length<2&&!/^\d+$/.test(v)){sres=[];sdraw();return}
  sdraw('Searching…');
  stm=setTimeout(function(){
   var p=/^\d+$/.test(v)?findUser(v).then(function(u){return [u]}):searchUsers(v);
   p.then(function(l){if(my!==sseq)return;sres=l.map(function(u){u.img=u.img||'';return u});sdraw(l.length?'':'No users found.');
    return heads(l.map(function(u){return u.id})).then(function(m){if(my!==sseq)return;sres.forEach(function(u){u.img=m[u.id]||''});sdraw()})}).catch(function(e){if(my===sseq){sres=[];sdraw(e&&e.message||'Couldn’t search right now.')}})},220)});
 $('apS').addEventListener('click',function(e){var b=e.target.closest('.ab');if(!b||b.classList.contains('on'))return;var u=sres[+b.dataset.i];if(!u)return;S.friends.push({id:u.id,name:u.name,display:u.display,img:u.img});save();renderFriends();$('apL').innerHTML=apFriendsHtml();sdraw()});
 if(focusF===true){var fi=$('apF');fi.scrollIntoView({block:'center'});fi.focus({preventScroll:true})}
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
 el.addEventListener('click',function(e){if(fired){e.stopImmediatePropagation();e.stopPropagation();e.preventDefault();fired=false}},true);
}
document.querySelector('.bell').addEventListener('click',openAp);

document.addEventListener('keydown',function(e){if(e.key==='Escape'){if(!ap.hidden)closeAp();else if(!$('scrim').hidden)closeDrw();else if(!sr.hidden)closeSr();else if(!$('rb').hidden)closeRb()}});

/* ---------- window controls (Electron) ---------- */
var pc=window.pc||null;
function wc(id,fn){$(id).addEventListener('click',function(){if(pc&&pc[fn])pc[fn]()})}
wc('wmin','min');wc('wmax','max');wc('wcls','close');
$('tb').addEventListener('dblclick',function(e){if(!e.target.closest('.tb-btns')&&pc&&pc.max)pc.max()});

renderMe();renderFriends();setBal();
loadGames().catch(function(){});
})();
