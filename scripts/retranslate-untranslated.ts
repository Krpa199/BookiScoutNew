/**
 * Re-translate articles that were saved in English under another language
 * (translation failed and the EN text was stored as-is — ~600 files).
 * Detects them by title AND opening identical to the EN original, retranslates
 * with the current prompt (euro prices, native heading case), keeps image data.
 *
 *   npx tsx scripts/retranslate-untranslated.ts --dry-run
 *   npx tsx scripts/retranslate-untranslated.ts
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';
import { translateArticle, ArticleData } from './gemini';
import { LanguageCode } from '../src/config/languages';

const DIR = path.join(process.cwd(), 'src', 'content', 'articles');

function untranslated(): string[] {
  const out: string[] = [];
  for (const lang of fs.readdirSync(DIR)) {
    if (lang === 'en') continue;
    for (const f of fs.readdirSync(path.join(DIR, lang))) {
      const enFile = path.join(DIR, 'en', f);
      if (!fs.existsSync(enFile)) continue;
      const a = JSON.parse(fs.readFileSync(path.join(DIR, lang, f), 'utf-8'));
      const en = JSON.parse(fs.readFileSync(enFile, 'utf-8'));
      if (a.title === en.title && (a.content || '').slice(0, 200) === (en.content || '').slice(0, 200)) {
        out.push(`${lang}/${f}`);
      }
    }
  }
  return out;
}

async function main() {
  const files = untranslated();
  console.log(`${files.length} articles stored in English under another language`);
  if (process.argv.includes('--dry-run')) return;

  let ok = 0;
  for (const rel of files) {
    const [lang, f] = rel.split('/');
    const en = JSON.parse(fs.readFileSync(path.join(DIR, 'en', f), 'utf-8')) as ArticleData & Record<string, unknown>;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const t = await translateArticle(en, lang as LanguageCode);
        if (t.title === en.title) throw new Error('came back untranslated');
        const out = { ...en, ...t, language: lang, updatedAt: new Date().toISOString() };
        fs.writeFileSync(path.join(DIR, lang, f), JSON.stringify(out, null, 2));
        console.log(`  ✅ ${rel}`);
        ok++;
        break;
      } catch (err) {
        console.log(`  ⚠️ ${rel} attempt ${attempt}: ${(err as Error).message}`);
        if (attempt < 3) await new Promise(r => setTimeout(r, 15000));
      }
    }
  }
  console.log(`\nRetranslated ${ok}/${files.length}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
