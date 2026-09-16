# Tadla — Promo vidéo 2 min (CapCut + Figma)

Guide prêt à filmer et monter. Durée exacte du studio : **2:00**.

---

## Partie C — Studio navigateur 3D (`/promo`)

Promo cinématographique **en français** : fondu noir → grand logo + slogan, devices 3D glossy, transitions pro et défilement manuel dans les écrans.

**Slogan :** *Cascades, cèdres et vallées — Béni Mellal-Khénifra vous attend*

### Ouvrir

```
http://localhost:5173/promo
http://localhost:5173/promo?record=1   ← cache les contrôles (idéal OBS)
```

### Enregistrer

1. Navigateur **1920×1080** plein écran (F11)
2. `/promo?record=1`
3. Touche **R** pour recommencer, puis placer le curseur **dans l’écran** du laptop/phone
4. Faire défiler manuellement selon le guide ci-dessous pendant la capture (2:00)
5. OBS / Win+G → capturer la fenêtre
6. CapCut : ajouter musique, voix off arabe et sous-titres FR

### Raccourcis

| Touche | Action |
|--------|--------|
| Espace | Lecture / Pause |
| ← → | Scène précédente / suivante |
| R | Recommencer |

### Contenu des scènes

1. Intro noire + logo Tadla + slogan  
2. Accueil dans le laptop  
3. Support explicite **FR · EN · AR**, avec arabe RTL  
4. Découvrir · 5. Fiche lieu · 6. Patrimoine  
7. Planificateur IA · 8. Assistant IA  
9. **Annuaire des artisans** (`/artisans`)  
10. **Boutique artisan avec produits** (`/artisans/artisan-poterie-demnate`)  
11. **Circuits** (`/trips`) en duo avec les badges  
12. Générique / CTA + « Propulsé par l’intelligence artificielle »  

Les écrans chargent l’app réelle en iframe (`?embed=promo`, langue par défaut FR) ; le défilement est contrôlé par vous.  

Typo : **Fraunces** (logo), **Bricolage** (titres), **Hanken** (corps).

### Guide de défilement manuel synchronisé

Le scroll automatique est désactivé. Le curseur doit rester dans l’écran du device avant d’utiliser la molette ou le pavé tactile.

| Temps | Plan | Action manuelle |
|-------|------|-----------------|
| 0:00–0:08 | Intro | Ne rien toucher |
| 0:08–0:19 | Accueil | À 0:11, scroll très lent vers la carte puis arrêter à 0:17 |
| 0:19–0:26 | 3 langues | Ne rien toucher ; laisser lire FR · EN · AR |
| 0:26–0:37 | Découvrir | À 0:29, deux petits crans de molette dans le téléphone |
| 0:37–0:49 | Fiche lieu | À 0:40, scroll progressif vers activités et phrases utiles |
| 0:49–0:58 | Patrimoine | À 0:52, un scroll lent pour révéler la carte suivante |
| 0:58–1:11 | Planificateur IA | Montrer le formulaire ; petit scroll à 1:04 vers le résultat |
| 1:11–1:20 | Assistant IA | Laisser l’écran stable pour lire la réponse |
| 1:20–1:30 | Annuaire artisans | À 1:23, scroll lent sur la grille des coopératives |
| 1:30–1:41 | Boutique artisan | À 1:33, scroll vers la grille produits et les prix |
| 1:41–1:52 | Circuits + badges | À 1:44, scroll léger dans la liste des circuits |
| 1:52–2:00 | Fin | Ne rien toucher |

**Astuce :** mouvements courts et réguliers. Éviter les grands coups de molette. Si un plan défile trop vite, appuyer sur **Espace**, repositionner, puis reprendre.

---

## Partie A — Checklist CapCut (plan de tournage)

### Avant de filmer (10 min)

- [ ] `npm run dev` → ouvrir l’app
- [ ] Fenêtre navigateur **1920×1080** (ou 1280×720)
- [ ] Langue UI : **Français** (pour la démo jury)
- [ ] Compte **touriste** pour la plupart des plans
- [ ] Compte **admin** prêt pour 1 seul plan IA (optionnel)
- [ ] Barre de favoris / notifications cachées
- [ ] OBS ou Win+G : enregistrer **sans micro** (musique après)

### Clips à capturer (chemins exacts dans l’app)

