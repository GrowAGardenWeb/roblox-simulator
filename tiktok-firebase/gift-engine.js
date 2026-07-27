// ── GIFT VIDEO ENGINE ──
// Motor compartido: lo usa tanto el panel de control como el overlay de OBS
// (los dos viven en el mismo index.html, cambian de modo según la URL).
// Ambos deben tener en su HTML los mismos IDs: #gift-video-overlay,
// #gift-canvas, #gift-video-player.
(function () {
  // zoom: true  = gráfico chico centrado sobre fondo negro -> se hace zoom
  // zoom: false = video de escena completa -> respeta su propia proporción
  // chromaKey: true = quita los píxeles negros (los hace transparentes)
  // fade: { position:'top'|'bottom'|'left'|'right'|'none', size: 0-100 (alcance), strength: 0-100 (intensidad) }
  // crop: { top, bottom, left, right } = recorta fracciones (0-1) del video fuente antes de dibujar
  // showDonorNotif: true/false = si en el overlay se muestra "fulano mandó X" además del video
  const giftVideos = {
    'Interstellar': { file: 'Interstellar_plain.webm', zoom: false, chromaKey: false, fade: { position: 'top', size: 45, strength: 100 }, showDonorNotif: true, fadeInSeconds: 0.6, fadeOutSeconds: 0.6, keyThreshold: 56 },
    'Zeus': { file: 'Zeus_plain.webm', zoom: true, chromaKey: true, fade: { position: 'none', size: 0, strength: 100 }, crop: { top: 0, bottom: 0, left: 0, right: 0 }, showDonorNotif: true, fadeInSeconds: 0.6, fadeOutSeconds: 0.6, keyThreshold: 56 },
    'Unicorn Fantasy': { file: 'Unicorn_plain.webm', zoom: true, chromaKey: true, fade: { position: 'none', size: 0, strength: 100 }, crop: { top: 0, bottom: 0, left: 0, right: 0 }, showDonorNotif: true, fadeInSeconds: 0.6, fadeOutSeconds: 0.6, keyThreshold: 56 },
    'Fire Phoenix': { file: 'FirePhoenix_plain.webm', zoom: true, chromaKey: true, fade: { position: 'none', size: 0, strength: 100 }, crop: { top: 0, bottom: 0, left: 0, right: 0 }, showDonorNotif: true, fadeInSeconds: 0.6, fadeOutSeconds: 0.6, keyThreshold: 56 },
    'Lion': { file: 'Lion_plain.webm', zoom: true, chromaKey: true, fade: { position: 'none', size: 0, strength: 100 }, crop: { top: 0, bottom: 0, left: 0, right: 0 }, showDonorNotif: true, fadeInSeconds: 0.6, fadeOutSeconds: 0.6, keyThreshold: 56, muted: false },
    // Agrega más: 'Nombre del regalo': { file: 'archivo.webm', zoom: true, chromaKey: true },
  };

  let giftVideoQueue = [];
  let giftVideoPlaying = false;
  let currentlyPlayingGiftName = null;

  function playGiftVideo(giftName) {
    const cfg = giftVideos[giftName];
    if (!cfg) return;
    giftVideoQueue.push({ name: giftName, cfg });
    if (!giftVideoPlaying) processGiftVideoQueue();
  }

  async function processGiftVideoQueue() {
    if (giftVideoQueue.length === 0) { giftVideoPlaying = false; currentlyPlayingGiftName = null; return; }
    giftVideoPlaying = true;

    const { name: playingName, cfg } = giftVideoQueue.shift();
    currentlyPlayingGiftName = playingName;
    const overlay = document.getElementById('gift-video-overlay');
    const vid = document.getElementById('gift-video-player');
    const canvas = document.getElementById('gift-canvas');
    if (!overlay || !vid || !canvas) { console.warn('GiftEngine: faltan elementos en el HTML'); giftVideoPlaying = false; return; }

    vid.src = cfg.file;
    vid.muted = cfg.muted === false ? false : true;
    vid.load();

    await new Promise(res => {
      vid.onloadedmetadata = res;
      vid.onerror = res;
      setTimeout(res, 5000);
    });

    const ctx = canvas.getContext('2d');
    const crop = cfg.crop || { top: 0, bottom: 0, left: 0, right: 0 };

    let srcRect;
    if (cfg.zoom) {
      const vw = vid.videoWidth || 375;
      const vh = vid.videoHeight || 487;
      const sx = vw * (crop.left || 0);
      const sy = vh * (crop.top || 0);
      const sw = vw * (1 - (crop.left || 0) - (crop.right || 0));
      const sh = vh * (1 - (crop.top || 0) - (crop.bottom || 0));
      srcRect = { sx, sy, sw, sh };
      // Tope de resolución de trabajo: el chroma key procesa pixel por pixel cada
      // cuadro, así que en videos grandes (1080p+) eso solo se ve como lag.
      // Se muestra igual de grande en pantalla (eso lo controla el CSS), pero se
      // procesa a una resolución más chica por dentro -> mismo look, mucho más fluido.
      const MAX_W = 450;
      const scaleDown = sw > MAX_W ? MAX_W / sw : 1;
      canvas.width = Math.round(sw * scaleDown);
      canvas.height = Math.round(sh * scaleDown);
      canvas.style.width = 'auto';
      canvas.style.height = '80%';
      canvas.style.left = '60%';
      canvas.style.bottom = '20px';
      canvas.style.transform = 'translateX(-50%)';
    } else {
      const vw = vid.videoWidth || 375;
      const vh = vid.videoHeight || 812;
      const sx = vw * (crop.left || 0);
      const sy = vh * (crop.top || 0);
      const sw = vw * (1 - (crop.left || 0) - (crop.right || 0));
      const sh = vh * (1 - (crop.top || 0) - (crop.bottom || 0));
      srcRect = { sx, sy, sw, sh };
      canvas.width = 375;
      canvas.height = Math.round(375 * (sh / sw));
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.left = '0';
      canvas.style.bottom = '0';
      canvas.style.transform = 'none';
    }

    const maskCss = computeFadeMaskCSS(cfg.fade);
    canvas.style.maskImage = maskCss;
    canvas.style.webkitMaskImage = maskCss;

    // Fade in/out del overlay completo al aparecer/desaparecer (en segundos, por regalo).
    // Se usa la Web Animations API (element.animate) en vez de CSS transitions:
    // así se garantiza que la animación corra completa y sepamos con certeza
    // cuándo terminó, sin depender de que el navegador detecte bien el cambio.
    const fadeInMs = Math.max(0, (cfg.fadeInSeconds != null ? cfg.fadeInSeconds : 0.6)) * 1000;
    const fadeOutMs = Math.max(0, (cfg.fadeOutSeconds != null ? cfg.fadeOutSeconds : 0.6)) * 1000;
    overlay.getAnimations().forEach(an => an.cancel());
    overlay.style.opacity = '0';
    overlay.classList.add('visible');
    if (fadeInMs > 0) {
      overlay.animate([{ opacity: 0 }, { opacity: 1 }], { duration: fadeInMs, easing: 'ease', fill: 'forwards' });
    } else {
      overlay.style.opacity = '1';
    }

    let animFrame;

    function renderFrame() {
      if (vid.paused || vid.ended) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(vid, srcRect.sx, srcRect.sy, srcRect.sw, srcRect.sh, 0, 0, canvas.width, canvas.height);

      if (cfg.chromaKey) {
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = imageData.data;
          const W = canvas.width, H = canvas.height;
          const n = W * H;
          const KT = cfg.keyThreshold != null ? cfg.keyThreshold : 56; // sensibilidad ajustable
          const KT_LOW = Math.max(5, KT - 34);

          // Brillo por pixel (una vez)
          const brightness = new Float32Array(n);
          for (let p = 0; p < n; p++) {
            const i = p * 4;
            brightness[p] = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
          }

          // Flood fill desde el borde del cuadro: solo el negro que está
          // CONECTADO al borde se considera fondo real. Un negro sí oscuro
          // pero rodeado de contenido (una sombra del pelaje, por ejemplo)
          // no se toca, aunque tenga el mismo brillo.
          const isBg = new Uint8Array(n);
          const stack = new Int32Array(n);
          let sp = 0;
          for (let x = 0; x < W; x++) {
            if (brightness[x] < KT && !isBg[x]) { isBg[x] = 1; stack[sp++] = x; }
            const bx = (H - 1) * W + x;
            if (brightness[bx] < KT && !isBg[bx]) { isBg[bx] = 1; stack[sp++] = bx; }
          }
          for (let y = 0; y < H; y++) {
            const lx = y * W, rx = y * W + (W - 1);
            if (brightness[lx] < KT && !isBg[lx]) { isBg[lx] = 1; stack[sp++] = lx; }
            if (brightness[rx] < KT && !isBg[rx]) { isBg[rx] = 1; stack[sp++] = rx; }
          }
          while (sp > 0) {
            const p = stack[--sp];
            const x = p % W, y = (p / W) | 0;
            if (x > 0) { const q = p - 1; if (!isBg[q] && brightness[q] < KT) { isBg[q] = 1; stack[sp++] = q; } }
            if (x < W - 1) { const q = p + 1; if (!isBg[q] && brightness[q] < KT) { isBg[q] = 1; stack[sp++] = q; } }
            if (y > 0) { const q = p - W; if (!isBg[q] && brightness[q] < KT) { isBg[q] = 1; stack[sp++] = q; } }
            if (y < H - 1) { const q = p + W; if (!isBg[q] && brightness[q] < KT) { isBg[q] = 1; stack[sp++] = q; } }
          }

          for (let p = 0; p < n; p++) {
            if (!isBg[p]) continue; // no es fondo -> se queda tal cual, opaco
            const i = p * 4;
            const br = brightness[p];
            if (br < KT_LOW) {
              d[i + 3] = 0;
              continue;
            }
            const a = (br - KT_LOW) / (KT - KT_LOW);
            d[i + 3] = Math.round(a * 255);
            const factor = Math.min(1 / Math.max(a, 0.08), 3);
            const r = Math.min(255, d[i] * factor);
            const g = Math.min(255, d[i + 1] * factor);
            let b = Math.min(255, d[i + 2] * factor);
            // Supresión de derrame morado/azul en el borde
            const rgAvg = (r + g) / 2;
            if (b > rgAvg) b = rgAvg;
            d[i] = r; d[i + 1] = g; d[i + 2] = b;
          }
          ctx.putImageData(imageData, 0, 0);
        } catch (e) {
          console.warn('Chroma key error:', e);
        }
      }

      animFrame = requestAnimationFrame(renderFrame);
    }

    try {
      try {
        await vid.play();
      } catch (playErr) {
        if (!vid.muted) {
          // El navegador bloqueó el autoplay con sonido -> reintenta silenciado
          // para que al menos la animación se vea, en vez de no mostrar nada.
          console.warn('Autoplay con sonido bloqueado, reintentando en silencio:', playErr);
          vid.muted = true;
          await vid.play();
        } else {
          throw playErr;
        }
      }
      renderFrame();
      await new Promise(res => {
        vid.onended = res;
        vid.onerror = res;
        setTimeout(res, 35000);
      });
    } catch (e) { console.warn('Gift video error:', e); }

    cancelAnimationFrame(animFrame);

    // Fade out real: primero bajamos la opacidad (con el último frame todavía
    // dibujado), esperamos a que la animación TERMINE de verdad (con la
    // Web Animations API, no con CSS transitions), y RECIÉN AHÍ limpiamos
    // el canvas. Antes se limpiaba primero y no había nada que hacer fade out.
    overlay.classList.remove('visible');
    if (fadeOutMs > 0) {
      const currentOpacity = getComputedStyle(overlay).opacity || '1';
      overlay.getAnimations().forEach(an => an.cancel());
      overlay.style.opacity = currentOpacity;
      const animOut = overlay.animate([{ opacity: currentOpacity }, { opacity: 0 }], { duration: fadeOutMs, easing: 'ease', fill: 'forwards' });
      await animOut.finished.catch(() => {});
    } else {
      overlay.getAnimations().forEach(an => an.cancel());
      overlay.style.opacity = '0';
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    vid.src = '';

    processGiftVideoQueue();
  }

  // size = qué tanto del cuadro alcanza el fade (0-100%)
  // strength = qué tan intenso/transparente se pone en el borde (0-100%).
  //   100 = totalmente transparente en el borde; menos = se queda parcialmente visible.
  function computeFadeMaskCSS(fade) {
    if (!fade || !fade.position || fade.position === 'none' || !fade.size) return 'none';
    const size = Math.min(Math.max(fade.size, 0), 100);
    const strength = fade.strength != null ? Math.min(Math.max(fade.strength, 0), 100) : 100;
    const edgeAlpha = 1 - (strength / 100); // alpha del borde: 0 = invisible, 1 = no se nota el fade
    const dirMap = { top: 'to bottom', bottom: 'to top', left: 'to right', right: 'to left' };
    const dir = dirMap[fade.position] || 'to bottom';
    return `linear-gradient(${dir}, rgba(0,0,0,${edgeAlpha}) 0%, black ${size}%)`;
  }

  function updateLiveFadePreview(giftName) {
    const overlay = document.getElementById('gift-video-overlay');
    const canvas = document.getElementById('gift-canvas');
    if (!overlay || !overlay.classList.contains('visible')) return;
    if (currentlyPlayingGiftName !== giftName) return;
    const cfg = giftVideos[giftName];
    const maskCss = computeFadeMaskCSS(cfg.fade);
    canvas.style.maskImage = maskCss;
    canvas.style.webkitMaskImage = maskCss;
  }

  function ensureFade(cfg) {
    if (!cfg.fade) cfg.fade = { position: 'none', size: 0, strength: 100 };
    if (cfg.fade.strength == null) cfg.fade.strength = 100;
  }

  function setFadePosition(giftName, val) {
    const cfg = giftVideos[giftName];
    if (!cfg) return;
    ensureFade(cfg);
    cfg.fade.position = val;
    updateLiveFadePreview(giftName);
    if (window.GiftEngine.onConfigChange) window.GiftEngine.onConfigChange(giftName);
  }

  function setFadeSize(giftName, val, labelId) {
    const cfg = giftVideos[giftName];
    if (!cfg) return;
    ensureFade(cfg);
    cfg.fade.size = parseInt(val) || 0;
    if (labelId) { const el = document.getElementById(labelId); if (el) el.textContent = cfg.fade.size + '%'; }
    updateLiveFadePreview(giftName);
    if (window.GiftEngine.onConfigChange) window.GiftEngine.onConfigChange(giftName);
  }

  function setFadeStrength(giftName, val, labelId) {
    const cfg = giftVideos[giftName];
    if (!cfg) return;
    ensureFade(cfg);
    cfg.fade.strength = parseInt(val) || 0;
    if (labelId) { const el = document.getElementById(labelId); if (el) el.textContent = cfg.fade.strength + '%'; }
    updateLiveFadePreview(giftName);
    if (window.GiftEngine.onConfigChange) window.GiftEngine.onConfigChange(giftName);
  }

  function setCropTop(giftName, val, labelId) {
    const cfg = giftVideos[giftName];
    if (!cfg) return;
    if (!cfg.crop) cfg.crop = { top: 0, bottom: 0, left: 0, right: 0 };
    cfg.crop.top = (parseInt(val) || 0) / 100;
    if (labelId) { const el = document.getElementById(labelId); if (el) el.textContent = Math.round(cfg.crop.top * 100) + '%'; }
    if (window.GiftEngine.onConfigChange) window.GiftEngine.onConfigChange(giftName);
  }

  function setKeyThreshold(giftName, val, labelId) {
    const cfg = giftVideos[giftName];
    if (!cfg) return;
    cfg.keyThreshold = parseInt(val) || 56;
    if (labelId) { const el = document.getElementById(labelId); if (el) el.textContent = cfg.keyThreshold; }
    if (window.GiftEngine.onConfigChange) window.GiftEngine.onConfigChange(giftName);
  }

  function setShowDonorNotif(giftName, val) {
    const cfg = giftVideos[giftName];
    if (!cfg) return;
    cfg.showDonorNotif = !!val;
    if (window.GiftEngine.onConfigChange) window.GiftEngine.onConfigChange(giftName);
  }

  function setMuted(giftName, val) {
    const cfg = giftVideos[giftName];
    if (!cfg) return;
    cfg.muted = !!val;
    if (window.GiftEngine.onConfigChange) window.GiftEngine.onConfigChange(giftName);
  }

  function setFadeInSeconds(giftName, val, labelId) {
    const cfg = giftVideos[giftName];
    if (!cfg) return;
    cfg.fadeInSeconds = Math.max(0, parseFloat(val) || 0);
    if (labelId) { const el = document.getElementById(labelId); if (el) el.textContent = cfg.fadeInSeconds.toFixed(1) + 's'; }
    if (window.GiftEngine.onConfigChange) window.GiftEngine.onConfigChange(giftName);
  }

  function setFadeOutSeconds(giftName, val, labelId) {
    const cfg = giftVideos[giftName];
    if (!cfg) return;
    cfg.fadeOutSeconds = Math.max(0, parseFloat(val) || 0);
    if (labelId) { const el = document.getElementById(labelId); if (el) el.textContent = cfg.fadeOutSeconds.toFixed(1) + 's'; }
    if (window.GiftEngine.onConfigChange) window.GiftEngine.onConfigChange(giftName);
  }

  // Para sincronizar por Firebase: exporta/aplica solo la parte configurable
  function exportConfig(giftName) {
    const cfg = giftVideos[giftName];
    if (!cfg) return null;
    return {
      fade: cfg.fade || null,
      crop: cfg.crop || null,
      showDonorNotif: cfg.showDonorNotif !== false,
      fadeInSeconds: cfg.fadeInSeconds != null ? cfg.fadeInSeconds : 0.6,
      fadeOutSeconds: cfg.fadeOutSeconds != null ? cfg.fadeOutSeconds : 0.6,
      keyThreshold: cfg.keyThreshold != null ? cfg.keyThreshold : 56,
      muted: cfg.muted !== false
    };
  }

  function applyConfig(giftName, configObj) {
    const cfg = giftVideos[giftName];
    if (!cfg || !configObj) return;
    if (configObj.fade) cfg.fade = configObj.fade;
    if (configObj.crop) cfg.crop = configObj.crop;
    if (configObj.showDonorNotif != null) cfg.showDonorNotif = configObj.showDonorNotif;
    if (configObj.fadeInSeconds != null) cfg.fadeInSeconds = configObj.fadeInSeconds;
    if (configObj.fadeOutSeconds != null) cfg.fadeOutSeconds = configObj.fadeOutSeconds;
    if (configObj.keyThreshold != null) cfg.keyThreshold = configObj.keyThreshold;
    if (configObj.muted != null) cfg.muted = configObj.muted;
  }

  window.GiftEngine = {
    giftVideos,
    playGiftVideo,
    setFadePosition,
    setFadeSize,
    setFadeStrength,
    setCropTop,
    setKeyThreshold,
    setShowDonorNotif,
    setMuted,
    setFadeInSeconds,
    setFadeOutSeconds,
    exportConfig,
    applyConfig,
    onConfigChange: null // el index.html lo engancha para escribir a Firebase
  };
})();
