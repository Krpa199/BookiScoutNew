# BookiScout AI-First Content System

## 🎯 Što je ovo?

Dual content engine za AI discovery i monetizaciju:

- **`/guides/`** = AI Decision Layer (AI te citira, nema booking riječi)
- **`/articles/`** = Transaction Layer (Booking widget, affiliate revenue)

---

## 🚀 Quick Start

### 1. Generiraj teme
```bash
npm run generate:topics
```

Ovo će:
- Pozvati Gemini AI da generiranth 25 tema za Split, Zadar, Dubrovnik, Poreč, Rovinj, Zagreb
- Automatski primijeniti **3/3 filter** (decision mode + booking exclusion + citable)
- Spremiti u `src/content/topics.guides.json`

### 2. Generiraj guide članke
```bash
npm run generate:guides
```

Ovo će:
- Pročitati teme iz `topics.guides.json`
- Generirati **AIDecisionArticle** za svaku temu (EN)
- Prevesti na 10 jezika (DE, PL, CS, IT, HU, SK, NL, SL, FR, HR)
- Provjeriti **guardrails** (zabranjene riječi)
- Spremiti u `src/content/guides/{lang}/{slug}.json`
- Trackati progress u `src/content/guides-generated.json`

### 3. Build Next.js

```bash
npm run build
```

Static stranice će biti generirane za `/guides/[lang]/[slug]`

---

## 📂 Folder Struktura

```
src/
├── content/
│   ├── guides/              ← AI Decision Articles
│   │   ├── en/
│   │   ├── de/
│   │   └── ...
│   ├── articles/            ← Booking Articles (postojeće)
│   │   ├── en/
│   │   └── ...
│   ├── topics.guides.json   ← Generated topics
│   └── guides-generated.json ← Progress tracking
├── app/
│   ├── guides/[lang]/[slug]/page.tsx  ← Guide renderer
│   └── ...
├── config/
│   ├── features.ts          ← Feature flags
│   └── destinations.ts
└── components/
    └── ...
```

---

## 🎛️ Feature Flags (.env)

```env
# Global toggle
NEXT_PUBLIC_BOOKING_WIDGET_ENABLED=true

# /guides/ pages (AI decision content)
# Keep FALSE to maintain AI citability
NEXT_PUBLIC_BOOKING_WIDGET_ON_GUIDES=false

# /articles/ pages (transaction content)
NEXT_PUBLIC_BOOKING_WIDGET_ON_ARTICLES=true

# Internal links from guides → articles
NEXT_PUBLIC_GUIDES_INTERNAL_LINKS_ENABLED=true
```

---

## 🛡️ Guardrails (Automatski)

Generator automatski **odbacuje** članke koji sadrže zabranjene riječi u **title/h1/summary**:

```
booking | accommodation | hotel | apartment | price | reserve | deal
```

Ako AI generira članak s ovim riječima → član se **ne sprema**.

---

## 🧠 Kako radi 3/3 Filter?

AI sam validira svaku temu:

1. **DECISION MODE** - pomaže odluku (gdje boraviti), ne rezervaciju
2. **BOOKING EXCLUSION** - bez booking/accommodation riječi
3. **CITABLE ANSWER** - AI može citirati 2-6 rečenica

Tema se **prihvaća** samo ako prolazi **SVE 3** uvjete.

---

## 📊 Content Types

### AIDecisionArticle (/guides/)
```typescript
{
  type: 'ai_decision',
  title: "Which area of Split is best for families?",
  summary: "Short, citable answer",
  bestForFamilies: ["Spinut - quiet...", "..."],
  avoid: ["Bačvice - party area", "..."],
  practicalNotes: ["..."],
  qa: [{"q": "...", "a": "..."}],
  internalLinks: [{label: "Looking for stays?", href: "/articles/..."}],
  monetizationAllowed: false  // strict default
}
```

### BookingArticle (/articles/)
```typescript
{
  type: 'booking_article',
  title: "Best Apartments in Spinut, Split",
  intro: "...",
  sections: [{h2: "...", content: "..."}],
  bookingWidgetAllowed: true,
  relatedGuides: [{label: "...", href: "/guides/..."}]
}
```