| # | Durée clip | Chemin dans l’app | Action à filmer | Titre à l’écran (CapCut) |
|---|------------|-------------------|-----------------|--------------------------|
| 01 | 8–10 s | `/` Landing | Scroll léger sur la carte hero | — (logo plus tard) |
| 02 | 10–12 s | `/` → **Découvrir** | Clic nav **Découvrir** | Découvrir la région |
| 03 | 12–15 s | `/discover` | Filtre **waterfall** / cascade → clic **Ouzoud** | 45 lieux sur la carte |
| 04 | 12–15 s | `/poi/poi-ouzoud-falls` | Scroll : activités → phrases Darija/Tamazight | Chaque lieu, prêt à visiter |
| 05 | 8–10 s | même page | Scroll événements / météo (bref) | — |
| 06 | 10–12 s | Nav **Patrimoine vivant** `/heritage` | Scroll 1 carte (Ahidous ou Tbourida) | Patrimoine vivant |
| 07 | 12–15 s | `/assistant` | Remplir 2 jours + nature → **Générer** (admin si IA live) | Planifier avec Tadla |
| 08 | 8–10 s | Résultat plan | Montrer jour 1 + carte itinéraire | Itinéraire jour par jour |
| 09 | 10–12 s | Chat FAB ou `/ask` | Question : *« Où voir des cascades près de Beni Mellal ? »* | Demandez à Tadla |
| 10 | 10–12 s | `/artisans` → un store | Miniatures produits → ouvrir boutique | Artisans & produits |
| 11 | 6–8 s | Menu langue | Switch **FR → AR** (RTL) | EN · FR · AR |
| 12 | 6–8 s | `/badges` | Aperçu badges | Explorez, gagnez des badges |
| 13 | 5 s | `/` | Logo Tadla centré | — |

**Astuce :** chaque clip = un fichier séparé (`01-landing.mp4`, `02-discover.mp4`…).

---

### Montage CapCut — ordre des scènes

| Temps | Clip(s) | Effet | Texte overlay | Voix FR (optionnelle) |
|-------|---------|-------|---------------|------------------------|
| 0:00–0:08 | Burst brand + grand logo | Fade noir → bleu | **Tadla** + slogan | « Cascades, cèdres et vallées — Béni Mellal-Khénifra vous attend. » |
| 0:08–0:19 | Accueil **laptop 3D** | Zoom lent | Tourisme intelligent | « Découvrez Béni Mellal–Khénifra autrement. » |
| 0:19–0:26 | Cartes de langues | Apparition décalée | **FR · EN · AR** | « Une expérience accessible en trois langues. » |
| 0:26–0:37 | Découvrir **phone** | Fondu + rotation | 45 lieux sur la carte | « Explorez la région sur une carte interactive. » |
| 0:37–0:49 | Fiche lieu **phone** | Cut doux | Chaque lieu, prêt à visiter | « Activités, météo et phrases utiles. » |
| 0:49–0:58 | Patrimoine **laptop** | Pan vertical | Patrimoine vivant | « Découvrez un patrimoine vivant. » |
| 0:58–1:11 | Planificateur **laptop 3D** | Lumière écran | Planifier avec l’IA | « L’intelligence artificielle construit votre itinéraire. » |
| 1:11–1:20 | Assistant **phone** | Pop-in | Demandez à Tadla | « Posez vos questions et obtenez des réponses locales. » |
| 1:20–1:30 | Annuaire **laptop** | Zoom léger | L’annuaire des artisans | « Rencontrez les coopératives et les artisans de la région. » |
| 1:30–1:41 | Boutique **laptop** | Pan produits | Entrez dans la boutique | « Découvrez leurs produits, leurs prix, et commandez directement. » |
| 1:41–1:52 | Circuits + badges | Duo 3D | Circuits et badges | « Réservez des circuits guidés et collectionnez vos souvenirs. » |
| 1:52–2:00 | Logo + CTA énergie brand | Fade | **Propulsé par l’IA** | « Tadla — Béni Mellal-Khénifra vous attend. » |

---

### Voix off FR courte (optionnelle)

Tu peux **ne pas** tout dire : la version silencieuse + sous-titres marche très bien pour un jury.

1. *(0:00)* Cascades, cèdres et vallées — Béni Mellal-Khénifra vous attend.  
2. *(0:19)* Une expérience accessible en français, en anglais et en arabe.  
3. *(0:26)* Explorez quarante-cinq lieux sur une carte interactive.  
4. *(0:58)* Planifiez votre circuit avec une intelligence artificielle ancrée dans la région.  
5. *(1:20)* Rencontrez les artisans, entrez dans leur boutique et achetez local.  
6. *(1:41)* Réservez des circuits guidés et gagnez vos badges de voyage.  
7. *(1:52)* Tadla — Cascades, cèdres et vallées. Béni Mellal-Khénifra vous attend.

