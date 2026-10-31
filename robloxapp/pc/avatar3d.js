/* Avatar viewer: the same RoAvatar library and settings the mobile app uses
   (robloxapp/assets/dist-*.js, FLAGS, FETCH_FUNC through the Vercel proxy, OutfitRenderer + idle animation),
   so accessories, animations and effects are drawn by the same engine. */
(function(){
var LIFT=.95,VB='https://create-app-iota.vercel.app',LIB='/robloxapp/assets/dist-CjbySSkN-D81REfjO.js',P=null,cur=null;
function boot(){
 if(P)return P;
 P=(async function(){
  if(typeof window.DracoDecoderModule==='undefined')throw Error('draco_decoder.js is missing');
  var R=await import(LIB);
  R.FLAGS.ONLINE_ASSETS=true;
  R.FLAGS.ASSETS_PATH='/robloxapp/roavatar/assets/rbxasset/';
  R.FLAGS.RIG_PATH='/robloxapp/roavatar/assets/';
  R.FLAGS.USE_WORKERS=false;
  R.FLAGS.FETCH_FUNC=async function(e,t){
   var n=typeof e==='string'?e:e instanceof URL?e.href:e.url,ext=/^https:\/\/([\w-]+\.)*(roblox\.com|rbxcdn\.com)(\/|$)/.test(n),
       i=ext?await fetch(VB+'/api/rbx?u='+encodeURIComponent(n),t):await fetch(e,t);
   if(!ext)return i;
   try{
    var buf=await i.clone().arrayBuffer(),u=new Uint8Array(buf);
    if(u.length>2&&u[0]===31&&u[1]===139){
     var g=new DecompressionStream('gzip'),out=await new Response(new Response(buf).body.pipeThrough(g)).arrayBuffer(),h=new Headers(i.headers);
     h.delete('content-encoding');h.delete('content-length');
     return new Response(out,{status:i.status,statusText:i.statusText,headers:h});
    }
   }catch(x){}
   return i;
  };
  if(!await R.RBXRenderer.fullSetup(true,true,true))throw Error('renderer setup failed');
  try{var pr=Math.min(2,window.devicePixelRatio||1),rd=(R.RBXRenderer.getRenderer&&R.RBXRenderer.getRenderer())||R.RBXRenderer.renderer;if(rd&&rd.getPixelRatio()>pr)rd.setPixelRatio(pr)}catch(x){}
  return {R:R,auth:new R.Authentication()};
 })();
 P.catch(function(){P=null});
 return P;
}
var Q=Promise.resolve(),tok=0;
function show(box,uid,opt){var t=++tok;Q=Q.catch(function(){}).then(function(){if(t!==tok)throw Error('superseded');return doShow(box,uid,opt)});return Q}
function doShow(box,uid,opt){
 opt=opt||{};var log=opt.log||function(){},LF=opt.lift!=null?opt.lift:LIFT;
 return boot().then(function(E){
  var R=E.R;log('Loading avatar…');
  return R.API.Avatar.GetUserAvatarModel(Number(uid)).then(function(model){
   if(!model||model instanceof Response)throw Error('avatar model '+(model&&model.status));
   var reuse=!!(cur&&cur.rend),rend=reuse?cur.rend:new R.OutfitRenderer(E.auth,model);
   /* one renderer for the whole page: a new person is loaded into it (like the mobile app does when the outfit changes), so two models never stack */
   if(reuse){try{rend.setOutfitModel(model)}catch(x){}}
   else if(rend.backgroundRenderer){rend.backgroundRenderer.cameraAffectsTransparency=false;rend.backgroundRenderer.cameraAffectsRotation=false}
   var assets0=model.clone().outfit.toJson().assets.slice();
   var el=R.RBXRenderer.getRendererElement();
   el.style.cssText='width:100%;height:100%;display:block;touch-action:none';
   if(el.parentNode!==box)box.appendChild(el);
   R.RBXRenderer.setRendererSize(box.clientWidth,box.clientHeight);
   var sc=R.RBXRenderer.firstScene;
   /* same scene set-up as the mobile app (transparent background, no floor, its light rig) */
   try{
    sc.scene.background=null;R.RBXRenderer.renderer&&R.RBXRenderer.renderer.setClearColor(0,0);if(sc.plane)sc.plane.visible=false;if(sc.shadowPlane)sc.shadowPlane.visible=false;
    if(sc.ambientLight)sc.ambientLight.intensity=2.8;
    if(sc.directionalLight){sc.directionalLight.castShadow=false;sc.directionalLight.intensity=.45;sc.directionalLight.position.set(-4,9,-9)}
    if(sc.directionalLight2){sc.directionalLight2.intensity=.4;sc.directionalLight2.position.set(6,5,-4)}
    if(sc.directionalLight){var L=sc.directionalLight.constructor,l1=new L(0xffffff,.6);l1.position.set(0,12,-1.5);var l2=new L(0xffffff,.45);l2.position.set(0,6,9);sc.scene.add(l1,l2)}
   }catch(x){}
   rend.doCameraUpdateOnLoad=false;rend.doCameraUpdate=false;
   var D=R.RBXRenderer.controls;
   function cam(){
    rend.doCameraUpdateOnLoad=false;rend.doCameraUpdate=false;D=R.RBXRenderer.controls;if(!D)return;
    D.target.set(0,3+LF,0);var d=7.6346,t=5*Math.PI/180;
    D.object.position.set(0,3+LF+d*Math.sin(t),-d*Math.cos(t));D.object.lookAt(D.target);
    D.enableZoom=false;D.enablePan=false;D.minPolarAngle=D.maxPolarAngle=Math.PI/2-t;D.enableDamping=true;D.dampingFactor=.15;D.rotateSpeed=1.6;D.update();
    /* keep the feet centred on the turntable like the mobile app */
    try{var f=[];sc.scene.updateMatrixWorld(true);sc.scene.traverse(function(o){if(/^(Left|Right)Foot_/.test(o.name))f.push(o.matrixWorld.elements)});
     if(f.length>=2){var dx=f.reduce(function(s,m){return s+m[12]},0)/f.length-D.target.x,dz=f.reduce(function(s,m){return s+m[14]},0)/f.length-D.target.z;D.target.x+=dx;D.target.z+=dz;D.object.position.x+=dx;D.object.position.z+=dz;D.update()}}catch(x){}
   }
   rend.startAnimating();
   return rend.setMainAnimation('idle').then(function(){
    cam();
    /* the engine keeps adding meshes for a while: re-frame until the scene stops changing (same as the mobile app) */
    var last=-1,calm=0,iv=setInterval(function(){var n=(sc.scene&&sc.scene.children&&sc.scene.children.length)||0;if(n===last){if(n>8&&++calm>=3){cam();clearInterval(iv)}}else{last=n;calm=0;cam()}},500);setTimeout(function(){clearInterval(iv)},90000);
    var ro=new ResizeObserver(function(){if(box.clientWidth>0){R.RBXRenderer.setRendererSize(box.clientWidth,box.clientHeight);cam()}});ro.observe(box);
    if(cur&&cur.ro)cur.ro.disconnect();cur={ro:ro,rend:rend,base:model,assets:assets0,R:R,owner:opt.owner||'me'};
    return rend;
   });
  });
 });
}
var ACC={8:1,41:1,42:1,43:1,44:1,45:1,46:1,47:1,19:1};
function rebuild(){
 if(!cur)return;var r=cur.base.clone(),j=r.outfit.toJson();j.assets=cur.assets.slice();r.outfit.fromJson(j);cur.rend.setOutfitModel(r);
}
function has(id){return !!cur&&!!cur.assets&&cur.assets.some(function(x){return Number(x.id)===Number(id)})}
function wear(id,type,name){
 if(!cur)return false;id=Number(id);type=Number(type)||0;
 if(!ACC[type]&&type)cur.assets=cur.assets.filter(function(x){return !(x.assetType&&x.assetType.id===type)});
 if(!has(id))cur.assets.push({id:id,name:name||'',assetType:{id:type,name:''}});
 rebuild();return true;
}
function unwear(id){if(!cur)return false;id=Number(id);cur.assets=cur.assets.filter(function(x){return Number(x.id)!==id});rebuild();return true}
window.Av3D={show:show,boot:boot,wear:wear,unwear:unwear,has:has,ready:function(){return !!cur&&!!cur.assets},owner:function(){return cur&&cur.owner}};
})();
