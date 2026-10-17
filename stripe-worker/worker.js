// MoneyScripts — Stripe Checkout + Google Sign-In backend (Cloudflare Worker)
//
// Holds the Stripe secret key and Google client id as Worker config (secrets
// via `wrangler secret put`, never committed to the repo) and:
//   - verifies "Sign in with Google" ID tokens and issues our own session
//     token, stored in KV so we know which Google account is checking out
//   - creates Stripe Checkout Sessions tied to that Google account
//     (client_reference_id = Google "sub", customer_email = their email)
//   - on a verified checkout.session.completed webhook, records in KV which
//     Google account now has access to which product
//
// Routes:
//   POST /auth/google               { id_token } -> { session, email, name, picture }
//   POST /auth/signout              { } (Authorization: Bearer <session>) -> { ok }
//   GET  /me                        (Authorization: Bearer <session>) -> { email, products }
//   POST /create-checkout-session   { product } (Authorization: Bearer <session>) -> { url }
//   POST /webhook                   Stripe webhook receiver (signature-verified)
//   POST /notify-blocked            { product } (Authorization: Bearer <session>) -> { ok }
//   GET  /admin/whitelist/list      ?secret=ADMIN_SECRET -> { entries: [{email,product,expiresAt,addedAt}] }
//   POST /admin/whitelist/add       { secret, email, product, days? } -> { ok }
//                                   product: 'mobile' | 'headless' | 'cashapp' |
//                                   'phantom' | 'exodus' | 'paypal' | 'megapack' | 'all'
//                                   days: optional — omit/0 for permanent, e.g. 30 for one month
//   POST /admin/whitelist/remove    { secret, email } -> { ok }
//
// Requires a KV namespace bound as MS_KV (Settings -> Bindings -> KV Namespace).
//
// Optional: set DISCORD_WEBHOOK_URL as a Worker secret (wrangler secret put /
// Cloudflare dashboard -> Settings -> Variables and Secrets -> Secret) to get
// a Discord message on sign-ins, purchases, and blocked access attempts. If
// it's not set, these notifications are silently skipped.
//
// Set ADMIN_SECRET as a Worker secret to manage the free-access whitelist
// from /admin/ (a page in the main site repo) without editing/redeploying
// this file. Pick a long random password — anyone with it can grant free
// access to a specific product (or all of them), permanently or for a set
// number of days — e.g. for customers who pay via crypto outside Stripe.

const SITE_URL = 'https://moneyscripts.shop';

// TODO: replace with the real Google OAuth Client ID (safe to expose — it's
// public, not a secret) once it's created in Google Cloud Console.
const GOOGLE_CLIENT_ID = '308338292645-4u30h18t29b9nacbdusd43fivcl2bf47.apps.googleusercontent.com';

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

// Emails that always get full access to every product on sign-in, no
// purchase needed — for the site owner's own testing/admin account.
const ADMIN_EMAILS = new Set(['munfuja11@gmail.com']);

// Fill in headless.price once the Headless Gifter product/price exists in Stripe.
const PRODUCTS = {
  mobile: { price: 'price_1UP7I9FvaDdMVYC9aNf1fQ4J', mode: 'subscription' },
  headless: { price: 'price_1UP7I9FvaDdMVYC9kNeu3VG9', mode: 'payment' },
  cashapp: { price: 'price_1URNWCFvaDdMVYC9XGyamKKl', mode: 'subscription' },
  phantom: { price: 'price_1URNWPFvaDdMVYC9aLlaWzuv', mode: 'subscription' },
  exodus: { price: 'price_1URNWkFvaDdMVYC9loqRm93S', mode: 'subscription' },
  paypal: { price: 'price_1URNXNFvaDdMVYC9IOd576dU', mode: 'subscription' },
  megapack: { price: 'price_1URNVSFvaDdMVYC9M1EwD63O', mode: 'subscription' },
};

// Products to create in Stripe (Live mode), all recurring/month unless noted:
//   Cash App   $10/mo
//   Phantom    $10/mo
//   Exodus     $10/mo
//   PayPal     $10/mo
//   Mega Pack  $33/mo  — grants cashapp + phantom + exodus + paypal together
// A purchase of a bundle product grants every product listed here for it,
// instead of just the bundle's own key.
const PRODUCT_BUNDLES = {
  megapack: ['cashapp', 'phantom', 'exodus', 'paypal'],
};

