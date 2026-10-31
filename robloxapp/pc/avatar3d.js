/* Avatar viewer: the same RoAvatar library and settings the mobile app uses
   (robloxapp/assets/dist-*.js, FLAGS, FETCH_FUNC through the Vercel proxy, OutfitRenderer + idle animation),
   so accessories, animations and effects are drawn by the same engine. */
(function(){
var VB='https://create-app-iota.vercel.app',LIB='/robloxapp/assets/dist-CjbySSkN-D81REfjO.js',P=null,cur=null;
function boot(){
 if(P)return P;
 P=(async function(){
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
function show(box,uid,opt){
 opt=opt||{};var log=opt.log||function(){};
 return boot().then(function(E){
  var R=E.R;log('Loading avatar…');
  return R.API.Avatar.GetUserAvatarModel(Number(uid)).then(function(model){
   if(!model||model instanceof Response)throw Error('avatar model '+(model&&model.status));
   var rend=new R.OutfitRenderer(E.auth,model);
   var el=R.RBXRenderer.getRendererElement();
   el.style.cssText='width:100%;height:100%;display:block;touch-action:none';
   if(el.parentNode!==box)box.appendChild(el);
   R.RBXRenderer.setRendererSize(box.clientWidth,box.clientHeight);
   var sc=R.RBXRenderer.firstScene;
   try{sc.scene.background=null;R.RBXRenderer.renderer&&R.RBXRenderer.renderer.setClearColor(0,0);if(sc.plane)sc.plane.visible=false;if(sc.shadowPlane)sc.shadowPlane.visible=false}catch(x){}
   rend.startAnimating();
   return rend.setMainAnimation('idle').then(function(){
    var D=R.RBXRenderer.controls;
    function cam(){
     rend.doCameraUpdateOnLoad=false;rend.doCameraUpdate=false;if(!D)return;
     D.target.set(0,3,0);var d=7.6346,t=5*Math.PI/180;
     D.object.position.set(0,3+d*Math.sin(t),-d*Math.cos(t));D.object.lookAt(D.target);
     D.enableZoom=false;D.enablePan=false;D.minPolarAngle=D.maxPolarAngle=Math.PI/2-t;D.enableDamping=true;D.dampingFactor=.15;D.rotateSpeed=1.6;D.update();
    }
    cam();
    var ro=new ResizeObserver(function(){if(box.clientWidth>0){R.RBXRenderer.setRendererSize(box.clientWidth,box.clientHeight);cam()}});ro.observe(box);
    if(cur&&cur.ro)cur.ro.disconnect();cur={ro:ro,rend:rend};
    return rend;
   });
  });
 });
}
window.Av3D={show:show,boot:boot};
})();
