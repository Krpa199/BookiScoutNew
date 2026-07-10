/**
 * Translate MISSING articles — fill gaps where an EN article has no counterpart
 * file in a target-language folder at all.
 *
 * Differs from retranslate-english-articles.ts: that one fixes EXISTING files
 * whose content came back in English. This one creates files that don't exist yet.
 *
 * For every non-EN language it:
 *   1. Diffs the language folder against en/ to find missing slugs
 *   2. Reads the EN source, calls translateArticle()
 *   3. Sets language + generatedAt, writes a NEW file in the language folder
 *
 * Usage:
 *   npx tsx scripts/translate-missing-articles.ts --dry-run        # list gaps only
 *   npx tsx scripts/translate-missing-articles.ts --lang hr        # one language
 *   npx tsx scripts/translate-missing-articles.ts                  # all languages
 *   npx tsx scripts/translate-missing-articles.ts --limit 10       # cap per run
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { translateArticle, ArticleData, getRemainingCalls } from './gemini';
import { LANGUAGES, LanguageCode } from '../src/config/languages';

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'articles');

// In CI, commit+push progress every COMMIT_EVERY translations so a run that gets
// interrupted (timeout, crash) never loses completed work — the next run just
// picks up from what's already on origin/main. No-op locally (COMMIT_EVERY unset).
const COMMIT_EVERY = process.env.COMMIT_EVERY ? parseInt(process.env.COMMIT_EVERY, 10) : 0;

function commitProgress(count: number): void {
  if (!COMMIT_EVERY) return;
  try {
    execSync('git add src/content/articles', { stdio: 'ignore' });
    // Nothing staged? skip.
    try {
      execSync('git diff --staged --quiet');
      return; // no changes
    } catch {
      /* there ARE staged changes — proceed */
    }
    execSync(`git commit -m "🌍 Translate missing articles (progress: ${count})"`, { stdio: 'ignore' });
    // Rebase on any concurrent pushes, then push (best-effort, don't crash the run).
    execSync('git fetch origin main', { stdio: 'ignore' });
    try {
      execSync('git rebase origin/main', { stdio: 'ignore' });
    } catch {
      execSync('git rebase --abort', { stdio: 'ignore' });
    }
    execSync('git push origin main', { stdio: 'ignore' });
    console.log(`   💾 Progress committed & pushed (${count} done)`);
  } catch (e: any) {
    console.log(`   ⚠️ Progress commit failed (non-fatal): ${e.message}`);
  }
}

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run') || process.env.DRY_RUN === '1';
const langIdx = args.indexOf('--lang');
const FILTER_LANG =
  langIdx !== -1
    ? (args[langIdx + 1] as LanguageCode)
    : (process.env.LANG_FILTER as LanguageCode) || undefined;
// Limit from --limit flag or LIMIT env (for CI). Blank/absent = no limit.
const limitIdx = args.indexOf('--limit');
const LIMIT =
  limitIdx !== -1
    ? parseInt(args[limitIdx + 1], 10)
    : process.env.LIMIT
      ? parseInt(process.env.LIMIT, 10)
      : Infinity;

interface MissingItem {
  lang: LanguageCode;
  filename: string;
  enFilepath: string;
  targetFilepath: string;
}

function findMissing(filterLang?: LanguageCode): MissingItem[] {
  const missing: MissingItem[] = [];
  const enDir = path.join(CONTENT_DIR, 'en');
  const enFiles = new Set(fs.readdirSync(enDir).filter((f) => f.endsWith('.json')));

  const languages = filterLang
    ? [filterLang]
    : (Object.keys(LANGUAGES) as LanguageCode[]);

  for (const lang of languages) {
    if (lang === 'en') continue;

    const langDir = path.join(CONTENT_DIR, lang);
    if (!fs.existsSync(langDir)) {
      fs.mkdirSync(langDir, { recursive: true });
    }
    const existing = new Set(
      fs.readdirSync(langDir).filter((f) => f.endsWith('.json'))
    );

    for (const filename of enFiles) {
      if (!existing.has(filename)) {
        missing.push({
          lang,
          filename,
          enFilepath: path.join(enDir, filename),
          targetFilepath: path.join(langDir, filename),
        });
      }
    }
  }

  return missing;
}

async function main() {
  if (FILTER_LANG && !LANGUAGES[FILTER_LANG]) {
    console.error(`❌ Unknown language: ${FILTER_LANG}`);
    process.exit(1);
  }

  const missing = findMissing(FILTER_LANG);

  // Report gaps grouped by language
  const byLang: Record<string, number> = {};
  for (const m of missing) byLang[m.lang] = (byLang[m.lang] || 0) + 1;

  console.log(`\n📊 Missing translations:`);
  for (const [lang, n] of Object.entries(byLang).sort()) {
    console.log(`   ${lang}: ${n} missing`);
  }
  console.log(`   TOTAL: ${missing.length} translations to create\n`);

  if (DRY_RUN) {
    console.log('(dry-run — listing first 60 gaps, nothing written)\n');
    for (const m of missing.slice(0, 60)) {
      console.log(`   ${m.lang}/${m.filename}`);
    }
    return;
  }

  let successCount = 0;
  let failCount = 0;
  let done = 0;

  for (const item of missing) {
    if (done >= LIMIT) {
      console.log(`\n⏹  Hit --limit ${LIMIT}, stopping.`);
      break;
    }
    done++;

    const langName = LANGUAGES[item.lang].name;
    console.log(
      `\n[${done}/${Math.min(missing.length, LIMIT)}] ${item.lang} (${langName}) ← ${item.filename}`
    );

    try {
      const enArticle: ArticleData = JSON.parse(
        fs.readFileSync(item.enFilepath, 'utf-8')
      );

      const translated = await translateArticle(enArticle, item.lang);

      // Guard: if it came back in English, retry once
      if (translated.title === enArticle.title) {
        console.log(`  ⚠️ Title unchanged (still English?), retrying once...`);
        const retry = await translateArticle(enArticle, item.lang);
        if (retry.title !== enArticle.title) {
          Object.assign(translated, retry);
        } else {
          console.log(`  ❌ Still English after retry, skipping`);
          failCount++;
          continue;
        }
      }

      // Build the new file: EN metadata (image, coords, destination) + translated text
      const newArticle = {
        ...enArticle,
        title: translated.title,
        metaDescription: translated.metaDescription,
        slug: enArticle.slug,
        content: translated.content,
        faq: translated.faq,
        quickAnswer: translated.quickAnswer,
        tableData: translated.tableData || enArticle.tableData,
        language: item.lang,
        generatedAt: new Date().toISOString(),
      };

      fs.writeFileSync(item.targetFilepath, JSON.stringify(newArticle, null, 2));
      console.log(`  ✅ Created: "${translated.title}"`);
      successCount++;

      if (COMMIT_EVERY && successCount % COMMIT_EVERY === 0) {
        commitProgress(successCount);
      }
    } catch (error: any) {
      console.log(`  ❌ Error: ${error.message}`);
      failCount++;

      if (error.message?.includes('exhausted')) {
        console.log(`\n🛑 API keys exhausted — stopping. Re-run tomorrow to continue.`);
        break;
      }
    }
  }

  const remaining = getRemainingCalls();
  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Created: ${successCount}`);
  console.log(`❌ Failed:  ${failCount}`);
  console.log(`🔑 API calls remaining: Pro=${remaining.pro}, Flash=${remaining.flash}`);
  console.log(`${'='.repeat(50)}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
