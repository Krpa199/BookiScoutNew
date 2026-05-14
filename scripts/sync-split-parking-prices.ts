/**
 * Sync Split parking zone prices across all Split parking/transport articles in all 13 languages.
 *
 * Master prices (per user decision):
 *   Zone 1 (Red)    = €2.00/hour
 *   Zone 2 (Yellow) = €1.50/hour
 *   Zone 3 (Green)  = €1.00/hour
 *
 * Strategy: regex replace the price token immediately after "Zone X (color)" mentions,
 * tolerating various number formats (€1.50, €1.50-€2.00, €3.00, ~€1.50, etc.) and
 * various per-hour suffixes (/hour, per hour, /hr, /h).
 *
 * Also normalizes the "up to €3.00 per hour" claim in split-parking-difficulty
 * to "around €2.00 per hour".
 *
 * Run: npx tsx scripts/sync-split-parking-prices.ts [--dry-run]
 */
import fs from 'fs';
import path from 'path';

type Article = { content?: string; faq?: Array<{ question: string; answer: string }>; tableData?: unknown; [k: string]: unknown };

const FILES = [
  'split-car-vs-no-car.json',
  'split-parking-difficulty.json',
  'split-parking.json',
  'split-transport.json',
];

// Localized "price" string per language
const PRICE_FORMATS: Record<string, (eur: string) => string> = {
  en: (eur) => `€${eur}/hour`,
  de: (eur) => `${eur.replace('.', ',')} €/Stunde`,
  it: (eur) => `${eur.replace('.', ',')} €/ora`,
  fr: (eur) => `${eur.replace('.', ',')} €/heure`,
  es: (eur) => `${eur.replace('.', ',')} €/hora`,
  pl: (eur) => `${eur.replace('.', ',')} €/godzinę`,
  nl: (eur) => `€${eur}/uur`,
  cz: (eur) => `${eur.replace('.', ',')} €/hodinu`,
  sk: (eur) => `${eur.replace('.', ',')} €/hodinu`,
  sl: (eur) => `${eur.replace('.', ',')} €/uro`,
  hu: (eur) => `${eur.replace('.', ',')} €/óra`,
  ru: (eur) => `${eur.replace('.', ',')} €/час`,
  hr: (eur) => `${eur.replace('.', ',')} €/sat`,
};