const ALLOWED_ORIGINS = new Set([
  'https://moneyscripts.shop',
  'https://www.moneyscripts.shop',
]);

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    // Catch-all: any uncaught exception below would otherwise produce
    // Cloudflare's default error page, which has no CORS headers — the
    // browser then reports that to fetch() as an opaque network failure
    // instead of a readable error. Wrapping it means real failures (a
    // missing KV binding, a bad Google token, a Stripe error, etc.) show
    // up as an actual error message on the site instead of "could not
    // reach the server".
    try {
      if (url.pathname === '/auth/google' && request.method === 'POST') {
        return await handleGoogleAuth(request, env, origin);
      }
      if (url.pathname === '/auth/signout' && request.method === 'POST') {
        return await handleSignOut(request, env, origin);
      }
      if (url.pathname === '/me' && request.method === 'GET') {
        return await handleMe(request, env, origin);
      }
      if (url.pathname === '/create-checkout-session' && request.method === 'POST') {
        return await handleCreateSession(request, env, origin);
      }
      if (url.pathname === '/webhook' && request.method === 'POST') {
        return await handleWebhook(request, env);
      }
      if (url.pathname === '/notify-blocked' && request.method === 'POST') {
        return await handleNotifyBlocked(request, env, origin);
      }
      if (url.pathname === '/admin/whitelist/list' && request.method === 'GET') {
        return await handleWhitelistList(request, env, origin);
      }
      if (url.pathname === '/admin/whitelist/add' && request.method === 'POST') {
        return await handleWhitelistAdd(request, env, origin);
      }
      if (url.pathname === '/admin/whitelist/remove' && request.method === 'POST') {
        return await handleWhitelistRemove(request, env, origin);
      }
      return new Response('Not found', { status: 404, headers: corsHeaders(origin) });
    } catch (err) {
      console.error('Unhandled worker error:', err && err.stack ? err.stack : err);
      return json({ error: 'Server error: ' + (err && err.message ? err.message : String(err)) }, 500, origin);
    }
  },
};

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : 'https://moneyscripts.shop';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function json(obj, status, origin) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Fire-and-forget Discord notification. Never throws — a Discord outage or
// missing webhook should never break sign-in/checkout/etc.
async function notifyDiscord(env, content) {
  if (!env.DISCORD_WEBHOOK_URL) return;
  try {
    await fetch(env.DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
  } catch (err) {
    console.error('Discord notify failed:', err && err.message ? err.message : err);
  }
}

async function getSession(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const match = auth.match(/^Bearer (.+)$/);
  if (!match) return null;
  const raw = await env.MS_KV.get(`session:${match[1]}`);
  if (!raw) return null;
  return { token: match[1], ...JSON.parse(raw) };
}

// ---------- Google ID token verification ----------

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function base64UrlDecodeJson(str) {
  const bytes = base64UrlDecode(str);
  return JSON.parse(new TextDecoder().decode(bytes));
}

let cachedJwks = null;
let cachedJwksAt = 0;

async function getGoogleJwks() {
  const now = Date.now();
  if (cachedJwks && now - cachedJwksAt < 60 * 60 * 1000) return cachedJwks;
  const resp = await fetch('https://www.googleapis.com/oauth2/v3/certs');
  const data = await resp.json();
  cachedJwks = data.keys;
  cachedJwksAt = now;
  return cachedJwks;
}

async function verifyGoogleIdToken(idToken) {
  const parts = idToken.split('.');
  if (parts.length !== 3) throw new Error('Malformed token');
  const [headerB64, payloadB64, sigB64] = parts;

  const header = base64UrlDecodeJson(headerB64);
  const payload = base64UrlDecodeJson(payloadB64);
  const signature = base64UrlDecode(sigB64);

  const keys = await getGoogleJwks();
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('Unknown signing key');

  const cryptoKey = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signedData = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, signature, signedData);
  if (!valid) throw new Error('Invalid signature');

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) throw new Error('Token expired');
  if (payload.aud !== GOOGLE_CLIENT_ID) throw new Error('Wrong audience');
  if (payload.iss !== 'accounts.google.com' && payload.iss !== 'https://accounts.google.com') {
    throw new Error('Wrong issuer');
  }

  return payload; // contains sub, email, email_verified, name, picture
}