---

### Script voix off arabe — synchronisé avec `/promo` (2:00)

Arabe standard moderne (فصحى), ton chaleureux et clair. Une seule mention de l’intelligence artificielle. Parler un peu plus lentement : les phrases sont plus longues. Laisser une courte respiration entre les plans.

1. **0:00–0:08 — Intro**  
   « شلالات وأرز ووديان… بني ملال خنيفرة في انتظاركم. وهنا تبدأ رحلتكم مع تادلا. »

2. **0:08–0:19 — Accueil**  
   « تادلا تجمع لكم أهم ما تحتاجه الجهة في مكان واحد: الخريطة، والمعالم، والتجارب المحلية، بطريقة بسيطة وواضحة من اللحظة الأولى. »

3. **0:19–0:26 — Trois langues**  
   « والتطبيق متاح بالعربية والفرنسية والإنجليزية، حتى تكون التجربة قريبة من الجميع، سواء كنتم من المغرب أو من خارجه. »

4. **0:26–0:37 — Carte et découverte**  
   « اكتشفوا أكثر من خمسة وأربعين موقعاً على خريطة تفاعلية: من الشلالات والجبال إلى القرى والمعالم التراثية في أرجاء الجهة. »

5. **0:37–0:49 — Fiche lieu**  
   « وفي كل وجهة، تجدون ما تحتاجونه قبل الزيارة: الأنشطة المقترحة، حالة الطقس، وعبارات محلية مفيدة تساعدكم على التواصل أثناء الرحلة. »

6. **0:49–0:58 — Patrimoine vivant**  
   « وتعرفوا أيضاً على تراث حيّ ينبض بالحياة، من أحيدوس إلى التبوريدة، مع قصص وارتباطات حقيقية بكل مكان تزورونه. »

7. **0:58–1:11 — Planificateur**  
   « وبمساعدة الذكاء الاصطناعي، تقترح تادلا برنامجاً سياحياً يناسب مدة إقامتكم واهتماماتكم، مع المراحل والخريطة يوماً بعد يوم. »

8. **1:11–1:20 — Assistant**  
   « وإذا كان لديكم سؤال عن مكان أو نشاط، اسألوا تادلا، واحصلوا على إجابات مرتبطة بوجهات الجهة وبما يهمكم فعلاً. »

9. **1:20–1:30 — Annuaire des artisans**  
   « تصفحوا دليل الحرفيين والتعاونيات المحلية، من الفخار والزرابي إلى منتجات الأرض، واكتشفوا مواهب الجهة عن قرب. »

10. **1:30–1:41 — Boutique**  
    « ثم ادخلوا إلى المتجر مباشرة: شاهدوا المنتجات والأثمنة، وتواصلوا مع الحرفي دون وسيط، وساهموا في دعم الاقتصاد المحلي. »

11. **1:41–1:52 — Circuits et badges**  
    « واحجزوا جولات سياحية مع مرشدين محليين، واجمعوا شاراتكم مع كل وجهة تزورونها، لتبقى رحلتكم ذكرى حية. »

12. **1:52–2:00 — Fin**  
    « تادلا… شلالات وأرز ووديان. بني ملال خنيفرة في انتظاركم. اكتشفوا، خططوا، وادعموا المحلي. »

**Prononciation :** تادلا · بني ملال خنيفرة.  
**Mixage :** voix `-3 dB` · musique `-20 dB` · fondu `0,5 s`.  
**Conseil lecture :** environ `130–140` mot/minute — ne pas accélérer.

---

### Générer la voix off dans Google AI Studio (TTS)

**Réglages :** aistudio.google.com → **Generate media → Speech** (ou modèle `gemini-2.5-flash-preview-tts`) → **Single speaker** → auditionner les voix (`Charon`, `Kore`, `Umbriel`, `Algieba`) → **Run** → télécharger le `.wav`.

#### Prompt A — voix off complète (un seul fichier)

