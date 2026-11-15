// Descarga las texturas de fondo de cada sección (billboard BG) a fortnite-app/data/tex/ y las enlaza en shop.json
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
const SHOP = new URL('../data/shop.json', import.meta.url).pathname;
const DIR = new URL('../data/tex/', import.meta.url).pathname;
mkdirSync(DIR, { recursive: true });
const shop = JSON.parse(readFileSync(SHOP, 'utf8'));
const slug = (s) => String(s || 'x').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const pick = (urls) => urls.find((u) => /unrealengine\.com\/.*billboard.*_bg[-_.]/i.test(u) && !/section/i.test(u)) || null;
const out = {};
for (const sec of shop.sections || []) {
  const urls = (shop.entries || []).filter((e) => e.sectionId === sec.id).flatMap((e) => e.images || []);
  const u = pick(urls); if (!u) continue;
  const file = slug(sec.id) + '.png', path = DIR + file;
  try {
    if (!existsSync(path)) { const r = await fetch(u); if (!r.ok) throw new Error('HTTP ' + r.status); writeFileSync(path, Buffer.from(await r.arrayBuffer())); }
    try { execSync(`convert "${path}" -resize 900x -quality 82 "${DIR}${slug(sec.id)}.webp"`, { stdio: 'ignore' }); out[sec.id] = { src: u, file: 'data/tex/' + slug(sec.id) + '.webp' }; }
    catch { out[sec.id] = { src: u, file: 'data/tex/' + file }; }
  } catch (e) { console.log('tex fail', sec.id, e.message); }
}
shop.textures = out;
writeFileSync(SHOP, JSON.stringify(shop, null, 1));
console.log('textures', Object.keys(out).length, JSON.stringify(out));
