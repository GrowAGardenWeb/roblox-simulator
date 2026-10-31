(function(){
var $=function(id){return document.getElementById(id)};
function e2(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function fmt(n){return Number(n).toLocaleString('en-US')}

/* ---------- state (saved in this browser / app) ---------- */
var KEY='pc.state.v2';
function def(){return {owned:{},ownedItems:[],user:{id:0,name:'munfuja',display:'munfuja',img:''},robux:1000,friends:[],req:'45',total:'',bell:'3',prem:true,ver:false,dark:false}}
var S=def();
try{var r0=JSON.parse(localStorage.getItem(KEY)||'null');if(r0)S=Object.assign(def(),r0)}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}

/* ---------- Roblox web API (same-origin proxy on the site, direct inside Electron) ---------- */
var PX=/^https?:$/.test(location.protocol)&&!window.pc;
var HOST={apis:'apis',thumbs:'thumbnails',users:'users',friends:'friends',games:'games',catalog:'catalog',inv:'inventory',avatar:'avatar',economy:'economy'};
function D(p){var m=p.match(/^\/rbx\/([a-z]+)\/(.*)$/);return 'https://'+HOST[m[1]]+'.roblox.com/'+m[2]}
var VB='https://create-app-iota.vercel.app',VP=VB+'/api/rbx?u=';
var FAILS=[];
function note(u,e){var m=(String(u).match(/^\/?([a-z]+(?:\/[a-z]+)?)/)||[,'?'])[1];FAILS.push(m+' '+((e&&e.message)||e));if(FAILS.length>6)FAILS.shift()}
function F1(u){return fetch(u).then(function(r){if(!r.ok)throw Error(r.status);return r.json()},function(e){throw Error('blocked')}).catch(function(e){note(u,e);throw e})}
function J(p){
 if(!PX)return F1(D(p));
 /* same route the mobile app uses (/rbx/...), then the generic proxy */
 return F1(VB+p).catch(function(){return F1(VP+encodeURIComponent(D(p)))}).catch(function(){return F1(p)});
}
function PGET(url){
 if(!PX)return F1(url);
 return F1(VP+encodeURIComponent(url)).catch(function(){return F1('/rbxproxy?u='+encodeURIComponent(url))});
}
function PPOST(url,body){
 function go(u){return fetch(u,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}).then(function(r){if(!r.ok)throw Error(r.status);return r.json()},function(){throw Error('blocked')}).catch(function(e){note(u,e);throw e})}
 if(!PX)return go(url);
 return go('/rbxproxy?u='+encodeURIComponent(url)).catch(function(){return go(VP+encodeURIComponent(url))});
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
function heads(ids,size){
 if(!ids.length)return Promise.resolve({});
 size=size||'150x150';
 return J('/rbx/thumbs/v1/users/avatar-headshot?userIds='+ids.join(',')+'&size='+size+'&format='+(size==='150x150'?'Webp':'Png')).then(function(t){var m={};(t.data||[]).forEach(function(x){if(x.imageUrl)m[x.targetId]=x.imageUrl});return m}).catch(function(){return {}});
}
function withHead(u){return heads([u.id]).then(function(m){u.img=m[u.id]||'';return u})}

/* ---------- home: header, friends ---------- */
function loadFriendsOf(id){
 return J('/rbx/friends/v1/users/'+id+'/friends').then(function(r){
  var list=(r.data||[]).map(function(f){return {id:f.id,name:f.name||'',display:f.displayName||f.name||'',img:''}});
  S.friends=list;S.total='';save();renderFriends();
  /* the friends list only gives ids: ask Roblox for the names, like the mobile app does */
  var nch=[];for(var q=0;q<list.length;q+=100)nch.push(list.slice(q,q+100));
  Promise.all(nch.map(function(c){return PPOST('https://users.roblox.com/v1/users',{userIds:c.map(function(f){return f.id}),excludeBannedUsers:true}).then(function(r2){var m={};(r2.data||[]).forEach(function(u){m[u.id]=u});c.forEach(function(f){var u=m[f.id];if(u){f.name=u.name;f.display=u.displayName||u.name}})}).catch(function(){return Promise.all(c.slice(0,24).map(function(f){return J('/rbx/users/v1/users/'+f.id).then(function(u){f.name=u.name;f.display=u.displayName||u.name}).catch(function(){})}))})})).then(function(){save();renderFriends();var l2=$('apL');if(l2)l2.innerHTML=apFriendsHtml()});
  var chunks=[];for(var i=0;i<list.length;i+=100)chunks.push(list.slice(i,i+100));
  return Promise.all(chunks.map(function(c){return heads(c.map(function(f){return f.id}))})).then(function(ms){var m={};ms.forEach(function(x){Object.keys(x).forEach(function(k){m[k]=x[k]})});list.forEach(function(f){f.img=m[f.id]||''});save();renderFriends();var l=$('apL');if(l)l.innerHTML=apFriendsHtml()});
 }).catch(function(){});
}
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
  '<div class="hv"><button class="hx" aria-label="Close">'+I('x-r',20)+'</button><img class="t" src="'+e2(img||'')+'" alt=""><b>'+e2(name)+'</b><div class="r">'+I('like-f',15)+'<span>'+e2(rate)+'</span></div><button class="pb" aria-label="Play">'+I('play-f',26)+'</button></div></div>';
}
var STATIC=[['[NUCLEAR WARFARE] God Simulati...','79% Rating'],['[🍀] Spin To Upgrade! [GUILDS + GO...','68% Rating'],['Prison Life','85% Rating'],['[🎃] 📱 Build a Phone Empire','87% Rating'],['[EVENT] San Diego Roleplay','85% Rating'],['🍀 Tower Of Luck [1.8]','54% Rating']];
$('games').innerHTML=STATIC.map(function(){return '<div class="g gsk"><div class="t"></div><b></b><div class="r"></div></div>'}).join('');
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
  var cards='';for(var i=0;i<16;i++)cards+='<div class="cc csk"><div class="t"></div><b></b></div>';
  return crowHtml(s,cards)}).join('');
 [].forEach.call(document.querySelectorAll('#chartRows img.t'),function(i){i.classList.add('ld')});
}
var chSeq=0;
function loadCharts(){
 var my=++chSeq,sid=Math.random().toString(36).slice(2,12),q='&device='+CH.dev[1]+'&country='+CH.cty[1];
 return Promise.all(CSEC.map(function(s){return J('/rbx/apis/explore-api/v1/get-sort-content?sessionId='+sid+'&sortId='+s[0]+q).then(function(r){return (r.games||[]).slice(0,30)}).catch(function(){return null})})).then(function(res){
  if(my!==chSeq||!res.some(function(x){return x&&x.length}))return;
  var ids=[];res.forEach(function(x){(x||[]).forEach(function(g){ids.push(g.universeId)})});
  var ch=[];for(var i=0;i<ids.length;i+=100)ch.push(J('/rbx/thumbs/v1/games/icons?universeIds='+ids.slice(i,i+100).join(',')+'&returnPolicy=PlaceHolder&size=256x256&format=Webp&isCircular=false').catch(function(){return {data:[]}}));
  return Promise.all(ch).then(function(rs){
   if(my!==chSeq)return;var im={};rs.forEach(function(r){(r.data||[]).forEach(function(x){if(x.imageUrl)im[x.targetId]=x.imageUrl})});
   $('chartRows').innerHTML=CSEC.map(function(s,k){var g=res[k];if(!g||!g.length)return '';return crowHtml(s,g.map(function(x){return ccard(x.name,pct(x)+'%',kfmt(x.playerCount||0),im[x.universeId])}).join(''))}).join('')})}).catch(function(){})}
