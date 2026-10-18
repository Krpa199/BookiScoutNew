/**
 * Remove businesses/places the generator invented ("hypothetical",
 * "fictional but realistic") from articles, in all 13 languages.
 * Proper names stay unchanged in translations, so they locate the same text
 * in every language.
 *
 * A name can be prefixed with a mode:
 *   (none)  heading → whole section; list item → item + sub-items;
 *           standalone bold line → line + the list under it;
 *           prose → the paragraph (and the list it introduces, if it ends with ":")
 *   s:Name  only the sentence(s) naming it
 *   p:Name  keep the name, drop the "(hypothetical …)" parenthetical next to it
 * "A|B|C" lists the forms a name takes in different translations.
 * A list item whose bold label names something else only loses the sentence.
 * Afterwards: list items/bold lines ending in ":" with nothing under them,
 * intro paragraphs of lists that became empty, and empty sections are removed.
 *
 *   npx tsx scripts/remove-invented-places.ts <slug> "Name" "s:Name" ... [--dry-run]
 *   npx tsx scripts/remove-invented-places.ts --plan plan.json [--dry-run]   # { slug: [names] }
 */
import fs from 'fs';
import path from 'path';

const DIR = path.join(process.cwd(), 'src', 'content', 'articles');
const isHeading = (l: string) => /^#+ /.test(l);
const level = (l: string) => (l.match(/^(#+) /) || ['', ''])[1].length;
const isItem = (l: string) => /^\s*([*-]|\d+\.)\s/.test(l);
const indent = (l: string) => l.match(/^\s*/)![0].length;
const isBoldLine = (l: string) => /^\s*\*\*[^*]+\*\*.{0,80}$/.test(l) && !isItem(l);

function blockEnd(lines: string[], i: number): number {
  // end (exclusive) of the list item at i including its more-indented children
  const base = indent(lines[i]);
  let j = i + 1;
  while (j < lines.length && (lines[j].trim() === '' ? (j + 1 < lines.length && indent(lines[j + 1]) > base && lines[j + 1].trim() !== '') : indent(lines[j]) > base)) j++;
  return j;
}
function listAfter(lines: string[], i: number): number {
  // end of a list block that starts after line i (skipping blank lines)
  let j = i + 1;
  while (j < lines.length && lines[j].trim() === '') j++;
  if (j >= lines.length || !isItem(lines[j])) return i + 1;
  while (j < lines.length && (isItem(lines[j]) || (lines[j].trim() !== '' && indent(lines[j]) > 0) || (lines[j].trim() === '' && j + 1 < lines.length && isItem(lines[j + 1])))) j++;
  return j;
}

export function removeName(content: string, spec: string): { content: string; removed: string[] } {
  const mode = spec.startsWith('s:') ? 's' : spec.startsWith('p:') ? 'p' : 'd';
  const names = (mode === 'd' ? spec : spec.slice(2)).split('|');
  const has = (l: string) => names.some(n => l.includes(n));
  const removed: string[] = [];
  let lines = content.split('\n');

  if (mode === 'p') {
    const name = names.find(n => content.includes(n));
    if (!name) return { content, removed };
    const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const inside = new RegExp(`\\s*\\([^()]*${esc}[^()]*\\)`);
    const after = new RegExp(`(${esc}[^()\\n]{0,6}?)\\s*\\([^()]*\\)`);
    const before = content;
    content = content.replace(inside, m => { removed.push(m); return ''; });
    if (content === before) content = content.replace(after, (m, keep) => { removed.push(m); return keep; });
    return { content, removed };
  }

  if (mode === 's') {
    lines = lines.map(l => {
      if (!has(l)) return l;
      const prefix = (l.match(/^(\s*([*-]|\d+\.)\s+(\*\*[^*]+\*\*:?)?\s*)/) || ['', ''])[0];
      const body = l.slice(prefix.length);
      const parts = body.split(/(?<=[.!?])\s+/);
      const kept = parts.filter(p => { if (has(p)) { removed.push(p); return false; } return true; });
      return prefix + kept.join(' ');
    });
    return { content: lines.join('\n'), removed };
  }

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!has(l)) continue;
    let end: number;
    const label = isItem(l) && l.match(/^\s*(?:[*-]|\d+\.)\s+\*\*([^*]+)\*\*/);
    if (label && !has(label[1])) {
      const r = removeName(l, `s:${names.join('|')}`);
      removed.push(...r.removed);
      lines[i] = r.content;
      continue;
    }
    if (isHeading(l)) {
      end = i + 1;
      while (end < lines.length && !(isHeading(lines[end]) && level(lines[end]) <= level(l))) end++;
    } else if (isItem(l)) {
      end = blockEnd(lines, i);
    } else if (isBoldLine(l)) {
      end = listAfter(lines, i);
    } else {
      // prose: the whole paragraph (block between blank lines)
      let start = i;
      while (start > 0 && lines[start - 1].trim() !== '' && !isHeading(lines[start - 1]) && !isItem(lines[start - 1])) start--;
      end = i + 1;
      while (end < lines.length && lines[end].trim() !== '' && !isHeading(lines[end]) && !isItem(lines[end])) end++;
      if (/:\s*$/.test(lines[end - 1])) end = listAfter(lines, end - 1);
      removed.push(lines.slice(start, end).join('\n'));
      lines.splice(start, end - start);
      i = start - 1;
      continue;
    }
    removed.push(lines.slice(i, end).join('\n'));
    lines.splice(i, end - i);
    i--;
  }
  return { content: lines.join('\n'), removed };
}

export function cleanup(content: string, listsTouched: boolean): string {
  let lines = content.split('\n');
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      // "Examples (hypothetical):" parent with nothing under it
      if ((isItem(l) || isBoldLine(l)) && /:\**\s*$/.test(l)) {
        let j = i + 1;
        while (j < lines.length && lines[j].trim() === '') j++;
        // any following item counts as a child: generated lists are often flat
        const hasChild = j < lines.length && isItem(lines[j]);
        if (!hasChild) { lines.splice(i, 1); changed = true; break; }
      }
      // empty section: heading followed by same/higher heading or end
      if (isHeading(l)) {
        let j = i + 1;
        while (j < lines.length && lines[j].trim() === '') j++;
        if (j >= lines.length || (isHeading(lines[j]) && level(lines[j]) <= level(l))) { lines.splice(i, 1); changed = true; break; }
      }
      // intro paragraph left without its list ("…options for your stay:")
      if (listsTouched && /:\s*$/.test(l) && !isItem(l) && !isHeading(l) && !isBoldLine(l)) {
        let j = i + 1;
        while (j < lines.length && lines[j].trim() === '') j++;
        if (j >= lines.length || isHeading(lines[j])) { lines.splice(i, 1); changed = true; break; }
      }
    }
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').replace(/[ \t]+$/gm, '');
}

