import fs from 'fs';
import path from 'path';

const pois = JSON.parse(fs.readFileSync('src/data/seedPois.json', 'utf8'));

for (const p of pois) {
  const dir = path.join('public', 'places', p.id);
  if (!fs.existsSync(dir)) {
    p.images = [`/places/${p.id}/1.jpg`, `/places/${p.id}/2.jpg`, `/places/${p.id}/3.jpg`];
    continue;
  }
  const files = fs
    .readdirSync(dir)
    .filter((f) => /^[0-9]+\.jpe?g$/i.test(f))
    .filter((f) => fs.statSync(path.join(dir, f)).size > 20000)
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  p.images = files.length
    ? files.map((f) => `/places/${p.id}/${f}`)
    : [`/places/${p.id}/1.jpg`, `/places/${p.id}/2.jpg`, `/places/${p.id}/3.jpg`];
}

fs.writeFileSync('src/data/seedPois.json', JSON.stringify(pois, null, 2) + '\n');
console.log(
  'synced',
  pois.length,
  'avg images',
  (pois.reduce((s, p) => s + p.images.length, 0) / pois.length).toFixed(1)
);
console.log('ouzoud', pois.find((p) => p.id === 'poi-ouzoud-falls').images);
console.log('imi', pois.find((p) => p.id === 'poi-imi-n-ifri').images);