var DEVS2=[['All Devices','all'],['Entry-level Phone','phone'],['Standard Phone','phone2'],['Entry-level Tablet','tablet'],['Standard Tablet','tablet2'],['Computer','computer'],['Console','console'],['VR','vr']];
var CTY2=[['All Locations','all'],['Mexico','mx']].concat([["Afghanistan","af"],["Albania","al"],["Algeria","dz"],["American Samoa","as"],["Andorra","ad"],["Angola","ao"],["Anguilla","ai"],["Antarctica","aq"],["Antigua and Barbuda","ag"],["Argentina","ar"],["Armenia","am"],["Aruba","aw"],["Australia","au"],["Austria","at"],["Azerbaijan","az"],["Bahamas","bs"],["Bahrain","bh"],["Bangladesh","bd"],["Barbados","bb"],["Belarus","by"],["Belgium","be"],["Belize","bz"],["Benin","bj"],["Bermuda","bm"],["Bhutan","bt"],["Bolivia","bo"],["Bonaire, Sint Eustatius and Saba","bq"],["Bosnia and Herzegovina","ba"],["Botswana","bw"],["Bouvet Island","bv"],["Brazil","br"],["British Indian Ocean Territory","io"],["Brunei","bn"],["Bulgaria","bg"],["Burkina Faso","bf"],["Burundi","bi"],["Cabo Verde","cv"],["Cambodia","kh"],["Cameroon","cm"],["Canada","ca"],["Cayman Islands","ky"],["Central African Republic","cf"],["Chad","td"],["Chile","cl"],["China","cn"],["Christmas Island","cx"],["Cocos (Keeling) Islands","cc"],["Colombia","co"],["Comoros","km"],["Congo","cg"],["Congo, The Democratic Republic of the","cd"],["Cook Islands","ck"],["Costa Rica","cr"],["Croatia","hr"],["Cuba","cu"],["Curaçao","cw"],["Cyprus","cy"],["Czech Republic","cz"],["Côte d'Ivoire","ci"],["Denmark","dk"],["Djibouti","dj"],["Dominica","dm"],["Dominican Republic","do"],["Ecuador","ec"],["Egypt","eg"],["El Salvador","sv"],["Equatorial Guinea","gq"],["Eritrea","er"],["Estonia","ee"],["Eswatini","sz"],["Ethiopia","et"],["Falkland Islands (Malvinas)","fk"],["Faroe Islands","fo"],["Fiji","fj"],["Finland","fi"],["France","fr"],["French Guiana","gf"],["French Polynesia","pf"],["French Southern Territories","tf"],["Gabon","ga"],["Gambia","gm"],["Georgia","ge"],["Germany","de"],["Ghana","gh"],["Gibraltar","gi"],["Greece","gr"],["Greenland","gl"],["Grenada","gd"],["Guadeloupe","gp"],["Guam","gu"],["Guatemala","gt"],["Guernsey","gg"],["Guinea","gn"],["Guinea-Bissau","gw"],["Guyana","gy"],["Haiti","ht"],["Heard Island and McDonald Islands","hm"],["Holy See (Vatican City State)","va"],["Honduras","hn"],["Hong Kong","hk"],["Hungary","hu"],["Iceland","is"],["India","in"],["Indonesia","id"],["Iran","ir"],["Iraq","iq"],["Ireland","ie"],["Isle of Man","im"],["Israel","il"],["Italy","it"],["Jamaica","jm"],["Japan","jp"],["Jersey","je"],["Jordan","jo"],["Kazakhstan","kz"],["Kenya","ke"],["Kiribati","ki"],["Kuwait","kw"],["Kyrgyzstan","kg"],["Laos","la"],["Latvia","lv"],["Lebanon","lb"],["Lesotho","ls"],["Liberia","lr"],["Libya","ly"],["Liechtenstein","li"],["Lithuania","lt"],["Luxembourg","lu"],["Macao","mo"],["Madagascar","mg"],["Malawi","mw"],["Malaysia","my"],["Maldives","mv"],["Mali","ml"],["Malta","mt"],["Marshall Islands","mh"],["Martinique","mq"],["Mauritania","mr"],["Mauritius","mu"],["Mayotte","yt"],["Micronesia, Federated States of","fm"],["Moldova","md"],["Monaco","mc"],["Mongolia","mn"],["Montenegro","me"],["Montserrat","ms"],["Morocco","ma"],["Mozambique","mz"],["Myanmar","mm"],["Namibia","na"],["Nauru","nr"],["Nepal","np"],["Netherlands","nl"],["New Caledonia","nc"],["New Zealand","nz"],["Nicaragua","ni"],["Niger","ne"],["Nigeria","ng"],["Niue","nu"],["Norfolk Island","nf"],["North Korea","kp"],["North Macedonia","mk"],["Northern Mariana Islands","mp"],["Norway","no"],["Oman","om"],["Pakistan","pk"],["Palau","pw"],["Palestine, State of","ps"],["Panama","pa"],["Papua New Guinea","pg"],["Paraguay","py"],["Peru","pe"],["Philippines","ph"],["Pitcairn","pn"],["Poland","pl"],["Portugal","pt"],["Puerto Rico","pr"],["Qatar","qa"],["Romania","ro"],["Russia","ru"],["Rwanda","rw"],["Réunion","re"],["Saint Barthélemy","bl"],["Saint Helena, Ascension and Tristan da Cunha","sh"],["Saint Kitts and Nevis","kn"],["Saint Lucia","lc"],["Saint Martin (French part)","mf"],["Saint Pierre and Miquelon","pm"],["Saint Vincent and the Grenadines","vc"],["Samoa","ws"],["San Marino","sm"],["Sao Tome and Principe","st"],["Saudi Arabia","sa"],["Senegal","sn"],["Serbia","rs"],["Seychelles","sc"],["Sierra Leone","sl"],["Singapore","sg"],["Sint Maarten (Dutch part)","sx"],["Slovakia","sk"],["Slovenia","si"],["Solomon Islands","sb"],["Somalia","so"],["South Africa","za"],["South Georgia and the South Sandwich Islands","gs"],["South Korea","kr"],["South Sudan","ss"],["Spain","es"],["Sri Lanka","lk"],["Sudan","sd"],["Suriname","sr"],["Svalbard and Jan Mayen","sj"],["Sweden","se"],["Switzerland","ch"],["Syria","sy"],["Taiwan","tw"],["Tajikistan","tj"],["Tanzania","tz"],["Thailand","th"],["Timor-Leste","tl"],["Togo","tg"],["Tokelau","tk"],["Tonga","to"],["Trinidad and Tobago","tt"],["Tunisia","tn"],["Turkey","tr"],["Turkmenistan","tm"],["Turks and Caicos Islands","tc"],["Tuvalu","tv"],["Uganda","ug"],["Ukraine","ua"],["United Arab Emirates","ae"],["United Kingdom","gb"],["United States","us"],["United States Minor Outlying Islands","um"],["Uruguay","uy"],["Uzbekistan","uz"],["Vanuatu","vu"],["Venezuela","ve"],["Vietnam","vn"],["Virgin Islands, British","vg"],["Virgin Islands, U.S.","vi"],["Wallis and Futuna","wf"],["Western Sahara","eh"],["Yemen","ye"],["Zambia","zm"],["Zimbabwe","zw"],["Åland Islands","ax"]]);
var DAPI={phone2:'phone',tablet2:'tablet'};
function openPick(k,chip){
 closeDd();var L=k==='dev'?DEVS2:CTY2,cur=CH[k][1],sel=cur,my=k==='dev'?'My device':'My location',mine=k==='dev'?'computer':'mx';
 var ov=document.createElement('div');ov.className='pk dd';var w=$('win').getBoundingClientRect(),r=chip.getBoundingClientRect();
 ov.innerHTML='<div class="pk-box '+k+'" style="left:'+Math.round(r.left-w.left)+'px"><div class="pk-h"><b>'+(k==='dev'?'Device':'Location')+'</b><button class="pk-x" aria-label="Close">'+I('x-r',22)+'</button></div><div class="pk-l">'+L.map(function(o){return '<label class="pk-r"><input type="radio" name="pk" value="'+o[1]+'"'+(o[1]===cur?' checked':'')+'><i></i><span>'+e2(o[0])+'</span>'+(o[1]===mine?'<em>'+my+'</em>':'')+'</label>'}).join('')+'</div><button class="pk-a" disabled>Apply</button></div>';
 $('win').appendChild(ov);
 ov.addEventListener('mousedown',function(e){if(e.target===ov)ov.remove()});
 ov.addEventListener('click',function(e){e.stopPropagation()});
 ov.querySelector('.pk-x').addEventListener('click',function(){ov.remove()});
 ov.querySelector('.pk-l').addEventListener('change',function(e){sel=e.target.value;ov.querySelector('.pk-a').disabled=sel===cur});
 ov.querySelector('.pk-a').addEventListener('click',function(){var it=L.filter(function(x){return x[1]===sel})[0];CH[k]=[it[0],DAPI[it[1]]||it[1]];chip.querySelector('span').textContent=it[0];ov.remove();drawStatic();loadCharts()});
}
function closeDd(){[].forEach.call(document.querySelectorAll('.dd'),function(d){d.remove()})}
[].forEach.call(document.querySelectorAll('.chip'),function(b){b.addEventListener('click',function(e){e.stopPropagation();openPick(b.dataset.k,b)})});
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
$('rbPk').innerHTML=rrow([1500,1200,300,'$299.00'],'<span class="pl">'+I('star-r',14)+'For you</span>',true)+rrow([1000,800,200,'$249.00'])+rrow([500,400,100,'$129.00']);
var FAQ=[['What are Robux?','Robux is the virtual currency you use to buy items for your avatar and perks in experiences.'],['Where are my Robux?','Your Robux are added to your balance as soon as the purchase finishes. You can see your balance at the top of this page.'],['Do Robux expire?','No, Robux you buy do not expire.'],['How to redeem your gift card?','Open the redeem page, enter the PIN on the back of your gift card and your Robux or credit are added to your account.']];
$('rbPk').parentNode.insertAdjacentHTML('beforeend','<h2 class="faq">FAQ</h2>'+FAQ.map(function(f){return '<div class="fq"><button>'+e2(f[0])+'<i>'+I('chevd-r',22)+'</i></button><p>'+e2(f[1])+'</p></div>'}).join(''));
[].forEach.call(document.querySelectorAll('.fq>button'),function(b){b.addEventListener('click',function(){b.parentNode.classList.toggle('op')})});
function openRb(){$('rb').hidden=false}
function closeRb(){$('rb').hidden=true}
$('openRb').addEventListener('click',openRb);$('rbX').addEventListener('click',closeRb);