// ---------- Handlers ----------

async function handleGoogleAuth(request, env, origin) {
  if (GOOGLE_CLIENT_ID.indexOf('REPLACE_ME') !== -1) {
    return json({ error: 'Google sign-in not configured yet' }, 500, origin);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400, origin);
  }
  if (!body.id_token) return json({ error: 'Missing id_token' }, 400, origin);

  let claims;
  try {
    claims = await verifyGoogleIdToken(body.id_token);
  } catch (err) {
    return json({ error: 'Invalid Google token: ' + err.message }, 401, origin);
  }

  const emailLower = claims.email.toLowerCase();
  // Remember which Google "sub" this email last signed in with, so an admin
  // whitelist grant made while they're not actively signing in can still be
  // applied to their account right away (see handleWhitelistAdd).
  await env.MS_KV.put(`sub-by-email:${emailLower}`, claims.sub);

  if (ADMIN_EMAILS.has(claims.email)) {
    for (const p of Object.keys(PRODUCTS)) {
      await applyGrant(env, claims.sub, claims.email, p, null, 'admin');
    }
  } else {
    const wlRaw = await env.MS_KV.get(`wl:${emailLower}`);
    if (wlRaw) {
      let entry = null;
      try { entry = JSON.parse(wlRaw); } catch {}
      if (entry) await applyWhitelistEntryToSub(env, claims.sub, claims.email, entry);
    }
  }

  const token = randomToken();
  await env.MS_KV.put(
    `session:${token}`,
    JSON.stringify({ sub: claims.sub, email: claims.email, name: claims.name, picture: claims.picture }),
    { expirationTtl: SESSION_TTL_SECONDS }
  );

  const seenKey = `seenuser:${claims.sub}`;
  const seenBefore = await env.MS_KV.get(seenKey);
  if (!seenBefore) {
    await env.MS_KV.put(seenKey, '1');
    await notifyDiscord(env, `🆕 **New sign-in** — ${claims.email}`);
  } else {
    await notifyDiscord(env, `🔵 Sign-in — ${claims.email}`);
  }

  return json(
    { session: token, email: claims.email, name: claims.name, picture: claims.picture },
    200,
    origin
  );
}

async function handleSignOut(request, env, origin) {
  const session = await getSession(request, env);
  if (session) await env.MS_KV.delete(`session:${session.token}`);
  return json({ ok: true }, 200, origin);
}

async function handleMe(request, env, origin) {
  const session = await getSession(request, env);
  if (!session) return json({ error: 'Not signed in' }, 401, origin);
  const accessRaw = await env.MS_KV.get(`access:${session.sub}`);
  const access = accessRaw ? JSON.parse(accessRaw) : {};
  const now = Date.now();

  let products;
  if (access.grants) {
    products = Object.keys(access.grants).filter((p) => {
      const g = access.grants[p];
      return !g.expiresAt || g.expiresAt > now;
    });
  } else {
    // Back-compat with the old { products: [...] } shape (permanent grants).
    products = access.products || [];
  }

  return json({ email: session.email, name: session.name, picture: session.picture, products }, 200, origin);
}

async function handleNotifyBlocked(request, env, origin) {
  const session = await getSession(request, env);
  if (!session) return json({ error: 'Not signed in' }, 401, origin);

  let body = {};
  try { body = await request.json(); } catch {}
  const product = body.product || 'unknown';

  await notifyDiscord(env, `🔴 **Blocked access attempt** — ${session.email} tried **${product}** without purchasing`);
  return json({ ok: true }, 200, origin);
}

function checkAdminSecret(env, provided) {
  return !!env.ADMIN_SECRET && typeof provided === 'string' && provided === env.ADMIN_SECRET;
}

