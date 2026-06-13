/**
 * Re-generate cover images ONLY for articles that fell back to the generic
 * "Travel and vacation concept" stock photo while the gemini-2.0-flash
 * validation model was dead (2026-06-02 → 2026-06-12).
 *
 * Now that validation uses gemini-flash-latest again, this re-fetches a proper
 * destination+theme image for each affected article and writes it across all
 * 13 locales (image is shared per slug, which is correct).
 *
 * Designed to run in GitHub Actions where the real API keys live and there is
 * no TLS interception. Locally Mario's network blocks the API calls.
 *
 * Run: npx tsx scripts/refix-fallback-images.ts
 * Env knobs:
 *   LIMIT=50   process at most N destination+theme combos (for a test run)
 *   DRY_RUN=1  fetch + log but do NOT write any files
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';
import { getArticleImage } from './image-service';

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'articles');
const FALLBACK_ALT = 'Travel and vacation concept';
const LIMIT = process.env.LIMIT ? parseInt(process.env.LIMIT, 10) : Infinity;
const DRY_RUN = process.env.DRY_RUN === '1';
// Which articles to re-do:
//   MODE=fallback (default) — only the generic "suitcase" fallback articles.
//   MODE=dupes — also re-do articles whose image is shared by more than
//     DUPE_THRESHOLD different articles (default 5). Catches images taken
//     without validation after the old daily cap was hit, and leftover repeats.
const MODE = (process.env.MODE || 'fallback').toLowerCase();
const DUPE_THRESHOLD = process.env.DUPE_THRESHOLD ? parseInt(process.env.DUPE_THRESHOLD, 10) : 5;

interface Article {
  destination?: string;
  theme?: string;
  imageUrl?: string;
  imageAlt?: string;
  generatedAt?: string;
  [key: string]: unknown;
}

// ORDER=newest (default) processes the most recently generated articles first,
// so LIMIT=20 fixes exactly the newest 20. ORDER=alpha keeps filename order.
const ORDER = (process.env.ORDER || 'newest').toLowerCase();

function readJson(file: string): Article | null {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return null;
  }
}

async function main() {
  console.log(`\n🩹 Re-fixing fallback cover images${DRY_RUN ? ' (DRY RUN — no writes)' : ''}\n`);

  const langs = fs.readdirSync(CONTENT_DIR).filter((d) =>
    fs.statSync(path.join(CONTENT_DIR, d)).isDirectory()
  );

  // 1) Find affected destination+theme combos from the EN locale.
  const enDir = path.join(CONTENT_DIR, 'en');
  const enFiles = fs.readdirSync(enDir).filter((f) => f.endsWith('.json'));

  // Read every EN article once: keep its key fields and tally image usage so we
  // can target both fallback articles and over-shared (likely unvalidated) ones.
  const all: { destination: string; theme: string; slug: string; generatedAt: string; alt: string; img: string }[] = [];
  const imageCount = new Map<string, number>();
  for (const f of enFiles) {
    const a = readJson(path.join(enDir, f));
    if (!a || !a.destination || !a.theme) continue;
    const img = (a.imageUrl || '').split('?')[0];
    all.push({
      destination: a.destination,
      theme: a.theme,
      slug: f.replace('.json', ''),
      generatedAt: a.generatedAt || '',
      alt: a.imageAlt || '',
      img,
    });
    if (img) imageCount.set(img, (imageCount.get(img) || 0) + 1);
  }

  // Select which articles to re-do based on MODE.
  const affected = all.filter((a) => {
    const isFallback = a.alt === FALLBACK_ALT;
    if (MODE === 'dupes') {
      const overShared = a.img !== '' && (imageCount.get(a.img) || 0) > DUPE_THRESHOLD;
      return isFallback || overShared;
    }
    return isFallback;
  });
  console.log(`🔎 MODE=${MODE}${MODE === 'dupes' ? ` (also re-doing images shared by >${DUPE_THRESHOLD} articles)` : ''}`);

  if (ORDER === 'newest') {
    affected.sort((x, y) => y.generatedAt.localeCompare(x.generatedAt));
  } else {
    affected.sort((x, y) => x.slug.localeCompare(y.slug));
  }

  // Dedupe by destination+theme (image is shared per combo) while preserving order.
  const combos = new Map<string, { destination: string; theme: string }>();
  const slugsForCombo = new Map<string, string[]>();
  for (const a of affected) {
    const key = `${a.destination}-${a.theme}`;
    if (!combos.has(key)) combos.set(key, { destination: a.destination, theme: a.theme });
    (slugsForCombo.get(key) || slugsForCombo.set(key, []).get(key)!).push(a.slug);
  }

  const comboList = [...combos.values()].slice(0, LIMIT);
  console.log(`📋 ${combos.size} affected combos found (order=${ORDER}); processing ${comboList.length}`);
  console.log(`🎯 Articles to be changed (EN slugs; same image applied to all 13 locales):`);
  for (const c of comboList) {
    console.log(`   - ${slugsForCombo.get(`${c.destination}-${c.theme}`)!.join(', ')}`);
  }
  console.log('');

  // 2) Fetch a fresh validated image for each combo.
  const imageByCombo = new Map<string, Awaited<ReturnType<typeof getArticleImage>>>();
  let i = 0;
  for (const { destination, theme } of comboList) {
    i++;
    console.log(`\n[${i}/${comboList.length}] ${destination} / ${theme}`);
    const img = await getArticleImage(theme, destination);
    if (img) {
      const stillFallback = img.imageAlt === FALLBACK_ALT;
      console.log(`  ${stillFallback ? '🧳 fallback' : '✅ validated'} (${img.imageSource}): ${img.imageUrl.split('/').pop()?.split('?')[0]}`);
      imageByCombo.set(`${destination}-${theme}`, img);
    } else {
      console.log('  ⚠️ no image returned');
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  if (DRY_RUN) {
    const validated = [...imageByCombo.values()].filter((v) => v && v.imageAlt !== FALLBACK_ALT).length;
    console.log(`\n— DRY RUN done. ${validated}/${imageByCombo.size} combos got a validated (non-fallback) image. No files written.\n`);
    return;
  }

  // 3) Write the new image onto every locale's copy of each affected slug.
  //    An article qualifies if it's on the fallback image, or (dupes mode) its
  //    current image is over-shared. We only touch combos we actually re-fetched.
  let updated = 0;
  for (const lang of langs) {
    const langDir = path.join(CONTENT_DIR, lang);
    const files = fs.readdirSync(langDir).filter((f) => f.endsWith('.json'));
    for (const f of files) {
      const fp = path.join(langDir, f);
      const a = readJson(fp);
      if (!a || !a.destination || !a.theme) continue;
      const img = imageByCombo.get(`${a.destination}-${a.theme}`);
      if (!img) continue;
      const curImg = (a.imageUrl || '').split('?')[0];
      const isFallback = a.imageAlt === FALLBACK_ALT;
      const overShared = MODE === 'dupes' && curImg !== '' && (imageCount.get(curImg) || 0) > DUPE_THRESHOLD;
      if (!isFallback && !overShared) continue;
      const merged = { ...a, ...img };
      fs.writeFileSync(fp, JSON.stringify(merged, null, 2));
      updated++;
    }
  }

  console.log(`\n✅ Updated ${updated} article files across ${langs.length} locales.\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
