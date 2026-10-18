/**
 * Some articles were saved with Gemini's whole JSON reply as their `content`
 * ({"title": …, "content": "## …"}), often cut off mid-way so it never parses.
 * Readers see raw JSON. This pulls the real markdown (and title/meta/quick
 * answer when present) out of it, even when the JSON is incomplete, then trims
 * a cut-off ending like fix-truncated-endings.ts.
 *
 *   npx tsx scripts/fix-raw-json-content.ts --dry-run
 *   npx tsx scripts/fix-raw-json-content.ts
 */
import fs from 'fs';
import path from 'path';
import { trimEnding } from './fix-truncated-endings';

const DIR = path.join(process.cwd(), 'src', 'content', 'articles');
const isRaw = (c: string) => /^\s*(```|\{)/.test(c) || /^\s*"?(title|content)"?\s*:/.test(c);

/** Value of a JSON string field, read up to its closing quote or the end of a cut-off text. */
function field(raw: string, name: string): string | null {
  const m = new RegExp(`"${name}"\\s*:\\s*"`).exec(raw);
  if (!m) return null;
  let i = m.index + m[0].length, out = '';
  for (; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === '\\' && i + 1 < raw.length) {
      const n = raw[++i];
      out += n === 'n' ? '\n' : n === 't' ? '\t' : n === 'r' ? '' : n === 'u' ? String.fromCharCode(parseInt(raw.slice(i + 1, i + 5), 16)) : n;
      if (n === 'u') i += 4;
      continue;
    }
    if (ch === '"') return out;
    out += ch;
  }
  return out; // cut off before the closing quote
}

export function extract(raw: string): { content: string; title?: string; metaDescription?: string; quickAnswer?: string } | null {
  let s = raw.trim().replace(/^```(json)?\s*/, '').replace(/```\s*$/, '');
  try {
    const j = JSON.parse(s);
    if (typeof j.content === 'string') return j;
  } catch { /* incomplete JSON — walk it */ }
  let content = field(s, 'content');
  if (!content || content.length < 200) {
    // unescaped quotes inside the text end the string early: read up to the next key instead
    const m = /"content"\s*:\s*"/.exec(s);
    if (!m) return null;
    const rest = s.slice(m.index + m[0].length);
    const end = rest.search(/"\s*,?\s*\n\s*"(faq|tableData|quickAnswer|metaDescription|title|imageUrl)"\s*:/);
    content = (end === -1 ? rest : rest.slice(0, end)).replace(/\\n/g, '\n').replace(/\\"/g, '"');
    if (content.length < 200) return null;
  }
  return {
    content,
    title: field(s, 'title') ?? undefined,
    metaDescription: field(s, 'metaDescription') ?? undefined,
    quickAnswer: field(s, 'quickAnswer') ?? undefined,
  };
}

function main() {
  const dry = process.argv.includes('--dry-run');
  let fixed = 0; const failed: string[] = [];
  for (const lang of fs.readdirSync(DIR)) {
    for (const f of fs.readdirSync(path.join(DIR, lang))) {
      const p = path.join(DIR, lang, f);
      const a = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (typeof a.content !== 'string' || !isRaw(a.content)) continue;
      const x = extract(a.content);
      if (!x || isRaw(x.content)) { failed.push(`${lang}/${f} (${a.content.length} chars)`); continue; }
      let content = x.content.trim();
      content = trimEnding(content) ?? content;
      if (dry && fixed < 3) console.log(`\n## ${lang}/${f}\n  title: ${x.title ?? '(kept)'}\n  starts: ${JSON.stringify(content.slice(0, 120))}\n  ends:   …${JSON.stringify(content.slice(-120))}`);
      a.content = content;
      // keep the file's own title/meta unless they are missing or are themselves raw JSON
      for (const k of ['title', 'metaDescription', 'quickAnswer'] as const) {
        if (x[k] && (!a[k] || /^\s*[{"`]/.test(a[k]))) a[k] = x[k];
      }
      if (!dry) fs.writeFileSync(p, JSON.stringify(a, null, 2));
      fixed++;
    }
  }
  console.log(`\nfixed ${fixed}, failed ${failed.length}`);
  failed.forEach(f => console.log('  ❌ ' + f));
}

if (require.main === module) main();
