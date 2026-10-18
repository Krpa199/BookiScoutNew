/**
 * Rewrite existing guides from scratch (English with Gemini Pro, then the 12
 * translations) while keeping their URL, cover image and publish date. For
 * articles that were saved nearly empty (a title and half a sentence).
 *
 *   npx tsx scripts/regenerate-articles.ts slug1 slug2 ...
 *   npx tsx scripts/regenerate-articles.ts --file slugs.txt
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
process.env.GEMINI_GROUNDING = process.env.GEMINI_GROUNDING || 'on';

import fs from 'fs';
import path from 'path';
import { DESTINATIONS, Theme } from '../src/config/destinations';
import { LANGUAGES, LanguageCode } from '../src/config/languages';
import { generateArticle } from './gemini';
import { translateChecked } from './article-generator';
import { trimEnding } from './fix-truncated-endings';

const DIR = path.join(process.cwd(), 'src', 'content', 'articles');
const KEEP = ['imageUrl', 'imageAlt', 'imageCredit', 'imageCreditUrl', 'imageSource', 'generatedAt', 'destination', 'destinationName', 'region', 'theme', 'lat', 'lng', 'slug'];
const finished = (c: string) => /[.!?…"”»)*|]\s*$/.test(c.trim());

async function regenerate(slug: string) {
  const enPath = path.join(DIR, 'en', `${slug}.json`);
  const old = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const destination = DESTINATIONS.find(d => d.slug === old.destination);
  if (!destination) throw new Error(`unknown destination ${old.destination}`);

  let en: any;
  for (let attempt = 1; attempt <= 3; attempt++) {
    en = await generateArticle(destination, old.theme as Theme, 'en');
    en.content = trimEnding(en.content) ?? en.content;
    if (en.content.length > 3000 && finished(en.content) && !/^\s*(```|\{)/.test(en.content)) break;
    console.log(`  ⚠️ attempt ${attempt}: ${en.content.length} chars, finished=${finished(en.content)}`);
    if (attempt === 3) throw new Error('English came back short or broken 3 times');
  }
  const keep = (a: any, lang: LanguageCode) => ({ ...a, ...Object.fromEntries(KEEP.filter(k => old[k] !== undefined).map(k => [k, old[k]])), language: lang, updatedAt: new Date().toISOString() });
  fs.writeFileSync(enPath, JSON.stringify(keep(en, 'en'), null, 2));
  console.log(`  ✅ en (${en.content.length} chars)`);

  for (const lang of Object.keys(LANGUAGES) as LanguageCode[]) {
    if (lang === 'en') continue;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const t: any = await translateChecked(en, lang);
        t.content = trimEnding(t.content) ?? t.content;
        fs.writeFileSync(path.join(DIR, lang, `${slug}.json`), JSON.stringify(keep(t, lang), null, 2));
        console.log(`  ✅ ${lang}`);
        break;
      } catch (err) {
        console.log(`  ⚠️ ${lang} attempt ${attempt}: ${(err as Error).message}`);
      }
    }
  }
}

async function main() {
  const fi = process.argv.indexOf('--file');
  const slugs = fi !== -1
    ? fs.readFileSync(process.argv[fi + 1], 'utf8').split(/\s+/).filter(Boolean)
    : process.argv.slice(2);
  for (const slug of slugs) {
    console.log(`\n## ${slug}`);
    try { await regenerate(slug); } catch (err) { console.log(`❌ ${slug}: ${(err as Error).message}`); }
  }
}

main();
