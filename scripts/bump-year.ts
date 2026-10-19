/**
 * Move reviewed articles to the 2027 planning season: "2026" -> "2027" in all
 * 13 languages (title, meta, quick answer, content, FAQ, table), and set
 * updatedAt. Runs right before Claude's review of old articles, which then
 * fixes any sentence where 2027 no longer makes sense — so the year only ever
 * changes on an article that is actually re-read.
 * Skipped: Advent articles (they are about this winter), and lines about
 * ETIAS/EES, whose real dates are in 2026.
 *
 *   npx tsx scripts/bump-year.ts --file old-slugs.txt
 */
import fs from 'fs';
import path from 'path';

const DIR = path.join(process.cwd(), 'src', 'content', 'articles');
const FROM = /\b2026\b/g;
const TO = '2027';
const KEEP_LINE = /ETIAS|\bEES\b|Entry\/Exit|Entry-Exit|EU-Einreise|Advent/i;

const bump = (s: string) => s.split('\n').map(l => (KEEP_LINE.test(l) ? l : l.replace(FROM, TO))).join('\n');
function walk(v: any): any {
  if (typeof v === 'string') return bump(v);
  if (Array.isArray(v)) return v.map(walk);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)]));
  return v;
}

function main() {
  const fi = process.argv.indexOf('--file');
  const slugs = fi !== -1 ? fs.readFileSync(process.argv[fi + 1], 'utf8').split(/\s+/).filter(Boolean) : process.argv.slice(2);
  const now = new Date().toISOString();
  let files = 0;
  for (const slug of slugs) {
    for (const lang of fs.readdirSync(DIR)) {
      const p = path.join(DIR, lang, `${slug}.json`);
      if (!fs.existsSync(p)) continue;
      const a = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (a.theme === 'advent') continue;
      const before = JSON.stringify(a);
      for (const k of ['title', 'metaDescription', 'quickAnswer', 'content', 'faq', 'tableData', 'imageAlt']) if (a[k] !== undefined) a[k] = walk(a[k]);
      if (JSON.stringify(a) === before) continue;
      a.updatedAt = now;
      fs.writeFileSync(p, JSON.stringify(a, null, 2));
      files++;
    }
  }
  console.log(`year moved to ${TO} in ${files} files (${slugs.length} articles)`);
}

main();
