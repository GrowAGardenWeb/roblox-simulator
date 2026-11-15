import { readFileSync } from 'node:fs';
const shop = JSON.parse(readFileSync(new URL('../data/shop.json', import.meta.url)));
const ids = shop.entries.flatMap((e) => e.items.map((i) => ({ id: i.id, name: i.name, type: i.type }))).filter((x) => x.id).slice(0, 400);
const pick = [ids.find((x) => x.type === 'outfit'), ids.find((x) => x.type === 'pickaxe'), ids.find((x) => x.type === 'emote')].filter(Boolean);
const VID = /video|cosmo|\.webm|\.mp4|youtube|showcase/i;
const walk = (o, f, p = '') => { if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) walk(v, f, p ? p + '.' + k : k); else f(String(o), p); };
const hit = async (url, label) => {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; probe)' } });
    const t = await r.text();
    console.log(`[${label}] ${r.status} ${t.length}b ${url}`);
    return { r, t };
  } catch (e) { console.log(`[${label}] ERR ${e.message}`); return null; }
};
for (const it of pick) {
  const x = await hit(`https://fortnite-api.com/v2/cosmetics/br/${it.id}`, 'cosmetic ' + it.type);
  if (x && x.r.ok) {
    const d = JSON.parse(x.t).data; console.log('  keys:', Object.keys(d).join(','));
    walk(d, (v, p) => { if (VID.test(p) || VID.test(v)) console.log('  *', p, '=', v.slice(0, 160)); });
  }
}
const pages = ['https://fnbr.co/shop', 'https://fortnite.gg/shop', 'https://www.fortnite.com/item-shop', 'https://fortniteapi.io/v2/shop?lang=en', 'https://api.fortniteapi.io/v2/shop?lang=en'];
for (const u of pages) {
  const x = await hit(u, 'page');
  if (x) { const m = [...x.t.matchAll(/https?:\/\/[^\s"'\\<>]*(?:cosmo|\.webm|\.mp4)[^\s"'\\<>]*/gi)].map((m) => m[0]); console.log('  video links:', m.length, m.slice(0, 3).join(' | '), '| title:', (x.t.match(/<title>([^<]*)/) || [])[1]); }
}
