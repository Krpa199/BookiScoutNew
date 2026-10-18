/**
 * Translate existing English articles into the other 12 languages, with the
 * same guards as the generator (retry when a translation comes back English
 * or with a garbled title). Used by the daily review workflow after Claude
 * has checked and fixed the English.
 *
 *   npx tsx scripts/translate-articles.ts --file review-slugs.txt
 *   npx tsx scripts/translate-articles.ts slug1 slug2 ...
 *   add --force to overwrite translations that already exist
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';
import { LANGUAGES, LanguageCode } from '../src/config/languages';
import { translateChecked } from './article-generator';

const DIR = path.join(process.cwd(), 'src', 'content', 'articles');

function slugs(): string[] {
  const args = process.argv.slice(2).filter(a => a !== '--force');
  const f = args.indexOf('--file');
  if (f !== -1) return fs.readFileSync(args[f + 1], 'utf8').split(/\s+/).filter(Boolean);
  return args;
}

async function main() {
  const force = process.argv.includes('--force');
  const langs = (Object.keys(LANGUAGES) as LanguageCode[]).filter(l => l !== 'en');
  let ok = 0, failed = 0;
  for (const slug of slugs()) {
    const en = JSON.parse(fs.readFileSync(path.join(DIR, 'en', `${slug}.json`), 'utf8'));
    console.log(`\n🌍 ${slug}`);
    for (const lang of langs) {
      const file = path.join(DIR, lang, `${slug}.json`);
      if (fs.existsSync(file) && !force) continue;
      let saved = false;
      for (let attempt = 1; attempt <= 3 && !saved; attempt++) {
        try {
          const t = await translateChecked(en, lang);
          fs.mkdirSync(path.dirname(file), { recursive: true });
          fs.writeFileSync(file, JSON.stringify({ ...t, slug, language: lang, generatedAt: new Date().toISOString() }, null, 2));
          saved = true;
        } catch (e) {
          console.log(`  ⚠️ ${lang} attempt ${attempt}: ${(e as Error).message}`);
        }
      }
      saved ? ok++ : failed++;
      console.log(`  ${saved ? '✅' : '❌'} ${lang}`);
    }
  }
  console.log(`\nTranslated ${ok}, failed ${failed}`);
}

main();
