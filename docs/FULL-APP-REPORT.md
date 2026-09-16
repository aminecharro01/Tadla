# Tanmiya Explorer — Full Application Report

**Region focus:** Béni Mellal–Khénifra (BMK), Morocco  
**Product name / brand:** Tadla / Tanmiya Explorer  
**Type:** Smart tourism web app (hackathon prototype, $0 stack)  
**Report date:** 25 July 2026  

---

## 1. Executive summary

Tanmiya Explorer is a multilingual tourism platform for the Béni Mellal–Khénifra region. Tourists discover places on a map, generate AI trip plans, ask a grounded regional chatbot, book guide-led programs, shop artisan products, explore living heritage, and earn visit badges. Guides and artisans join via a partner application flow; admins approve them and manage catalog content.

The app runs on **Vite + React**, **Firebase Auth + Firestore + Hosting**, **Leaflet** maps, and **Google Gemini** for itineraries, RAG chat, and live events — with **offline fallbacks** when Gemini hits quotas or is unavailable.

---

## 2. Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React (JavaScript) + Vite |
| Routing | React Router (lazy-loaded pages except Landing) |
| Styling | Tailwind CSS v4 (`@theme` in `src/index.css`) |
| Typography | Bricolage Grotesque (headlines), Hanken Grotesk (body) |
| Brand colors | Primary `#003580`, accent `#009fe3`, CTA `#ee0a65` |
| Map | Leaflet.js + OpenStreetMap |
| Backend / Auth / DB | Firebase Authentication + Cloud Firestore |
| Hosting | Firebase Hosting (project `bmkh-82c3b`) |
| AI | Google Gemini (AI Studio) — model alias `gemini-flash-lite-latest` |
| Weather | Open-Meteo (no API key) |
| 360° | Pannellum + Google Street View embeds on landing |
| i18n | English, French, Arabic (+ RTL) |

### Environment variables

| Variable | Purpose |
|----------|---------|
| `VITE_FIREBASE_*` | Firebase web config |
| `VITE_GEMINI_API_KEY` | Gemini API key (client-side for prototype) |
| `VITE_GEMINI_MODEL` | Model id (default `gemini-flash-lite-latest`) |
| `VITE_RAG_EMBEDDINGS` | `true`/`false` — enable embedding re-rank for chat |
| `VITE_GEMINI_EMBED_MODEL` | Optional embedding model |

---

## 3. User roles & access

| Role | How obtained | Main capabilities |
|------|----------------|-------------------|
| **Tourist** | Public signup | Explore, plan, book trips, order products, badges, chat |
| **Guide** | Partner apply → admin approve | Guide dashboard: programs, bookings, quotes |
| **Artisan / Cooperative** | Partner apply → admin approve | Workshop: listings, products, orders |
| **Admin** | Manual Firestore role | Approvals, catalog, users, global oversight |

**Rules**

- Public signup is always **tourist**.
- Guide / artisan desks appear in the account menu only when `partnerStatus === approved`.
- Partner path: `/partner` → docs → admin review.

---

## 4. Routes & pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Hero map, brand, AI preview, 360 / Street View, stats |
| `/discover` | HomeMap | Interactive POI map + filters + admin seed |
| `/poi/:poiId` | PoiDetail | Full place toolkit |
| `/assistant` | AiAssistant | Full AI trip planner |
| `/ask` | AskPage | Full-page RAG chat |
| `/essentials` | EssentialsPage | Emergency, Darija & Tamazight, offline tips |
| `/heritage` | HeritagePage | Intangible / living heritage catalog |
| `/badges` | TouristBadges | Tourist passport & badges |
| `/trips` | TripPrograms | Guide-led trip catalog |
| `/trips/:tripId` | TripDetail | Program detail + booking |
| `/bookings` | MyBookings | Tourist bookings & product orders |
| `/bookings/:bookingId` | BookingConfirmation | Booking confirmation |
| `/guide` | GuideDashboard | Guide desk |
| `/artisan` | ArtisanDashboard | Artisan workshop |
| `/artisans` | ArtisanDirectory | Artisan marketplace list |
| `/artisans/:listingId` | ArtisanStore | Store + order form |
| `/partner` | PartnerApply | Become guide / artisan |
| `/admin` | AdminDashboard | Admin console |
| `/auth` | Auth | Sign in / sign up |

Floating **Ask Tanmiya** chat is available from the layout on most pages.

---

## 5. Features in detail

### 5.1 Landing page

