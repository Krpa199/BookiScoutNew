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

interface Article {
  destination?: string;
  theme?: string;
  imageUrl?: string;
  imageAlt?: string;
  [key: string]: unknown;
}

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

  const combos = new Map<string, { destination: string; theme: string }>();
  for (const f of enFiles) {
    const a = readJson(path.join(enDir, f));
    if (!a || a.imageAlt !== FALLBACK_ALT) continue;
    if (!a.destination || !a.theme) continue;
    const key = `${a.destination}-${a.theme}`;
    if (!combos.has(key)) combos.set(key, { destination: a.destination, theme: a.theme });
  }

  const comboList = [...combos.values()].slice(0, LIMIT);
  console.log(`📋 ${combos.size} affected destination+theme combos found; processing ${comboList.length}\n`);

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
      // Only overwrite articles that are currently on the fallback image.
      if (a.imageAlt !== FALLBACK_ALT) continue;
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
