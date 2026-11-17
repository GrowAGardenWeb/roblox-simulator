// Diagnóstico: ¿en qué formato/códec están los videos de Epic y existe una variante WebM?
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const B = 'https://cosmo.fdeb.live.use1a.on.epicgames.com/v1/item/';
const H = ['L2CBTj5GHBSFsZc6pSWMq29DqKBaTPDpmatcfnhPjEc', 'cq8A1Q_JRQEVxwwTJMIVlFsfJ4RB0jz9AYL4e858E4Y'];
const sfx = ['mp4-sm', 'mp4-md', 'mp4-lg', 'mp4', 'webm-sm', 'webm-md', 'webm', 'webm-lg', 'vp9-sm', 'alpha-sm', 'hevc-sm', 'png', 'gif'];
mkdirSync('/tmp/pv', { recursive: true });
const out = [];
for (const h of H) for (const s of sfx) {
  const u = B + h + '/' + s;
  try {
    const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0' } });
    const buf = Buffer.from(await r.arrayBuffer());
    const row = { u: s + ' ' + h.slice(0, 6), status: r.status, type: r.headers.get('content-type'), bytes: buf.length };
    if (r.ok && /video|octet/.test(row.type || '') && buf.length > 1000) {
      const f = '/tmp/pv/' + h.slice(0, 6) + '_' + s + '.bin'; writeFileSync(f, buf);
      try { row.probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-print_format', 'json', f], { encoding: 'utf8' })); row.probe = { streams: row.probe.streams.map((x) => ({ codec: x.codec_name, w: x.width, h: x.height, pix: x.pix_fmt, tags: x.tags, side: x.side_data_list })), format: row.probe.format.format_name }; } catch (e) { row.probeErr = String(e.message).slice(0, 200); }
    }
    out.push(row);
  } catch (e) { out.push({ u: s, error: String(e.message || e) }); }
}
writeFileSync(new URL('../data/probe-video.json', import.meta.url), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
