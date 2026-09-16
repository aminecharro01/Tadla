# Photos sample (fallback)

Quand un lieu ou un artisan **n’a pas de photo**, l’app utilise ce dossier.

## Structure

```
public/samples/
  places/
    1.jpg          ← galerie générique (lieu sans photos)
    2.jpg
    3.jpg
  categories/
    waterfall/1.jpg
    lake/1.jpg
    garden/1.jpg
    heritage/1.jpg
    nature/1.jpg
  artisans/
    bazar-ouzoud.jpg
    bazar-ibrahimy.jpg ← photos locales et repli artisan
  products/
    bracelet.jpg, tagine.jpg, … ← photos produits (démo)
  trips/
    ouzoud.jpg, lakes.jpg, … ← couvertures circuits (démo)
```

## Comment déposer

1. Remplace les fichiers existants **en gardant le même nom** (`1.jpg`, `2.jpg`…).
2. Formats OK : JPG, PNG, WebP.
3. Taille conseillée : ~1200–2000 px de large.
4. Pas besoin de changer le code ni de re-seed Firestore.

## Priorité d’affichage (lieux)

1. Photos du lieu : `public/places/{poiId}/1.jpg`…
2. Sinon couverture catégorie : `public/samples/categories/{category}/1.jpg`
3. Sinon galerie générique : `public/samples/places/1.jpg`…

## Artisans & produits

Les bazars Ouzoud et Ibrahimy utilisent leurs photos locales nommées ci-dessus.
Les produits seedés pointent vers `/samples/products/…`.
Les circuits seedés pointent vers `/samples/trips/…`.

Si une autre photo distante ne charge pas, l’app utilise
`public/samples/artisans/bazar-ibrahimy.jpg`.