/* ---------- Send Robux modal ---------- */
var sr=$('sr'),box=$('srBox'),pick=null,amt='',peopleTimer=null;
function pav(f,big){return '<img src="'+e2((big&&f.big)||f.img||'')+'" alt="">'}
function bigHead(f,cb){if(f.big)return cb&&cb(f.big);heads([f.id],'420x420').then(function(m){if(m[f.id]){f.big=m[f.id];cb&&cb(f.big)}})}
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
 $('srBody').addEventListener('click',function(e){var t=e.target.closest('.fx');if(!t)return;var f=t.dataset.s==='f'?S.friends[+t.dataset.i]:people.filter(function(p){return !S.friends.some(function(f){return String(f.id)===String(p.id)})})[+t.dataset.i];if(!f)return;pick=f;amt='';closeRb();viewAmt();bigHead(f,function(u){var i=document.querySelector('.pf img');if(i)i.src=u})});
 inp.focus({preventScroll:true});
}
function viewAmt(){
 box.className='sr-box amt am';
 var chips=[25,50,100,200].map(function(n){return '<button data-v="'+n+'">'+I('robux-r',21)+n+'</button>'}).join('');
 box.innerHTML=head()+'<span class="pf">'+pav(pick,1)+'</span><div class="nm">'+e2(pick.display||pick.name)+'</div><div class="big">'+I('robux-r',44)+'<span id="amV">0</span><input id="amI" inputmode="numeric" autocomplete="off"></div><div class="chips">'+chips+'</div><button class="nx" id="amN">Next</button><p class="nt">Robux are sent instantly with no fees</p>';
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
 box.innerHTML=head()+'<div class="c1"><span class="pf">'+pav(pick,1)+'</span><div class="nm">'+e2(pick.display||pick.name)+'</div><div class="hd">@'+e2(pick.name)+'</div><div class="ln"><span>'+I('cal-f',20)+'Connected 3 months</span><span>'+I('ppl-f',22)+'1 mutual friend</span></div><div class="jn">'+I('info-f',18)+'Joined in 2021</div></div><div class="c2"><div class="v">'+I('robux-r',44)+fmt(n)+'</div><p>The recipient will get '+fmt(n)+' Robux.</p></div><div class="bs"><button class="s" id="cfS">Send</button><button class="e" id="cfE">Edit</button></div><p class="ntt">You need an age check or parental consent to send Robux. Once you send, you cannot cancel.</p>';
 bindX();
 bigHead(pick,function(u){var i=document.querySelector('.pf img');if(i)i.src=u});
 $('cfE').addEventListener('click',viewAmt);
 $('cfS').addEventListener('click',function(){
  if(box.dataset.busy)return;box.dataset.busy='1';
  box.style.transition='opacity .22s ease';box.style.opacity='0';sr.style.transition='background .25s ease';sr.style.background='rgba(0,0,0,0)';
  setTimeout(function(){
   var old=S.robux;S.robux=Math.max(0,S.robux-n);save();
   box.style.opacity='';box.style.transition='';sr.style.background='';sr.style.transition='';delete box.dataset.busy;
   box.className='sr-box dn';
   box.innerHTML=head()+'<div class="dn-c">'+I('ccheck-r',44)+'</div><p class="dn-t">You sent '+fmt(n)+' Robux</p><button class="dn-b" id="dnOk">OK</button>';
   bindX();$('dnOk').addEventListener('click',closeSr);
   setTimeout(function(){var bl=box.querySelector('.bl');if(bl)bl.innerHTML=I('robux-r',20)+fmt(S.robux);setBal()},650);
  },950);
 });
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
  findUser(q).then(withHead).then(function(u){S.user=u;save();renderMe();loadFriendsOf(u.id);$('apD').value=u.display||u.name;$('apN').value=u.name;$('apPh').src=u.img||'img/av_me.webp';apMsg('apUM','Loaded '+(u.display||u.name),1)}).catch(function(e){apMsg('apUM',e&&e.message||'Couldn’t load that user.')})});
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

