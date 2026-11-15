// Daily Fortnite item shop snapshot -> fortnite-app/data/shop.json
// Source 1: fortnite-api.com /v2/shop (public). Source 2: fortnite.com/item-shop page (extra videos/media).
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const OUT = new URL('../data/shop.json', import.meta.url).pathname;
const RAW = new URL('../data/raw-sample.json', import.meta.url).pathname;
const UA = 'Mozilla/5.0 (compatible; shop-snapshot/1.0)';
const VIDEO_RE = /^https?:\/\/[^\s"']+(\.webm|\.mp4|\.m3u8)(\?[^\s"']*)?$|cosmo\.[^\s"']*\/mp4/i;
const IMG_RE = /^https?:\/\/[^\s"']+\.(png|jpe?g|webp)(\?[^\s"']*)?$/i;

const get = async (url, type = 'json') => {
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: type === 'json' ? 'application/json' : 'text/html' } });
  if (!r.ok) throw new Error(`${url} -> HTTP ${r.status}`);
  return type === 'json' ? r.json() : r.text();
};
const walk = (o, f, path = '') => {
  if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) walk(v, f, path ? `${path}.${k}` : k);
  else if (typeof o === 'string') f(o, path);
};
const uniq = (a) => [...new Set(a.filter(Boolean))];

async function fromApi() {
  const j = await get('https://fortnite-api.com/v2/shop?language=en');
  const d = j.data;
  writeFileSync(RAW, JSON.stringify({ keys: Object.keys(d), sample: d.entries?.slice(0, 3) }, null, 1));
  return (d.entries || []).map((e, i) => {
    const videos = [], images = [];
    walk(e, (s, p) => { if (VIDEO_RE.test(s)) videos.push(s); else if (IMG_RE.test(s)) images.push(s); });
    const items = (e.brItems || []).map((b) => ({
      id: b.id, name: b.name, type: b.type?.value, rarity: b.rarity?.value,
      icon: b.images?.icon || b.images?.smallIcon || null, featured: b.images?.featured || null,
    }));
    const mi = e.newDisplayAsset?.materialInstances?.[0];
    const pick = (...c) => c.find(Boolean) || null;
    return {
      order: i,
      offerId: e.offerId,
      name: e.bundle?.name || items[0]?.name || e.devName || '',
      info: e.bundle?.info || null,
      isBundle: !!e.bundle,
      section: e.layout?.name || null,
      sectionId: e.layout?.id || null,
      sectionIndex: e.layout?.index ?? null,
      tileSize: e.tileSize || null,
      regularPrice: e.regularPrice ?? null,
      finalPrice: e.finalPrice ?? null,
      giftable: e.giftable ?? null,
      inDate: e.inDate || null,
      outDate: e.outDate || null,
      colors: e.colors || null,
      image: pick(e.bundle?.image, mi?.images?.OfferImage, mi?.images?.Background, e.newDisplayAsset?.renderImages?.[0]?.image, items[0]?.featured, items[0]?.icon),
      items,
      videos: uniq(videos),
      images: uniq(images),
    };
  });
}

async function fromSite() {
  const out = { ok: false, videos: [], images: [], offers: [] };
  try {
    const html = await get('https://www.fortnite.com/item-shop?lang=en-US', 'text');
    out.ok = true; out.bytes = html.length;
    out.videos = uniq([...html.matchAll(/https?:\/\/[^\s"'\\<>]+?\.(?:webm|mp4)(?:\?[^\s"'\\<>]*)?/gi)].map((m) => m[0].replace(/\\u002F/g, '/')));
    out.images = uniq([...html.matchAll(/https?:\/\/[^\s"'\\<>]+?\.(?:png|webp|jpe?g)(?:\?[^\s"'\\<>]*)?/gi)].map((m) => m[0])).slice(0, 400);
    const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (m) {
      const data = JSON.parse(m[1]);
      const found = [];
      const rec = (o) => {
        if (Array.isArray(o)) return o.forEach(rec);
        if (o && typeof o === 'object') {
          let v = null, n = o.title || o.name || o.devName || null, p = o.price ?? o.finalPrice ?? null;
          walk(o, (s) => { if (!v && VIDEO_RE.test(s)) v = s; });
          if (v && n) found.push({ name: n, price: p, video: v });
          else Object.values(o).forEach(rec);
        }
      };
      rec(data);
      out.offers = found;
      out.nextDataKeys = Object.keys(data.props?.pageProps || {});
    }
  } catch (e) { out.error = String(e.message || e); }
  return out;
}

const log = (...a) => console.log('[shop]', ...a);
let entries = [], apiError = null;
try { entries = await fromApi(); } catch (e) { apiError = String(e.message || e); }
const site = await fromSite();

const snapshot = {
  updated: new Date().toISOString(),
  source: { api: apiError ? `error: ${apiError}` : 'fortnite-api.com/v2/shop', site: site.ok ? 'fortnite.com/item-shop' : `error: ${site.error}` },
  counts: { entries: entries.length, withVideo: entries.filter((e) => e.videos.length).length, siteVideos: site.videos.length, siteOffers: site.offers.length },
  entries,
  site: { videos: site.videos, offers: site.offers, nextDataKeys: site.nextDataKeys || null },
};
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(snapshot, null, 1));
log(JSON.stringify(snapshot.source), JSON.stringify(snapshot.counts));
if (!entries.length && !site.videos.length) { console.error('Nothing fetched'); process.exit(1); }
