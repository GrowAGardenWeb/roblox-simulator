// MoneyScripts — Roblox API proxy (Cloudflare Worker)
//
// The Roblox web APIs only send CORS headers to roblox.com, so a page on
// moneyscripts.shop cannot call them directly. This worker forwards the
// requests (GET and the few JSON POSTs the apps use) and adds the CORS
// headers. It replaces the proxy that used to run on Vercel.
//
// Routes (same shapes the apps already use):
//   /rbx/<alias>/<path>?<query>   -> https://<host>.roblox.com/<path>?<query>
//        aliases: apis, thumbs (thumbnails), users, friends, games, catalog,
//                 inv (inventory), avatar, economy, groups, badges, presence
//   /api/rbx?u=<url>  or  /rbxproxy?u=<url>
//        -> any https URL on roblox.com / rbxcdn.com (images, assets, JSON)
//   /avatar/status    -> { ok: true, authed: true }   (turns the 3D engine on)
//   /avatar/*         -> 501 (server-side avatar renders are not available)
//
// Only roblox.com and rbxcdn.com hosts are ever contacted, and only requests
// from moneyscripts.shop (or the desktop app / localhost) are answered.

const ALIASES = {
  apis: 'apis',
  thumbs: 'thumbnails',
  thumbnails: 'thumbnails',
  users: 'users',
  friends: 'friends',
  games: 'games',
  catalog: 'catalog',
  inv: 'inventory',
  inventory: 'inventory',
  avatar: 'avatar',
  economy: 'economy',
  groups: 'groups',
  badges: 'badges',
  presence: 'presence',
  trades: 'trades',
  assetdelivery: 'assetdelivery',
};

const HOST_OK = /^([a-z0-9-]+\.)*(roblox\.com|rbxcdn\.com)$/i;

const ORIGIN_OK = [
  /^https:\/\/(www\.)?moneyscripts\.shop$/,
  /^https:\/\/create-app-iota\.vercel\.app$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^null$/,
];

const UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

function cors(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Expose-Headers': 'x-rbx-proxy, content-type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
    'x-rbx-proxy': '1',
  };
}

function json(obj, status, origin) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors(origin) },
  });
}

// How long Cloudflare may keep a GET answer, by what is being asked for.
function ttlFor(target) {
  const h = target.hostname;
  if (h.endsWith('rbxcdn.com') || h.startsWith('assetdelivery.')) return 86400;
  if (h.startsWith('thumbnails.')) return 1800;
  if (h.startsWith('catalog.') || h.startsWith('economy.')) return 300;
  if (h.startsWith('users.') || h.startsWith('avatar.')) return 600;
  return 120;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    if (origin && !ORIGIN_OK.some((re) => re.test(origin))) {
      return json({ error: 'Origin not allowed' }, 403, '');
    }
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors(origin) });
    }

    try {
      let target = null;
      const path = url.pathname;

      if (path.startsWith('/rbx/')) {
        const m = path.match(/^\/rbx\/([a-z]+)\/(.*)$/);
        const host = m && ALIASES[m[1]];
        if (!host) return json({ error: 'Unknown service' }, 404, origin);
        target = new URL(`https://${host}.roblox.com/${m[2]}${url.search}`);
      } else if (path === '/api/rbx' || path === '/rbxproxy') {
        const u = url.searchParams.get('u');
        if (!u) return json({ error: 'Missing u' }, 400, origin);
        try { target = new URL(u); } catch { return json({ error: 'Bad u' }, 400, origin); }
      } else if (path === '/avatar/status' || path === '/api/avatar/status') {
        return json({ ok: true, authed: true }, 200, origin);
      } else if (path.startsWith('/avatar/') || path.startsWith('/api/avatar/')) {
        return json({ error: 'Not available' }, 501, origin);
      } else {
        return json({ ok: true, service: 'moneyscripts-rbx' }, 200, origin);
      }

      if (target.protocol !== 'https:' || !HOST_OK.test(target.hostname)) {
        return json({ error: 'Host not allowed' }, 403, origin);
      }
      if (request.method !== 'GET' && request.method !== 'HEAD' && request.method !== 'POST') {
        return json({ error: 'Method not allowed' }, 405, origin);
      }

      const headers = new Headers();
      headers.set('User-Agent', UA);
      headers.set('Accept', request.headers.get('Accept') || 'application/json, */*');
      const ct = request.headers.get('Content-Type');
      if (ct) headers.set('Content-Type', ct);

      const init = { method: request.method, headers, redirect: 'follow' };
      if (request.method === 'POST') init.body = await request.arrayBuffer();
      else init.cf = { cacheTtl: ttlFor(target), cacheEverything: true };

      const up = await fetch(target.toString(), init);

      const out = new Headers();
      const upType = up.headers.get('Content-Type');
      if (upType) out.set('Content-Type', upType);
      const enc = up.headers.get('Content-Encoding');
      if (enc) out.set('Content-Encoding', enc);
      const cc = up.headers.get('Cache-Control');
      out.set('Cache-Control', request.method === 'GET' && up.ok ? 'public, max-age=60' : cc || 'no-store');
      for (const [k, v] of Object.entries(cors(origin))) out.set(k, v);

      return new Response(up.body, { status: up.status, headers: out });
    } catch (err) {
      return json({ error: 'Proxy error: ' + (err && err.message ? err.message : String(err)) }, 502, origin);
    }
  },
};