/* ---------- Avatar page (Marketplace) ---------- */
var AVN=[['The Crook',900],['Jack O\' Bandana',86],['New Years Kitty',50],['Halloween Ninja H...',90],['Bass Blast Should...',50],['Overseer Lapel Pin',50],['Sinister F.',716],['Dark Camo Paintb...',86],['Beautiful Orange ...',86],['Telamon\'s Vampir...',450],['Horse with Cowbo...',176],['Neon Transparent',270],['Ninja Mask of Fire',81],['Gearpunk Bucket',900],['Skeleton',450],['Davy Bazooka',225],['ROBLOX Santa',86],['Overseer Berserker',180],['Blue 8-Bit Headph...',720],['Andrew\'s Beard',113],['Spooky Tie',50]];
var CATQ={all:{category:1},avatars:{category:18,subcategory:37},body:{category:18,chips:[['Full Bodies',37],['Hair',20],['Heads',66]]},clothing:{category:3,chips:[['Shirts',59],['T-Shirts',58],['Sweaters',62],['Jackets',61],['Pants',60],['Dresses & Skirts',65],['Shorts',63],['Shoes',64],['Classic Shirts',56],['Classic T-Shirts',55],['Classic Pants',57]]},accessories:{category:11,chips:[['Head',54],['Face',21],['Neck',22],['Shoulder',23],['Front',24],['Back',25],['Waist',26],['Gear',5]]},animations:{category:12,chips:[['Bundles',38],['Emotes',39]]},backgrounds:{category:1,bg:true},makeup:{category:1,keyword:'makeup'}};
var avChip=null;
var avCat='all',avSeq=0,avInit=false;
function kc(n){n=Number(n)||0;return n>=1e6?(n/1e6).toFixed(n>=1e7?0:1).replace(/\.0$/,'')+'M':n>=1e3?(n/1e3).toFixed(n>=1e4?0:1).replace(/\.0$/,'')+'K':String(n)}
function plusOn(){return S.prem!==false}
function pbOf(p){p=Number(p)||0;return plusOn()&&p>0?Math.floor(p*.1):0}
var TYPES={8:'Hat',41:'Hair',42:'Face Accessory',43:'Neck',44:'Shoulder',45:'Front',46:'Back',47:'Waist',64:'T-Shirt',65:'Shirt',66:'Pants',67:'Jacket',68:'Sweater',69:'Shorts',70:'Shoes',71:'Shoes',72:'Skirt',17:'Head',18:'Face',2:'T-Shirt',11:'Shirt',12:'Pants',61:'Emote',79:'Head',78:'Face',24:'Animation',48:'Animation',49:'Animation',50:'Animation',51:'Animation',52:'Animation',53:'Animation',54:'Animation',55:'Animation',56:'Animation',32:'Package',19:'Gear',92:'Background'};
function itCard(x){
 return '<div class="it'+(S.owned&&x.id&&S.owned[x.id]?' own':'')+'" data-id="'+(x.id||'')+'" data-ty="'+(x.assetType||'')+'" data-t="'+e2(TYPES[x.assetType]||'Item')+'" data-p="'+(x.price==null?'':x.price)+'"><div class="ph">'+(x.img?'<img src="'+e2(x.img)+'" alt="">':'')+'<span class="dt">Details</span></div><b>'+e2(x.name)+'</b><div class="cr"><span>'+e2(x.creator||'Roblox')+'</span><i>'+I('ver-f',16)+'</i></div><div class="pr">'+(x.price==null?'':(x.price===0?'Free':'<i>'+I('robux-r',16)+'</i>'+fmt(x.price-pbOf(x.price))))+'</div></div>'}
