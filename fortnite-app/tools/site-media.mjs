// Opens fortnite.com/item-shop in a normal headless browser and records the direct video links
// (cosmo.*.epicgames.com/.../item/<id>/...) and the offer cards it shows. Output: data/site.json
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
const OUT = new URL('../data/site.json', import.meta.url).pathname;
const VIDEO = /\.(webm|mp4|m3u8)(\?|$)|cosmo\.[^/]*epicgames\.com\/v1\/item\//i;
const res = { at: new Date().toISOString(), status: null, title: null, videoRequests: [], jsonHits: [], cards: [], note: '' };
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-US' });
const page = await ctx.newPage();
const seen = new Set();
page.on('response', async (r) => {
  const u = r.url(), ct = r.headers()['content-type'] || '';
  if (VIDEO.test(u) && !seen.has(u)) { seen.add(u); res.videoRequests.push({ url: u, status: r.status(), type: ct }); }
  if (ct.includes('json') && /epicgames|fortnite/i.test(u) && res.jsonHits.length < 25) {
    try { const t = await r.text(); res.jsonHits.push({ url: u, status: r.status(), bytes: t.length, hasVideo: VIDEO.test(t), sample: t.slice(0, 200) }); } catch {}
  }
});
try {
  const r = await page.goto('https://www.fortnite.com/item-shop?lang=en-US', { waitUntil: 'domcontentloaded', timeout: 45000 });
  res.status = r ? r.status() : null;
  await page.waitForTimeout(6000);
  res.title = await page.title();
  for (let i = 0; i < 12; i++) { await page.mouse.wheel(0, 1400); await page.waitForTimeout(700); }
  res.cards = await page.evaluate(() => [...document.querySelectorAll('[class*="card" i],[class*="offer" i],article,li')]
    .map((el) => ({ text: (el.innerText || '').trim().slice(0, 80).replace(/\n+/g, ' | '), video: el.querySelector('video')?.currentSrc || el.querySelector('video source')?.src || null }))
    .filter((c) => c.video).slice(0, 400));
  const html = await page.content();
  res.htmlBytes = html.length;
  res.htmlVideoLinks = [...new Set([...html.matchAll(/https?:\/\/[^\s"'\\<>]+?(?:\.webm|\.mp4|cosmo\.[^\s"'\\<>]*\/item\/[^\s"'\\<>]+)/gi)].map((m) => m[0]))].slice(0, 400);
} catch (e) { res.note = String(e.message || e); }
await browser.close();
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(res, null, 1));
console.log('[site]', JSON.stringify({ status: res.status, title: res.title, video: res.videoRequests.length, cards: res.cards.length, html: res.htmlVideoLinks?.length, json: res.jsonHits.length, note: res.note }));
