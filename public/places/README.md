# Photos des lieux

Déposez vos images ici. Le carrousel de la landing et la galerie des pages détail les lisent automatiquement.

## Dossier

```
public/places/
  poi-ouzoud-falls/
    1.jpg
    2.jpg
    3.jpg
  poi-bin-el-ouidane/
    1.jpg
    2.jpg
    3.jpg
  poi-ain-asserdoun/
    1.jpg
    2.jpg
    3.jpg
  …
```

## Règles

1. Un dossier par lieu : `public/places/{poiId}/`
2. Nommez les fichiers `1.jpg`, `2.jpg`, `3.jpg`… (JPG / PNG / WebP OK)
3. Idéal : 2–4 photos, paysage, ~1600–2400 px de large
4. Les chemins sont déjà dans `src/data/seedPois.json` (`images: ["/places/…"]`)

Exemples d’IDs : `poi-ouzoud-falls`, `poi-bin-el-ouidane`, `poi-ain-asserdoun`.

## Sources autorisées

Ne scrapez pas Google Maps / TripAdvisor / Airbnb / Booking.

OK :

- Fichiers que vous avez le droit d’utiliser (photos perso / autorisées)
- Wikimedia Commons (licences libres)
- Google Places API (New) avec attribution — script optionnel ci-dessous

## Script optionnel (clé Maps)

Dans `.env` :

```
GOOGLE_MAPS_API_KEY=...
```

```bash
node scripts/fetch-google-place-photos.mjs
node scripts/sync-poi-image-paths.mjs
```

Puis Admin → **Réimporter les sites**.

## UI

- Landing : carrousel fluide (autoplay + swipe) sur les lieux phares
- Page détail : galerie photos en tête de page
- Si un lieu n’a **pas** de photo (ou fichier manquant) → fallback `public/samples/`
  (voir `public/samples/README.md`)
