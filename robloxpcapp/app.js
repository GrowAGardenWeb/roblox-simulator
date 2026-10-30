(function(){
var $=function(id){return document.getElementById(id)};
var F=[
 ['wole','[Ken Carson]...'],['FDXPLAYXD50...','🍀 Tower Of...'],['Gonzza_TK','Steal An Egg'],['elboty','Natural Disaster...'],
 ['4l4nxddddd','[🎃] Fake an Egg'],['fandeterrinum...','99 Nights in the...'],['ToroLocoEmilio','Steal An Egg'],['LASD',''],
 ['rip_bonifacio',''],['JULIAN',''],['KLEIV675352',''],['DeboraMelo608',''],['Samrobaps',''],['Flow','']
];
var G=[
 ['[NUCLEAR WARFARE] God Simulati...','79% Rating'],['[🍀] Spin To Upgrade! [GUILDS + GO...','68% Rating'],['Prison Life','85% Rating'],
 ['[🎃] 📱 Build a Phone Empire','87% Rating'],['[EVENT] San Diego Roleplay','Ad • 85% Rating'],['🍀 Tower Of Luck [1.8]','FDXPLAYXD50603']
];
var h='<div class="fr"><div class="add"><img src="img/f_add.webp" alt="" style="width:54px;height:56px"><i class="n">45</i></div><b>Add Friends</b><small></small></div>';
F.forEach(function(f,i){h+='<div class="fr"><img src="img/fr'+i+'.webp" alt=""><b>'+f[0]+'</b><small>'+f[1]+'</small></div>'});
$('friends').innerHTML=h;
h='';
G.forEach(function(g,i){
 var last=i===5;
 h+='<div class="g"><img class="t" src="img/g'+i+'.webp" alt=""><b>'+g[0]+'</b><div class="r">'+(last?'<img class="pa" src="img/fr1.webp" alt="">':'<img src="img/i_like.webp" alt="">')+'<span>'+g[1]+'</span></div></div>';
});
$('games').innerHTML=h;
/* sidebar / tabs */
[].forEach.call(document.querySelectorAll('.sb'),function(b){b.addEventListener('click',function(){[].forEach.call(document.querySelectorAll('.sb'),function(x){x.classList.toggle('on',x===b)})})});
[].forEach.call(document.querySelectorAll('.tabs button'),function(b){b.addEventListener('click',function(){[].forEach.call(document.querySelectorAll('.tabs button'),function(x){x.classList.toggle('on',x===b)})})});
/* Robux page */
var S={robux:1000,user:'munfuja'};
function fmt(n){return Number(n).toLocaleString('en-US')}
var PK=[[24000,22500,1500,'$4,999.00'],[11000,10000,1000,'$2,499.00'],[5250,4500,750,'$1,299.00'],[3625,3150,475,'$799.00'],[2000,1700,300,'$499.00']];
function rrow(p,x,blue){return '<div class="rr"><div class="a"><img src="img/'+(blue?'hx_w':'hx_l')+'.webp" alt="" style="width:30px;height:30px"><b>'+fmt(p[0])+'</b><s><em><img src="img/hx_s.webp" alt="" style="width:24px;height:24px;margin-right:2px">'+fmt(p[1])+'</em></s></div><span class="pl">+ '+fmt(p[2])+' more</span>'+(x||'')+'<button class="bt'+(blue?' b':'')+'">'+p[3]+'</button></div>'}
$('rbRows').innerHTML=PK.map(function(p){return rrow(p)}).join('');
$('rbPk').innerHTML=rrow([1500,1200,300,'$299.00'],'<span class="pl"><img src="img/i_fy.webp" alt="" style="width:12px;height:12px">For you</span>',true);
function setBal(){$('rbBal').textContent=fmt(S.robux);$('rbPill').textContent=fmt(S.robux)}
setBal();
function openRb(){$('rb').hidden=false}
function closeRb(){$('rb').hidden=true}
$('openRb').addEventListener('click',openRb);$('rbX').addEventListener('click',closeRb);

/* Send Robux modal */
var sr=$('sr'),box=$('srBox'),FR=[
 ['elboty',3],['4l4nxddddd',4],['fandeterrinumero1',5],['ToroLocoEmilio',6],['Tio_segovia67',-1],['wole',0],['FDXPLAYXD50603',1],['Gonzza_TK',2],
 ['LASD',7],['rip_bonifacio',8],['JULIAN',9],['KLEIV675352',10],['DeboraMelo608',11],['Samrobaps',12],['Flow',13]
];
var pick=null,amt='';
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function pav(f,big){return f[1]<0?'<img class="t" src="img/'+(big?'tio60':'tio48')+'.webp" alt="">':'<img src="img/fr'+f[1]+'.webp" alt="">'}
function head(){return '<div class="sh"><span class="ti"><img src="img/i_sr.webp" alt="" style="width:24px;height:24px">Send Robux</span><span class="bl"><img src="img/hx_t.webp" alt="" style="width:14px;height:13px">'+fmt(S.robux)+'</span><button class="cl" id="srX" aria-label="Close"><img src="img/x_m.webp" alt="" style="width:20px;height:20px"></button></div>'}
function bindX(){$('srX').addEventListener('click',closeSr)}
function openSr(){pick=null;amt='';sr.hidden=false;viewPick('')}
function closeSr(){sr.hidden=true}
function viewPick(q){
 box.className='sr-box pick';
 box.innerHTML=head()+'<label class="sr-s"><img src="img/i_sg.webp" alt="" style="width:20px;height:20px"><input id="srQ" type="text" placeholder="Search" autocomplete="off" value="'+esc(q)+'"></label><div class="sr-l" id="srL"></div><div class="sr-list" id="srList"></div>';
 bindX();
 var inp=$('srQ');
 function fill(){var v=inp.value.trim().toLowerCase(),l=FR.filter(function(f){return !v||f[0].toLowerCase().indexOf(v)>=0});
  $('srL').textContent='My friends ('+(v?l.length:57)+')';
  $('srList').innerHTML=l.map(function(f){return '<div class="fx" data-n="'+esc(f[0])+'"><span class="p">'+pav(f)+'</span>'+esc(f[0])+'</div>'}).join('')}
 inp.addEventListener('input',fill);fill();
 $('srList').addEventListener('click',function(e){var t=e.target.closest('.fx');if(!t)return;pick=FR.filter(function(f){return f[0]===t.dataset.n})[0];amt='';viewAmt()});
 inp.focus();
}
function viewAmt(){
 box.className='sr-box amt am';
 var chips=[25,50,100,200].map(function(n){return '<button data-v="'+n+'"><img src="img/hx_c.webp" alt="" style="width:17px;height:17px">'+n+'</button>'}).join('');
 box.innerHTML=head()+'<span class="pf">'+pav(pick,true)+'</span><div class="nm">'+esc(pick[0])+'</div><div class="big"><img src="img/hx_a.webp" alt="" style="width:36px;height:38px"><span id="amV">0</span><input id="amI" inputmode="numeric" autocomplete="off"></div><div class="chips">'+chips+'</div><button class="nx" id="amN">Next</button><p class="nt">Robux are sent instantly with no fees</p>';
 bindX();
 var inp=$('amI');
 function upd(){var n=+amt||0;$('amV').textContent=fmt(n);$('amN').className='nx'+(n>0&&n<=S.robux?' on':'')}
 inp.addEventListener('input',function(){amt=inp.value.replace(/\D/g,'').replace(/^0+/,'').slice(0,7);inp.value=amt;upd()});
 box.querySelector('.chips').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;amt=b.dataset.v;inp.value=amt;upd()});
 $('amN').addEventListener('click',function(){var n=+amt||0;if(n>0&&n<=S.robux)viewConfirm(n)});
 inp.focus();
}
function viewConfirm(n){
 box.className='sr-box cf';
 var handle=pick[1]<0?'@EmiDs845':'@'+pick[0];
 box.innerHTML=head()+'<div class="c1"><span class="pf">'+pav(pick,true)+'</span><div class="nm">'+esc(pick[0])+'</div><div class="hd">'+esc(handle)+'</div><div class="ln"><span><img src="img/i_cal.webp" alt="" style="width:19px;height:20px">Connected 3 months</span><span><img src="img/i_ppl.webp" alt="" style="width:20px;height:20px">1 mutual friend</span></div><div class="jn"><img src="img/i_inf.webp" alt="" style="width:18px;height:18px">Joined in 2021</div></div><div class="c2"><div class="v"><img src="img/hx_a2.webp" alt="" style="width:36px;height:38px">'+fmt(n)+'</div><p>The recipient will get '+fmt(n)+' Robux.</p></div><div class="bs"><button class="s" id="cfS">Send</button><button class="e" id="cfE">Edit</button></div><p class="ntt">You need an age check or parental consent to send Robux. Once you send, you cannot cancel.</p>';
 bindX();
 $('cfE').addEventListener('click',viewAmt);
 $('cfS').addEventListener('click',function(){S.robux-=n;setBal();closeSr()});
}
$('rbSend').addEventListener('click',openSr);
sr.addEventListener('mousedown',function(e){if(e.target===sr)closeSr()});
document.addEventListener('keydown',function(e){if(e.key==='Escape'){if(!sr.hidden)closeSr();else if(!$('rb').hidden)closeRb()}});
/* window controls (Electron) */
var pc=window.pc||null;
function wc(id,fn){$(id).addEventListener('click',function(){if(pc&&pc[fn])pc[fn]()})}
wc('wmin','min');wc('wmax','max');wc('wcls','close');
$('tb').addEventListener('dblclick',function(e){if(!e.target.closest('.tb-btns')&&pc&&pc.max)pc.max()});
})();
