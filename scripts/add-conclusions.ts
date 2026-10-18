/**
 * Give articles that were cut short (see fix-truncated-endings.ts) a short,
 * article-specific closing section, so they read as finished. One Gemini Flash
 * call per article writes the closing in all 13 languages; it is appended only
 * to the language files that lost their ending.
 *
 *   npx tsx scripts/add-conclusions.ts --dry-run slug ...      # print, write nothing
 *   npx tsx scripts/add-conclusions.ts --file slugs.txt [--langs-from-git]
 *
 * --langs-from-git: append only to files with uncommitted changes (the trimmed
 * ones); otherwise to every language of the slug.
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PROMPT_LANGUAGE_NAMES, LanguageCode } from '../src/config/languages';

const DIR = path.join(process.cwd(), 'src', 'content', 'articles');
const LANGS = Object.keys(PROMPT_LANGUAGE_NAMES) as LanguageCode[];

const model = () =>
  new GoogleGenerativeAI(process.env.GEMINI_API_KEY_1 || '').getGenerativeModel({
    model: 'gemini-flash-latest',
    generationConfig: { responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 0 } } as any,
  });

type Closing = { heading: string; text: string };

async function writeClosing(en: any): Promise<Record<string, Closing>> {
  const headings = (en.content.match(/^#{2,3} .*/gm) || []).join('\n');
  const prompt = `You are finishing a travel article about ${en.destinationName || en.destination}, Croatia, for people PLANNING a trip.
The article was cut short and has no ending. Write its closing section.

Title: ${en.title}
Summary: ${en.quickAnswer}
Sections:
${headings}
How it currently ends:
…${en.content.slice(-1200)}

Write the closing section:
- A short heading (2–6 words) specific to this article. Vary the form: a question ("Is Biograd Right for Your Family?"), a verdict ("Book Early, Stay Central"), or a topic ("Before You Book a Lošinj Ferry"). Do not start it with "Planning". Never "Conclusion", "Final Thoughts" or "Wrapping Up".
- 2–3 sentences that help the reader decide or plan: who this place/option suits, the one or two things to book or check first. Concrete and specific to this article.
- Use only facts already in the article. Do not add new prices, numbers, dates or opening hours. Never name a business, hotel, restaurant or person.
- Do not start the text with "<place> suits" or "<place> is ideal"; open with what matters most for this reader.
- Plain, direct tone. No "in conclusion", no hype words (breathtaking, nestled, hidden gem, unforgettable, paradise), no exclamation marks.

Return JSON with one key per language code, each {"heading": "...", "text": "..."}, the same closing written natively in each language:
${LANGS.map(l => `"${l}": ${PROMPT_LANGUAGE_NAMES[l]}`).join('\n')}
Use euro (€) if a price is unavoidable. Keep place names in their usual form for each language.`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await model().generateContent(prompt);
      const out = JSON.parse(res.response.text());
      const bad = LANGS.filter(l => !out[l]?.heading || !out[l]?.text || out[l].text.length < 60);
      if (bad.length) throw new Error(`missing/short: ${bad.join(',')}`);
      if (/\$\d|kuna|HRK/i.test(JSON.stringify(out))) throw new Error('non-euro money');
      return out;
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise(r => setTimeout(r, 5000 * attempt));
    }
  }
  throw new Error('unreachable');
}

async function main() {
  const dry = process.argv.includes('--dry-run');
  const fromGit = process.argv.includes('--langs-from-git');
  const fi = process.argv.indexOf('--file');
  const slugs = fi !== -1
    ? fs.readFileSync(process.argv[fi + 1], 'utf8').split(/\s+/).filter(Boolean)
    : process.argv.slice(2).filter(a => !a.startsWith('--'));
  const changed = fromGit
    ? new Set(execSync('git diff --name-only -- src/content/articles').toString().trim().split('\n').map(f => f.replace(/\\/g, '/')))
    : null;

  let done = 0, failed = 0;
  const queue = [...slugs];
  const worker = async () => {
    for (let slug = queue.shift(); slug; slug = queue.shift()) {
      const en = JSON.parse(fs.readFileSync(path.join(DIR, 'en', `${slug}.json`), 'utf8'));
      try {
        const c = await writeClosing(en);
        if (dry) {
          console.log(`\n## ${slug}`);
          for (const l of ['en', 'hr', 'de', 'sk'] as const) console.log(`  [${l}] ## ${c[l].heading}\n       ${c[l].text}`);
          continue;
        }
        let n = 0;
        for (const l of LANGS) {
          const rel = `src/content/articles/${l}/${slug}.json`;
          if (changed && !changed.has(rel)) continue;
          const p = path.join(DIR, l, `${slug}.json`);
          if (!fs.existsSync(p)) continue;
          const a = JSON.parse(fs.readFileSync(p, 'utf8'));
          a.content = `${a.content.replace(/\s+$/, '')}\n\n## ${c[l].heading.replace(/^#+\s*/, '')}\n\n${c[l].text.trim()}`;
          fs.writeFileSync(p, JSON.stringify(a, null, 2));
          n++;
        }
        done++;
        console.log(`✅ ${slug} (${n} languages)  [${done + failed}/${slugs.length}]`);
      } catch (err) {
        failed++;
        console.log(`❌ ${slug}: ${(err as Error).message}`);
      }
    }
  };
  await Promise.all(Array.from({ length: 5 }, worker));
  console.log(`\ndone ${done}, failed ${failed}`);
}

main();
