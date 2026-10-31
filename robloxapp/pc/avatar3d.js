/* 3D avatar viewer: same method as the mobile app.
   1) worn asset ids from Roblox  2) POST /avatar/render3d on the Vercel server -> {obj, mtl, aabb}
   3) /avatar/cdn/<hash> files are loaded with three.js (OBJ + MTL) and drawn in a canvas you can drag to rotate. */
(function(){
var BASE='https://create-app-iota.vercel.app',LIBS=[
 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/MTLLoader.js',
 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/OBJLoader.js'];
var libP=null;
function loadScript(u){return new Promise(function(res,rej){var s=document.createElement('script');s.src=u;s.onload=res;s.onerror=function(){rej(Error('lib '+u))};document.head.appendChild(s)})}
function libs(){if(!libP)libP=LIBS.reduce(function(p,u){return p.then(function(){return loadScript(u)})},Promise.resolve());return libP}
function vid(){var k='larp-vid-m',v='';try{v=localStorage.getItem(k)||'';if(!/^[a-f0-9]{16}$/.test(v)){v=Array.from({length:16},function(){return Math.floor(Math.random()*16).toString(16)}).join('');localStorage.setItem(k,v)}}catch(e){v=''}return v}
function cdn(h){return BASE+'/avatar/cdn/'+h+(vid()?'?_v='+vid():'')}
function render3d(ids){
 return fetch(BASE+'/avatar/render3d'+(vid()?'?_v='+vid():''),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({assetIds:ids})}).then(function(r){return r.json().then(function(j){if(!r.ok)throw Error(j.error||'render3d '+r.status);return j})});
}
var cur=null;
function show(box,ids,opt){
 opt=opt||{};var zoom=opt.zoom||1.25,log=opt.log||function(){};
 log('3D: asking the server… ('+ids.length+' items)');
 var timeout=new Promise(function(_,rej){setTimeout(function(){rej(Error('timed out (the server did not answer in 40s)'))},40000)});
 var main=Promise.all([render3d(ids).then(function(m){log('3D: loading the model…');return m}),libs().then(function(){log('3D: libraries ready')})]).then(function(r){
  var meta=r[0],T=window.THREE;
  if(cur){cur.dead=true;cancelAnimationFrame(cur.raf);try{cur.renderer.dispose()}catch(e){}if(cur.el&&cur.el.parentNode)cur.el.parentNode.removeChild(cur.el)}
  var W=box.clientWidth||600,H=box.clientHeight||800;
  var renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));renderer.setSize(W,H);renderer.outputEncoding=T.sRGBEncoding;
  box.appendChild(renderer.domElement);renderer.domElement.className='av3d';
  var scene=new T.Scene(),cam=new T.PerspectiveCamera(30,W/H,.1,100);
  scene.add(new T.AmbientLight(0xffffff,.9));var d1=new T.DirectionalLight(0xffffff,.8);d1.position.set(-3,6,-8);scene.add(d1);var d2=new T.DirectionalLight(0xdfe7ff,.25);d2.position.set(5,2,-4);scene.add(d2);
  var pivot=new T.Group();scene.add(pivot);
  var a=meta.aabb,ctr=new T.Vector3((a.min.x+a.max.x)/2,(a.min.y+a.max.y)/2,(a.min.z+a.max.z)/2);
  var st={dead:false,renderer:renderer,el:renderer.domElement,yaw:0,target:0,raf:0};cur=st;
  var mgr=new T.LoadingManager();mgr.setURLModifier(function(u){return /^(blob:|data:|https?:)/.test(u)?u:cdn(u.split('/').pop())});
  return new Promise(function(res2,rej2){
   new T.MTLLoader(mgr).load(cdn(meta.mtl),function(mtl){
    mtl.preload();var base={};
    Object.keys(mtl.materials).forEach(function(k){
     var m=mtl.materials[k];base[k]=m.color.clone();m.side=T.DoubleSide;if(m.specular)m.specular.set(0);m.alphaMap=null;m.transparent=false;m.opacity=1;
     var info=mtl.materialsInfo&&mtl.materialsInfo[k],kd=info&&info.map_kd;
     if(kd){m.color.set(0xffffff);m.map=null;new T.TextureLoader().load(cdn(kd.split('/').pop()),function(t){var c=document.createElement('canvas');c.width=t.image.width;c.height=t.image.height;var g=c.getContext('2d');g.fillStyle='#'+base[k].getHexString();g.fillRect(0,0,c.width,c.height);g.drawImage(t.image,0,0);var tx=new T.CanvasTexture(c);tx.encoding=T.sRGBEncoding;tx.flipY=true;tx.anisotropy=4;m.map=tx;m.needsUpdate=true})}
    });
    var ol=new T.OBJLoader(mgr);ol.setMaterials(mtl);
    ol.load(cdn(meta.obj),function(obj){
     if(st.dead)return;obj.position.sub(ctr);pivot.add(obj);
     var h=a.max.y-a.min.y,r2=h*.8/Math.tan(cam.fov*Math.PI/360)/zoom;cam.position.set(0,h*.1,-r2);cam.lookAt(0,h*.06,0);
     var down=null;var el=renderer.domElement;el.style.cursor='grab';
     el.addEventListener('pointerdown',function(e){down={x:e.clientX,t:st.target};el.setPointerCapture&&el.setPointerCapture(e.pointerId);el.style.cursor='grabbing'});
     el.addEventListener('pointermove',function(e){if(down)st.target=down.t+(e.clientX-down.x)*.018});
     ['pointerup','pointercancel'].forEach(function(n){el.addEventListener(n,function(){down=null;el.style.cursor='grab'})});
     (function loop(){if(st.dead)return;st.yaw+=(st.target-st.yaw)*.4;pivot.rotation.y=st.yaw;renderer.render(scene,cam);st.raf=requestAnimationFrame(loop)})();
     res2()},null,function(){rej2(Error('obj'))});
   },null,function(){rej2(Error('mtl'))});
  });
 });
 return Promise.race([main,timeout]);
}
function status(){return fetch(BASE+'/avatar/status'+(vid()?'?_v='+vid():'')).then(function(r){return r.json()}).then(function(e){return {raw:e,authed:!!(e.authed!=null?e.authed:e.ok)}}).catch(function(){return {authed:false,raw:null}})}
function render2d(ids){return fetch(BASE+'/avatar/render'+(vid()?'?_v='+vid():''),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({assetIds:ids,exact:true,lookId:''})}).then(function(r){return r.json().then(function(j){if(!r.ok)throw Error(j.error||j.reason||'render '+r.status);return j.imageUrl})})}
window.Av3D={show:show,status:status,render2d:render2d};
})();
