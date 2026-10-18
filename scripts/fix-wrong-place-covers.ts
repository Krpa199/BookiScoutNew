/**
 * The old fallback image pool gave many articles a cover of ANOTHER place
 * (Biograd's first-timer guide showing Supetar, Bol apartments showing Split).
 * No API: a cover counts as wrong when its alt text names another destination;
 * it is replaced by a cover already used — and verified by its caption — for
 * the article's own destination, least-used first. All 13 languages get the
 * same cover, as the generator does.
 *
 *   npx tsx scripts/fix-wrong-place-covers.ts --dry-run [--limit N]
 *   npx tsx scripts/fix-wrong-place-covers.ts [--only slug,slug]
 */
import fs from 'fs';
import path from 'path';

const DIR = path.join(process.cwd(), 'src', 'content', 'articles');
const IMG = ['imageUrl', 'imageAlt', 'imageCredit', 'imageCreditUrl', 'imageSource'] as const;
const strip = (s?: string) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const words = (s?: string) => ` ${strip(s).replace(/[^a-z ]/g, ' ')} `;

// Places that belong to a destination (a Supetar photo is right for Brač).
const NEAR: Record<string, string[]> = {
  brac: ['supetar', 'zlatni rat', 'bol'], bol: ['zlatni rat', 'brac'], hvar: ['hvar town', 'stari grad', 'jelsa'],
  krk: ['baska'], losinj: ['mali losinj'], krka: ['skradin', 'sibenik'], 'biograd na moru': ['biograd'],
};
const ROUTE_THEMES = /day-trips|island-hopping|road-trip|sailing|itinerary|vs-istria/;

function main() {
  const dry = process.argv.includes('--dry-run');
  const li = process.argv.indexOf('--limit');
  const limit = li !== -1 ? Number(process.argv[li + 1]) : Infinity;
  const oi = process.argv.indexOf('--only');
  const only = oi !== -1 ? new Set(process.argv[oi + 1].split(',')) : null;
  // Covers rejected on visual inspection (captions can be wrong: a "Rovinj" photo of another town)
  const xi = process.argv.indexOf('--exclude');
  const excluded = new Set(xi !== -1 ? fs.readFileSync(process.argv[xi + 1], 'utf8').split('\n').map(s => s.trim()).filter(Boolean) : []);
  // Optional: only covers that were inspected and approved
  const ai = process.argv.indexOf('--allow');
  const allowed = ai !== -1 ? new Set(fs.readFileSync(process.argv[ai + 1], 'utf8').split('\n').map(s => s.trim()).filter(Boolean)) : null;

  const en = fs.readdirSync(path.join(DIR, 'en')).map(f => JSON.parse(fs.readFileSync(path.join(DIR, 'en', f), 'utf8')));
  const places = [...new Set(en.map(a => strip(a.destinationName)).concat(
    ['supetar', 'hvar town', 'stari grad', 'jelsa', 'baska', 'mali losinj', 'zlatni rat', 'skradin', 'brac', 'dubrovnik', 'split', 'zadar',
     'sibenik', 'rovinj', 'pula', 'porec', 'korcula', 'makarska', 'primosten', 'trogir', 'opatija', 'rijeka', 'zagreb', 'plitvice']))];

  const otherPlace = (a: any) => {
    const own = strip(a.destinationName), alt = words(a.imageAlt);
    return places.filter(n => n !== own && alt.includes(` ${n} `) && !(NEAR[own] || []).includes(n) && !strip(a.slug).includes(n.replace(/ /g, '-')));
  };
  const ownPlace = (a: any) => {
    const own = strip(a.destinationName).split(' ')[0];
    return words(a.imageAlt).includes(` ${own}`) || (NEAR[strip(a.destinationName)] || []).some(n => words(a.imageAlt).includes(` ${n} `));
  };

  const wrong = en.filter(a => !ROUTE_THEMES.test(a.theme) && otherPlace(a).length && (!only || only.has(a.slug)));
  const uses = new Map<string, number>();
  for (const a of en) uses.set(a.imageUrl, (uses.get(a.imageUrl) || 0) + 1);
  const pool: Record<string, any[]> = {};
  for (const a of en) if (a.imageUrl && !excluded.has(a.imageUrl) && (!allowed || allowed.has(a.imageUrl)) && !otherPlace(a).length && ownPlace(a)) {
    const list = (pool[a.destination] ||= []);
    if (!list.some(x => x.imageUrl === a.imageUrl)) list.push(a);
  }

  let fixed = 0, noCandidate: string[] = [];
  for (const a of wrong) {
    if (fixed >= limit) break;
    const cands = (pool[a.destination] || []).sort((x, y) => (uses.get(x.imageUrl) || 0) - (uses.get(y.imageUrl) || 0));
    if (!cands.length) { noCandidate.push(a.slug); continue; }
    const src = cands[0];
    uses.set(src.imageUrl, (uses.get(src.imageUrl) || 0) + 1);
    uses.set(a.imageUrl, (uses.get(a.imageUrl) || 1) - 1);
    console.log(`${a.slug}\n   − ${a.imageAlt}\n   + ${src.imageAlt}  (${src.imageUrl.slice(0, 70)})`);
    if (!dry) {
      for (const lang of fs.readdirSync(DIR)) {
        const p = path.join(DIR, lang, `${a.slug}.json`);
        if (!fs.existsSync(p)) continue;
        const t = JSON.parse(fs.readFileSync(p, 'utf8'));
        for (const k of IMG) if (src[k] !== undefined) t[k] = src[k]; else delete t[k];
        fs.writeFileSync(p, JSON.stringify(t, null, 2));
      }
    }
    fixed++;
  }
  console.log(`\nwrong-place covers: ${wrong.length}, replaced ${fixed}, no same-place cover available: ${noCandidate.length}`);
  if (noCandidate.length) console.log('  ' + noCandidate.join(' '));
}

main();
