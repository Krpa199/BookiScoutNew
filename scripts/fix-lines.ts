/**
 * Surgical, line-level fixes with Gemini Flash: only the lines/fields matching
 * a pattern are sent, with a task describing what is wrong; everything else in
 * the article stays byte-for-byte the same. Presets cover recurring problems.
 *
 *   npx tsx scripts/fix-lines.ts <preset> [--dry-run] [lang/slug ...]
 *   presets: kuna | etias | first-person | placeholders
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PROMPT_LANGUAGE_NAMES, LanguageCode } from '../src/config/languages';

const DIR = path.join(process.cwd(), 'src', 'content', 'articles');

const PRESETS: Record<string, { re: RegExp; task: string }> = {
  kuna: {
    re: /\b(kuna|kune|kunas|kunama|kunách|kunami|kunach|HRK)\b|\bкун[аыу]?\b/i,
    task: `Croatia replaced the kuna with the euro on 1 January 2023; kuna is not accepted anywhere and no "transition period" exists any more.
Rewrite so the text says to pay in euros (cash or card). Drop advice to carry kuna, claims that meters/shops/kiosks accept kuna, and "maximize your kuna". Convert any kuna price at 7.5345 kn = 1 € and round sensibly. A clearly historical remark ("before 2023 Croatia used the kuna") may stay.`,
  },
  etias: {
    re: /\bETIAS\b|\bEES\b/,
    task: `Entry-system facts are outdated. Correct status: the EU Entry/Exit System (EES), which registers non-EU travellers' fingerprints and photo at the border, started on 12 October 2025. ETIAS, an online travel authorisation for visa-exempt non-EU visitors, is planned to start in the last quarter of 2026 (it does not apply to EU citizens); travellers should check travel-europe.europa.eu before booking. Replace wrong or vague dates ("2025", "2025/2026", "on the horizon") with this, briefly. Do not add anything else.`,
  },
  'first-person': {
    re: /\b(in my experience|my trip|I visited|I stayed|I've been|when I was|I personally)\b|prema mo(m|jem) iskustvu|meiner Erfahrung nach|nach meiner Erfahrung|d'après mon expérience|selon mon expérience|en mi experiencia|nella mia esperienza|in mijn ervaring|z moje(go)? doświadczeni|podle m(é|ých) zkušenost|z mojich skúseností|po mojih izkušnjah|iz mojih izkušenj|tapasztalatom szerint|по моему опыту|по моим наблюдениям/i,
    task: `The text pretends a human author personally visited ("in my experience", "my trip"). Nobody did. Rewrite the sentence as plain advice without first person or claimed personal experience. Keep the advice itself.`,
  },
  placeholders: {
    re: /\bxxx\b|\d{3}\s?XXX\b|[$£]\s?\d/i,
    task: `The text contains a placeholder phone/number (e.g. "443 XXX", "708xxx") or a price in dollars/pounds. Remove the placeholder number (say to check the official sign or website instead); convert any $/£ price to euros (1 $ ≈ 0.9 €, 1 £ ≈ 1.15 €, rounded) written as euros.`,
  },
};

const model = () =>
  new GoogleGenerativeAI(process.env.GEMINI_API_KEY_1 || '').getGenerativeModel({
    model: 'gemini-flash-latest',
    generationConfig: { responseMimeType: 'application/json', thinkingConfig: { thinkingBudget: 0 } } as any,
  });

type Unit = { kind: string; get: () => string; set: (v: string) => void };

function units(a: any, re: RegExp): Unit[] {
  const out: Unit[] = [];
  for (const k of ['title', 'metaDescription', 'quickAnswer'] as const) {
    if (typeof a[k] === 'string' && re.test(a[k])) out.push({ kind: k, get: () => a[k], set: v => { a[k] = v; } });
  }
  if (typeof a.content === 'string') {
    const lines: string[] = a.content.split('\n');
    lines.forEach((l, i) => {
      if (re.test(l)) out.push({ kind: /^#+ /.test(l) ? 'heading line' : 'content line', get: () => lines[i], set: v => { lines[i] = v; a.content = lines.join('\n'); } });
    });
  }
  for (const k of ['faq', 'tableData'] as const) {
    if (!Array.isArray(a[k])) continue;
    for (const row of a[k]) for (const f of Object.keys(row)) {
      if (typeof row[f] === 'string' && re.test(row[f])) out.push({ kind: `${k}.${f}`, get: () => row[f], set: v => { row[f] = v; } });
    }
  }
  return out;
}

async function rewrite(lang: LanguageCode, task: string, texts: Record<string, string>) {
  const prompt = `These are pieces of a ${PROMPT_LANGUAGE_NAMES[lang]} travel article about Croatia, for people planning a trip.

Problem to fix: ${task}

Rules:
- Change only what the problem requires; keep every other word, fact and price, and the language (${PROMPT_LANGUAGE_NAMES[lang]}).
- Keep markdown exactly: a line starting "## ", "* **Label:**" or "1. " keeps that prefix.
- If nothing useful is left of a content line, return "". Never return an empty title, metaDescription or quickAnswer.
- Never name new businesses or add new facts beyond those given in the problem description.

Return JSON with the same keys, each value the corrected text (string, without the [kind] tag).

${JSON.stringify(texts)}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const out = JSON.parse((await model().generateContent(prompt)).response.text());
      for (const k of Object.keys(texts)) if (typeof out[k] !== 'string') throw new Error(`missing ${k}`);
      return out as Record<string, string>;
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise(r => setTimeout(r, 5000 * attempt));
    }
  }
  throw new Error('unreachable');
}

async function main() {
  const [preset, ...rest] = process.argv.slice(2);
  const P = PRESETS[preset];
  if (!P) throw new Error(`preset: ${Object.keys(PRESETS).join(' | ')}`);
  const dry = rest.includes('--dry-run');
  const only = rest.filter(a => !a.startsWith('--')).map(s => (s.endsWith('.json') ? s : `${s}.json`));
  const files = only.length ? only : fs.readdirSync(DIR).flatMap(l => fs.readdirSync(path.join(DIR, l)).map(f => `${l}/${f}`))
    .filter(rel => P.re.test(fs.readFileSync(path.join(DIR, rel), 'utf8')));
  console.log(`${preset}: ${files.length} files`);
  let ok = 0, failed = 0, still = 0;
  const queue = [...files];
  const worker = async () => {
    for (let rel = queue.shift(); rel; rel = queue.shift()) {
      try {
        const p = path.join(DIR, rel);
        const a = JSON.parse(fs.readFileSync(p, 'utf8'));
        const us = units(a, P.re);
        if (!us.length) continue;
        const out = await rewrite(rel.split('/')[0] as LanguageCode, P.task, Object.fromEntries(us.map((u, i) => [`p${i}`, `[${u.kind}] ${u.get()}`])));
        us.forEach((u, i) => {
          const before = u.get();
          let v = out[`p${i}`].replace(/^\[[^\]]+\]\s*/, '').trim();
          const prefix = (before.match(/^(\s*(#+ |[*-]\s+|\d+\.\s+))/) || [''])[0];
          if (v && prefix && !v.startsWith(prefix.trim())) v = prefix + v.replace(/^(#+ |[*-]\s+|\d+\.\s+)/, '');
          if (!v && /^(title|metaDescription|quickAnswer)$/.test(u.kind)) return;
          if (v.length > before.length * 1.6 + 120) return; // runaway rewrite: keep original
          if (P.re.test(v) && preset !== 'etias' && !/(before|until|prior to|do|bis|avant|antes|prima|vóór|przed|před|pred|előtt|до) 2023/i.test(v)) still++;
          if (dry) console.log(`  ${rel} [${u.kind}]\n    − ${before.slice(0, 240)}\n    + ${v.slice(0, 240) || '(deleted)'}`);
          u.set(v);
        });
        if (typeof a.content === 'string') a.content = a.content.replace(/\n{3,}/g, '\n\n');
        if (!dry) fs.writeFileSync(p, JSON.stringify(a, null, 2));
        ok++;
      } catch (err) { failed++; console.log(`❌ ${rel}: ${(err as Error).message}`); }
    }
  };
  await Promise.all(Array.from({ length: dry ? 1 : 6 }, worker));
  console.log(`ok ${ok}, failed ${failed}, lines still matching ${still}`);
}

main();