function avSec(title,items,extra){return '<h3 class="avh"'+(extra&&extra.mt?' style="margin-top:22px"':'')+'>'+e2(title)+(extra&&extra.all?'<a>See All</a>':'')+'</h3><div class="avg">'+items.map(itCard).join('')+'</div>'}
function chipsHtml(q){return q.chips?'<div class="mchips" id="mchips">'+q.chips.map(function(c){return '<button data-c="'+c[1]+'" class="'+((avChip==null?q.chips[0][1]:avChip)===c[1]?'on':'')+'">'+e2(c[0])+'</button>'}).join('')+'</div>':''}
function avStatic(){
 var q=CATQ[avCat],h=chipsHtml(q),sk=function(n){var o='';for(var i=0;i<n;i++)o+='<div class="it isk"><div class="ph"></div><b></b><div class="cr"></div><div class="pr"></div></div>';return o};
 if(avCat==='all')h+='<h3 class="avh">Recommended For You</h3><div class="avg">'+sk(21)+'</div><h3 class="avh" style="margin-top:22px">Explore Styles</h3><div class="avg row">'+sk(8)+'</div>';
 else h+='<div class="avg pg">'+sk(28)+'</div>';
 $('avRows').innerHTML=h;
}
function catSearch(q,limit,cursor){
 var LL=[10,28,30,60,120].filter(function(x){return x>=limit})[0]||120;
 var p='Category='+q.category+'&Limit='+LL+'&SortType='+(q.sort==null?1:q.sort)+'&IncludeNotForSale=false'+(q.subcategory?'&Subcategory='+q.subcategory:'')+(q.keyword?'&Keyword='+encodeURIComponent(q.keyword):'')+(q.extra||'')+(cursor?'&Cursor='+cursor:'');
 return J('/rbx/catalog/v1/search/items/details?'+p).then(function(r){
  var d=(r.data||[]).slice(0,limit),a=d.filter(function(e){return e.itemType==='Asset'}).map(function(e){return e.id}),b=d.filter(function(e){return e.itemType==='Bundle'}).map(function(e){return e.id}),im={},jobs=[];
  if(a.length)jobs.push(J('/rbx/thumbs/v1/assets?assetIds='+a.join(',')+'&size=420x420&format=Webp&isCircular=false').then(function(t){(t.data||[]).forEach(function(x){if(x.imageUrl)im['Asset'+x.targetId]=x.imageUrl})}).catch(function(){}));
  if(b.length)jobs.push(J('/rbx/thumbs/v1/bundles/thumbnails?bundleIds='+b.join(',')+'&size=420x420&format=Webp&isCircular=false').then(function(t){(t.data||[]).forEach(function(x){if(x.imageUrl)im['Bundle'+x.targetId]=x.imageUrl})}).catch(function(){}));
  return Promise.all(jobs).then(function(){var o=d.map(function(e){return {id:e.id,itype:e.itemType,name:e.name,creator:e.creatorName,assetType:Number(e.assetType),price:(e.isOffSale||e.priceStatus==='Off Sale')?null:(e.lowestPrice!=null?e.lowestPrice:e.price),img:im[e.itemType+e.id]}});o.next=r.nextPageCursor||'';return o})});
}
function shuf(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
function rnd(q,n){return catSearch({category:q.category,subcategory:q.subcategory,keyword:q.keyword,sort:Math.floor(Math.random()*4)},30).then(function(l){return shuf(l).slice(0,n)})}
var BGW=[{category:1,extra:'&AssetTypes=AvatarBackground'},{category:1,extra:'&assetTypeIds=92'},{category:1,keyword:'background'}];
function catItems(q,limit){
 if(!q.bg)return catSearch(q,limit);
 var k=0;return (function next(){if(k>=BGW.length)return Promise.resolve([]);var w=BGW[k++];return catSearch(w,60).then(function(l){l=l.filter(function(x){return x.assetType===92});return l.length?l.slice(0,limit):next()}).catch(next)})();
}
function avErr(w){var e=$('avErrT');if(!e){e=document.createElement('div');e.id='avErrT';e.className='av-err';$('avSc').insertBefore(e,$('avSc').firstChild)}e.textContent=w+' did not load. '+(FAILS.length?'['+FAILS.slice(-3).join(' · ')+']':'')}
var avNext='',avBusy=false;
function avRow(title,items,extra){return '<h3 class="avh"'+(extra&&extra.mt?' style="margin-top:22px"':'')+'>'+e2(title)+(extra&&extra.all?'<a>See All</a>':'')+'</h3><div class="avg row">'+items.map(itCard).join('')+'</div>'}
function loadAv(){
 var e0=$('avErrT');if(e0)e0.remove();
 var my=++avSeq,q=CATQ[avCat];avNext='';
 if(avCat==='all'){
  Promise.all([rnd({category:1},21),rnd({category:18,subcategory:37},14),rnd({category:11},14),catSearch({category:3,sort:2},14)]).then(function(r){
   if(my!==avSeq)return;if(!r[0].length){avErr('Marketplace');return}
   $('avRows').innerHTML=avSec('Recommended For You',r[0])+avRow('Explore Styles',r[1],{mt:1,all:1})+(r[2].length?avRow('Worth A Look',r[2],{mt:1}):'')+(r[3].length?avRow('Trending Clothing',r[3],{mt:1}):'');
  }).catch(function(){avErr('Marketplace')});
  return;
 }
 var sub=q.chips?(avChip==null?q.chips[0][1]:avChip):q.subcategory;
 var done=function(l,add){
  if(my!==avSeq)return;avNext=l.next||'';
  if(add){var g=document.querySelector('#avRows .avg.pg');if(g)g.insertAdjacentHTML('beforeend',l.map(itCard).join(''));return}
  $('avRows').innerHTML=chipsHtml(q)+(l.length?'<div class="avg pg">'+l.map(itCard).join('')+'</div>':'<div class="il-none">'+(avCat==='backgrounds'?'Unlock free exclusive backgrounds with Plus.':'No items')+'</div>');
 };
 (q.bg?catItems({category:q.category,bg:true},30):catSearch({category:q.category,subcategory:sub,keyword:q.keyword},30)).then(function(l){done(l)}).catch(function(){avErr('Marketplace')});
 avMore=function(){
  if(!avNext||avBusy||q.bg)return;avBusy=true;
  catSearch({category:q.category,subcategory:sub,keyword:q.keyword},30,avNext).then(function(l){avBusy=false;done(l,true)}).catch(function(){avBusy=false});
 };
}
var avMore=function(){};
$('avSc').addEventListener('scroll',function(){var e=this;if(e.scrollTop+e.clientHeight>e.scrollHeight-600)avMore()},{passive:true});
document.addEventListener('load',function(e){var t=e.target;if(t&&t.tagName==='IMG'&&t.closest&&t.closest('.it .ph'))t.classList.add('ld')},true);
/* same rule as the mobile app (ur/mr): accessories can repeat, every other type keeps only one; head parts yield to a dynamic head */
function wornIds(as){
 var acc={8:1,41:1,42:1,43:1,44:1,45:1,46:1,47:1},seen={},out=[];
 as=as.map(function(x){return {id:x.id,t:(x.assetType&&x.assetType.id)||x.assetTypeId||0}});
 if(as.some(function(x){return x.t===79}))as=as.filter(function(x){return x.t!==17&&x.t!==18});
 for(var i=as.length-1;i>=0;i--){var x=as[i];if(acc[x.t]||x.t===61){if(out.indexOf(x.id)<0)out.unshift(x.id);continue}var k=(x.t===17||x.t===79)?'head':x.t;if(seen[k])continue;seen[k]=1;out.unshift(x.id)}
 return out;
}
function av3dMsg(t,err){if(!err){var e0=$('av3dErr');if(e0)e0.remove();return}var e=$('av3dErr');if(!t){if(e)e.remove();return}if(!e){e=document.createElement('div');e.id='av3dErr';$('avR').appendChild(e)}e.className='av-err av-err2'+(err?'':' av-info');e.textContent=t}
function avUser(){
 var go=function(id){
  if(!/^https?:$/.test(location.protocol))return;
  window.Av3D.show($('av3d'),id,{log:av3dMsg}).then(function(){window.__av3d=1;$('avFig').hidden=true;$('avFb').hidden=true;av3dMsg('');cuSync()}).catch(function(e){console.warn('3D avatar failed',e);av3dMsg('3D avatar: '+(e&&e.message||'failed'),1)});
 };
 if(S.user.id)go(S.user.id);else findUser(S.user.name).then(function(u){S.user.id=u.id;save();go(u.id)}).catch(function(){});
}
function showAv(on){
 $('s-av').hidden=!on;document.querySelector('.main').hidden=on;
 if(on){$('avRb').textContent=kc(S.robux);$('avHead').src=S.user.img||'img/av_me.webp';
  if(!avInit){avInit=true;avStatic();loadAv();avUser();}}
}
[].forEach.call(document.querySelectorAll('.sb'),function(b){b.addEventListener('click',function(){showAv(b.dataset.s==='me')})});
$('cats').addEventListener('click',function(e){var b=e.target.closest('button[data-k]');if(!b)return;[].forEach.call(document.querySelectorAll('#cats button'),function(x){x.classList.toggle('on',x===b)});avCat=b.dataset.k;avChip=null;avStatic();loadAv()});
$('avRows').addEventListener('click',function(e){var b=e.target.closest('#mchips button');if(!b)return;avChip=Number(b.dataset.c);avStatic();loadAv()});
;(function(){
 var bar=document.createElement('div');bar.className='av-buy';bar.hidden=true;bar.innerHTML='<button class="bb" id="avBuy"></button><button class="bm" id="avClr" aria-label="Clear">'+I('trash-r',24)+'</button>';$('avR').appendChild(bar);
 function sels(){return [].slice.call(document.querySelectorAll('#avRows .it.sel'))}
 function upd(){
  var l=sels();syncPrev();bar.hidden=!l.length;$('avR').classList.toggle('buying',!!l.length);
  if(l.length===1&&l[0].classList.contains('own')){$('avBuy').dataset.m='own';$('avBuy').className='bb gray';$('avBuy').textContent='Manage in Customize';$('avClr').innerHTML=I('three-dots-h',26)}
  else if(l.length===1){$('avBuy').className='bb';var pr=l[0].dataset.p;$('avBuy').dataset.m='one';$('avBuy').innerHTML=pr===''?'Off sale':(pr==='0'?'Free':I('robux-r',20)+'<span>'+fmt(Number(pr)-pbOf(pr))+'</span>');$('avClr').innerHTML=I('three-dots-h',26)}
  else if(l.length){$('avBuy').className='bb';$('avBuy').dataset.m='many';$('avBuy').textContent='View Checkout ('+l.length+')';$('avClr').innerHTML=I('trash-r',24)}
  if(!l.length)closeCo();
 }
 var prev={};
 function syncPrev(){
  if(!window.Av3D||!window.Av3D.ready())return;
  var l=sels(),on={};
  l.forEach(function(it){var id=it.dataset.id;if(!id)return;on[id]=it;if(!prev[id]&&!window.Av3D.has(id)){window.Av3D.wear(id,it.dataset.ty,(it.querySelector('b')||{}).textContent);prev[id]=1}});
  Object.keys(prev).forEach(function(id){if(!on[id]){window.Av3D.unwear(id);delete prev[id]}});
 }
 window.avPrevKeep=function(id,keep){if(prev[id]){delete prev[id];if(!keep)window.Av3D.unwear(id)}};
 window.avSelUpd=upd;
 $('avRows').addEventListener('click',function(e){var it=e.target.closest('.it');if(!it||it.classList.contains('isk'))return;it.classList.toggle('sel');upd()});
 $('avClr').addEventListener('click',function(){if(sels().length>1||$('avBuy').dataset.m==='many'){sels().forEach(function(x){x.classList.remove('sel')});upd()}});
 /* checkout panel */
 var co=document.createElement('div');co.className='co';co.hidden=true;$('avR').appendChild(co);
 function closeCo(){co.hidden=true}
 function drawCo(){
  var l=sels();if(!l.length){closeCo();upd();return}
  var plus=S.prem!==false,sum=0,rows=l.map(function(it,i){var p=Number(it.dataset.p)||0,np=p-pbOf(p);sum+=p;var im=it.querySelector('.ph img');
   return '<div class="co-i"><span class="co-p"><img src="'+e2(im?im.src:'')+'" alt=""></span><div><b>'+e2(it.querySelector('b').textContent)+'</b><small>'+e2(it.dataset.t||'Item')+'</small><div class="co-pr">'+(p===0?'Free':'<i>'+I('robux-r',16)+'</i>'+fmt(np))+(p!==np?'<s><i>'+I('robux-r',12)+'</i>'+fmt(p)+'</s>':'')+'</div></div><button class="co-x" data-i="'+i+'" aria-label="Remove">'+I('x-r',22)+'</button></div>'}).join('');
  var save=0;l.forEach(function(it){save+=pbOf(it.dataset.p)});var tot=sum-save;
  co.innerHTML='<div class="co-h"><button id="coB" aria-label="Back">'+I('chevl-r',26)+'</button><b>Checkout</b></div><div class="co-l">'+rows+'<label class="by-c"><input type="checkbox" checked><i></i>Wear items after purchase</label></div><div class="co-f">'+(plus&&save>0?'<div class="co-s"><i>'+I('rplus-r',20)+'</i><span>Saving <i class="ri">'+I('robux-r',13)+'</i>'+fmt(save)+' with Plus</span></div>':'')+'<div class="co-t"><b>Total ('+l.length+' items)</b><span>'+(save?'<s><i class="ri">'+I('robux-r',12)+'</i>'+fmt(sum)+'</s>':'')+'<i class="ri">'+I('robux-r',18)+'</i>'+fmt(tot)+'</span></div><button class="by-b" id="coBuy">Buy</button></div>';
  co.hidden=false;
  $('coB').addEventListener('click',closeCo);
  co.querySelectorAll('.co-x').forEach(function(b){b.addEventListener('click',function(){sels()[+b.dataset.i].classList.remove('sel');upd();if(sels().length)drawCo()})});
  $('coBuy').addEventListener('click',function(){if(S.robux<tot){$('coBuy').textContent='Not enough Robux';return}var wi=co.querySelector('.by-c input');var wr=!wi||wi.checked;var bt=$('coBuy');bt.disabled=true;bt.classList.add('wait');var ls=sels();setTimeout(function(){S.robux-=tot;save();setBal();$('avRb').textContent=kc(S.robux);purchased();ls.forEach(function(x){own(x,x.querySelector('b').textContent,(x.querySelector('.ph img')||{}).src,wr)});upd();closeCo()},1000)});
 }
 window.drawCo=drawCo;
})();
function avMode(m){var bb=document.querySelector('.av-buy');if(bb&&m==='c'){bb.hidden=true;$('avR').classList.remove('buying');[].forEach.call(document.querySelectorAll('#avRows .it.sel'),function(x){x.classList.remove('sel')})}$('avM').classList.toggle('on',m==='m');$('avC').classList.toggle('on',m==='c');$('avSc').hidden=m!=='m';$('cuSc').hidden=m!=='c';if(m==='c')loadCust()}
$('avM').addEventListener('click',function(){avMode('m')});
$('avC').addEventListener('click',function(){avMode('c')});
/* Customize */
var cuCat='all',cuSeq=0,cuSub='';
var CUT={all:'Hat,HairAccessory,FaceAccessory,NeckAccessory,ShoulderAccessory,FrontAccessory,BackAccessory,WaistAccessory',accessories:'Hat,HairAccessory,FaceAccessory,NeckAccessory,ShoulderAccessory,FrontAccessory,BackAccessory,WaistAccessory',clothing:'Shirt,Pants,TShirt',emotes:'EmoteAnimation',animations:'RunAnimation,WalkAnimation,FallAnimation,JumpAnimation,IdleAnimation,ClimbAnimation,SwimAnimation'};
function cuSkel(n){var h='';for(var i=0;i<n;i++)h+='<div class="it"><div class="ph"><span class="dt">Details</span></div></div>';$('cuGrid').innerHTML=h}
var CUS={
 body:[['Full Body','full-body','bundle',0],['Hair','hair','DynamicHead',0],['Head','head','DynamicHead',0],['Build','build','',0],['Skin','skin','',0]],
 clothing:[['Top','top','TShirtAccessory,ShirtAccessory,SweaterAccessory',[[59],[58],[62]]],['Outerwear','outerwear','JacketAccessory',[[61]]],['Bottom','bottom','PantsAccessory,ShortsAccessory,DressSkirtAccessory',[[60],[63],[65]]],['Shoes','shoes','LeftShoeAccessory,RightShoeAccessory',[[64]]],['Shirt Classic','classic-shirt','Shirt',[[56]]],['Pants Classic','classic-pants','Pants',[[57]]],['T-Shirt Classic','classic-tshirt','TShirt',[[55]]],['Clear','clear','',0]],
 accessories:[['Head','head-accessory','Hat',[[54]]],['Face','face-accessory','FaceAccessory',[[21]]],['Neck','neck','NeckAccessory',[[22]]],['Back','back','BackAccessory',[[25]]],['Waist','waist','WaistAccessory',[[26]]],['Shoulder','shoulder','ShoulderAccessory',[[23]]],['Front','front','FrontAccessory',[[24]]],['Gear','gear','',[[5]]],['Clear','clear','',0]],
 animations:[['Full Set','full-set','',[[38]]],['Idle','idle','IdleAnimation',[[38]]],['Walk','walk','WalkAnimation',[[38]]],['Run','run','RunAnimation',[[38]]],['Jump','jump','JumpAnimation',[[38]]],['Fall','fall','FallAnimation',[[38]]],['Climb','climb','ClimbAnimation',[[38]]],['Swim','swim','SwimAnimation',[[38]]],['Clear','clear','',0]]
};
var CUCAT={clothing:3,accessories:11,animations:12};
function cuDef(){var l=CUS[cuCat];return l?l[0][0]:''}
function drawBsub(){
 var l=CUS[cuCat];$('bsub').hidden=!l;if(!l)return;
 if(!cuSub||!l.some(function(x){return x[0]===cuSub}))cuSub=l[0][0];
 $('bsr').innerHTML=l.map(function(s){
  var inner=s[0]==='Clear'?'<i>'+I('av-clear',34)+'</i>':(s[0]==='Skin'?'<b class="skc"></b>':'<i>'+I('av-'+s[1],34)+'</i>'+(s[0]!=='Full Body'&&cuCat!=='body'?'<u>'+I('av-plus',14)+'</u>':''));
  return '<div class="bsc'+(cuSub===s[0]?' on':'')+'" data-n="'+s[0]+'"><span>'+inner+'</span><em>'+s[0]+'</em></div>'}).join('');
 var bp=document.querySelector('.bpl');if(bp)bp.style.display=cuCat==='body'?'':'none';
}
function cuTail(l){
 /* You May Also Like + Shop for More (clothing, accessories, animations) */
 var q=CUCAT[cuCat],sc=null;if(!q){return}
 var sel=(CUS[cuCat]||[]).filter(function(x){return x[0]===cuSub})[0];sc=sel&&sel[3]&&sel[3][0]?sel[3][0][0]:undefined;
 catSearch({category:q,subcategory:sc,sort:2},30).then(function(r){
  if(!r.length||cuCat!==cuTailFor)return;
  var el=$('cuTail');if(!el)return;
  el.innerHTML='<h3 class="avh">You May Also Like</h3><div class="avg row">'+r.slice(0,6).map(function(x){return itCard(x).replace('<div class="pr">','<div class="pr clk">')}).join('')+'</div><button class="shopmore" id="shopMore">Shop for More</button>';
  $('shopMore').addEventListener('click',function(){avMode('m');var b=document.querySelector('#cats button[data-k="'+cuCat+'"]');if(b)b.click()});
 }).catch(function(){});
}
var cuTailFor='';
var INVT={Hat:8,HairAccessory:41,FaceAccessory:42,NeckAccessory:43,ShoulderAccessory:44,FrontAccessory:45,BackAccessory:46,WaistAccessory:47,TShirt:2,Shirt:11,Pants:12,TShirtAccessory:64,ShirtAccessory:65,PantsAccessory:66,JacketAccessory:67,SweaterAccessory:68,ShortsAccessory:69,LeftShoeAccessory:70,RightShoeAccessory:71,DressSkirtAccessory:72,Gear:19};
function cuSync(){[].forEach.call(document.querySelectorAll('#cuGrid .it'),function(e){e.classList.toggle('sel',!!(window.Av3D&&window.Av3D.has(e.dataset.id)))})}
function cuOwned(){
 var h=S.ownedItems.map(function(x){return '<div class="it" data-id="'+e2(x.id)+'" data-ty="'+x.ty+'" data-p="" data-n="'+e2(x.name)+'"><div class="ph">'+(x.img?'<img src="'+e2(x.img)+'" alt="">':'')+'<span class="dt">Details</span></div></div>'}).join('');
 if(h)$('cuGrid').insertAdjacentHTML('afterbegin',h);cuSync();
}
function loadCust(){
 var my=++cuSeq;drawBsub();cuSkel(0);cuTailFor=cuCat;
 var g=$('cuGrid');if(!$('cuTail')){var t=document.createElement('div');t.id='cuTail';g.parentNode.appendChild(t)}$('cuTail').innerHTML='';
 var sel=(CUS[cuCat]||[]).filter(function(x){return x[0]===cuSub})[0],t=sel?sel[2]:CUT[cuCat];
 if(sel&&sel[2]==='bundle'){cuTail();return}
 if(!t)t=CUT[cuCat];
 if(!t||!S.user.id||!t){cuTail();return}
 J('/rbx/inv/v2/users/'+S.user.id+'/inventory?assetTypes='+t+'&limit=50&sortOrder=Desc').then(function(r){
  var d=(r.data||[]).slice(0,56);if(my!==cuSeq)return;
  if(!d.length){cuTail();return}
  return J('/rbx/thumbs/v1/assets?assetIds='+d.map(function(x){return x.assetId}).join(',')+'&size=420x420&format=Webp&isCircular=false').then(function(t2){
   if(my!==cuSeq)return;var im={};(t2.data||[]).forEach(function(x){if(x.imageUrl)im[x.targetId]=x.imageUrl});
   $('cuGrid').innerHTML=d.map(function(x){return '<div class="it" data-id="'+x.assetId+'" data-ty="'+(INVT[x.assetType]||'')+'" data-p="" data-n="'+e2(x.assetName||'')+'"><div class="ph">'+(im[x.assetId]?'<img src="'+e2(im[x.assetId])+'" alt="">':'')+'<span class="dt">Details</span></div><b class="nm1">'+e2(x.assetName||'')+'</b></div>'}).join('');cuOwned();cuTail()})}).catch(function(){cuOwned();cuTail()});
}
$('cuGrid').addEventListener('click',function(e){
 var it=e.target.closest('.it');if(!it||!it.dataset.id||!window.Av3D||!window.Av3D.ready())return;
 var id=it.dataset.id;if(window.Av3D.has(id))window.Av3D.unwear(id);else window.Av3D.wear(id,it.dataset.ty,it.dataset.n);cuSync();
});
$('cuCats').addEventListener('click',function(e){var b=e.target.closest('button[data-k]');if(!b)return;[].forEach.call(document.querySelectorAll('#cuCats button'),function(x){x.classList.toggle('on',x===b)});cuCat=b.dataset.k;cuSub=cuDef();loadCust()});
$('bsr').addEventListener('click',function(e){var b=e.target.closest('.bsc');if(!b)return;cuSub=b.dataset.n;drawBsub();loadCust()});
/* Buy item dialog */
function own(it,name,img,wear){
 if(!it||!it.dataset.id)return;var id=it.dataset.id,ty=Number(it.dataset.ty)||0;
 S.owned[id]=1;S.ownedItems=S.ownedItems.filter(function(x){return x.id!==id});S.ownedItems.unshift({id:id,ty:ty,name:name,img:img});save();
 it.classList.add('own');it.classList.remove('sel');if(window.avSelUpd)window.avSelUpd();
 if(window.avPrevKeep)window.avPrevKeep(id,wear);
 if(wear&&window.Av3D&&window.Av3D.ready()&&!window.Av3D.has(id))window.Av3D.wear(id,ty,name);
}
function purchased(){
 var t=document.createElement('div');t.className='ptoast';t.innerHTML='<i class="bilogo"></i><b>Purchased!</b>';$('s-av').appendChild(t);
 var s=document.querySelector('.av-s');if(s)s.classList.add('ld');
 setTimeout(function(){if(s)s.classList.remove('ld')},1400);
 setTimeout(function(){t.classList.add('out')},2600);setTimeout(function(){t.remove()},3000);
}
function openBuy(name,price,img,it){
 price=Number(price)||0;var pb=pbOf(price),plus=pb>0,tot=price-pb,open=false;
 function draw(){
  var sv=plus?'<div class="sv'+(open?' op':'')+'"><button class="svh" id="svT"><i>'+I('rplus-r',22)+'</i><span>Saving <i class="ri">'+I('robux-r',14)+'</i>'+pb+' with Plus</span><i class="chv">'+I(open?'chevu-r':'chevd-r',22)+'</i></button>'+(open?'<div class="svb"><div><span>Subtotal</span><b><i class="ri">'+I('robux-r',15)+'</i>'+fmt(price)+'</b></div><div><span>Plus benefit (10% off on eligible items)</span><b>- <i class="ri">'+I('robux-r',15)+'</i>'+pb+'</b></div><hr><div><span>Total</span><b><i class="ri">'+I('robux-r',15)+'</i>'+fmt(tot)+'</b></div></div>':'')+'</div>':'';
  $('buyBox').innerHTML='<div class="by-h"><b>Buy item</b><button class="by-x" id="byX" aria-label="Close">'+I('x-r',28)+'</button></div><div class="by-i"><span class="by-p"><img src="'+e2(img||'')+'" alt=""></span><div><b>'+e2(name||'Item')+'</b><small>Permanent</small><div class="by-pr">'+'<i>'+I('robux-r',20)+'</i><b>'+fmt(tot)+'</b>'+''+(plus&&pb?'<s><i>'+I('robux-r',14)+'</i>'+fmt(price)+'</s>':'')+'</div></div></div>'+sv+'<label class="by-c"><input type="checkbox" checked><i></i>Wear item after purchase</label><button class="by-b" id="byB">Buy</button>';
  $('byX').addEventListener('click',function(){$('buy').hidden=true});
  var t=$('svT');if(t)t.addEventListener('click',function(){open=!open;draw()});
  $('byB').addEventListener('click',function(){
   if(S.robux<tot){$('byB').textContent='Not enough Robux';return}
   var wearIt=$('buyBox').querySelector('.by-c input').checked,b=$('byB');b.disabled=true;b.classList.add('wait');
   setTimeout(function(){S.robux-=tot;save();setBal();$('avRb').textContent=kc(S.robux);$('buy').hidden=true;purchased();own(it,name,img,wearIt)},1000);
  });
 }
 draw();$('buy').hidden=false;
}
$('buy').addEventListener('mousedown',function(e){if(e.target===$('buy'))$('buy').hidden=true});
$('avBuy').addEventListener('click',function(){var l=document.querySelectorAll('#avRows .it.sel');if(l.length>1){window.drawCo()}else if(l.length===1&&$('avBuy').dataset.m==='own'){avMode('c')}else if(l.length===1){var it=l[0],im=it.querySelector('.ph img');openBuy(it.querySelector('b').textContent,it.dataset.p,im&&im.src,it)}});

/* ---------- window controls (Electron) ---------- */
var pc=window.pc||null;
function wc(id,fn){$(id).addEventListener('click',function(){if(pc&&pc[fn])pc[fn]()})}
wc('wmin','min');wc('wmax','max');wc('wcls','close');
$('tb').addEventListener('dblclick',function(e){if(!e.target.closest('.tb-btns')&&pc&&pc.max)pc.max()});

renderMe();renderFriends();setBal();
loadGames().catch(function(){});
})();