// Merge a candidate grant into an account's access record for one product,
// never downgrading an existing permanent grant to a temporary one and
// always keeping the longer expiry when both are temporary.
async function applyGrant(env, sub, email, product, expiresAt, source) {
  const key = `access:${sub}`;
  const raw = await env.MS_KV.get(key);
  const access = raw ? JSON.parse(raw) : {};
  if (!access.grants) access.grants = {};

  const existing = access.grants[product];
  const now = Date.now();
  const existingExpired = existing && existing.expiresAt && existing.expiresAt < now;
  const candidate = { source, expiresAt };

  if (!existing || existingExpired) {
    access.grants[product] = candidate;
  } else if (!existing.expiresAt) {
    // Existing grant is already permanent — don't downgrade it.
  } else if (!candidate.expiresAt || candidate.expiresAt > existing.expiresAt) {
    access.grants[product] = candidate;
  }

  if (email) access.email = email;
  access.updatedAt = Date.now();
  await env.MS_KV.put(key, JSON.stringify(access));
}

async function applyWhitelistEntryToSub(env, sub, email, entry) {
  if (entry.expiresAt && entry.expiresAt < Date.now()) return; // expired, nothing to apply
  const products = entry.product === 'all' ? Object.keys(PRODUCTS) : [entry.product];
  for (const p of products) {
    await applyGrant(env, sub, email, p, entry.expiresAt || null, 'whitelist');
  }
}

async function handleWhitelistList(request, env, origin) {
  const secret = new URL(request.url).searchParams.get('secret');
  if (!checkAdminSecret(env, secret)) return json({ error: 'Invalid admin secret' }, 401, origin);

  const entries = [];
  let cursor;
  do {
    const page = await env.MS_KV.list({ prefix: 'wl:', cursor });
    for (const k of page.keys) {
      const raw = await env.MS_KV.get(k.name);
      let entry = { product: 'all', expiresAt: null, addedAt: null };
      try { entry = { ...entry, ...JSON.parse(raw) }; } catch {}
      entries.push({ email: k.name.slice(3), product: entry.product, expiresAt: entry.expiresAt, addedAt: entry.addedAt });
    }
    cursor = page.cursor;
  } while (cursor);

  return json({ entries }, 200, origin);
}

async function handleWhitelistAdd(request, env, origin) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400, origin); }
  if (!checkAdminSecret(env, body.secret)) return json({ error: 'Invalid admin secret' }, 401, origin);

  const email = (body.email || '').trim().toLowerCase();
  if (!email || email.indexOf('@') === -1) return json({ error: 'Invalid email' }, 400, origin);

  const product = body.product;
  if (product !== 'all' && !PRODUCTS[product]) {
    return json({ error: `product must be one of: ${Object.keys(PRODUCTS).join(', ')}, all` }, 400, origin);
  }

  let days = null;
  if (body.days !== undefined && body.days !== null && body.days !== '') {
    days = Number(body.days);
    if (!Number.isFinite(days) || days <= 0) {
      return json({ error: 'days must be a positive number, or omit it for permanent access' }, 400, origin);
    }
  }
  const expiresAt = days ? Date.now() + days * 24 * 60 * 60 * 1000 : null;

  const entry = { product, expiresAt, addedAt: Date.now() };
  await env.MS_KV.put(`wl:${email}`, JSON.stringify(entry));

  // If this person already has an active account (signed in before), apply
  // the grant immediately instead of waiting for their next sign-in.
  const sub = await env.MS_KV.get(`sub-by-email:${email}`);
  if (sub) await applyWhitelistEntryToSub(env, sub, email, entry);

  const durationLabel = expiresAt ? `${days} day(s)` : 'permanent';
  await notifyDiscord(env, `⚪ **Whitelisted** — ${email} → **${product}** (${durationLabel})`);
  return json({ ok: true }, 200, origin);
}

