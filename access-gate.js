// MoneyScripts — shared purchase gate for /robloxapp and /headless.
// Include this as the very first <script> in <head>, after setting
// window.MS_REQUIRED_PRODUCT to 'mobile' or 'headless'.
(function () {
  var CHECKOUT_WORKER_URL = 'https://moneyscripts-stripe.pamelalunaescuela.workers.dev';
  var PRODUCT = window.MS_REQUIRED_PRODUCT;
  var STORE_URL = 'https://moneyscripts.shop/';

  // Hide everything instantly so there's no flash of the real app/content
  // before we know whether this visitor is allowed to see it. This is a
  // UX gate, not a real security boundary — the files are still publicly
  // hosted, same as everything else on a static site.
  document.documentElement.style.visibility = 'hidden';
  window.MS_ACCESS_STATE = 'pending';

  function bounceToStore() {
    window.MS_ACCESS_STATE = 'blocked';
    window.location.replace(STORE_URL);
  }

  async function checkAccess() {
    var token = null;
    try { token = localStorage.getItem('ms_session'); } catch (e) {}

    if (!token) {
      bounceToStore();
      return;
    }

    try {
      var res = await fetch(CHECKOUT_WORKER_URL + '/me', {
        headers: { Authorization: 'Bearer ' + token },
      });
      if (!res.ok) {
        bounceToStore();
        return;
      }
      var data = await res.json();
      if (!data.products || data.products.indexOf(PRODUCT) === -1) {
        bounceToStore();
        return;
      }
      // Authorized — reveal the real page.
      window.MS_ACCESS_STATE = 'granted';
      document.documentElement.style.visibility = 'visible';
    } catch (err) {
      bounceToStore();
    }
  }

  checkAccess();
})();