```
You are a professional Arabic voice-over artist recording a 2-minute tourism promo.

Read the following script in Modern Standard Arabic (فصحى).
Tone: warm, welcoming, confident and cinematic — like a national tourism campaign.
Pace: calm and unhurried, about 135 words per minute.
Add a natural short pause at each line break and a longer pause where you see [pause].
Pronounce "تادلا" as TAD-la and "بني ملال خنيفرة" clearly.
Do not add any sound effects, music, or spoken commentary — only read the script.

Script:
شلالات وأرز ووديان… بني ملال خنيفرة في انتظاركم. وهنا تبدأ رحلتكم مع تادلا. [pause]
تادلا تجمع لكم أهم ما تحتاجه الجهة في مكان واحد: الخريطة، والمعالم، والتجارب المحلية، بطريقة بسيطة وواضحة من اللحظة الأولى. [pause]
والتطبيق متاح بالعربية والفرنسية والإنجليزية، حتى تكون التجربة قريبة من الجميع، سواء كنتم من المغرب أو من خارجه. [pause]
اكتشفوا أكثر من خمسة وأربعين موقعاً على خريطة تفاعلية: من الشلالات والجبال إلى القرى والمعالم التراثية في أرجاء الجهة. [pause]
وفي كل وجهة، تجدون ما تحتاجونه قبل الزيارة: الأنشطة المقترحة، حالة الطقس، وعبارات محلية مفيدة تساعدكم على التواصل أثناء الرحلة. [pause]
وتعرفوا أيضاً على تراث حيّ ينبض بالحياة، من أحيدوس إلى التبوريدة، مع قصص وارتباطات حقيقية بكل مكان تزورونه. [pause]
وبمساعدة الذكاء الاصطناعي، تقترح تادلا برنامجاً سياحياً يناسب مدة إقامتكم واهتماماتكم، مع المراحل والخريطة يوماً بعد يوم. [pause]
وإذا كان لديكم سؤال عن مكان أو نشاط، اسألوا تادلا، واحصلوا على إجابات مرتبطة بوجهات الجهة وبما يهمكم فعلاً. [pause]
تصفحوا دليل الحرفيين والتعاونيات المحلية، من الفخار والزرابي إلى منتجات الأرض، واكتشفوا مواهب الجهة عن قرب. [pause]
ثم ادخلوا إلى المتجر مباشرة: شاهدوا المنتجات والأثمنة، وتواصلوا مع الحرفي دون وسيط، وساهموا في دعم الاقتصاد المحلي. [pause]
واحجزوا جولات سياحية مع مرشدين محليين، واجمعوا شاراتكم مع كل وجهة تزورونها، لتبقى رحلتكم ذكرى حية. [pause]
تادلا… شلالات وأرز ووديان. بني ملال خنيفرة في انتظاركم. اكتشفوا، خططوا، وادعموا المحلي.
```

#### Prompt B — une ligne à la fois (meilleur calage CapCut)

Recommandé : générer **12 fichiers séparés** pour poser chaque phrase exactement sur sa scène.

```
Read this single line as an Arabic (فصحى) tourism voice-over.
Tone: warm, cinematic, confident. Pace: calm, ~135 words per minute.
Target duration: about 11 seconds. No music, no sound effects, no extra words.

Line:
<COLLER ICI UNE SEULE PHRASE DU SCRIPT>
```

**Astuce :** si une prise est trop rapide, ajouter `Speak more slowly and leave a clear pause before the final sentence.`

---

### Réglages CapCut

- [ ] Projet **1080p · 30 fps**
- [ ] Musique douce (voyage / électronique), volume **-18 à -22 dB** sous la voix
- [ ] Sous-titres : police bold, max **6 mots**, couleur `#003580` ou blanc + ombre
- [ ] Transitions : **Mix / Dissolve** 8–12 frames (pas de transitions “flashy”)
- [ ] Export : H.264, haute qualité → `Tadla-promo-2min.mp4`

### Mockups dans CapCut (rapide)

1. Calque vidéo UI  
2. Au-dessus : PNG **laptop** ou **phone** transparent (télécharger “macbook mockup png” / “iphone 15 frame png”)  
3. Redimensionner la vidéo **dans l’écran** du device  
4. Effet **3D** léger : rotate X = 4–8°, Y = −6 à −12°  
5. Ombre portée sous le device  

---

## Partie B — Layout Figma (mockups à copier)

### Créer le fichier

1. Figma → New design file → nom **`Tadla Promo Mockups`**
2. Installer (Community) : chercher **“Apple Devices”** ou **“Device Mockups”** (frames MacBook + iPhone)
3. Page 1 : `Frames` · Page 2 : `Exports`

