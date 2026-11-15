/* La tienda se queda debajo cuando abres un artículo (o los regalos): el artículo se pone ENCIMA y BACK solo lo quita.
   Así no se oculta y se vuelve a pintar toda la tienda (que re-decodifica cientos de imágenes de golpe) y no se pierde el lugar donde ibas. */
(function () {
  const shop = document.querySelector('.screen[data-screen="shop"]'), sc = document.getElementById('shopscroll');
  if (!shop) return;
  let under = false, prev = document.body.dataset.screen, lastTop = 0;
  if (sc) sc.addEventListener('scroll', () => { if (!shop.dataset.under) lastTop = sc.scrollTop; }, { passive: true });
  new MutationObserver(() => {
    const cur = document.body.dataset.screen;
    if (prev === 'shop' && cur === 'detail') under = true;
    if (under && (cur === 'detail' || cur === 'gift')) {
      shop.hidden = false; shop.style.pointerEvents = 'none'; shop.dataset.under = '1';
      if (sc && Math.abs(sc.scrollTop - lastTop) > 2) sc.scrollTop = lastTop;
    } else if (under) {
      const back = cur === 'shop';
      under = false; delete shop.dataset.under; shop.style.pointerEvents = '';
      if (back) { const l = document.getElementById('ldr'); if (l) l.classList.remove('on'); if (sc && Math.abs(sc.scrollTop - lastTop) > 2) sc.scrollTop = lastTop; }
    }
    prev = cur;
  }).observe(document.body, { attributes: true, attributeFilter: ['data-screen'] });
})();
