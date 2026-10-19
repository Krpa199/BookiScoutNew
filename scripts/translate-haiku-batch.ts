/**
 * Translate articles with Claude Haiku 5.5 through Anthropic's Message Batches
 * API (50% cheaper than normal calls; results within 24 h, usually much
 * sooner). Built for re-translating the ~1,500 Slovak pages that were written
 * in Slovenian, from today's cleaned English source.
 *
 * Key: ANTHROPIC_TRANSLATE_KEY in .env.local (deliberately NOT
 * ANTHROPIC_API_KEY, which Claude Code would pick up and bill as API usage).
 *
 *   npx tsx scripts/translate-haiku-batch.ts submit --lang sk --slugs slugs.txt
 *   npx tsx scripts/translate-haiku-batch.ts submit --lang sk --slovenian [--limit 3]
 *   npx tsx scripts/translate-haiku-batch.ts status <batch_id>
 *   npx tsx scripts/translate-haiku-batch.ts collect <batch_id> [--dry-run]
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';
import { PROMPT_LANGUAGE_NAMES, LanguageCode } from '../src/config/languages';
import { trimEnding } from './fix-truncated-endings';

const DIR = path.join(process.cwd(), 'src', 'content', 'articles');
const API = 'https://api.anthropic.com/v1/messages/batches';
const MODEL = process.env.HAIKU_MODEL || 'claude-haiku-5-5';
const FIELDS = ['title', 'metaDescription', 'quickAnswer', 'content', 'faq', 'tableData', 'imageAlt'] as const;
const KEEP = ['imageUrl', 'imageCredit', 'imageCreditUrl', 'imageSource', 'generatedAt', 'destination', 'destinationName', 'region', 'theme', 'lat', 'lng', 'slug'];

const SL = new Set('kje splača prenočiti hrvaški hrvaškem lahko zelo vendar če ki smo boste letu obisk morje tudi ali vodnik'.split(' '));
const SK = new Set('kde oplatí ubytovať chorvátsky chorvátskom môžete veľmi však ak ktoré bude roku návšteva more tiež alebo sprievodca'.split(' '));
const EN = new Set('the and with you your is are this that for from which while what when where will have has not but also into than'.split(' '));
const words = (s: string) => s.toLowerCase().split(/[^\p{L}]+/u).filter(Boolean);

function headers() {
  const key = process.env.ANTHROPIC_TRANSLATE_KEY;
  if (!key) throw new Error('ANTHROPIC_TRANSLATE_KEY is not set in .env.local');
  return { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' };
}

function prompt(lang: LanguageCode, src: Record<string, unknown>) {
  const L = PROMPT_LANGUAGE_NAMES[lang];
  return `Translate this travel article about Croatia from English to ${L}. Readers are people planning a holiday.
Keep exactly the same JSON keys and structure, and keep all markdown (headings, lists, bold, tables) as it is.
Translate naturally, as a native ${L} travel writer would — not word for word.
- Keep every price exactly as in the original, in euros (€). Never convert to kuna/HRK or any other currency.
- Headings: follow ${L} capitalisation (usually only the first word and proper nouns capitalised).
- Inflect Croatian place names correctly for ${L} grammar.
- Translate "vs"/"vs." in titles and headings with the natural ${L} word for "or".
- Use the usual ${L} name for Plitvice Lakes, not the Croatian "Plitvička Jezera".
- Do not add, drop or change facts, names or numbers.

Return only the JSON object, with no code fences and no comments.

${JSON.stringify(src)}`;
}

function enSource(slug: string) {
  const en = JSON.parse(fs.readFileSync(path.join(DIR, 'en', `${slug}.json`), 'utf8'));
  return { en, src: Object.fromEntries(FIELDS.filter(k => en[k] !== undefined).map(k => [k, en[k]])) };
}

function slovenianSlovak(): string[] {
  return fs.readdirSync(path.join(DIR, 'sk')).filter(f => {
    const a = JSON.parse(fs.readFileSync(path.join(DIR, 'sk', f), 'utf8'));
    let sl = 0, sk = 0;
    for (const w of words(a.content || '')) { if (SL.has(w)) sl++; if (SK.has(w)) sk++; }
    return sl > sk;
  }).map(f => f.replace(/\.json$/, ''));
}

async function submit(args: string[]) {
  const lang = args[args.indexOf('--lang') + 1] as LanguageCode;
  if (!PROMPT_LANGUAGE_NAMES[lang] || lang === 'en') throw new Error('--lang <code> required');
  let slugs = args.includes('--slovenian') ? slovenianSlovak()
    : fs.readFileSync(args[args.indexOf('--slugs') + 1], 'utf8').split(/\s+/).filter(Boolean);
  const li = args.indexOf('--limit');
  if (li !== -1) slugs = slugs.slice(0, Number(args[li + 1]));
  const requests = slugs.filter(s => fs.existsSync(path.join(DIR, 'en', `${s}.json`))).map(slug => ({
    custom_id: `${lang}__${slug}`.slice(0, 64),
    params: { model: MODEL, max_tokens: Number(process.env.HAIKU_MAX_TOKENS || 32000), messages: [{ role: 'user', content: prompt(lang, enSource(slug).src) }] },
  }));
  // A batch takes up to 100,000 requests / 256 MB; split to stay well inside.
  for (let i = 0; i < requests.length; i += 500) {
    const res = await fetch(API, { method: 'POST', headers: headers(), body: JSON.stringify({ requests: requests.slice(i, i + 500) }) });
    const j: any = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(j));
    console.log(`batch ${j.id}: ${requests.slice(i, i + 500).length} requests submitted`);
    fs.appendFileSync('haiku-batches.txt', `${j.id}\n`);
  }
}

async function status(id: string) {
  const j: any = await (await fetch(`${API}/${id}`, { headers: headers() })).json();
  console.log(JSON.stringify({ id: j.id, status: j.processing_status, counts: j.request_counts, ended: j.ended_at }, null, 1));
  return j;
}

async function collect(id: string, dry: boolean, only?: Set<string>) {
  const b = await status(id);
  if (b.processing_status !== 'ended') { console.log('not finished yet'); return; }
  const text = await (await fetch(b.results_url, { headers: headers() })).text();
  let ok = 0, bad = 0, inTok = 0, outTok = 0;
  for (const line of text.trim().split('\n')) {
    const r = JSON.parse(line);
    const [lang, slug] = r.custom_id.split('__') as [LanguageCode, string];
    if (only && !only.has(slug)) continue;
    if (r.result.type !== 'succeeded') { bad++; console.log(`❌ ${slug}: ${r.result.type}`); continue; }
    const msg = r.result.message;
    inTok += msg.usage.input_tokens; outTok += msg.usage.output_tokens;
    try {
      let raw = msg.content.map((c: any) => c.text || '').join('').trim().replace(/^```(json)?\s*/, '').replace(/```\s*$/, '');
      const t = JSON.parse(raw);
      const { en } = enSource(slug);
      const w = words(t.content || '');
      // guards: complete, right language, not English, title translated
      if (msg.stop_reason === 'max_tokens') throw new Error('cut off (max_tokens)');
      if ((t.content || '').length < en.content.length * 0.6) throw new Error('content much shorter than English');
      if (w.filter(x => EN.has(x)).length / Math.max(1, w.length) > 0.06) throw new Error('still English');
      if (lang === 'sk') { let sl = 0, sk = 0; for (const x of w) { if (SL.has(x)) sl++; if (SK.has(x)) sk++; } if (sl > sk || (sl === sk && sl > 0)) throw new Error('not Slovak (Slovenian?)'); }
      if ((t.title || '').trim() === (en.title || '').trim()) throw new Error('title not translated');
      // a number followed by a non-euro unit ("kníh" = books is not "kn")
      if (/\d\s?(kn|HRK|Kč|zł|Ft)(?!\p{L})|\d\s?\$|\$\s?\d/u.test(JSON.stringify(t))) throw new Error('non-euro price');
      t.content = trimEnding(t.content) ?? t.content;
      const out = { ...t, ...Object.fromEntries(KEEP.filter(k => en[k] !== undefined).map(k => [k, en[k]])), language: lang, updatedAt: new Date().toISOString() };
      if (!dry) fs.writeFileSync(path.join(DIR, lang, `${slug}.json`), JSON.stringify(out, null, 2));
      if (dry) console.log(`✅ ${lang}/${slug} | ${t.title}`);
      ok++;
    } catch (e) { bad++; console.log(`❌ ${lang}/${slug}: ${(e as Error).message}`); }
  }
  // Haiku 5.5 batch: $0.05 / M input, $0.25 / M output
  console.log(`\nsaved ${ok}, failed ${bad} | tokens in ${inTok}, out ${outTok} | cost ≈ $${(inTok * 0.05e-6 + outTok * 0.25e-6).toFixed(3)}`);
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === 'submit') return submit(args);
  if (cmd === 'status') return void (await status(args[0]));
  const oi = args.indexOf('--only');
  if (cmd === 'collect') return collect(args[0], args.includes('--dry-run'), oi !== -1 ? new Set(fs.readFileSync(args[oi + 1], 'utf8').split(/\s+/).filter(Boolean)) : undefined);
  console.log('usage: submit | status <id> | collect <id> [--dry-run]');
}

main().catch(e => { console.error(e.message); process.exit(1); });
