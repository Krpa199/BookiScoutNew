/**
 * Trim articles whose content stops mid-sentence (Gemini hit its output limit
 * and the text was saved as-is) back to the last complete sentence. No API
 * calls: the unfinished tail is dropped, plus any heading or "…:" intro left
 * with nothing under it. Every language file is checked on its own, because
 * translations were cut at different places than the English.
 *
 *   npx tsx scripts/fix-truncated-endings.ts --dry-run            # report all
 *   npx tsx scripts/fix-truncated-endings.ts --dry-run slug ...   # show these
 *   npx tsx scripts/fix-truncated-endings.ts [slug ...]           # write
 */
import fs from 'fs';
import path from 'path';

const DIR = path.join(process.cwd(), 'src', 'content', 'articles');
const isHeading = (l: string) => /^#+ /.test(l);
const isItem = (l: string) => /^\s*([*-]|\d+\.)\s/.test(l);
const isTable = (l: string) => /^\s*\|/.test(l);
const isRule = (l: string) => /^\s*(-{3,}|\*{3,})\s*$/.test(l);
// A line is finished if it ends in sentence punctuation (optionally followed by
// closing quotes/brackets/bold markers), or is a table row / rule.
const finished = (l: string) =>
  isTable(l) || isRule(l) || /[.!?…](["'”»)\]*_]*)\s*$/.test(l) || /\*\*\s*$/.test(l) && /^\s*\*\*[^*]+\*\*\s*$/.test(l);

export function trimEnding(content: string): string | null {
  // raw JSON saved as content is a different bug (fix-nested-json-articles.ts)
  if (/^\s*(```|\{)/.test(content)) return null;
  const out = trimLines(content);
  // never cut more than a small tail: a big loss means the text is broken some other way
  if (out === null || out.length < 300 || out.length < content.trim().length * 0.85) return null;
  return out;
}

function trimLines(content: string): string | null {
  const lines = content.replace(/\s+$/, '').split('\n');
  const last = lines[lines.length - 1];
  if (finished(last) && !isHeading(last)) return null;

  if (!isHeading(last)) {
    // keep the complete sentences of the unfinished line, if any
    const prefix = (last.match(/^(\s*([*-]|\d+\.)\s+(\*\*[^*]+\*\*:?)?\s*)/) || [''])[0];
    const body = last.slice(prefix.length);
    const m = body.match(/^(.*[.!?…](["'”»)\]]*))\s/);
    if (m && m[1].length > 20) lines[lines.length - 1] = prefix + m[1];
    else lines.pop();
  }
  // drop what is left dangling at the end: headings, "Label:" intros, blank lines
  for (;;) {
    while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
    const l = lines[lines.length - 1];
    if (l === undefined) break;
    if (isHeading(l) || isRule(l) || /:\**\s*$/.test(l) || /^\s*([*-]|\d+\.)\s*(\*\*[^*]*\*\*:?)?\s*$/.test(l)) { lines.pop(); continue; }
    if (!finished(l)) {
      // still unfinished (e.g. the cut line was an item and the one above it too)
      const r = trimEnding(lines.join('\n'));
      if (r === null) break;
      return r;
    }
    break;
  }
  return lines.join('\n');
}

/**
 * After trimming, the article often ends in a section that had only just
 * started (heading + one sentence). Drop that stub so the article ends on a
 * complete topic. Returns null if the last section is substantial.
 */
export function dropStubSection(content: string, minChars = 250): string | null {
  const lines = content.replace(/\s+$/, '').split('\n');
  let i = lines.length - 1;
  while (i >= 0 && !isHeading(lines[i])) i--;
  if (i <= 0) return null;
  const tail = lines.slice(i + 1).join('\n').trim();
  if (tail.length >= minChars) return null;
  const out = lines.slice(0, i).join('\n').replace(/\s+$/, '');
  if (out.length < content.trim().length * 0.85 || !/[.!?…"'”»)\]*|]\s*$/.test(out)) return null;
  return out;
}

function main() {
  const dry = process.argv.includes('--dry-run');
  const only = new Set(process.argv.slice(2).filter(a => !a.startsWith('--')));
  const stats: Record<string, number> = {};
  let shown = 0;
  for (const lang of fs.readdirSync(DIR)) {
    for (const f of fs.readdirSync(path.join(DIR, lang))) {
      const slug = f.replace(/\.json$/, '');
      if (only.size && !only.has(slug)) continue;
      const p = path.join(DIR, lang, f);
      const a = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (typeof a.content !== 'string') continue;
      const out = trimEnding(a.content);
      if (out === null) continue;
      stats[lang] = (stats[lang] || 0) + 1;
      const lost = a.content.trim().length - out.length;
      if (dry && (only.size || shown < 6) && (lang === 'en' || only.size)) {
        shown++;
        console.log(`\n## ${lang}/${slug}  (−${lost} chars)`);
        console.log('  BEFORE …' + JSON.stringify(a.content.trim().slice(-160)));
        console.log('  AFTER  …' + JSON.stringify(out.slice(-160)));
      }
      if (!dry) { a.content = out; fs.writeFileSync(p, JSON.stringify(a, null, 2)); }
    }
  }
  console.log('\nfiles trimmed per language:', JSON.stringify(stats));
}

if (require.main === module) main();
