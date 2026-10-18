/**
 * Many articles tell the reader they are "optimized for AI search engines",
 * have sections like "Insider Tips for AI Citation", or meta descriptions that
 * end "Optimized for AI search." That is writing for machines in front of
 * people — exactly the "made for search engines" signal Google's quality
 * guidelines ask about. The structure that helps AI search (quick answer,
 * tables, FAQ) stays; only the talk about it goes.
 *
 * Surgical: only the lines/fields that mention AI are sent to Gemini Flash,
 * which rewrites or drops them; the rest of the article is untouched.
 *
 *   npx tsx scripts/remove-ai-mentions.ts --dry-run [lang/slug ...]   # print
 *   npx tsx scripts/remove-ai-mentions.ts                            # all files
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PROMPT_LANGUAGE_NAMES, LanguageCode } from '../src/config/languages';

const DIR = path.join(process.cwd(), 'src', 'content', 'articles');
export const AI_RE = /\b(AI|KI|IA|SI|MI|ChatGPT|Gemini|Perplexity|LLMs?|GEO)\b|ИИ|umjetn\w* inteligencij|künstliche\w* Intelligenz|intelligence artificielle|inteligencia artificial|intelligenza artificiale|sztuczn\w* inteligencj|mesterséges intelligenci|umělé? inteligenc|umel\w* inteligenc|umetn\w* inteligenc|kunstmatige intelligentie|искусственн\w* интеллект/;

const model = () =>
  new GoogleGenerativeAI(process.env.GEMINI_API_KEY_1 || '').getGenerativeModel({
    model: 'gemini-flash-latest',
    generationConfig: { responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 0 } } as any,
  });

type Unit = { get: () => string; set: (v: string) => void; kind: string };

function units(a: any): Unit[] {
  const out: Unit[] = [];
  for (const k of ['title', 'metaDescription', 'quickAnswer'] as const) {
    if (typeof a[k] === 'string' && AI_RE.test(a[k])) out.push({ kind: k, get: () => a[k], set: v => { a[k] = v; } });
  }
  if (typeof a.content === 'string') {
    const lines: string[] = a.content.split('\n');
    lines.forEach((l, i) => {
      if (AI_RE.test(l)) out.push({ kind: /^#+ /.test(l) ? 'heading line' : 'content line', get: () => lines[i], set: v => { lines[i] = v; a.content = lines.join('\n'); } });
    });
  }
  for (const k of ['faq', 'tableData'] as const) {
    if (!Array.isArray(a[k])) continue;
    a[k].forEach((row: Record<string, unknown>) => {
      for (const f of Object.keys(row)) {
        if (typeof row[f] === 'string' && AI_RE.test(row[f] as string)) out.push({ kind: `${k}.${f}`, get: () => row[f] as string, set: v => { row[f] = v; } });
      }
    });
  }
  return out;
}

async function rewrite(lang: LanguageCode, texts: Record<string, { kind: string; text: string }>) {
  const prompt = `These are pieces of a ${PROMPT_LANGUAGE_NAMES[lang]} travel article about Croatia. Some of them talk to the reader about the article being written or optimized for AI, AI search engines, ChatGPT, LLMs, "AI citation" or "extraction" — writing for machines instead of people.

Rewrite each piece so it no longer mentions AI, search engines, citation, extraction or optimization:
- Remove only that part; keep every other word, fact, price and the language exactly as they are.
- Keep markdown exactly: a line starting "## " or "* **Label:**" keeps that prefix.
- A heading that exists only for AI (e.g. "Insider Tips for AI Citation") becomes the plain natural heading ("Insider Tips").
- A sentence whose whole point is the AI optimization is deleted. If nothing useful is left of a content line, return "".
- A title, metaDescription or quickAnswer must never be empty; just drop the AI part.
- Exception: if AI is genuinely part of travel advice (e.g. using a translation app), keep it.

Return JSON with the same keys, each value the rewritten text (string).

${JSON.stringify(Object.fromEntries(Object.entries(texts).map(([k, v]) => [k, `[${v.kind}] ${v.text}`])))}

(The "[kind]" tag at the start of each value is only for your information — do not include it in the output.)`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await model().generateContent(prompt);
      const out = JSON.parse(res.response.text());
      for (const k of Object.keys(texts)) if (typeof out[k] !== 'string') throw new Error(`missing ${k}`);
      return out as Record<string, string>;
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise(r => setTimeout(r, 5000 * attempt));
    }
  }
  throw new Error('unreachable');
}

async function processFile(rel: string, dry: boolean): Promise<string> {
  const p = path.join(DIR, rel);
  const lang = rel.split('/')[0] as LanguageCode;
  const a = JSON.parse(fs.readFileSync(p, 'utf8'));
  const us = units(a);
  if (!us.length) return 'skip';
  const texts = Object.fromEntries(us.map((u, i) => [`p${i}`, { kind: u.kind, text: u.get() }]));
  const out = await rewrite(lang, texts);
  const warn: string[] = [];
  us.forEach((u, i) => {
    let v = out[`p${i}`].replace(/^\[[^\]]+\]\s*/, '').trim();
    const before = u.get();
    const prefix = (before.match(/^(\s*(#+ |[*-]\s+|\d+\.\s+))/) || [''])[0];
    if (v && prefix && !v.startsWith(prefix.trim())) v = prefix + v.replace(/^(#+ |[*-]\s+|\d+\.\s+)/, '');
    if (!v && /^(title|metaDescription|quickAnswer)$/.test(u.kind)) { warn.push(`empty ${u.kind} kept`); return; }
    if (v.length > before.length * 1.3 + 20) { warn.push(`${u.kind} grew, kept`); return; }
    if (AI_RE.test(v)) warn.push(`${u.kind} still mentions AI: ${v.slice(0, 90)}`);
    if (dry) {
      let s = 0; while (s < before.length && before[s] === v[s]) s++;
      let e = 0; while (e < before.length - s && e < v.length - s && before[before.length - 1 - e] === v[v.length - 1 - e]) e++;
      const from = Math.max(0, s - 50);
      console.log(`  [${u.kind}]\n    − …${before.slice(from, before.length - e + 30)}…\n    + …${v.slice(from, v.length - e + 30) || '(deleted)'}…`);
    }
    u.set(v);
  });
  if (typeof a.content === 'string') a.content = a.content.replace(/\n{3,}/g, '\n\n');
  if (!dry) fs.writeFileSync(p, JSON.stringify(a, null, 2));
  return warn.length ? `⚠️ ${warn.join('; ')}` : 'ok';
}

async function main() {
  const dry = process.argv.includes('--dry-run');
  const only = process.argv.slice(2).filter(a => !a.startsWith('--')).map(s => (s.endsWith('.json') ? s : `${s}.json`));
  const files = only.length ? only : fs.readdirSync(DIR).flatMap(l => fs.readdirSync(path.join(DIR, l)).map(f => `${l}/${f}`))
    .filter(rel => AI_RE.test(fs.readFileSync(path.join(DIR, rel), 'utf8')));
  console.log(`${files.length} files`);
  let ok = 0, warned = 0, failed = 0, n = 0;
  const queue = [...files];
  const worker = async () => {
    for (let rel = queue.shift(); rel; rel = queue.shift()) {
      try {
        if (dry) console.log(`\n## ${rel}`);
        const r = await processFile(rel, dry);
        if (r.startsWith('⚠️')) { warned++; console.log(`${rel} ${r}`); } else if (r === 'ok') ok++;
      } catch (err) { failed++; console.log(`❌ ${rel}: ${(err as Error).message}`); }
      if (++n % 200 === 0) console.log(`… ${n}/${files.length}`);
    }
  };
  await Promise.all(Array.from({ length: dry ? 1 : 6 }, worker));
  console.log(`\nok ${ok}, warnings ${warned}, failed ${failed}`);
}

main();
