/**
 * Notify IndexNow (Bing → ChatGPT search / Copilot, plus Yandex, Seznam, Naver)
 * about changed pages. Google does not use IndexNow.
 *
 *   npx tsx scripts/indexnow.ts --all                         # every guide in every language
 *   git diff --name-only A B | npx tsx scripts/indexnow.ts    # changed article files from stdin
 *   npx tsx scripts/indexnow.ts --dry-run ...                 # print URLs, don't submit
 *
 * The key is public by design: it is served at /<key>.txt to prove site ownership.
 */
import fs from 'fs';
import path from 'path';
import { localizedUrl, SITE_URL } from '../src/lib/urls';
import { locales } from '../src/i18n/config';

const KEY = '177b1301568e470b821b5bc16df2a14a';
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const BATCH = 10_000; // protocol maximum per request
const ARTICLES_DIR = path.join(process.cwd(), 'src', 'content', 'articles');

function urlForArticleFile(file: string): string | null {
  const m = file.replace(/\\/g, '/').match(/src\/content\/articles\/([a-z]{2})\/([a-z0-9-]+)\.json$/);
  return m ? localizedUrl(m[1], `/guides/${m[2]}`) : null;
}

function allGuideUrls(): string[] {
  const urls: string[] = [];
  for (const locale of locales) {
    const dir = path.join(ARTICLES_DIR, locale);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith('.json')) urls.push(localizedUrl(locale, `/guides/${f.replace('.json', '')}`));
    }
  }
  return urls;
}

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) return '';
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf-8');
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  const urls = args.includes('--all')
    ? allGuideUrls()
    : [...new Set((await readStdin()).split(/\r?\n/).map(urlForArticleFile).filter((u): u is string => !!u))];

  if (urls.length === 0) {
    console.log('IndexNow: no changed pages to submit');
    return;
  }

  console.log(`IndexNow: ${urls.length} URLs${dryRun ? ' (dry run)' : ''}`);
  if (dryRun) {
    urls.slice(0, 20).forEach(u => console.log('  ' + u));
    return;
  }

  const host = new URL(SITE_URL).host;
  for (let i = 0; i < urls.length; i += BATCH) {
    const urlList = urls.slice(i, i + BATCH);
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host, key: KEY, keyLocation: `${SITE_URL}/${KEY}.txt`, urlList }),
    });
    // 200 = accepted, 202 = accepted (key validation pending)
    console.log(`  batch ${i / BATCH + 1}: HTTP ${res.status} (${urlList.length} URLs)`);
    if (res.status >= 400) {
      console.error(await res.text());
      process.exit(1);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
