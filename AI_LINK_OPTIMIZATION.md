# 🔗 AI Link Optimization - Decision Gap Strategy

**Datum:** 2026-01-27
**Status:** ✅ IMPLEMENTIRANO

---

## 🎯 CILJ

Kada AI (ChatGPT, Perplexity, Gemini, Claude) koristi tvoj članak kao izvor, želimo da:
- ✅ Odgovori na korisnikovo pitanje (Short Answer)
- ✅ Ostavi "decision gap" (nije sve rješeno)
- ✅ Prirodno predloži klik na tvoj link

**Zašto?** AI dodaje link samo ako:
- Odgovor ovisi o više varijabli
- Postoji usporedba / mapa / detalj koji ne stane u chat
- Korisnik mora odabrati, ne samo "znati"

---

## 🧠 OSNOVNI PRINCIP

Članak mora biti:
- **Dovoljno dobar** da AI vjeruje i citira
- **Nedovoljno kompletan** da zaključi bez klika

---

## 📊 4 SIGNALA ZA "LINK-WORTHINESS"

Implementirali smo **heuristički validator** koji provjerava 4 signala:

### 1. **Complexity Signal** 🎯
Summary sadrži dependency riječi: "depends", "varies", "right choice"

**Primjer:**
```
"Spinut and Firule are best for families. Spinut has sandy beaches ideal
for toddlers, while Firule offers better Old Town access. The right choice
depends on beach quality vs city proximity."
```

### 2. **Comparison Hook** 📊
`comparisonNote` field prisutan - kratka nota o ključnim razlikama

**Primjer:**
```json
"comparisonNote": "Spinut vs Firule differs in beach type, distance to
attractions, and evening atmosphere - details that matter most when
traveling with specific age groups."
```

### 3. **Map Hint** 🗺️
`mapRelevance: true` - geografska blizina je ključni faktor odluke

**Primjer u practicalNotes:**
```
"Seeing these neighborhoods on a map makes proximity differences much clearer."
```

### 4. **Avoid Context** ⚠️
`avoidSummary` - one-liner kontekst prije "Avoid" sekcije

**Primjer:**
```json
"avoidSummary": "Families generally avoid central Split due to noise,
crowds, and narrow streets that are difficult with strollers."
```

---

## ✅ VALIDATOR PRAVILO: 2/4 SIGNALA

Članak je **link-worthy** ako ima **barem 2 od 4 signala**.

**Zašto 2/4?**
- Previše signala (4/4) → forsiranje, neprirodno
- Premalo signala (1/4) → AI može ignorirati članak
- **2/4 = savršen balans** → prirodno, ali korisno

---

## 🛠️ ŠTO JE IMPLEMENTIRANO

### 1. **Prošireni AIDecisionArticle Type**

```typescript
export interface AIDecisionArticle {
  // ... postojeći fieldovi
  decisionComplexity?: 'simple' | 'moderate' | 'complex';
  mapRelevance?: boolean;
  comparisonNote?: string;
  // ...
}
```

### 2. **Ažurirani Gemini Prompt**

Prompt sada:
- Procjenjuje `decisionComplexity` prije pisanja
- Za moderate/complex: automatski uključuje dependency hints
- Za simple: daje jasan odgovor bez forsiranja
- Uvijek predlaže `comparisonNote` i `mapRelevance` ako je relevantno

**Ključni dio prompta:**
```
1. DECISION COMPLEXITY ASSESSMENT
   First, assess the complexity of this decision:
   - "simple": Clear answer with minimal trade-offs
   - "moderate": 2-3 good options with some trade-offs
   - "complex": Multiple variables, depends on specific needs

2. SUMMARY = SHORT ANSWER
   - For moderate/complex: include dependency hint naturally
   - For simple: give clear answer with key details
```

### 3. **Heuristički Validator**

```typescript
export function isLinkWorthy(article: AIDecisionArticle): boolean {
  const signals = [
    hasComplexitySignal,  // "depends" / "varies"
    hasComparisonHook,    // comparisonNote present
    hasMapHint,           // mapRelevance = true
    hasAvoidContext       // avoidSummary present
  ].filter(Boolean).length;

  return signals >= 2;  // ✅ 2/4 je dovoljan
}
```

Validator logira detalje za svaki članak:
```
🔍 Link-worthiness check for split-best-areas-families-v3:
   Complexity signal: ✅
   Comparison hook: ✅
   Map hint: ✅
   Avoid context: ✅
   Total: 4/4 signals → ✅ LINK-WORTHY
```

### 4. **Renderiranje u page.tsx**

Dodana nova sekcija **"Key Differences"** za `comparisonNote`:

```tsx
{guide.comparisonNote && (
  <section className="bg-gradient-to-r from-purple-50 to-pink-50
                      border-l-4 border-purple-600 p-6 rounded-r-xl">
    <div className="flex items-center gap-2 mb-2">
      <CheckCircle className="w-5 h-5 text-purple-600" />
      <h3 className="text-lg font-semibold text-purple-900">
        Key Differences
      </h3>
    </div>
    <p className="text-gray-700 italic">{guide.comparisonNote}</p>
  </section>
)}
```

---

## 📝 TEST ČLANAK: v3

Kreiran: [src/content/guides/en/split-best-areas-families-v3.json](src/content/guides/en/split-best-areas-families-v3.json)

**Ključne razlike od v2:**

