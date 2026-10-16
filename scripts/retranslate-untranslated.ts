/**
 * Re-translate articles that were saved in English under another language
 * (translation failed and the EN text was stored as-is — ~600 files).
 * Detects them by title AND opening identical to the EN original, retranslates
 * with the current prompt (euro prices, native heading case), keeps image data.
 *
 *   npx tsx scripts/retranslate-untranslated.ts --dry-run
 *   npx tsx scripts/retranslate-untranslated.ts
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';
import { translateArticle, ArticleData } from './gemini';
import { LanguageCode } from '../src/config/languages';

const DIR = path.join(process.cwd(), 'src', 'content', 'articles');
const REPORT = path.join(process.cwd(), 'retranslate-report.json');

/**
 * Quality gate for one translation vs. its English original. Returns the list
 * of problems (empty = OK). A translation that fails is retried, never saved.
 */
function qaProblems(en: Record<string, any>, t: Record<string, any>): string[] {
  const problems: string[] = [];
  const headings = (s: string) => (s.match(/^#{1,4} /gm) || []).length;
  const enWords = (s: string) => (s.match(/\b(the|and|with|from|your|you|this|that|are|for)\b/gi) || []).length;
  if (!t.title || t.title === en.title) problems.push('title not translated');
  if (!t.content) problems.push('missing content');
  else {
    const ratio = t.content.length / Math.max(1, en.content.length);
    if (ratio < 0.7 || ratio > 1.6) problems.push(`length ratio ${ratio.toFixed(2)}`);
    if (Math.abs(headings(t.content) - headings(en.content)) > 1) problems.push(`headings ${headings(t.content)} vs ${headings(en.content)}`);
    const per1k = enWords(t.content) / (t.content.length / 1000);
    if (per1k > 6) problems.push('content still reads as English');
    if (/\bHRK\b|\d[\d.,]*\s?(kn|kuna|kune)\b/i.test(t.content)) problems.push('kuna price');
  }
  if (Array.isArray(en.faq) && (!Array.isArray(t.faq) || t.faq.length !== en.faq.length)) problems.push('FAQ count differs');
  else if (Array.isArray(t.faq) && t.faq.some((q: any, i: number) => q.question === en.faq[i].question)) problems.push('FAQ not translated');
  return problems;
}

function untranslated(): string[] {
  const out: string[] = [];
  for (const lang of fs.readdirSync(DIR)) {
    if (lang === 'en') continue;
    for (const f of fs.readdirSync(path.join(DIR, lang))) {
      const enFile = path.join(DIR, 'en', f);
      if (!fs.existsSync(enFile)) continue;
      const a = JSON.parse(fs.readFileSync(path.join(DIR, lang, f), 'utf-8'));
      const en = JSON.parse(fs.readFileSync(enFile, 'utf-8'));
      if (a.title === en.title && (a.content || '').slice(0, 200) === (en.content || '').slice(0, 200)) {
        out.push(`${lang}/${f}`);
      }
    }
  }
  return out;
}

async function main() {
  const files = untranslated();
  console.log(`${files.length} articles stored in English under another language`);
  if (process.argv.includes('--dry-run')) return;

  let ok = 0;
  const report: { file: string; ok: boolean; problems: string[] }[] = [];
  for (const rel of files) {
    const [lang, f] = rel.split('/');
    const en = JSON.parse(fs.readFileSync(path.join(DIR, 'en', f), 'utf-8')) as ArticleData & Record<string, unknown>;
    let saved = false;
    let lastProblems: string[] = [];
    for (let attempt = 1; attempt <= 3 && !saved; attempt++) {
      try {
        const t = await translateArticle(en, lang as LanguageCode);
        lastProblems = qaProblems(en, t as Record<string, any>);
        if (lastProblems.length) throw new Error(lastProblems.join('; '));
        const out = { ...en, ...t, language: lang, updatedAt: new Date().toISOString() };
        fs.writeFileSync(path.join(DIR, lang, f), JSON.stringify(out, null, 2));
        console.log(`  ✅ ${rel}`);
        ok++;
        saved = true;
      } catch (err) {
        console.log(`  ⚠️ ${rel} attempt ${attempt}: ${(err as Error).message}`);
        if (attempt < 3) await new Promise(r => setTimeout(r, 15000));
      }
    }
    report.push({ file: rel, ok: saved, problems: saved ? [] : lastProblems });
  }
  console.log(`\nRetranslated ${ok}/${files.length}`);
  fs.writeFileSync(REPORT, JSON.stringify({ ok, total: files.length, failed: report.filter(r => !r.ok) }, null, 2));
  console.log(`Report: ${REPORT}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
