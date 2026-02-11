/**
 * Retranslate articles that have English content in non-English language files.
 * These articles lost their translations due to the Gemini nested JSON bug.
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';
import { translateArticle, ArticleData, getRemainingCalls } from './gemini';
import { LANGUAGES, LanguageCode } from '../src/config/languages';

const ARTICLES_DIR = path.join(process.cwd(), 'src', 'content', 'articles');

// The 18 affected slugs
const AFFECTED_SLUGS = [
  'pula-apartments', 'pula-families-with-teens', 'pula-ferry-connections',
  'pula-first-time-visitors', 'pula-hidden-gems', 'pula-parking-difficulty',
  'pula-parking', 'pula-public-transport-quality', 'pula-vs-dubrovnik',
  'pula-vs-split', 'pula-vs-zadar', 'pula-wifi-quality', 'zadar-family',
  'pula-car-vs-no-car', 'pula-coast-vs-inland', 'pula-local-food',
  'pula-weather-by-month', 'pula-budget',
];

async function main() {
  const allLanguages = Object.keys(LANGUAGES) as LanguageCode[];
  const nonEnLanguages = allLanguages.filter(l => l !== 'en');

  console.log(`Retranslating ${AFFECTED_SLUGS.length} articles into ${nonEnLanguages.length} languages...\n`);

  const remaining = getRemainingCalls();
  console.log(`API Capacity: Flash=${remaining.flash} calls\n`);

  let translated = 0;
  let skipped = 0;
  let failed = 0;

  for (const slug of AFFECTED_SLUGS) {
    // Load the EN version as source
    const enPath = path.join(ARTICLES_DIR, 'en', `${slug}.json`);
    if (!fs.existsSync(enPath)) {
      console.log(`  EN source not found: ${slug}, skipping`);
      continue;
    }

    const enArticle: ArticleData = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
    console.log(`\n${slug} (EN title: "${enArticle.title}")`);

    for (const lang of nonEnLanguages) {
      const langPath = path.join(ARTICLES_DIR, lang, `${slug}.json`);
      if (!fs.existsSync(langPath)) {
        continue;
      }

      // Check if this language file already has proper translation
      const existing = JSON.parse(fs.readFileSync(langPath, 'utf-8'));
      if (existing.title !== enArticle.title && existing.content !== enArticle.content) {
        // Already has different content = likely already translated
        skipped++;
        continue;
      }

      // Check API capacity
      const cap = getRemainingCalls();
      if (cap.flash <= 0) {
        console.log(`  API exhausted, stopping.`);
        console.log(`\nResults: ${translated} translated, ${skipped} skipped, ${failed} failed`);
        return;
      }

      console.log(`  Translating to ${lang}...`);
      try {
        const result = await translateArticle(enArticle, lang);

        // Preserve metadata from existing file (image, destination, etc.)
        const merged = {
          ...existing,
          title: result.title,
          metaDescription: result.metaDescription,
          content: result.content,
          faq: result.faq,
          quickAnswer: result.quickAnswer,
          tableData: result.tableData,
        };

        fs.writeFileSync(langPath, JSON.stringify(merged, null, 2));
        translated++;
        console.log(`  -> ${lang} done`);
      } catch (err: any) {
        failed++;
        console.log(`  -> ${lang} FAILED: ${err.message}`);

        if (err.message.includes('exhausted')) {
          console.log(`\nAPI exhausted. Results: ${translated} translated, ${skipped} skipped, ${failed} failed`);
          return;
        }
      }
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Results: ${translated} translated, ${skipped} skipped, ${failed} failed`);
}

main().catch(console.error);
