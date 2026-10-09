# MoneyScripts Stripe backend

Cloudflare Worker that creates Stripe Checkout Sessions for the static site at
moneyscripts.shop. The secret key never leaves this worker — the site only
ever talks to this worker, never to Stripe directly.

## Deploy

From this folder, on a machine with Node installed:

```
npm install -g wrangler
wrangler login
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET   # add after creating the webhook endpoint below
wrangler deploy
```

`wrangler deploy` prints a URL like `https://moneyscripts-stripe.<your-subdomain>.workers.dev`.
Send that URL back so it can be wired into the site's checkout modal.

## Stripe dashboard setup still needed

1. **Headless Gifter price**: create that product/price in Stripe (one-time,
   $20), then replace `price_REPLACE_ME` in `worker.js` with the real
   `price_...` id and redeploy.
2. **Webhook endpoint**: Dashboard → Developers → Webhooks → Add endpoint →
   URL = `https://<your-worker-url>/webhook`, events: `checkout.session.completed`,
   `invoice.paid`, `invoice.payment_failed`. Copy the signing secret
   (`whsec_...`) into `STRIPE_WEBHOOK_SECRET` above.
3. Rotate the secret key you pasted in chat earlier before going live —
   generate a fresh one in the dashboard and use that here instead.

## Fulfillment

The webhook handler currently only verifies the signature and logs the event.
There's no database yet to connect a Stripe customer back to a Discord
account or similar, so real fulfillment (granting access) is a TODO for
whenever that flow exists.
