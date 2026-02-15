/**
 * Fix articles broken by the nested JSON bug:
 * 1. Regenerate truncated EN articles
 * 2. Retranslate all their language versions
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';
import { translateArticle, generateArticle, ArticleData, getRemainingCalls } from './gemini';
import { LANGUAGES, LanguageCode } from '../src/config/languages';
import { DESTINATIONS, THEMES } from '../src/config/destinations';

const ARTICLES_DIR = path.join(process.cwd(), 'src', 'content', 'articles');

// EN articles that still have nested JSON and need regeneration
const REGENERATE_EN: { destination: string; theme: string }[] = [
  { destination: 'opatija', theme: 'wifi-quality' },
  { destination: 'porec', theme: 'mobile-coverage' },
];

async function main() {
  console.log('=== Fix Remaining Broken Articles ===\n');

  const remaining = getRemainingCalls();
  console.log(`API Capacity: Pro=${remaining.pro}, Flash=${remaining.flash}\n`);

  let regenerated = 0;
  let translated = 0;
  let failed = 0;

  const allLangs = (Object.keys(LANGUAGES) as LanguageCode[]).filter(l => l !== 'en');

  // Step 1: Regenerate EN articles and translate them
  for (const { destination, theme } of REGENERATE_EN) {
    const slug = `${destination}-${theme}`;
    const enPath = path.join(ARTICLES_DIR, 'en', `${slug}.json`);

    const cap = getRemainingCalls();
    if (cap.pro <= 0) {
      console.log('  Pro API exhausted.');
      break;
    }

    console.log(`\nRegenerating EN: ${slug}...`);
    const dest = DESTINATIONS.find(d => d.slug === destination);
    const th = THEMES.find(t => t === theme);
    if (!dest || !th) {
      console.log(`  Config not found for ${destination}/${theme}, skipping`);
      failed++;
      continue;
    }

    try {
      const article = await generateArticle(dest, th, 'en');

      // Verify the content is not nested JSON
      if (article.content.trim().startsWith('```json') ||
          (article.content.trim().startsWith('{"') && article.content.includes('"content"'))) {
        console.log(`  ⚠️ Generated article still has nested JSON! Retrying...`);
        const retry = await generateArticle(dest, th, 'en');
        if (retry.content.trim().startsWith('```json') ||
            (retry.content.trim().startsWith('{"') && retry.content.includes('"content"'))) {
          console.log(`  ❌ Still nested after retry, skipping`);
          failed++;
          continue;
        }
        Object.assign(article, retry);
      }

      // Preserve existing metadata (image, etc.)
      const existing = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
      const merged = {
        ...existing,
        title: article.title,
        metaDescription: article.metaDescription,
        content: article.content,
        faq: article.faq,
        quickAnswer: article.quickAnswer,
        tableData: article.tableData,
      };

      fs.writeFileSync(enPath, JSON.stringify(merged, null, 2));
      regenerated++;
      console.log(`  ✅ EN done: "${article.title}"`);

      // Translate to all languages
      for (const lang of allLangs) {
        const langPath = path.join(ARTICLES_DIR, lang, `${slug}.json`);
        if (!fs.existsSync(langPath)) continue;

        const flashCap = getRemainingCalls();
        if (flashCap.flash <= 0) {
          console.log('  Flash API exhausted.');
          break;
        }

        try {
          const result = await translateArticle(merged as ArticleData, lang);
          const langExisting = JSON.parse(fs.readFileSync(langPath, 'utf-8'));
          const langMerged = {
            ...langExisting,
            title: result.title,
            metaDescription: result.metaDescription,
            content: result.content,
            faq: result.faq,
            quickAnswer: result.quickAnswer,
            tableData: result.tableData,
          };
          fs.writeFileSync(langPath, JSON.stringify(langMerged, null, 2));
          translated++;
          console.log(`    ${lang} done`);
        } catch (err: any) {
          failed++;
          console.log(`    ${lang} FAILED: ${err.message}`);
        }
      }
    } catch (err: any) {
      failed++;
      console.log(`  ❌ EN FAILED: ${err.message}`);
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Results: ${regenerated} EN regenerated, ${translated} translated, ${failed} failed`);
}

main().catch(console.error);
