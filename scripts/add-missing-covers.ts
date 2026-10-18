/**
 * Give articles without a cover image one, in every language.
 * Uses the normal image search (place-name captions preferred); if nothing
 * passes validation, falls back to a caption-named or place-neutral photo.
 *
 *   npx tsx scripts/add-missing-covers.ts            # all EN articles missing a cover
 *   npx tsx scripts/add-missing-covers.ts slug ...   # only these
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';
import { getArticleImage } from './image-service';

const DIR = path.join(process.cwd(), 'src', 'content', 'articles');

async function main() {
  const only = process.argv.slice(2);
  const enDir = path.join(DIR, 'en');
  const todo = fs.readdirSync(enDir)
    .map(f => JSON.parse(fs.readFileSync(path.join(enDir, f), 'utf8')))
    .filter(a => (only.length ? only.includes(a.slug) : !a.imageUrl));
  console.log(`${todo.length} article(s) need a cover`);
  for (const a of todo) {
    const img = await getArticleImage(a.theme, a.destination);
    if (!img) { console.log(`  ⚠️ ${a.slug}: still no image`); continue; }
    for (const lang of fs.readdirSync(DIR)) {
      const f = path.join(DIR, lang, `${a.slug}.json`);
      if (!fs.existsSync(f)) continue;
      fs.writeFileSync(f, JSON.stringify({ ...JSON.parse(fs.readFileSync(f, 'utf8')), ...img }, null, 2));
    }
    console.log(`  ✅ ${a.slug}: ${img.imageAlt}`);
  }
}

main();