- Brand-first hero with live Leaflet map (`scrollWheelZoom` disabled so the page scrolls normally).
- Map becomes interactive after “Explore the map”.
- Embedded AI planner preview (`AiAssistant` in `embedded` mode, pink CTA).
- 360° / Street View section for the flagship Ouzoud experience.
- Stats strip based on **real Firestore counts** (never invented %).
- Lazy-load of heavy AI section on scroll.

### 5.2 Discover map (`/discover`)

- ~**45 seeded POIs** across **15 categories**: waterfall, lake, spring, river, nature, valley, peak, gorge, geology, heritage, village, market, museum, garden, park.
- Category filters and search.
- Marker map (Leaflet) with place cards.
- Catalog prefers Firestore; **falls back to local seed** when empty.
- Admin can **seed / re-seed POIs**.
- Place images: `public/places/{poiId}/…` with sample category fallbacks.

### 5.3 Place detail (`/poi/:poiId`)

Tourist toolkit for each place:

| Block | Detail |
|-------|--------|
| Gallery | Local photos / samples |
| Description | Seed / Firestore copy |
| **Activities** | Outdoor, culture, nature, etc. from experience catalog |
| **Live events** | Gemini + Google Search for dated events near the place |
| Visit tips | Duration, difficulty, family fit, what to bring |
| Weather | Open-Meteo current + short forecast |
| Budget bands | Indicative MAD ranges (entry / food / transport) |
| Language phrases | **Darija + Tamazight** (Latin + Arabic / Tifinagh) |
| Emergency | Police, ambulance, fire, gendarmerie, tourist police |
| Nearby places | Haversine distance |
| Navigation | Google Maps / Apple Maps / Waze deep links |
| Share | Native share / copy |
| Visited toggle | Marks place for badges |
| Heritage links | Related intangible heritage chips |
| Reviews | When applicable |

**Planner deep link:** opening a place from the AI plan uses `?from=planner` so “Back” returns to `/assistant` without resetting the plan.

### 5.4 AI trip planner (`/assistant`)

**Inputs**

- Duration (1–7 days)
- Group size
- Has car / no car
- Include hiking
- Interests: nature, history, culture, family
- Pace: relaxed, moderate, packed

**Outputs**

- Day-by-day POI itinerary (Gemini, catalog-only POI ids)
- Map with multi-stop route
- Google / Apple Maps multi-stop deep links; Waze (first stop)
- Transport plan cards when no car (indicative MAD)
- Stay offer cards (Booking.com-style links only)
- Matching guide trip programs
- Save plan / request guide quote (signed-in)

**Persistence**

- Device draft in storage for **7 days** (survives navigation and reload).
- Signed-in users: restore latest Firestore `savedItineraries` if no local draft.

**Fallback (quota / API failure)**

- Deterministic offline planner (`localPlanner.js`): interest match + proximity clustering.
- UI banner: plan built offline from local map.

### 5.5 Ask Tanmiya RAG chat (`/ask` + floating widget)

**Pipeline**

1. Build knowledge docs from POIs, artisans, trip programs, FAQ, heritage.
2. Lexical retrieval (always).
3. Optional Gemini embeddings re-rank (toggle `VITE_RAG_EMBEDDINGS`).
4. Gemini grounded answer as JSON (answer + highlight ids + follow-ups).
5. UI shows text, photo cards, follow-up chips, source links.

**Persistence:** chat history in `localStorage` with clear-chat control.

**Quota optimizations**

- Document embeddings cached (memory + localStorage).
- Lexical-only mode: **1 generate call per question**.
- Default model: `gemini-flash-lite-latest`.

**Fallback**

- On quota/rate-limit: answer composed from retrieved catalog hits + media cards (real places, not empty error).

### 5.6 Live events on place pages

- Gemini + **Google Search grounding** for festivals, moussems, souks, seasonal activities (~next 90 days).
- Loaded only when the section scrolls into view.
- Live results cached **24h** per place + language.
- Fallback results **not** cached (retry live next time).

**Offline curated events** (`localEvents.js`) — real recurring items, e.g.:

- National Ahidous Festival (Aïn Leuh, July)
- Almond / cherry blossom season (Feb–Mar)
- Waterfalls & lakes high season
- Moussem & tbourida season
- Weekly souk note for market / village / heritage categories

### 5.7 Essentials (`/essentials`)

- Emergency dial numbers (Morocco).
- Useful **Darija & Tamazight** phrase cards.
- Offline / practical travel tips.
- Links into Discover and Ask.

