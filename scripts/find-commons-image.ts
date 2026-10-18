/**
 * Find freely licensed photos of a place on Wikimedia Commons, for covers
 * where Pexels/Unsplash have no photo whose caption names the place.
 * Prints candidates; the reviewer downloads and looks at them, then applies
 * the chosen one with --apply.
 *
 *   npx tsx scripts/find-commons-image.ts "Mali Lošinj"            # list candidates
 *   npx tsx scripts/find-commons-image.ts --apply <slug> <n> "Mali Lošinj" [--alt "Harbour of Mali Lošinj"]
 *       # set candidate n as the cover of <slug> in all 13 languages
 *
 * Commons photos need attribution: imageCredit = "Author (licence)",
 * imageCreditUrl = the file's Commons page.
 */
import fs from 'fs';
import path from 'path';

const DIR = path.join(process.cwd(), 'src', 'content', 'articles');
const UA = 'BookiScout/1.0 (https://bookiscout.com; cover image search)';

type Candidate = { title: string; url: string; page: string; author: string; license: string; description: string; width: number; height: number };

const strip = (html = '') => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

async function search(place: string): Promise<Candidate[]> {
  const params = new URLSearchParams({
    action: 'query', format: 'json', generator: 'search', gsrnamespace: '6', gsrlimit: '30',
    gsrsearch: `${place} filetype:bitmap`, prop: 'imageinfo', iiprop: 'url|size|extmetadata', iiurlwidth: '1280',
  });
  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { headers: { 'User-Agent': UA } });
  const data: any = await res.json();
  const pages = Object.values(data?.query?.pages || {}) as any[];
  return pages
    .map(p => {
      const ii = p.imageinfo?.[0];
      const m = ii?.extmetadata || {};
      return {
        title: p.title, url: (ii?.thumburl || ii?.url || '').split('?')[0], page: ii?.descriptionurl,
        author: strip(m.Artist?.value) || 'Wikimedia Commons', license: strip(m.LicenseShortName?.value),
        description: strip(m.ImageDescription?.value).slice(0, 160), width: ii?.width || 0, height: ii?.height || 0,
      } as Candidate;
    })
    // Landscape photos, big enough for a cover, with a licence we can credit.
    .filter(c => c.url && c.width >= 1200 && c.width > c.height && /CC|Public domain|PD/i.test(c.license))
    .sort((a, b) => a.title.localeCompare(b.title));
}

async function main() {
  let args = process.argv.slice(2);
  const altAt = args.indexOf('--alt');
  const alt = altAt !== -1 ? args[altAt + 1] : '';
  if (altAt !== -1) args = args.filter((_, i) => i !== altAt && i !== altAt + 1);
  if (args[0] === '--apply') {
    const [, slug, n, ...placeWords] = args;
    const c = (await search(placeWords.join(' ')))[Number(n)];
    if (!c) throw new Error(`no candidate ${n}`);
    const img = {
      imageUrl: c.url,
      imageAlt: alt || c.description || c.title.replace(/^File:/, '').replace(/\.\w+$/, ''),
      imageCredit: `${c.author} (${c.license})`,
      imageCreditUrl: c.page,
      imageSource: 'wikimedia',
    };
    let n2 = 0;
    for (const lang of fs.readdirSync(DIR)) {
      const f = path.join(DIR, lang, `${slug}.json`);
      if (!fs.existsSync(f)) continue;
      fs.writeFileSync(f, JSON.stringify({ ...JSON.parse(fs.readFileSync(f, 'utf8')), ...img }, null, 2));
      n2++;
    }
    console.log(`✅ ${slug}: ${img.imageAlt} — ${img.imageCredit} (${n2} files)`);
    return;
  }
  const list = await search(args.join(' '));
  list.forEach((c, i) => console.log(`[${i}] ${c.title}\n    ${c.description}\n    ${c.url}\n    ${c.author} — ${c.license}`));
  if (!list.length) console.log('No suitable candidates.');
}

main();