---

## 🔄 Workflow

```
npm run generate:topics
      ↓
AI generira 25 tema
      ↓
3/3 filter (automatski)
      ↓
topics.guides.json
      ↓
npm run generate:guides
      ↓
Za svaku temu:
  - Generiraj EN (Gemini Pro)
  - Provjeri guardrails
  - Prevedi na 10 jezika (Gemini Flash)
  - Spremi u /guides/{lang}/
      ↓
npm run build
      ↓
Static stranice na /guides/[lang]/[slug]
```

---

## 🚨 Kill Switch

Ako AI prestane citirati `/guides/` stranice:

1. Postavi `NEXT_PUBLIC_BOOKING_WIDGET_ON_GUIDES=false`
2. Redeploy
3. Monetizacija ostaje na `/articles/`

---

## 📈 Metrics (TODO)

Implementiraj tracking u `src/config/features.ts`:

```typescript
metrics.trackBookingWidgetClick('guide', slug);
metrics.trackAIReferral('perplexity.ai', slug);
```

Koristi ovo za **automatski kill switch** ako AI visibility padne.

---

## 🎨 Destinacije za Start

```typescript
['Split', 'Zadar', 'Dubrovnik', 'Poreč', 'Rovinj', 'Zagreb']
```

Za više destinacija, ažuriraj u:
- `scripts/guide-generator.ts` → `START_DESTINATIONS`
- `scripts/generate-topics.ts` → `START_DESTINATIONS`

---

## 🔑 API Keys

Podrška za **rotaciju API ključeva**:

```env
GEMINI_API_KEY=your_key_1
GEMINI_API_KEY_1=your_key_2
GEMINI_API_KEY_2=your_key_3
```

Svaki ključ ima:
- **25 Pro poziva/dan** (generiranje članaka)
- **1500 Flash poziva/dan** (prijevodi)

10 ključeva = **250 Pro + 15,000 Flash poziva dnevno**

---

## 📝 Napomene

### Zašto nema `/articles/` generatora?

Postojeći `npm run generate` (article-generator.ts) **nastavlja raditi** za booking content.

Dual system:
- `npm run generate` → booking articles
- `npm run generate:guides` → decision guides

### Mogu li generirati više tema?

Da, ažuriraj prompt u `generateDecisionTopics()`:

```typescript
Generate 50 VALID topics for... // trenutno 25
```

### Kako dodati nove destinacije?

```typescript
// scripts/guide-generator.ts
const START_DESTINATIONS = [
  'Split', 'Zadar', 'Dubrovnik',
  'Poreč', 'Rovinj', 'Zagreb',
  'Hvar', 'Korčula' // ← dodaj ovdje
];
```

---

## ✅ Checklist prije produkcije

- [ ] Postavi sve `GEMINI_API_KEY` u .env
- [ ] Postavi `NEXT_PUBLIC_BOOKING_WIDGET_ON_GUIDES=false`
- [ ] Pokreni `npm run generate:topics`
- [ ] Pokreni `npm run generate:guides`
- [ ] Build i provjeri `/guides/en/split-best-area-families-...`
- [ ] Testiraj feature flags (toggle `BOOKING_WIDGET_ENABLED`)
- [ ] Implementiraj metrics tracking (optional)

---

## 🆘 Troubleshooting

### "All API keys exhausted"
→ Dodaj više API ključeva ili čekaj reset (midnight UTC)

### "Failed validation (banned words)"
→ Provjer output - AI generirao booking riječi, članak je odbačen (to je expected)

### "/guides/ stranice 404"
→ Pokreni `npm run generate:guides` prije `npm run build`

### "Topic already exists"
→ Obriši `src/content/topics.guides.json` i pokreni `generate:topics` ponovno

---

## 📚 Reference

- MASTER SPEC: `IMPLEMENTATION_PLAN.md`
- Feature flags: `src/config/features.ts`
- Gemini funkcije: `scripts/gemini.ts`
- Generator: `scripts/guide-generator.ts`

---

**🎉 Happy AI-first content generation!**
