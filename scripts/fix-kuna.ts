/**
 * Croatia switched to the euro on 1 Jan 2023, but ~110 articles still quote kuna
 * (HRK) — partly old EN originals ("meters accept HRK or EUR coins"), partly the
 * translator "adapting" euro prices into kuna. Kuna prices kill reader trust.
 *
 * Surgical edit, not a regeneration: Gemini Flash rewrites ONLY the sentences
 * that mention kuna and returns the article otherwise unchanged (pages that rank
 * keep their content).
 *
 *   npx tsx scripts/fix-kuna.ts --dry-run   # list affected files
 *   npx tsx scripts/fix-kuna.ts             # fix them
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { LANGUAGES } from '../src/config/languages';

const DIR = path.join(process.cwd(), 'src', 'content', 'articles');
// A kuna PRICE or the HRK code — not Dutch "kun" ("can") or other false friends
const KUNA = /\bHRK\b|\d[\d.,]*\s?(kn|kuna|kune|kun)\b/i;
const TEXT_FIELDS = ['title', 'metaDescription', 'quickAnswer', 'content', 'faq', 'tableData'] as const;

const model = () =>
  new GoogleGenerativeAI(process.env.GEMINI_API_KEY_1 || '').getGenerativeModel({
    model: 'gemini-2.5-flash',
    // A surgical sentence edit needs no reasoning; thinking tokens are billed
    // as output and were most of the cost of the first kuna run.
    generationConfig: { responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 0 } } as any,
  });

function affectedFiles(): string[] {
  const out: string[] = [];
  for (const lang of fs.readdirSync(DIR)) {
    for (const f of fs.readdirSync(path.join(DIR, lang))) {
      if (KUNA.test(fs.readFileSync(path.join(DIR, lang, f), 'utf-8'))) out.push(`${lang}/${f}`);
    }
  }
  return out;
}

async function fixFile(rel: string): Promise<boolean> {
  const file = path.join(DIR, rel);
  const article = JSON.parse(fs.readFileSync(file, 'utf-8'));
  const lang = rel.split('/')[0] as keyof typeof LANGUAGES;
  const text = Object.fromEntries(TEXT_FIELDS.filter(k => article[k] !== undefined).map(k => [k, article[k]]));

  const prompt = `This is a ${LANGUAGES[lang]?.name ?? 'English'} travel article (JSON) about Croatia.
Croatia replaced the kuna (HRK) with the euro (€) on 1 January 2023; kuna is no longer accepted anywhere.

Edit ONLY the parts that mention kuna/HRK/kn:
- A price given in both kuna and euro → keep only the euro amount.
- A price given only in kuna → convert at 7.5345 HRK = 1 € and round sensibly (e.g. "12 HRK" → "1.60 €").
- Claims that kuna is accepted or useful (e.g. "meters accept HRK or EUR") → say euro only.
- A purely historical remark about the kuna may stay only if it is clearly historical.
Keep everything else EXACTLY as it is: same language, wording, markdown, structure and keys.
Return the same JSON object.

${JSON.stringify(text)}`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await model().generateContent(prompt);
      const fixed = JSON.parse(res.response.text());
      if (!fixed.content || fixed.content.length < (text.content as string).length * 0.8) {
        throw new Error('content came back truncated');
      }
      Object.assign(article, fixed, { updatedAt: new Date().toISOString() });
      fs.writeFileSync(file, JSON.stringify(article, null, 2));
      const still = KUNA.test(JSON.stringify(fixed));
      console.log(`  ${still ? '⚠️ ' : '✅'} ${rel}${still ? ' (historical mention kept)' : ''}`);
      return true;
    } catch (err) {
      console.log(`  ❌ ${rel} attempt ${attempt}: ${(err as Error).message}`);
      if (attempt < 3) await new Promise(r => setTimeout(r, 10000));
    }
  }
  return false;
}

async function main() {
  const only = process.argv.slice(2).filter(a => !a.startsWith('--')); // e.g. hr/zadar-parking-difficulty.json
  const files = only.length > 0 ? only : affectedFiles();
  console.log(`${files.length} files mention kuna prices`);
  if (process.argv.includes('--dry-run')) {
    files.forEach(f => console.log('  ' + f));
    return;
  }
  let ok = 0;
  for (const f of files) if (await fixFile(f)) ok++;
  console.log(`\nFixed ${ok}/${files.length}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
