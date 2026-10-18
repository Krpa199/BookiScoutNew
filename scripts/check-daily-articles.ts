/**
 * Mechanical checks on freshly generated articles, for the daily review.
 * Flags what a human/Claude reviewer must look at; fixes nothing itself.
 *
 *   npx tsx scripts/check-daily-articles.ts slug1 slug2 ...
 *   npx tsx scripts/check-daily-articles.ts --file review-slugs.txt
 *   npx tsx scripts/check-daily-articles.ts --from-commit <sha>   # slugs added in that commit
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const DIR = path.join(process.cwd(), 'src', 'content', 'articles');

function slugsFromArgs(): string[] {
  const f = process.argv.indexOf('--file');
  if (f !== -1) return fs.readFileSync(process.argv[f + 1], 'utf8').split(/\s+/).filter(Boolean);
  const i = process.argv.indexOf('--from-commit');
  if (i !== -1) {
    const out = execSync(`git show --name-only --format= ${process.argv[i + 1]}`, { encoding: 'utf8' });
    return out.split('\n').filter(l => l.startsWith('src/content/articles/en/')).map(l => path.basename(l, '.json'));
  }
  return process.argv.slice(2);
}

const words = (t: string) => t.toLowerCase().split(/[^\p{L}]+/u).filter(Boolean);
const EN = new Set('the and with you your is are this that for from which while what when where will have has not but also into than more most best worth guide visiting'.split(' '));
const SL = new Set('kje splača prenočiti hrvaški hrvaškem lahko zelo vendar če ki smo boste letu obisk morje tudi ali vodnik'.split(' '));
const SK = new Set('kde oplatí ubytovať chorvátsky chorvátskom môžete veľmi však ak ktoré bude roku návšteva more tiež alebo sprievodca'.split(' '));

const slugs = slugsFromArgs();
const langs = fs.readdirSync(DIR).filter(l => l !== 'en');
let problems = 0;

for (const slug of slugs) {
  const en = JSON.parse(fs.readFileSync(path.join(DIR, 'en', `${slug}.json`), 'utf8'));
  const flags: string[] = [];
  if (!en.imageUrl) flags.push('NO COVER IMAGE (run: npx tsx scripts/add-missing-covers.ts ' + slug + ')');
  if (/\$\d/.test(JSON.stringify(en))) flags.push('en: dollar prices');
  const invented = JSON.stringify(en).match(/[^."]{0,60}(hypothetical|fictional but|fictitious|realistic concept|\(concept\)|for illustrative purposes)[^."]{0,40}/gi);
  if (invented) flags.push(`en: admits invented places: ${invented.slice(0, 2).join(' … ')}`);
  for (const lang of langs) {
    const p = path.join(DIR, lang, `${slug}.json`);
    if (!fs.existsSync(p)) { flags.push(`${lang}: MISSING translation`); continue; }
    const a = JSON.parse(fs.readFileSync(p, 'utf8'));
    const title: string = a.title || '';
    if ((a.imageUrl || '') !== (en.imageUrl || '')) flags.push(`${lang}: cover differs from English`);
    const body = words(a.content || '');
    if (title.trim() === (en.title || '').trim()) flags.push(`${lang}: title identical to English`);
    else if (lang !== 'nl' && words(title).filter(w => EN.has(w)).length >= 2) flags.push(`${lang}: English words in title "${title}"`);
    if (body.length && body.filter(w => EN.has(w)).length / body.length > (lang === 'nl' ? 0.12 : 0.06)) flags.push(`${lang}: body looks English`);
    if (/^Isis/.test(title) || (lang !== 'ru' && /[Ͱ-ϿЀ-ӿ]/.test(title))) flags.push(`${lang}: garbled title "${title}"`);
    if (/\b(vs\.?|protiv|naspram)\b/i.test(title) && lang === 'hr') flags.push(`hr: "vs/protiv/naspram" in title "${title}"`);
    if (/\$\d/.test(JSON.stringify(a))) flags.push(`${lang}: dollar prices`);
    // Flash-Lite sometimes drops a Chinese/Japanese word into the text ("报考 Hvar").
    const junk = JSON.stringify(a).match(/[぀-ヿ一-鿿가-힯؀-ۿ]+/g);
    if (junk) flags.push(`${lang}: foreign-script junk in text: ${junk.slice(0, 3).join(' ')}`);
    if (lang !== 'hr' && /Plitvička Jezera/.test(`${a.title} ${a.metaDescription} ${a.quickAnswer}`)) flags.push(`${lang}: Croatian name "Plitvička Jezera" instead of the local name`);
    if (lang === 'sk') {
      let sl = 0, sk = 0;
      for (const w of body) { if (SL.has(w)) sl++; if (SK.has(w)) sk++; }
      if (sl > sk) flags.push('sk: text is SLOVENIAN, not Slovak');
    }
    if (a.theme !== 'advent' && /\b20(2[0-6])\b/.test(title)) flags.push(`${lang}: old year in title "${title}"`);
  }
  problems += flags.length;
  console.log(`\n## ${slug}${flags.length ? '' : '  ✓ no mechanical problems'}`);
  flags.forEach(f => console.log('  - ' + f));
}
console.log(`\n${slugs.length} articles, ${problems} flagged problems`);
