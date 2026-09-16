import fs from 'fs';

const path = new URL('../src/data/seedPois.json', import.meta.url);
const pois = JSON.parse(fs.readFileSync(path, 'utf8'));

for (const p of pois) {
  const id = p.id;
  p.images = [
    `/places/${id}/1.jpg`,
    `/places/${id}/2.jpg`,
    `/places/${id}/3.jpg`,
  ];
}

fs.writeFileSync(path, JSON.stringify(pois, null, 2) + '\n');
console.log('updated', pois.length, 'POIs → local /places/{id}/1..3.jpg');
