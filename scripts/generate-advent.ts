/**
 * Generate Advent guides on demand (seasonal — must be live before late November).
 *
 *   npx tsx scripts/generate-advent.ts zagreb --en-only   # one test article, EN only
 *   npx tsx scripts/generate-advent.ts                    # all advent destinations, all languages
 *
 * If the EN article already exists, only the missing translations are filled in
 * (use --force to regenerate from scratch). Grounding is forced on so 2026
 * dates/prices come from web search.
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
process.env.GEMINI_GROUNDING = 'on';

import fs from 'fs';
import path from 'path';
import { THEME_DESTINATIONS } from '../src/config/destinations';
import { LANGUAGES, LanguageCode } from '../src/config/languages';
import { generateSingleArticle } from './article-generator';
import { translateArticle } from './gemini';

const ARTICLES_DIR = path.join(process.cwd(), 'src', 'content', 'articles');

function articlePath(lang: string, slug: string): string {
  return path.join(ARTICLES_DIR, lang, `${slug}-advent.json`);
}

// translateArticle occasionally hands back the English text unchanged (4 of 144
// on the first run). Treat a translation with the EN title as missing.
function dropUntranslated(slug: string, enTitle: string): void {
  for (const lang of Object.keys(LANGUAGES)) {
    if (lang === 'en' || !fs.existsSync(articlePath(lang, slug))) continue;
    const t = JSON.parse(fs.readFileSync(articlePath(lang, slug), 'utf-8'));
    if (t.title === enTitle) {
      console.log(`  🔁 ${lang}/${slug}-advent is still English — retranslating`);
      fs.unlinkSync(articlePath(lang, slug));
    }
  }
}

async function fillMissingTranslations(slug: string): Promise<void> {
  const en = JSON.parse(fs.readFileSync(articlePath('en', slug), 'utf-8'));
  dropUntranslated(slug, en.title);
  const missing = (Object.keys(LANGUAGES) as LanguageCode[])
    .filter(lang => lang !== 'en' && !fs.existsSync(articlePath(lang, slug)));

  if (missing.length === 0) {
    console.log(`⏭️  ${slug}-advent complete in all languages`);
    return;
  }

  console.log(`\n🌍 ${slug}-advent: translating ${missing.length} missing languages`);
  for (const lang of missing) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const translated = await translateArticle(en, lang);
        // Keep EN metadata + image, swap in translated text (same shape saveArticle writes)
        const out = { ...en, ...translated, language: lang, generatedAt: new Date().toISOString() };
        fs.writeFileSync(articlePath(lang, slug), JSON.stringify(out, null, 2));
        console.log(`  ✅ Saved: ${lang}/${slug}-advent.json`);
        break;
      } catch (error) {
        console.log(`  ⚠️ ${lang} attempt ${attempt} failed: ${(error as Error).message}`);
        if (attempt < 3) await new Promise(r => setTimeout(r, 30000));
      }
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const enOnly = args.includes('--en-only');
  const force = args.includes('--force');
  const requested = args.filter(a => !a.startsWith('--'));
  const slugs = requested.length > 0 ? requested : [...(THEME_DESTINATIONS.advent || [])];

  for (const slug of slugs) {
    try {
      if (fs.existsSync(articlePath('en', slug)) && !force) {
        if (!enOnly) await fillMissingTranslations(slug);
        continue;
      }
      await generateSingleArticle(slug, 'advent', enOnly ? ['en'] : undefined);
      if (!enOnly) await fillMissingTranslations(slug);
    } catch (error) {
      // One destination failing must not stop the rest
      console.error(`❌ ${slug}: ${(error as Error).message}`);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