function syncPrices(text: string, lang: string = 'en'): { newText: string; changes: number } {
  let changes = 0;
  let result = text;
  const fmt = PRICE_FORMATS[lang] || PRICE_FORMATS.en;
  const priceFor = (eur: string) => fmt(eur);

  // Zone 1: any €X.XX/hour or €X.XX per hour or X.XX–Y.YY per hour appearing within 150 chars after "Zone 1"
  // We use 4 separate passes per zone for clarity.

  // For each zone, find "Zone N" mention then nearest €...hour pattern in the next 150 chars and rewrite
  type ZoneSpec = { zone: number; eur: string };
  const zones: ZoneSpec[] = [
    { zone: 1, eur: '2.00' },
    { zone: 2, eur: '1.50' },
    { zone: 3, eur: '1.00' },
  ];

  // "Zone word" variants across the 13 languages
  // EN: Zone   DE: Zone   IT: Zona   FR: Zone   ES: Zona   PL: Strefa
  // NL: Zone   CZ: Zóna   SK: Zóna   SL: Cona   HU: Zóna   RU: Зона   HR: Zona
  const zoneWord = '(?:Zone|Zona|Zóna|Strefa|Cona|Зона)';
  // HU uses "N. Zóna" pattern; we handle that as a separate pattern below.

  // Hour-unit variants across languages (include all inflected forms).
  // We use a lookahead instead of \b because JS \b only works on ASCII word boundaries,
  // which fails for Cyrillic (час) and other non-ASCII tokens.
  const wordEnd = '(?=[\\s,.;:!?)*\\]]|$)';
  const hourUnit = `(?:hour|hr|h|sat|ora|heure|hora|godzin[aęy]?|uur|hodin[auy]?|ur[aoe]?|óra|óra\\b|час|Stunde|hodinu)${wordEnd}`;

  // Per-prefix variants: "/", " per ", " an ", " na "
  const perSeparator = '(?:\\s*/\\s*|\\s+per\\s+|\\s+an\\s+|\\s+na\\s+|\\s+za\\s+)';

  // Currency token: € may come before OR after the number with optional space
  // Number: digits with . or , decimal separator
  const number = '\\d+(?:[.,]\\d{1,2})?';
  const currencyToken = '(?:€|евро|euró|EUR|euros?)';
  const currencyNumber = `(?:${currencyToken}\\s?${number}|${number}\\s?${currencyToken})`;
  const rangeNumber = `${currencyNumber}(?:\\s*[-–—]\\s*${currencyNumber})?`;
  const approx = '(?:~|approximately\\s+|around\\s+|about\\s+|cca\\.?\\s+|ca\\.?\\s+|околo\\s+|otprilike\\s+|priblizno\\s+|približno\\s+|circa\\s+|environ\\s+|aproximadamente\\s+|około\\s+|ungefähr\\s+|примерно\\s+|körülbelül\\s+)?';

  // Prefix character class: anything except sentence terminators, newline, digits, currency,
  // or the ~ approximator. This guarantees the prefix stops right before the price token.
  const prefixChars = '[^.!?\\n\\d€~]';

  for (const { zone, eur } of zones) {
    const pat = new RegExp(
      `(${zoneWord}\\s*${zone}${prefixChars}{0,180})` +
      `(${approx})` +
      rangeNumber +
      perSeparator +
      hourUnit,
      'gi'
    );
    result = result.replace(pat, (_match, prefix, approxToken) => {
      changes++;
      return `${prefix}${approxToken || ''}${priceFor(eur)}`;
    });

    // HU pattern: "N. Zóna" (number-first)
    const patHu = new RegExp(
      `(${zone}\\.\\s*Zóna${prefixChars}{0,180})` +
      `(${approx})` +
      rangeNumber +
      perSeparator +
      hourUnit,
      'gi'
    );
    result = result.replace(patHu, (_match, prefix, approxToken) => {
      changes++;
      return `${prefix}${approxToken || ''}${priceFor(eur)}`;
    });
  }

  // Special case (EN only — handles the "up to €3.00 per hour" overclaim in FAQ)
  if (lang === 'en') {
    result = result.replace(
      /(central\s+Zone\s*1[^.]*?)up\s+to\s+€\s?\d+(?:[.,]\d{1,2})?\s*(?:per\s+hour|\/hour|\/hr)/gi,
      (m, prefix) => { changes++; return `${prefix}around €2.00 per hour`; }
    );
  }

  return { newText: result, changes };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const root = path.join(process.cwd(), 'src', 'content', 'articles');
  const langs = fs.readdirSync(root).filter(l => fs.statSync(path.join(root, l)).isDirectory());

  let filesChanged = 0;
  let totalChanges = 0;

  for (const lang of langs) {
    for (const file of FILES) {
      const filepath = path.join(root, lang, file);
      if (!fs.existsSync(filepath)) continue;
      const raw = fs.readFileSync(filepath, 'utf-8');
      const article: Article = JSON.parse(raw);

      let fileChanges = 0;
      if (article.content) {
        const r = syncPrices(article.content, lang);
        if (r.changes > 0) { article.content = r.newText; fileChanges += r.changes; }
      }
      if (Array.isArray(article.faq)) {
        for (const f of article.faq) {
          const rQ = syncPrices(f.question, lang);
          if (rQ.changes > 0) { f.question = rQ.newText; fileChanges += rQ.changes; }
          const rA = syncPrices(f.answer, lang);
          if (rA.changes > 0) { f.answer = rA.newText; fileChanges += rA.changes; }
        }
      }
      // Also handle tableData if it has price strings
      if (Array.isArray(article.tableData)) {
        for (const row of article.tableData as Array<Record<string, unknown>>) {
          if (typeof row.price === 'string') {
            const r = syncPrices(row.price, lang);
            if (r.changes > 0) { row.price = r.newText; fileChanges += r.changes; }
          }
        }
      }

      if (fileChanges > 0) {
        filesChanged++;
        totalChanges += fileChanges;
        console.log(`[${lang}/${file}] ${fileChanges} price replacements`);
        if (!dryRun) {
          fs.writeFileSync(filepath, JSON.stringify(article, null, 2), 'utf-8');
        }
      }
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Files changed:  ${filesChanged}`);
  console.log(`Total changes:  ${totalChanges}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'WRITTEN'}`);
}

main().catch(err => { console.error(err); process.exit(1); });
