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
//
// Requires a KV namespace bound as MS_KV (Settings -> Bindings -> KV Namespace).

const SITE_URL = 'https://moneyscripts.shop';

// TODO: replace with the real Google OAuth Client ID (safe to expose — it's
// public, not a secret) once it's created in Google Cloud Console.
const GOOGLE_CLIENT_ID = '308338292645-4u30h18t29b9nacbdusd43fivcl2bf47.apps.googleusercontent.com';

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

// Fill in headless.price once the Headless Gifter product/price exists in Stripe.
const PRODUCTS = {
  mobile: { price: 'price_1UOVQQFva0TXUXnXNyHGeQDm', mode: 'subscription' },
  headless: { price: 'price_1UOVSIFva0TXUXnXTPQT9iq6', mode: 'payment' },
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

    if (url.pathname === '/auth/google' && request.method === 'POST') {
      return handleGoogleAuth(request, env, origin);
    }
    if (url.pathname === '/auth/signout' && request.method === 'POST') {
      return handleSignOut(request, env, origin);
    }
    if (url.pathname === '/me' && request.method === 'GET') {
      return handleMe(request, env, origin);
    }
    if (url.pathname === '/create-checkout-session' && request.method === 'POST') {
      return handleCreateSession(request, env, origin);
    }
    if (url.pathname === '/webhook' && request.method === 'POST') {
      return handleWebhook(request, env);
    }

    return new Response('Not found', { status: 404 });
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

  const token = randomToken();
  await env.MS_KV.put(
    `session:${token}`,
    JSON.stringify({ sub: claims.sub, email: claims.email, name: claims.name, picture: claims.picture }),
    { expirationTtl: SESSION_TTL_SECONDS }
  );

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
  const access = accessRaw ? JSON.parse(accessRaw) : { products: [] };
  return json({ email: session.email, name: session.name, picture: session.picture, products: access.products }, 200, origin);
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
      const key = `access:${sub}`;
      const existingRaw = await env.MS_KV.get(key);
      const existing = existingRaw ? JSON.parse(existingRaw) : { products: [] };
      if (existing.products.indexOf(product) === -1) existing.products.push(product);
      existing.email = session.customer_details?.email || existing.email;
      existing.updatedAt = Date.now();
      await env.MS_KV.put(key, JSON.stringify(existing));
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
