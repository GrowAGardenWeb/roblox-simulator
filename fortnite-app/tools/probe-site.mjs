// Prueba simple (GET normal, sin trucos): ¿qué responde fortnite.com a una petición del servidor?
import { writeFileSync } from 'node:fs';
const urls = [
  'https://www.fortnite.com/robots.txt',
  'https://www.fortnite.com/sitemap.xml',
  'https://www.fortnite.com/item-shop',
  'https://www.fortnite.com/item-shop?lang=en-US',
  'https://cosmo.fdeb.live.use1a.on.epicgames.com/v1/item/L2CBTj5GHBSFsZc6pSWMq29DqKBaTPDpmatcfnhPjEc/mp4-sm',
];
const out = [];
for (const u of urls) {
  try {
    const r = await fetch(u, { redirect: 'follow' });
    const t = await r.text().catch(() => '');
    out.push({ u, status: r.status, type: r.headers.get('content-type'), server: r.headers.get('server'), len: t.length, mp4: (t.match(/https?:[^"'\\\s]+\.mp4[^"'\\\s]*|cosmo\.[^"'\\\s]+\/mp4[^"'\\\s]*/g) || []).slice(0, 5), challenge: /Just a moment|cf-chl|challenge-platform/i.test(t), head: t.slice(0, 160).replace(/\s+/g, ' ') });
  } catch (e) { out.push({ u, error: String(e.message || e) }); }
}
writeFileSync(new URL('../data/probe-site.json', import.meta.url), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
