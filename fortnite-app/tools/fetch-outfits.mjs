// Lista de todos los personajes (outfits) con su icono -> fortnite-app/data/outfits.json (para el selector de foto de perfil)
import { writeFileSync, mkdirSync } from 'node:fs';
const OUT = new URL('../data/outfits.json', import.meta.url).pathname;
const r = await fetch('https://fortnite-api.com/v2/cosmetics/br?language=en');
if (!r.ok) throw new Error('HTTP ' + r.status);
const items = (await r.json()).data || [];
// nombres en español (los videos de la tienda están guardados con el nombre en español)
const es = new Map();
try { const re = await fetch('https://fortnite-api.com/v2/cosmetics/br?language=es'); if (re.ok) for (const it of (await re.json()).data || []) es.set(it.id, it.name); } catch (e) { /* opcional */ }
const list = [];
for (const it of items) {
  if ((it.type && it.type.value) !== 'outfit') continue;
  const icon = it.images && (it.images.smallIcon || it.images.icon); if (!icon || !it.name) continue;
  list.push({ id: it.id, name: it.name, nameEs: es.get(it.id) || null, icon, full: (it.images && it.images.featured) || null, series: (it.series && it.series.value) || null, rarity: (it.rarity && it.rarity.value) || null, added: (it.introduction && it.introduction.chapter) || null });
}
list.sort((a, b) => a.name.localeCompare(b.name));
mkdirSync(new URL('../data/', import.meta.url).pathname, { recursive: true });
writeFileSync(OUT, JSON.stringify(list));
console.log('outfits', list.length, 'con cuerpo completo', list.filter((x) => x.full).length);
