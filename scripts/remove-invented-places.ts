/**
 * Remove businesses/places the generator invented ("hypothetical",
 * "fictional but realistic") from an article in all 13 languages.
 * For each name: a section whose heading contains it is removed, otherwise
 * the list item, otherwise the sentence; table rows and FAQ entries that
 * mention it are dropped too. Names are proper nouns, so they appear
 * unchanged in every translation.
 *
 *   npx tsx scripts/remove-invented-places.ts <slug> "Name 1" "Name 2" [--dry-run]
 */
import fs from 'fs';
import path from 'path';

const DIR = path.join(process.cwd(), 'src', 'content', 'articles');

export function removeName(content: string, name: string): { content: string; removed: string[] } {
  const removed: string[] = [];
  let lines = content.split('\n');
  // 1. Sections whose heading names it
  for (let i = 0; i < lines.length; i++) {
    const h = lines[i].match(/^(#+) /);
    if (!h || !lines[i].includes(name)) continue;
    let end = i + 1;
    while (end < lines.length) {
      const m = lines[end].match(/^(#+) /);
      if (m && m[1].length <= h[1].length) break;
      end++;
    }
    removed.push(lines.slice(i, end).join('\n'));
    lines.splice(i, end - i);
    i--;
  }
  // 2. List items naming it
  lines = lines.filter(l => {
    if (/^\s*([*-]|\d+\.)\s/.test(l) && l.includes(name)) { removed.push(l); return false; }
    return true;
  });
  // 3. Sentences naming it
  lines = lines.map(l => {
    if (!l.includes(name)) return l;
    const parts = l.split(/(?<=[.!?])\s+/);
    const kept = parts.filter(p => { if (p.includes(name)) { removed.push(p); return false; } return true; });
    return kept.join(' ');
  });
  return { content: lines.join('\n').replace(/\n{3,}/g, '\n\n'), removed };
}

function main() {
  const args = process.argv.slice(2).filter(a => a !== '--dry-run');
  const dry = process.argv.includes('--dry-run');
  const [slug, ...names] = args;
  for (const lang of fs.readdirSync(DIR)) {
    const f = path.join(DIR, lang, `${slug}.json`);
    if (!fs.existsSync(f)) continue;
    const a = JSON.parse(fs.readFileSync(f, 'utf8'));
    let total = 0;
    for (const name of names) {
      const r = removeName(a.content || '', name);
      a.content = r.content;
      total += r.removed.length;
      if (lang === 'en' && r.removed.length) r.removed.forEach(x => console.log(`  ✂ en: ${x.replace(/\n/g, ' ¶ ').slice(0, 220)}`));
      for (const k of ['tableData', 'faq'] as const) {
        if (!Array.isArray(a[k])) continue;
        const before = a[k].length;
        a[k] = a[k].filter((row: unknown) => !JSON.stringify(row).includes(name));
        total += before - a[k].length;
      }
      for (const k of ['title', 'metaDescription', 'quickAnswer'] as const) {
        if ((a[k] || '').includes(name)) console.log(`  ⚠️ ${lang} ${k} still names "${name}" — fix by hand`);
      }
    }
    const left = names.filter(n => JSON.stringify(a).includes(n));
    console.log(`${lang}: removed ${total} block(s)${left.length ? `, STILL MENTIONS: ${left.join(', ')}` : ''}`);
    if (!dry) fs.writeFileSync(f, JSON.stringify(a, null, 2));
  }
}

if (require.main === module) main();