function clean(slug: string, specs: string[], dry: boolean) {
  console.log(`\n### ${slug}`);
  for (const lang of fs.readdirSync(DIR)) {
    const f = path.join(DIR, lang, `${slug}.json`);
    if (!fs.existsSync(f)) continue;
    const a = JSON.parse(fs.readFileSync(f, 'utf8'));
    let total = 0;
    for (const spec of specs) {
      const r = removeName(a.content || '', spec);
      a.content = r.content;
      total += r.removed.length;
      if (lang === 'en') r.removed.forEach(x => console.log(`  ✂ ${x.replace(/\n/g, ' ¶ ').slice(0, 160)}`));
      const names = spec.replace(/^[sp]:/, '').split('|');
      if (!spec.startsWith('p:')) {
        for (const k of ['tableData', 'faq'] as const) {
          if (!Array.isArray(a[k])) continue;
          const before = a[k].length;
          a[k] = a[k].filter((row: unknown) => !names.some(n => JSON.stringify(row).includes(n)));
          total += before - a[k].length;
        }
      }
    }
    a.content = cleanup(a.content || '', true);
    const json = JSON.stringify(a);
    const left = specs.filter(s => !s.startsWith('p:')).flatMap(s => s.replace(/^s:/, '').split('|')).filter(n => json.includes(n));
    if (lang !== 'en' && (total === 0 || left.length)) console.log(`  ⚠️ ${lang}: removed ${total}${left.length ? `, STILL MENTIONS ${left.join(', ')}` : ''}`);
    if (lang === 'en' && left.length) console.log(`  ⚠️ en STILL MENTIONS ${left.join(', ')}`);
    if (!dry) fs.writeFileSync(f, JSON.stringify(a, null, 2));
  }
}

function main() {
  const dry = process.argv.includes('--dry-run');
  const args = process.argv.slice(2).filter(a => a !== '--dry-run');
  if (args[0] === '--plan') {
    const plan: Record<string, string[]> = JSON.parse(fs.readFileSync(args[1], 'utf8'));
    for (const [slug, specs] of Object.entries(plan)) clean(slug, specs, dry);
  } else {
    const [slug, ...specs] = args;
    clean(slug, specs, dry);
  }
}

if (require.main === module) main();
