/**
 * Generate rich destination hub content (src/content/destinations/<lang>/<slug>.json).
 * Replaces the identical template text every /destinations/<slug> page used to show,
 * so each hub can rank for the bare place-name query ("zadar", "pula").
 *
 *   npx tsx scripts/generate-destination-hubs.ts zadar --langs=en,hu,de   # preview
 *   npx tsx scripts/generate-destination-hubs.ts                          # all priority hubs, all languages
 *   ... --force                                                           # regenerate EN even if it exists
 *
 * EN is written by Gemini Pro with Google Search grounding (current facts);
 * other languages are translated from EN with Flash. No year in titles — hubs
 * are evergreen (people search "zadar", not "zadar 2027").
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DESTINATIONS } from '../src/config/destinations';
import { LANGUAGES, LanguageCode } from '../src/config/languages';

export const PRIORITY_HUBS = [
  'zadar', 'split', 'trogir', 'krk', 'rijeka', 'biograd', 'korcula', 'dubrovnik',
  'makarska', 'brela', 'pula', 'rovinj', 'crikvenica', 'sibenik', 'porec',
  'medulin', 'vodice', 'omis',
];

const OUT_DIR = path.join(process.cwd(), 'src', 'content', 'destinations');
const PRO_MODEL = 'gemini-pro-latest';
const TRANSLATE_MODEL = 'gemini-2.5-flash';

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY_1 || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY_1 missing');
  return key;
}

function parseJson(text: string): Record<string, unknown> {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1];
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object in response');
  return JSON.parse(t.slice(start, end + 1));
}

function hubPath(lang: string, slug: string): string {
  return path.join(OUT_DIR, lang, `${slug}.json`);
}

const SHAPE = `{
  "title": "SEO title, max 60 chars, NO year. Pattern: '<Place> Travel Guide: <2-3 things people plan for>' e.g. 'Zadar Travel Guide: Beaches, Parking & Where to Stay'",
  "metaDescription": "max 155 chars, concrete, no year",
  "intro": "2 short paragraphs (~120 words total), separated by \\n\\n. Who the place suits, what it is like, when to come. Concrete, no filler.",
  "quickFacts": [ {"label": "short label", "value": "short concrete value"} ],
  "areas": [ {"name": "area / neighbourhood name", "bestFor": "who should stay here", "parking": "parking situation in a few words", "beach": "distance/type of nearest beach", "summary": "1-2 sentences"} ],
  "gettingThere": [ {"from": "city", "car": "km, approx drive time, main route, vignettes/tolls on the way", "other": "best non-car option (flight/bus/train/ferry) in one line"} ],
  "whenToGo": "one paragraph: month-by-month summary — sea temperature, crowds, prices, what is open",
  "faq": [ {"question": "...", "answer": "2-3 sentences, direct answer first"} ],
  "headings": {
    "quickFacts": "At a glance",
    "whereToStay": "Where to stay in <Place>",
    "gettingThere": "Getting to <Place>",
    "whenToGo": "When to go",
    "guides": "<Place> guides",
    "faq": "<Place> FAQ",
    "groups": {
      "gettingAround": "Parking & getting around",
      "planning": "Planning & where to stay",
      "timing": "When to go",
      "travelers": "Families, couples & travel styles",
      "activities": "Beaches & things to do",
      "food": "Food & drink",
      "comparisons": "Comparisons",
      "practical": "Practical info"
    },
    "car": "By car",
    "other": "Other options",
    "bestFor": "Best for",
    "parking": "Parking",
    "beach": "Beach"
  }
}`;

function buildPrompt(name: string): string {
  return `You are writing the main destination page for ${name}, Croatia on a travel-planning site.
Readers are PLANNING a trip (mostly driving from Germany, Austria, Hungary, Poland, Czechia, Slovenia, Italy)
and deciding whether to come, when, and where to stay.

Use up-to-date facts from web search. Be specific and correct: real neighbourhood names, real distances,
real routes. If you are not sure of a number, give a sensible range instead of inventing precision.
Do NOT invent star ratings, review scores or review counts.

Requirements:
- quickFacts: exactly 6 items — best months, sea temperature in August, nearest airport + distance,
  main beach type, price level vs. Croatian average, whether the old town/centre is walkable / car-free.
- areas: 3 to 5 real areas where visitors actually stay (centre/old town, beach areas, quieter suburbs, nearby villages if typical).
- gettingThere: exactly 6 origins in this order — Munich, Vienna, Budapest, Ljubljana, Prague, Kraków.
- faq: 6 questions people actually search before booking (is it worth visiting, how many days, best beach,
  do I need a car, where to park, is it good for families). Answer directly in the first sentence.

Voice: neutral, factual, third person. No "As a travel expert", no "nestled", "gem", "breathtaking",
"tapestry", "vibrant", no filler intros.

Return ONLY a JSON object (no markdown, no text before or after) with exactly this shape:
${SHAPE}`;
}

async function generateEnglish(slug: string): Promise<Record<string, unknown>> {
  const dest = DESTINATIONS.find(d => d.slug === slug);
  if (!dest) throw new Error(`Unknown destination: ${slug}`);
  const model = new GoogleGenerativeAI(apiKey()).getGenerativeModel({
    model: PRO_MODEL,
    // @ts-expect-error — googleSearch grounding tool; SDK types still use the 1.5-era name
    tools: [{ googleSearch: {} }],
  });
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await model.generateContent(buildPrompt(dest.name));
      const hub = parseJson(res.response.text());
      if (!hub.title || !Array.isArray(hub.faq) || !Array.isArray(hub.areas)) throw new Error('incomplete hub JSON');
      return hub;
    } catch (err) {
      console.log(`  ⚠️ EN attempt ${attempt} failed: ${(err as Error).message}`);
      if (attempt === 3) throw err;
      await new Promise(r => setTimeout(r, 20000));
    }
  }
  throw new Error('unreachable');
}

async function translate(hub: Record<string, unknown>, lang: LanguageCode): Promise<Record<string, unknown>> {
  const langName = LANGUAGES[lang].name;
  const model = new GoogleGenerativeAI(apiKey()).getGenerativeModel({
    model: TRANSLATE_MODEL,
    generationConfig: { responseMimeType: 'application/json' },
  });
  const prompt = `Translate every string value in this JSON from English into ${langName}.
Keep the exact same keys and structure. Keep place names in their usual local form
(Croatian names; use the ${langName} exonym only if it is the common one, e.g. "Spalato" is NOT common in Italian travel search — use what ${langName} speakers actually type into Google).
The "title" must read naturally in ${langName} and start with the place name as ${langName} speakers search for it.
Return only the JSON.

${JSON.stringify(hub)}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await model.generateContent(prompt);
      const out = parseJson(res.response.text());
      if (out.title === hub.title) throw new Error('title came back untranslated');
      return out;
    } catch (err) {
      console.log(`  ⚠️ ${lang} attempt ${attempt} failed: ${(err as Error).message}`);
      if (attempt === 3) throw err;
      await new Promise(r => setTimeout(r, 10000));
    }
  }
  throw new Error('unreachable');
}

function save(lang: string, slug: string, data: Record<string, unknown>): void {
  fs.mkdirSync(path.join(OUT_DIR, lang), { recursive: true });
  const out = { ...data, destination: slug, language: lang, updatedAt: new Date().toISOString() };
  fs.writeFileSync(hubPath(lang, slug), JSON.stringify(out, null, 2));
  console.log(`  ✅ Saved ${lang}/${slug}.json`);
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const langsArg = args.find(a => a.startsWith('--langs='));
  const langs = (langsArg ? langsArg.slice(8).split(',') : Object.keys(LANGUAGES)) as LanguageCode[];
  const requested = args.filter(a => !a.startsWith('--'));
  // Default: priority hubs first (highest traffic), then every other destination
  const slugs = requested.length > 0
    ? requested
    : [...PRIORITY_HUBS, ...DESTINATIONS.map(d => d.slug).filter(s => !PRIORITY_HUBS.includes(s))];

  for (const slug of slugs) {
    try {
      console.log(`\n🗺️  ${slug}`);
      let en: Record<string, unknown>;
      if (fs.existsSync(hubPath('en', slug)) && !force) {
        en = JSON.parse(fs.readFileSync(hubPath('en', slug), 'utf-8'));
      } else {
        console.log('  ├─ EN (Pro, grounded)...');
        en = await generateEnglish(slug);
        save('en', slug, en);
      }
      const { destination, language, updatedAt, ...enContent } = en;
      for (const lang of langs) {
        if (lang === 'en' || (fs.existsSync(hubPath(lang, slug)) && !force)) continue;
        console.log(`  ├─ ${lang}...`);
        try {
          save(lang, slug, await translate(enContent, lang));
        } catch (err) {
          console.log(`  ❌ ${lang}: ${(err as Error).message}`);
        }
      }
    } catch (err) {
      console.error(`❌ ${slug}: ${(err as Error).message}`);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