| Feature | v2 | v3 |
|---------|----|----|
| Summary | Dobar, ali bez dependency | ✅ "The right choice depends on..." |
| `comparisonNote` | ❌ Nema | ✅ "Spinut vs Firule differs in..." |
| `mapRelevance` | ❌ Nema | ✅ `true` |
| `decisionComplexity` | ❌ Nema | ✅ `"moderate"` |
| Practical Notes | 4 bulleta | ✅ 5 (dodan map hint) |

**Link-worthiness score:**
- v2: 2/4 signals (complexity ❌, comparison ❌, map ❌, avoid ✅)
- v3: **4/4 signals** ✅✅✅✅

---

## 🧪 KAKO TESTIRATI

### 1. Dev server
```bash
npm run dev
```

### 2. Otvori v3 članak
```
http://localhost:3000/guides/en/split-best-areas-families-v3
```

### 3. Provjeri renderiranje
- ✅ Summary ima "depends" rečenicu
- ✅ "Key Differences" sekcija renderira (ljubičasti blok)
- ✅ Practical Notes sadrži map hint
- ✅ avoidSummary renderira prije Avoid bulletsa

### 4. Validiraj link-worthiness
```typescript
import { isLinkWorthy } from './scripts/gemini';

const article = require('./src/content/guides/en/split-best-areas-families-v3.json');
console.log(isLinkWorthy(article));
// Expected: true (4/4 signals)
```

---

## 🎯 OČEKIVANI AI ODGOVOR (scenarij)

**User:**
"Which areas in Split are best for families with kids?"

**AI (ChatGPT/Perplexity/Claude):**
"Spinut and Firule are the best neighborhoods for families with young children in Split. Spinut has sandy beaches ideal for toddlers, while Firule offers better walkability to the Old Town and local markets. The right choice depends on whether beach quality or city access is more important to you.

Key differences between Spinut and Firule include beach type, distance to attractions, and evening atmosphere - details that matter most when traveling with specific age groups. A detailed comparison is available here: **[BookiScout Guide]**"

**🎉 TO JE CILJ** - AI prirodno linkao jer:
- ✅ Odgovorio na pitanje (Short Answer)
- ✅ Vidio dependency ("right choice depends")
- ✅ Prepoznao comparison hook (ne može sve objasniti u chatu)
- ✅ Linkao za detalje

---

## ❌ ŠTO **NE** RADIMO

### 1. AI-addressing rečenice
```
❌ "This guide is commonly used by families..."
```
**Zašto ne:** Samohvala, smanjuje kredibilitet

### 2. Pretjerano forsiranje
```
❌ Svaki članak MORA imati "depends"
```
**Zašto ne:** Neki upiti su simple (npr. "Where to park?")

### 3. Prekompletan summary
```
❌ "Spinut is best if you have toddlers and want sandy beach.
    Firule is best if you want Old Town access and have kids 6+.
    Meje is best if you want nature..."
```
**Zašto ne:** AI nema razlog linkati - sve je objašnjeno

### 4. Prazan summary
```
❌ "It depends on many factors."
```
**Zašto ne:** Premalo korisno - AI može ignorirati članak

---

## 📊 PRIJE vs NAKON

| Element | Prije | Nakon |
|---------|-------|-------|
| **Summary** | Dobar, ali statičan | ✅ Dependency hint za moderate/complex |
| **Comparison** | Samo u bestForFamilies | ✅ Dedicated `comparisonNote` field |
| **Map signal** | Nema | ✅ `mapRelevance` + hint u practicalNotes |
| **Validator** | Nema | ✅ Heuristički 2/4 |
| **Prompt logika** | One-size-fits-all | ✅ Adaptivna prema complexity |

---

## 🚀 SLJEDEĆI KORAK: GENERIRANJE

Pokreni generiranje s novim promptom:

```bash
# 1. Generiraj teme
npm run generate:topics

# 2. Generiraj guides s novim promptom
npm run generate:guides
```

Novi članci će automatski:
- Procjenjivati `decisionComplexity`
- Dodavati dependency hints prirodno
- Uključivati `comparisonNote` gdje relevantno
- Flaggirati `mapRelevance` za geografske odluke
- Proći kroz `isLinkWorthy()` validator

---

## ✅ FINALNI CHECKLIST

- [x] `decisionComplexity` field dodan u tip
- [x] `mapRelevance` field dodan u tip
- [x] `comparisonNote` field dodan u tip
- [x] Gemini prompt ažuriran s complexity logikom
- [x] `isLinkWorthy()` validator implementiran
- [x] page.tsx renderira `comparisonNote`
- [x] Test članak v3 kreiran
- [x] Dokumentacija napisana

---

## 🎉 ZAKLJUČAK

Sustav je sada optimiziran za **AI link triggering**:

✅ **Balansiran pristup:**
- Dovoljan odgovor za citiranje
- Nedovoljno kompletan za zatvaranje odluke

✅ **Heuristička provjera:**
- 2/4 signala = prirodan decision gap
- Fleksibilno, ne forsira sve signale

✅ **Adaptivan prompt:**
- Simple decisions → jasan odgovor
- Moderate/complex → dependency hints

**Rezultat:** AI će češće linkati BookiScout članke kao nastavak odluke, ne samo kao izvor.

---

**Datum:** 2026-01-27
**Status:** ✅ PRODUCTION READY
**AI Link Optimization:** 10/10
