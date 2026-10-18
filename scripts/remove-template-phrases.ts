/**
 * The article prompt gave Gemini example "human voice" sentences and a fixed
 * closing heading, and it copied them verbatim: "What Actually Matters" in 180
 * articles, "Contrary to popular belief" in 158, "This works well in theory, but
 * reality is different." in 47… Identical sentences across hundreds of pages
 * are a template fingerprint. No API: the stock sentences are filler, so they
 * are deleted or the lead-in is cut; the heading is dropped (its text joins the
 * section above) or replaced by its own subtitle. Headings are matched in the
 * translations by position, since the structure is the same.
 *
 *   npx tsx scripts/remove-template-phrases.ts --dry-run
 *   npx tsx scripts/remove-template-phrases.ts
 */
import fs from 'fs';
import path from 'path';

const DIR = path.join(process.cwd(), 'src', 'content', 'articles');
const LANGS = fs.readdirSync(DIR).filter(l => l !== 'en');

const STOCK = [
  'This sounds convenient, but in practice it often causes problems.',
  'Most travelers overestimate this part.',
  'Skip this unless you specifically need it.',
  'This is usually not worth the extra cost.',
  'Locals rarely do this, and for good reason.',
  'The marketing makes it look better than it is.',
  'This works well in theory, but reality is different.',
  "Don't believe the hype—here's what actually matters.",
  'This is one of those things that sounds great until you try it.',
  'Save your money here and spend it on something better.',
];
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "['’]").replace(/—/g, '\\s?[—–-]\\s?');
const STOCK_RE = new RegExp(`\\s*(\\*\\*|\\*)?(${STOCK.map(esc).join('|')})(\\*\\*|\\*)?`, 'g');
const ASSUME = ['Many visitors assume', "It's easy to assume", 'A common assumption is that', 'Plenty of travelers assume'];
const HEADING_RE = /^(#+) (What Actually Matters|Opinionated Statement)\b[:\s—–-]*(.*)$/i;

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const cap = (s: string) => s.replace(/^(\s*(?:\*\*)?)(\p{Ll})/u, (_m, p, c) => p + c.toUpperCase());

export function cleanText(t: string, slug: string): string {
  let out = t.replace(STOCK_RE, '');
  out = out.replace(/Most travel(?:l)?ers get this wrong[,:]?\s*assuming\s+(?:that\s+)?/g, () => `${ASSUME[hash(slug) % ASSUME.length]} `);
  out = out.replace(/Most travel(?:l)?ers get this wrong\s*[:.,—–-]\s*(\S)/g, (_m, c) => c.toUpperCase());
  out = out.replace(/Most travel(?:l)?ers get [^.\n]{3,90}? wrong\.\s*/g, '');
  out = out.replace(/Contrary to popular belief,\s*(\S)/g, (_m, c) => c.toUpperCase());
  if (out === t) return t;
  // tidy only lines that were edited: a removed sentence can leave "  " or an empty bullet
  const orig = new Set(t.split('\n'));
  return out.split('\n')
    .map(l => (orig.has(l) ? l : l.replace(/(\S) {2,}/g, '$1 ').replace(/\s+$/, '')))
    .filter(l => orig.has(l) || !/^\s*([*-]|\d+\.)?\s*(\*\*[^*]*\*\*:?)?\s*$/.test(l) || l === '')
    .join('\n').replace(/\n{3,}/g, '\n\n');
}

/** Returns new content and, per removed heading index, what to do with it. */
function fixHeadings(content: string): { content: string; actions: Map<number, 'drop' | 'subtitle'> } {
  const lines = content.split('\n');
  const actions = new Map<number, 'drop' | 'subtitle'>();
  let h = -1;
  const out: string[] = [];
  for (const l of lines) {
    if (/^#+ /.test(l)) {
      h++;
      const m = l.match(HEADING_RE);
      if (m) {
        if (m[3].trim().length > 3) { actions.set(h, 'subtitle'); out.push(`${m[1]} ${cap(m[3].trim())}`); }
        else actions.set(h, 'drop');
        continue;
      }
    }
    out.push(l);
  }
  return { content: out.join('\n'), actions };
}

function applyHeadingActions(content: string, actions: Map<number, 'drop' | 'subtitle'>): string | null {
  const lines = content.split('\n');
  let h = -1;
  const out: string[] = [];
  for (const l of lines) {
    if (/^#+ /.test(l)) {
      h++;
      const act = actions.get(h);
      if (act === 'drop') continue;
      if (act === 'subtitle') {
        const m = l.match(/^(#+) [^:：]+[:：]\s*(.+)$/);
        if (m) { out.push(`${m[1]} ${m[2]}`); continue; }
        continue; // no subtitle in the translation: drop it like the English
      }
    }
    out.push(l);
  }
  return out.join('\n');
}

function main() {
  const dry = process.argv.includes('--dry-run');
  let enFiles = 0, trFiles = 0, skipped = 0, shown = 0;
  for (const f of fs.readdirSync(path.join(DIR, 'en'))) {
    const p = path.join(DIR, 'en', f);
    const a = JSON.parse(fs.readFileSync(p, 'utf8'));
    const slug = f.replace(/\.json$/, '');
    const before = JSON.stringify(a);
    const enHeadings = (a.content.match(/^#+ .*/gm) || []).length;
    const { content, actions } = fixHeadings(a.content);
    a.content = cleanText(content, slug);
    for (const k of ['quickAnswer', 'metaDescription'] as const) if (typeof a[k] === 'string') a[k] = cleanText(a[k], slug).trim();
    for (const k of ['faq'] as const) if (Array.isArray(a[k])) a[k] = a[k].map((r: any) => ({ ...r, answer: typeof r.answer === 'string' ? cleanText(r.answer, slug).trim() : r.answer }));
    if (JSON.stringify(a) === before) continue;
    enFiles++;
    if (dry && shown < 4) {
      shown++;
      const o = JSON.parse(before);
      console.log(`\n## ${slug}\n  QA before: ${o.quickAnswer.slice(0, 160)}\n  QA after:  ${a.quickAnswer.slice(0, 160)}`);
      if (actions.size) console.log(`  headings: ${[...actions.entries()].map(([i, x]) => `#${i} ${x}`).join(', ')}`);
    }
    if (!dry) fs.writeFileSync(p, JSON.stringify(a, null, 2));
    if (!actions.size) continue;
    for (const lang of LANGS) {
      const tp = path.join(DIR, lang, f);
      if (!fs.existsSync(tp)) continue;
      const t = JSON.parse(fs.readFileSync(tp, 'utf8'));
      if ((t.content.match(/^#+ .*/gm) || []).length !== enHeadings) { skipped++; continue; }
      const c = applyHeadingActions(t.content, actions);
      if (c && c !== t.content) { t.content = c.replace(/\n{3,}/g, '\n\n'); trFiles++; if (!dry) fs.writeFileSync(tp, JSON.stringify(t, null, 2)); }
    }
  }
  console.log(`\nEnglish files ${enFiles}, translation files (headings) ${trFiles}, translations skipped (different structure) ${skipped}`);
}

if (require.main === module) main();