### 5.8 Living / intangible heritage (`/heritage`)

Six heritage dossiers (EN / FR / AR), each with:

- Summary
- **History / origins** (“how it started”)
- Respectful participation guidance
- Local photo banner
- Linked POIs
- YouTube search deep-link
- Source URL

| Id | Theme |
|----|--------|
| `ahidous-middle-atlas` | Ahidous poetry, rhythm, dance |
| `collective-granaries` | Ighrem / agadir shared stewardship |
| `mountain-pastoralism` | Agdal & pastoral knowledge |
| `tbourida` | UNESCO 2021 equestrian art |
| `weaving-craft` | Amazigh weaving & natural dyes |
| `geopark-oral-memory` | Oral memory of land & water |

Plus a neighbouring-context note for the **Imilchil engagement moussem** (outside BMK province).

Also surfaced on place detail via `PlaceActivities`.

### 5.9 Tourist badges (`/badges`)

Device-local visit passport (`experienceStorage`):

| Badge | Condition |
|-------|-----------|
| First step | 1 place visited |
| Pathfinder | 3 places |
| Atlas explorer | 5 places |
| Grand tour | 10 places |
| Heritage keeper | Heritage-category visits |
| Nature guardian | Nature-type visits |
| Water seeker | Waterfall / lake / spring / river |

Progress shown on badges page and on place detail when earned.

### 5.10 Guide trip programs

- Public catalog `/trips` with cover images.
- Detail page: days, POI stops, price, dates, group size, booking.
- Booking flow: simulated payment → status `pending` until guide confirms.
- Capacity check per date (not fully transactional — known limitation).
- Tourist: My Bookings + cancel own booking.
- Guide dashboard tabs: Programs / Bookings / Quotes, stats, cover image + sample photos.

Seed: **5** demo trip programs (`seedTrips.json`).

### 5.11 Artisan marketplace

- Directory `/artisans` with craft filter, search, product thumbnails.
- Store page: products with prices & photos, order options, WhatsApp.
- Orders stored in Firestore; artisan updates status.
- Dashboard: Catalog / Orders tabs, product image URL + sample gallery.
- Seed: **8** listings, **30** products with `/samples/products/…` images.
- Catalog merges missing product photos from seed when Firestore is stale.

### 5.12 Partner & admin

**Partner (`/partner`)**

- Apply as guide or artisan/cooperative.
- Document / status workflow (`pending_docs` → `pending_review` → approved/rejected).

**Admin (`/admin`)**

- Approve / reject partner applications.
- Manage roles, POIs, bookings overview, reviews, itineraries.
- Seed controls (also on Discover / Artisans for admins).

### 5.13 Auth

- Email/password (and Google if configured).
- Profile in Firestore `users/{uid}` with `role` and optional `partnerStatus`.
- Protected UX for partner desks and admin.

### 5.14 Reviews

- 1–5 star reviews on trips and artisans.
- Average rating helpers; displayed on listings / detail where wired.

### 5.15 i18n

- Full UI strings in **EN / FR / AR**.
- Arabic enables RTL layout.
- Heritage, activities, events, badges, planner, and chat copy localized.

---

## 6. Seed & media inventory

| Dataset | Count / notes |
|---------|----------------|
| POIs | 45 (`src/data/seedPois.json`) |
| Categories | 15 |
| Artisans | 8 |
| Products | 30 (with sample images) |
| Trip programs | 5 |
| Intangible heritage items | 6 (+ Imilchil note) |
| Phrase cards | 10 Darija + Tamazight pairs |
| Tourist badges | 7 |
| Place photos | `public/places/poi-*/` |
| Sample products / trips / artisans | `public/samples/` |
| Flagship 360 | `public/panorama/flagship-360.jpg` |

Catalog resolution (`catalog.js`): Firestore first; fill missing POI / product images from seed so demos never look empty.

---

## 7. Firestore data model

| Collection | Purpose |
|------------|---------|
| `users` | Profile, role, partnerStatus |
| `partnerApplications` | Eligibility requests |
| `pois` | Places (admin write) |
| `tripPrograms` | Guide programs (+ coverImage) |
| `bookings` | Trip bookings |
| `artisanListings` | Craft listings + products[] |
| `productOrders` | Artisan product orders |
| `savedItineraries` | AI plans + quote requests |
| `reviews` | Ratings on trips / artisans |

Security: `firestore.rules` — public read for catalog where intended; role-gated writes; no anonymous open write.

---

