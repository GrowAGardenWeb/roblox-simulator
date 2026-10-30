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
/* window controls (Electron) */
var pc=window.pc||null;
function wc(id,fn){$(id).addEventListener('click',function(){if(pc&&pc[fn])pc[fn]()})}
wc('wmin','min');wc('wmax','max');wc('wcls','close');
$('tb').addEventListener('dblclick',function(e){if(!e.target.closest('.tb-btns')&&pc&&pc.max)pc.max()});
})();
