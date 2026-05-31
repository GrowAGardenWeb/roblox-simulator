// ============================================
// MoneyScripts Key Gate — keygate.js
// Add this script to every simulator
// ============================================

(function(){
  const FIREBASE_DB = 'https://moneyscripts-75c7c-default-rtdb.firebaseio.com';

  // Generate/get device fingerprint
  function getDevice(){
    let d = localStorage.getItem('ms_device');
    if(!d){
      d = 'DEV-' + Math.random().toString(36).substr(2,9).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
      localStorage.setItem('ms_device', d);
    }
    return d;
  }

  // Check if already unlocked on this device
  function getStoredKey(){
    return localStorage.getItem('ms_active_key');
  }

  function setStoredKey(key){
    localStorage.setItem('ms_active_key', key);
  }

  // Verify key against Firebase
  async function verifyKey(key){
    try{
      const res = await fetch(`${FIREBASE_DB}/keys/${key}.json`);
      const data = await res.json();
      if(!data) return {valid:false, reason:'Key not found'};
      if(data.revoked) return {valid:false, reason:'Key has been revoked'};
      if(data.expires && data.expires < Date.now()) return {valid:false, reason:'Key has expired'};
      const device = getDevice();
      // If key already used by a different device, block
      if(data.device && data.device !== device) return {valid:false, reason:'Key already used on another device'};
      return {valid:true, data};
    }catch(e){
      return {valid:false, reason:'Connection error. Try again.'};
    }
  }

  // Mark key as used by this device
  async function claimKey(key){
    const device = getDevice();
    await fetch(`${FIREBASE_DB}/keys/${key}/device.json`, {
      method:'PUT',
      body: JSON.stringify(device)
    });
  }

  // GATE UI
  const style = document.createElement('style');
  style.textContent = `
    #ms-gate{position:fixed;inset:0;z-index:99999;background:#111214;display:flex;align-items:center;justify-content:center;padding:20px;font-family:'Builder Sans',system-ui,sans-serif}
    #ms-gate-box{background:#191a1f;border:1px solid rgba(255,255,255,.1);border-radius:16px;width:100%;max-width:400px;padding:28px;display:flex;flex-direction:column;gap:16px;text-align:center}
    #ms-gate-logo{font-size:18px;font-weight:800;color:#f7f7f8}
    #ms-gate-logo span{color:#00b06c}
    #ms-gate-title{font-size:22px;font-weight:800;color:#f7f7f8;letter-spacing:-.4px}
    #ms-gate-sub{font-size:14px;color:#9a9fb0;line-height:1.5}
    #ms-gate-input{width:100%;background:#202227;border:1.5px solid rgba(255,255,255,.1);border-radius:10px;padding:13px 14px;color:#f7f7f8;font-family:monospace;font-size:16px;text-align:center;letter-spacing:2px;outline:none;transition:border-color .15s}
    #ms-gate-input:focus{border-color:#335fff}
    #ms-gate-input::placeholder{color:#4a4f63;letter-spacing:1px;font-size:13px}
    #ms-gate-btn{width:100%;background:#335fff;color:#fff;border:none;border-radius:10px;padding:13px;font-family:system-ui,sans-serif;font-size:16px;font-weight:700;cursor:pointer;transition:opacity .15s}
    #ms-gate-btn:hover{opacity:.88}
    #ms-gate-btn:disabled{opacity:.5;cursor:not-allowed}
    #ms-gate-err{font-size:13px;color:#f04433;display:none;background:rgba(240,68,51,.08);border:1px solid rgba(240,68,51,.2);border-radius:8px;padding:8px 12px}
    #ms-gate-discord{font-size:12px;color:#5a5f78}
    #ms-gate-discord a{color:#6b9bff;text-decoration:none}
    #ms-gate-discord a:hover{text-decoration:underline}
  `;
  document.head.appendChild(style);

  const gate = document.createElement('div');
  gate.id = 'ms-gate';
  gate.innerHTML = `
    <div id="ms-gate-box">
      <div id="ms-gate-logo">Money<span>Scripts</span></div>
      <div id="ms-gate-title">Enter Your Key</div>
      <div id="ms-gate-sub">Enter your access key to unlock this simulator.</div>
      <input id="ms-gate-input" type="text" placeholder="MSK-XXXX-XXXX-XXXX" maxlength="19" autocomplete="off" spellcheck="false">
      <div id="ms-gate-err"></div>
      <button id="ms-gate-btn" onclick="window._msVerify()">Unlock</button>
      <div id="ms-gate-discord">Don't have a key? <a href="https://discord.gg/moneyscripts" target="_blank">Join discord.gg/moneyscripts</a></div>
    </div>
  `;

  async function init(){
    // Check if already unlocked
    const storedKey = getStoredKey();
    if(storedKey){
      const result = await verifyKey(storedKey);
      if(result.valid){
        const content = document.getElementById('ms-content');
        if(content) content.style.display = 'block';
        return;
      } // Already unlocked, don't show gate
      else { localStorage.removeItem('ms_active_key'); }
    }
    // Show gate
    document.body.appendChild(gate);
    document.body.style.overflow = 'hidden';

    // Auto-format input
    const input = document.getElementById('ms-gate-input');
    input.addEventListener('input', () => {
      let v = input.value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      if(v.length > 4) v = v.slice(0,4) + '-' + v.slice(4);
      if(v.length > 9) v = v.slice(0,9) + '-' + v.slice(9);
      if(v.length > 14) v = v.slice(0,14);
      input.value = v;
    });
    input.addEventListener('keydown', e => { if(e.key==='Enter') window._msVerify(); });
  }

  window._msVerify = async function(){
    const input = document.getElementById('ms-gate-input');
    const btn = document.getElementById('ms-gate-btn');
    const err = document.getElementById('ms-gate-err');
    const key = input.value.trim().toUpperCase();

    if(key.length < 14){ showErr('Please enter a valid key (MSK-XXXX-XXXX-XXXX)'); return; }

    btn.disabled = true;
    btn.textContent = 'Verifying...';
    err.style.display = 'none';

    const result = await verifyKey(key);
    if(result.valid){
      await claimKey(key);
      setStoredKey(key);
      btn.textContent = '✓ Unlocked!';
      btn.style.background = '#00b06c';
      setTimeout(() => {
        document.getElementById('ms-gate').remove();
        document.body.style.overflow = '';
        const content = document.getElementById('ms-content');
        if(content) content.style.display = 'block';
      }, 800);
    } else {
      showErr(result.reason);
      btn.disabled = false;
      btn.textContent = 'Unlock';
    }
  }

  function showErr(msg){
    const err = document.getElementById('ms-gate-err');
    err.textContent = msg;
    err.style.display = 'block';
  }

  // Wait for DOM then init
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