## 8. AI usage map & resilience

| Feature | Gemini use | Fallback when failing |
|---------|------------|------------------------|
| Itinerary | `generateContent` JSON plan | Offline proximity/interest planner |
| RAG chat | Embeddings (optional) + generate | Lexical hits → composed local answer |
| Live events | generate + Google Search grounding | Curated recurring regional events |
| Embeddings | `text-embedding-004` (optional) | Lexical-only or cached vectors |

**Quota hygiene**

- Embedding cache for RAG documents.
- Events: intersection-observer load + 24h live cache.
- Model alias `gemini-flash-lite-latest` (avoids retired ids like `gemini-2.5-flash-lite` for new accounts).
- Toggle `VITE_RAG_EMBEDDINGS=false` under pressure.

---

## 9. Key source files

| Area | Path |
|------|------|
| Routes | `src/App.jsx` |
| Layout / nav | `src/components/Layout.jsx` |
| Gemini client | `src/services/gemini.js` |
| RAG | `src/services/rag.js`, `ragKnowledge.js` |
| Catalog | `src/services/catalog.js` |
| Firestore API | `src/services/firestore.js` |
| Tourist helpers | `src/data/touristGuide.js` |
| Activities / heritage | `src/data/experienceCatalog.js` |
| Offline events | `src/data/localEvents.js` |
| Offline planner | `src/utils/localPlanner.js` |
| Chat / planner / badges storage | `src/utils/experienceStorage.js` |
| i18n | `src/i18n/strings.js` |
| Rules | `firestore.rules` |
| Seeds | `src/data/seedPois.json`, `seedArtisans.json`, `seedTrips.json` |

---

## 10. Known limitations

1. **Payments simulated** — bookings stay `pending` until guide confirms; no Stripe/PayPal.
2. **Booking capacity** not transactional — race conditions possible under concurrent bookers.
3. **Gemini API key in the browser** (`VITE_`) — fine for hackathon; use a Cloud Function proxy for production.
4. **Chat, planner draft, badges** are device-local — no cross-device sync yet.
5. **Partner media** via URLs / samples — no Firebase Storage upload pipeline yet.
6. **No automated test suite / CI**.
7. **Map tiles need network**; Print/PDF on Plan helps for offline day sheets.
8. **Waze** deep links: single destination only.
9. **Spark / Gemini free-tier quotas** — demos OK; heavy traffic needs billing or proxies.
10. **Live events** depend on web index quality; small villages may return curated fallbacks only.

---

## 11. Setup & deploy (short)

```bash
npm install
cp .env.example .env   # fill Firebase + Gemini
npm run dev            # http://localhost:5173

npm run build
npx firebase deploy --only hosting
npx firebase deploy --only firestore:rules
```

First demo steps: sign in → seed POIs / artisans (admin) → apply partner if needed → promote admin in Firestore for approvals.

---

## 12. Suggested next improvements

| Priority | Idea |
|----------|------|
| High | Cloud Function proxy for Gemini (hide key, shared rate limits) |
| High | Transactional booking capacity |
| High | Cross-device sync for chat / planner / badges (Firestore) |
| Medium | Firebase Storage for product & trip photos |
| Medium | Automated tests + CI |
| Medium | Real payment (or clear “demo only” badge in UI) |
| Low | PWA offline package for essentials + phrases |
| Low | Guide calendar / availability UI polish |
| Low | Native events calendar feed for the region |

---

## 13. Feature checklist (quick view)

- [x] Interactive regional map (45 POIs, 15 categories)
- [x] Place detail toolkit (weather, budget, nearby, nav)
- [x] Darija **and** Tamazight phrases
- [x] Place activities + linked heritage
- [x] Live web events + curated offline events
- [x] AI itinerary planner + map routes + transport/stay helpers
- [x] Planner persistence + restore from Firestore
- [x] Offline itinerary fallback
- [x] RAG chat (page + floating) + history
- [x] Chat embedding cache + lexical mode + offline answer fallback
- [x] Guide programs, bookings, quotes
- [x] Artisan directory, store, product photos, orders
- [x] Partner application + admin approvals
- [x] Intangible heritage page (history, photos, YouTube)
- [x] Tourist badges passport
- [x] Essentials (emergency / language / offline tips)
- [x] EN / FR / AR + RTL
- [x] Reviews
- [x] 360° / Street View flagship experience
- [x] Firebase Hosting ready

---

*End of report — Tanmiya Explorer / Tadla BMK tourism platform.*
