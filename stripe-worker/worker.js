// MoneyScripts — Stripe Checkout backend (Cloudflare Worker)
//
// Holds the Stripe secret key as a Worker secret (set via `wrangler secret put`,
// never committed to the repo) and creates Checkout Sessions on behalf of the
// static site at moneyscripts.shop, which cannot safely hold a secret key itself.
//
// Routes:
//   POST /create-checkout-session   { product: "mobile" | "headless" } -> { client_secret }
//   POST /webhook                   Stripe webhook receiver (signature-verified)

const STRIPE_API_VERSION = '2026-03-25.dahlia; custom_checkout_payment_form_preview=v1';

// Fill in headless.price once the Headless Gifter product/price exists in Stripe.
const PRODUCTS = {
  mobile: { price: 'price_1UOVQQFva0TXUXnXNyHGeQDm', mode: 'subscription' },
  headless: { price: 'price_REPLACE_ME', mode: 'payment' },
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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(obj, status, origin) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

async function handleCreateSession(request, env, origin) {
  if (!env.STRIPE_SECRET_KEY) {
    return json({ error: 'Server not configured' }, 500, origin);
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
  params.set('ui_mode', 'form');
  params.set('line_items[0][price]', product.price);
  params.set('line_items[0][quantity]', '1');
  params.set('billing_address_collection', 'auto');
  params.set('submit_type', 'auto');
  if (product.mode === 'subscription') {
    params.set('payment_method_collection', 'always');
  }

  const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': STRIPE_API_VERSION,
    },
    body: params.toString(),
  });

  const data = await resp.json();
  if (!resp.ok) {
    return json({ error: data.error?.message || 'Stripe error' }, 500, origin);
  }

  return json({ client_secret: data.client_secret }, 200, origin);
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
  // TODO: wire real fulfillment here (e.g. notify Discord, grant access) once
  // there's a place to persist which customer bought what. For now this only
  // verifies and acknowledges the event.
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