async function handleWhitelistRemove(request, env, origin) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400, origin); }
  if (!checkAdminSecret(env, body.secret)) return json({ error: 'Invalid admin secret' }, 401, origin);
  const email = (body.email || '').trim().toLowerCase();
  if (!email) return json({ error: 'Invalid email' }, 400, origin);

  const raw = await env.MS_KV.get(`wl:${email}`);
  await env.MS_KV.delete(`wl:${email}`);

  // Revoke whatever access this whitelist entry granted (but never touch a
  // grant that came from an actual Stripe purchase).
  if (raw) {
    let entry = null;
    try { entry = JSON.parse(raw); } catch {}
    const sub = await env.MS_KV.get(`sub-by-email:${email}`);
    if (entry && sub) {
      const key = `access:${sub}`;
      const accessRaw = await env.MS_KV.get(key);
      if (accessRaw) {
        const access = JSON.parse(accessRaw);
        if (access.grants) {
          const products = entry.product === 'all' ? Object.keys(PRODUCTS) : [entry.product];
          for (const p of products) {
            if (access.grants[p] && access.grants[p].source === 'whitelist') {
              delete access.grants[p];
            }
          }
          await env.MS_KV.put(key, JSON.stringify(access));
        }
      }
    }
  }

  return json({ ok: true }, 200, origin);
}

async function handleCreateSession(request, env, origin) {
  if (!env.STRIPE_SECRET_KEY) {
    return json({ error: 'Server not configured' }, 500, origin);
  }

  const session = await getSession(request, env);
  if (!session) {
    return json({ error: 'Please sign in with Google first' }, 401, origin);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400, origin);
  }

  const product = PRODUCTS[body.product];
  if (!product) {
    return json({ error: 'Unknown product' }, 400, origin);
  }
  if (product.price === 'price_REPLACE_ME') {
    return json({ error: 'This product is not configured yet' }, 500, origin);
  }

  const params = new URLSearchParams();
  params.set('mode', product.mode);
  params.set('line_items[0][price]', product.price);
  params.set('line_items[0][quantity]', '1');
  params.set('billing_address_collection', 'auto');
  params.set('customer_email', session.email);
  params.set('client_reference_id', session.sub);
  params.set('metadata[product]', body.product);
  params.set('success_url', `${SITE_URL}/?checkout=success`);
  params.set('cancel_url', `${SITE_URL}/?checkout=cancelled`);
  if (product.mode === 'subscription') {
    params.set('subscription_data[metadata][product]', body.product);
    params.set('subscription_data[metadata][google_sub]', session.sub);
  }

  const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const data = await resp.json();
  if (!resp.ok) {
    return json({ error: data.error?.message || 'Stripe error' }, 500, origin);
  }

  return json({ url: data.url }, 200, origin);
}

async function handleWebhook(request, env) {
  const payload = await request.text();
  const sigHeader = request.headers.get('Stripe-Signature') || '';

  if (!env.STRIPE_WEBHOOK_SECRET) {
    return new Response('Webhook secret not configured', { status: 500 });
  }
  const valid = await verifyStripeSignature(payload, sigHeader, env.STRIPE_WEBHOOK_SECRET);
  if (!valid) {
    return new Response('Invalid signature', { status: 400 });
  }

  const event = JSON.parse(payload);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const sub = session.client_reference_id;
    const product = session.metadata && session.metadata.product;
    if (sub && product) {
      const email = session.customer_details?.email;
      // Grant the bundle's own key too (so the storefront can show the
      // bundle card itself as owned), alongside everything it unlocks.
      const grantedProducts = PRODUCT_BUNDLES[product] ? [...PRODUCT_BUNDLES[product], product] : [product];
      for (const p of grantedProducts) {
        await applyGrant(env, sub, email, p, null, 'stripe');
      }

      const amount = typeof session.amount_total === 'number' ? (session.amount_total / 100).toFixed(2) : '?';
      const currency = (session.currency || 'usd').toUpperCase();
      await notifyDiscord(env, `🟢 **Purchase** — ${email || 'unknown'} bought **${product}** (${amount} ${currency})`);
    }
  }

  console.log('Verified Stripe event:', event.type);
  return new Response('ok', { status: 200 });
}

async function verifyStripeSignature(payload, sigHeader, secret) {
  const parts = Object.fromEntries(
    sigHeader.split(',').map((p) => {
      const [k, v] = p.split('=');
      return [k, v];
    })
  );
  const timestamp = parts.t;
  const expectedSig = parts.v1;
  if (!timestamp || !expectedSig) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
  const computedSig = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return computedSig === expectedSig;
}
