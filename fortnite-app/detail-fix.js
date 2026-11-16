/* Botón "VIEW ITEM" de la ficha: la imagen de fondo traía una mancha gris semitransparente en el borde de abajo.
   Se tapa con un botón sólido igual (debajo del texto). */
(function () {
  const det = document.querySelector('.screen[data-screen="detail"]'); if (!det) return;
  const b = document.createElement('div');
  b.style.cssText = 'position:absolute;left:132px;top:679px;width:684px;height:74px;border-radius:14px;background:linear-gradient(90deg,#a5b7f0,#a3c8f7 50%,#a2d1fa);pointer-events:none';
  const full = det.querySelector('.full'); if (full) full.after(b); else det.insertBefore(b, det.firstChild);
})();
