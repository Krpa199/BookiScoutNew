/**
 * Choose the next published articles for the daily review of OLD articles
 * (.github/workflows/review-old-articles.yml). New articles are reviewed by
 * review-articles.yml on the day they are written; this works through the
 * ~2,100 older ones, most valuable first:
 *   1. popular destinations before the rest,
 *   2. planner themes (GENERATION_TIERS) and parking (top traffic) before others,
 *   3. oldest first.
 * Progress lives in src/content/old-review-progress.json.
 *
 *   npx tsx scripts/pick-old-articles.ts 10 > old-slugs.txt
 *   npx tsx scripts/pick-old-articles.ts --mark old-slugs.txt   # after the review
 */
import fs from 'fs';
import path from 'path';
import { DESTINATIONS, GENERATION_TIERS } from '../src/config/destinations';

const EN = path.join(process.cwd(), 'src', 'content', 'articles', 'en');
const PROGRESS = path.join(process.cwd(), 'src', 'content', 'old-review-progress.json');
const RECENT_DAYS = 30; // newer articles were reviewed by the daily review already

type Progress = { reviewed: Record<string, string> }; // slug -> ISO date
const load = (): Progress => (fs.existsSync(PROGRESS) ? JSON.parse(fs.readFileSync(PROGRESS, 'utf8')) : { reviewed: {} });

function main() {
  const progress = load();
  const mi = process.argv.indexOf('--mark');
  if (mi !== -1) {
    const today = new Date().toISOString().slice(0, 10);
    for (const s of fs.readFileSync(process.argv[mi + 1], 'utf8').split(/\s+/).filter(Boolean)) progress.reviewed[s] = today;
    fs.writeFileSync(PROGRESS, JSON.stringify(progress, null, 2) + '\n');
    console.error(`${Object.keys(progress.reviewed).length} old articles reviewed so far`);
    return;
  }

  const n = Number(process.argv[2] || 10);
  const popular = new Set(DESTINATIONS.filter(d => d.popular).map(d => d.slug));
  const themeRank = new Map<string, number>();
  ['parking-difficulty', 'parking'].forEach(t => themeRank.set(t, 0));
  GENERATION_TIERS.forEach((tier, i) => tier.forEach(t => { if (!themeRank.has(t)) themeRank.set(t, i + 1); }));
  const cutoff = Date.now() - RECENT_DAYS * 86400e3;

  const candidates = fs.readdirSync(EN).map(f => JSON.parse(fs.readFileSync(path.join(EN, f), 'utf8')))
    .filter(a => !progress.reviewed[a.slug] && new Date(a.generatedAt).getTime() < cutoff)
    .sort((a, b) =>
      (popular.has(b.destination) ? 1 : 0) - (popular.has(a.destination) ? 1 : 0)
      || (themeRank.get(a.theme) ?? 9) - (themeRank.get(b.theme) ?? 9)
      || a.generatedAt.localeCompare(b.generatedAt));

  console.error(`${candidates.length} old articles not yet reviewed`);
  console.log(candidates.slice(0, n).map(a => a.slug).join('\n'));
}

main();
