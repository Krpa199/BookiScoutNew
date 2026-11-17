/**
 * How many topics the daily generator still has queued (GENERATION_TIERS).
 * Exits 1 when fewer than TOPIC_ALERT_MIN remain, so the topic-queue-alert
 * workflow fails and GitHub emails the repo owner. Same filters as
 * scripts/article-generator.ts → buildPending.
 *
 * Usage: npx tsx scripts/check-topic-queue.ts
 */
import fs from 'fs';
import { DESTINATIONS, GENERATION_TIERS, isThemeAvailableFor } from '../src/config/destinations';

const MIN = Number(process.env.TOPIC_ALERT_MIN || 100);
const PER_DAY = Number(process.env.ARTICLES_PER_RUN || 20);

const done = new Set<string>(JSON.parse(fs.readFileSync('src/content/generated.json', 'utf8')).generated);
const byTheme = new Map<string, number>();
for (const themes of GENERATION_TIERS) {
  for (const theme of themes) {
    for (const d of DESTINATIONS) {
      if (!isThemeAvailableFor(d.slug, theme) || theme === `vs-${d.slug}`) continue;
      if (!done.has(`${d.slug}-${theme}`)) byTheme.set(theme, (byTheme.get(theme) || 0) + 1);
    }
  }
}
const pending = [...byTheme.values()].reduce((a, b) => a + b, 0);

console.log(`Queued topics: ${pending} (~${Math.ceil(pending / PER_DAY)} days at ${PER_DAY}/day), alert below ${MIN}`);
for (const [theme, n] of [...byTheme].sort((a, b) => b[1] - a[1])) console.log(`  ${theme.padEnd(26)} ${n}`);

if (pending < MIN) {
  const msg = pending === 0
    ? 'The generator has NO topics left and writes nothing. Add themes to GENERATION_TIERS in src/config/destinations.ts.'
    : `Only ${pending} topics left (~${Math.ceil(pending / PER_DAY)} days). Add themes to GENERATION_TIERS in src/config/destinations.ts.`;
  console.log(`::error title=Topic queue low::${msg}`);
  process.exit(1);
}
