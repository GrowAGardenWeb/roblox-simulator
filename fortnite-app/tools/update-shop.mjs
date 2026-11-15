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
  const raws = [];
  const take = (pred) => { const e = (d.entries || []).find((x) => pred(x) && !raws.includes(x)); if (e) raws.push(e); };
  take((e) => e.bundle); take((e) => e.tracks?.length); take((e) => e.newDisplayAsset?.materialInstances?.length);
  take((e) => e.brItems?.length && !e.bundle); take((e) => e.layout?.background); take((e) => e.tileSize && e.tileSize !== 'Size_1_x_1');
  mkdirSync(dirname(RAW), { recursive: true });
  writeFileSync(RAW, JSON.stringify({ keys: Object.keys(d), sample: raws }, null, 1));
  const pick = (...c) => c.find(Boolean) || null;
  return (d.entries || []).map((e, i) => {
    const videos = [], images = [];
    walk(e, (s) => { if (VIDEO_RE.test(s)) videos.push(s); else if (IMG_RE.test(s)) images.push(s); });
    const items = (e.brItems || []).map((b) => ({
      id: b.id, name: b.name, type: b.type?.value, rarity: b.rarity?.value, series: b.series?.value || null,
      icon: b.images?.icon || b.images?.smallIcon || null, featured: b.images?.featured || null,
    }));
    const tracks = (e.tracks || []).map((t) => ({ id: t.id, title: t.title, artist: t.artist, album: t.album, year: t.releaseYear, bpm: t.bpm, duration: t.duration, art: t.albumArt || null }));
    const disp = (e.newDisplayAsset?.materialInstances || []).map((m) => ({ id: m.id, images: m.images || {}, colors: m.colors || {}, scalings: m.scalings || {}, flags: m.flags || {} }));
    const mi = disp[0];
    const l = e.layout || {};
    const jam = tracks.length > 0;
    return {
      order: i, offerId: e.offerId, devName: e.devName,
      name: pick(e.bundle?.name, items[0]?.name, tracks[0] && `${tracks[0].title}`, e.devName) || '',
      info: e.bundle?.info || (jam ? tracks[0].artist : null),
      kind: e.bundle ? 'bundle' : jam ? 'jam' : 'item',
      banner: e.banner?.value || null,
      isBundle: !!e.bundle,
      section: l.name || null, sectionId: l.id || null, sectionIndex: l.index ?? null, sectionRank: l.rank ?? null,
      tileSize: e.tileSize || null, sortPriority: e.sortPriority ?? null,
      regularPrice: e.regularPrice ?? null, finalPrice: e.finalPrice ?? null,
      giftable: e.giftable ?? null, inDate: e.inDate || null, outDate: e.outDate || null,
      colors: e.colors || null,
      image: pick(e.bundle?.image, mi?.images?.OfferImage, mi?.images?.Background, e.newDisplayAsset?.renderImages?.[0]?.image, tracks[0]?.art, items[0]?.featured, items[0]?.icon),
      display: disp, tracks, items, videos: uniq(videos), images: uniq(images),
      _layout: l,
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
// Nombres en español (la tienda real del usuario está en español): sirven para ligar videos por nombre
try {
  const es = (await get('https://fortnite-api.com/v2/shop?language=es')).data?.entries || [];
  const m = new Map(es.map((x) => [x.offerId, x]));
  for (const e of entries) {
    const x = m.get(e.offerId); if (!x) continue;
    e.nameEs = x.bundle?.name || x.brItems?.[0]?.name || (x.tracks?.[0] && x.tracks[0].title) || null;
    const byId = new Map((x.brItems || []).map((b) => [b.id, b.name]));
    for (const it of e.items) it.nameEs = byId.get(it.id) || null;
  }
} catch (e) { /* opcional */ }
const site = await fromSite();

const bad = (e) => !e.image || /placeholder|^\[VIRTUAL\]|\bTBD\b/i.test(`${e.name} ${e.devName}`);
const shown = entries.filter((e) => !bad(e));
const secMap = new Map();
for (const e of shown) { const k = e.sectionId || e.section || 'none'; if (!secMap.has(k)) secMap.set(k, { id: e.sectionId, name: e.section, index: e.sectionIndex, rank: e.sectionRank, layout: e._layout, count: 0 }); secMap.get(k).count++; }
for (const e of entries) delete e._layout;
const sections = [...secMap.values()].sort((a, b) => (a.index ?? 999) - (b.index ?? 999));
// Fondos reales de cada sección: página pública de Epic (mp-item-shop)
const backgrounds = {}; let bgError = null;
try {
  const r = await fetch('https://fortnitecontent-website-prod07.ol.epicgames.com/content/api/pages/fortnite-game/mp-item-shop', { headers: { 'user-agent': 'Mozilla/5.0' } });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const secs = (await r.json())?.shopData?.sections || [];
  const byId = new Map(secs.map((x) => [x.sectionID, x])), byName = new Map();
  for (const x of secs) { const k = String(x.displayName || '').trim().toLowerCase(); if (!byName.has(k)) byName.set(k, x); }
  for (const sec of sections) {
    const x = byId.get(sec.id) || byName.get(String(sec.name || '').trim().toLowerCase());
    const tex = x?.metadata?.background?.customTexture;
    if (tex && sec.name) { backgrounds[sec.name.trim().toUpperCase()] = tex; sec.background = tex; }
  }
} catch (e) { bgError = String(e.message || e); }
// secciones con fondo de mapa (billboard BG): sus casillas llevan la textura de pergamino
const textures = {};
for (const sec of sections) {
  const u = entries.filter((e) => e.sectionId === sec.id).flatMap((e) => e.images || []).find((x) => /unrealengine\.com\/.*billboard.*_bg[-_.]/i.test(x) && !/section/i.test(x));
  if (u) textures[sec.id] = u;
}
const snapshot = {
  updated: new Date().toISOString(),
  source: { api: apiError ? `error: ${apiError}` : 'fortnite-api.com/v2/shop', site: site.ok ? 'fortnite.com/item-shop' : `error: ${site.error}` },
  counts: { entries: entries.length, shown: shown.length, sections: sections.length, jam: shown.filter((e) => e.kind === 'jam').length, bundles: shown.filter((e) => e.kind === 'bundle').length, backgrounds: Object.keys(backgrounds).length, bgError, withVideo: entries.filter((e) => e.videos.length).length, siteVideos: site.videos.length, siteOffers: site.offers.length },
  backgrounds,
  textures,
  sections,
  entries,
  site: { videos: site.videos, offers: site.offers, nextDataKeys: site.nextDataKeys || null },
};
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(snapshot, null, 1));
log(JSON.stringify(snapshot.source), JSON.stringify(snapshot.counts));
if (!entries.length && !site.videos.length) { console.error('Nothing fetched'); process.exit(1); }
