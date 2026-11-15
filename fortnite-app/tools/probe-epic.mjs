// Prueba de endpoints públicos de Epic: ¿traen videos y fondos de la tienda?
import { writeFileSync, mkdirSync } from 'node:fs';
const B = 'https://fortnitecontent-website-prod07.ol.epicgames.com/content/api/pages/fortnite-game/';
const pages = ['shopoffervisuals', 'shop-sections', 'mp-item-shop', 'item-shop', 'shop-offer-visuals'];
const out = { at: new Date().toISOString(), pages: {} };
const urls = (o, acc = new Set()) => { const s = JSON.stringify(o) || ''; for (const m of s.matchAll(/https?:\/\/[^"\\\s]+/g)) acc.add(m[0]); return [...acc]; };
for (const p of pages) {
  try {
    const r = await fetch(B + p, { headers: { 'user-agent': 'Mozilla/5.0' } });
    const t = await r.text();
    const r0 = { status: r.status, bytes: t.length };
    if (r.ok) {
      let j; try { j = JSON.parse(t); } catch { j = null; }
      const u = urls(j || t);
      r0.urlCount = u.length;
      r0.video = u.filter((x) => /\.(mp4|webm|m3u8)|video|cosmo/i.test(x)).slice(0, 30);
      r0.bg = u.filter((x) => /background|backdrop|bg|section/i.test(x)).slice(0, 30);
      r0.sampleUrls = u.slice(0, 15);
      r0.topKeys = j && typeof j === 'object' ? Object.keys(j).slice(0, 30) : [];
      r0.sample = t.slice(0, 1800);
      writeFileSync(new URL('../data/epic-' + p + '.json', import.meta.url), t);
    }
    out.pages[p] = r0;
  } catch (e) { out.pages[p] = { error: String(e) }; }
}
mkdirSync(new URL('../data/', import.meta.url), { recursive: true });
writeFileSync(new URL('../data/epic-probe.json', import.meta.url), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, (k, v) => (k === 'sample' ? undefined : v), 1));
