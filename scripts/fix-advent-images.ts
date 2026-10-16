/**
 * Give Advent guides unique, validated Christmas-market cover images.
 *
 *   npx tsx scripts/fix-advent-images.ts                 # fix duplicates (keeps first of each group)
 *   npx tsx scripts/fix-advent-images.ts zadar pula      # re-pick these specifically
 *
 * Never reuses an image already on another Advent guide and never falls back to
 * an unvalidated scenic photo. The new image is written to all 13 languages.
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';
import { getArticleImage } from './image-service';

const ARTICLES_DIR = path.join(process.cwd(), 'src', 'content', 'articles');
const IMAGE_FIELDS = ['imageUrl', 'imageAlt', 'imageCredit', 'imageCreditUrl', 'imageSource'] as const;

function enArticles(): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  for (const f of fs.readdirSync(path.join(ARTICLES_DIR, 'en')).filter(f => f.endsWith('-advent.json'))) {
    out[f.replace('-advent.json', '')] = JSON.parse(fs.readFileSync(path.join(ARTICLES_DIR, 'en', f), 'utf-8'));
  }
  return out;
}

async function main() {
  const articles = enArticles();
  let targets = process.argv.slice(2);

  if (targets.length === 0) {
    const seen = new Set<string>();
    for (const [slug, a] of Object.entries(articles)) {
      if (seen.has(a.imageUrl)) targets.push(slug);
      seen.add(a.imageUrl);
    }
  }

  const used = new Set(Object.entries(articles)
    .filter(([slug]) => !targets.includes(slug))
    .map(([, a]) => a.imageUrl));

  console.log(`Re-picking images for: ${targets.join(', ') || '(none)'}`);

  for (const slug of targets) {
    const image = await getArticleImage('advent', slug, { excludeUrls: used, noFallback: true });
    if (!image) {
      console.log(`❌ ${slug}: no validated unique image found — left unchanged`);
      continue;
    }
    used.add(image.imageUrl);

    for (const lang of fs.readdirSync(ARTICLES_DIR)) {
      const file = path.join(ARTICLES_DIR, lang, `${slug}-advent.json`);
      if (!fs.existsSync(file)) continue;
      const a = JSON.parse(fs.readFileSync(file, 'utf-8'));
      for (const k of IMAGE_FIELDS) a[k] = image[k];
      fs.writeFileSync(file, JSON.stringify(a, null, 2));
    }
    console.log(`✅ ${slug}: ${image.imageUrl}`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
