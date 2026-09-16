import fs from 'fs';

const pois = JSON.parse(fs.readFileSync('src/data/seedPois.json', 'utf8'));

const lines = [
  '# POIs — liens Google Maps',
  '',
  'Pour chaque lieu : ouvrir le lien → Photos → enregistrer dans `public/places/{id}/1.jpg`, `2.jpg`, …',
  '',
  'Puis : `node scripts/sync-poi-image-paths.mjs` et Admin → réimporter.',
  '',
  '| # | ID | Nom | Google Maps |',
  '|---|----|-----|-------------|',
];

for (let i = 0; i < pois.length; i++) {
  const p = pois[i];
  const pin = `https://www.google.com/maps/search/?api=1&query=${p.lat}%2C${p.lng}`;
  const named = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${p.name} Beni Mellal Khenifra Morocco`
  )}`;
  lines.push(
    `| ${i + 1} | \`${p.id}\` | ${p.name} | [coords](${pin}) · [search](${named}) |`
  );
}

fs.writeFileSync('public/places/POI-GOOGLE-MAPS.md', lines.join('\n') + '\n');

console.log(`# ${pois.length} places — Google Maps\n`);
pois.forEach((p, i) => {
  const pin = `https://www.google.com/maps/search/?api=1&query=${p.lat}%2C${p.lng}`;
  console.log(`${i + 1}. ${p.name}`);
  console.log(`   dossier: public/places/${p.id}/`);
  console.log(`   ${pin}\n`);
});