### Structure des frames (copie cette arborescence)

```
📄 Tadla Promo Mockups
├── 📁 00-Brand
│   ├── Logo Tadla (horizontal)
│   ├── Palette : #003580 / #009fe3 / #ee0a65 / #ffffff
│   └── Titres style (Fraunces pour logo, Hanken pour body)
│
├── 📁 01-Laptop-Hero          ← Landing map
│   └── MacBook Pro 16"
│       └── Screen (1920×1200) ← screenshot / video frame landing
│
├── 📁 02-Phone-Discover       ← Carte + filtre
│   └── iPhone 15 Pro
│       └── Screen (1179×2556) ← discover
│
├── 📁 03-Phone-POI            ← Fiche lieu
│   └── iPhone 15 Pro
│       └── Screen ← poi Ouzoud (activités visibles)
│
├── 📁 04-Laptop-Planner       ← Itinéraire IA
│   └── MacBook Pro 16"
│       └── Screen ← résultat /assistant
│
├── 📁 05-Phone-Ask            ← Chat
│   └── iPhone 15 Pro
│       └── Screen ← réponse Ask Tadla + cartes lieux
│
├── 📁 06-Laptop-Heritage      ← Patrimoine
│   └── MacBook Air / Pro
│       └── Screen ← /heritage
│
├── 📁 07-Duo-Finale           ← Composition jury
│   └── Artboard 1920×1080
│       ├── Laptop (gauche, scale 70%)
│       ├── Phone (droite, scale 90%, léger overlap)
│       ├── Fond dégradé soft (#003580 → #f0f4f8)
│       └── Texte bas : “Tadla · BMK”
│
└── 📁 08-Endcard
    └── 1920×1080
        ├── Logo centré
        ├── Tagline FR
        └── URL / QR (optionnel)
```

### Tailles Artboard utiles

| Usage | Taille |
|-------|--------|
| Master promo still | **1920 × 1080** |
| Story / vertical teaser | **1080 × 1920** |
| Thumbnail YouTube | **1280 × 720** |

### Auto-layout / composition Duo (07)

```
[  Artboard 1920×1080  ]
[  padding 80          ]
[  Laptop ──────── Phone ]
[  gap 40–60           ]
[  Footer texte 40px   ]
```

- Laptop : rotation **Y −8°**, shadow `0 40 80 rgba(0,53,128,0.25)`  
- Phone : rotation **Y +10°**, légèrement plus bas (perspective “desk”)  
- Fond : radial soft ou photo Atlas floutée à 20 % opacity  

### Comment remplir les écrans

1. Screenshot PNG depuis Chrome (DevTools device mode pour le phone)  
2. Glisser le PNG **dans** le rectangle Screen du device (clip content ON)  
3. Pour une “vidéo” dans Figma : coller une **image séquence** (3–5 frames) ou enregistrer l’écran Figma en pan lent  

### Export pour CapCut

| Frame | Export | Nom fichier |
|-------|--------|-------------|
| 01 Laptop Hero | PNG @2x | `mock-laptop-landing.png` |
| 02 Phone Discover | PNG @2x | `mock-phone-discover.png` |
| 03 Phone POI | PNG @2x | `mock-phone-poi.png` |
| 04 Laptop Planner | PNG @2x | `mock-laptop-planner.png` |
| 05 Phone Ask | PNG @2x | `mock-phone-ask.png` |
| 07 Duo Finale | PNG @2x | `mock-duo-finale.png` |
| 08 Endcard | PNG @2x | `endcard.png` |

Dans CapCut : alterne **vidéos UI brutes** (mouvement) et **stills Figma mockup** (look 3D) toutes les 1–2 scènes.

---

## Checklist jour J (2–3 h)

- [ ] Filmer clips 01→13 (45 min)  
- [ ] Remplir Figma frames + export PNG (40 min)  
- [ ] CapCut : timeline + mockups + titres FR (50 min)  
- [ ] Musique + export (15 min)  
- [ ] Visionnage 1× — couper si > 2:00  

---

## Phrase de fin (endcard)

**FR :** Cascades, cèdres et vallées — Béni Mellal-Khénifra vous attend.  
**EN :** Waterfalls, cedars and valleys — Béni Mellal-Khénifra awaits you.  
**AR :** شلالات وأرز ووديان — بني ملال خنيفرة في انتظاركم.

Logo Fraunces + URL de démo.

---

*Fichier compagnon du projet Tanmiya Explorer / Tadla.*
