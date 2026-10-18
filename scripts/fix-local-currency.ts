/**
 * Older translations "helpfully" converted euro prices into the reader's
 * currency (Czech Kč, Polish zł, Hungarian Ft, Russian руб). Croatia uses the
 * euro, so those prices are wrong to show. No API: each converted amount is
 * divided back by a typical rate and snapped to the matching euro amount in
 * the English original when one is within 15%, otherwise rounded sensibly.
 *
 *   npx tsx scripts/fix-local-currency.ts --dry-run
 *   npx tsx scripts/fix-local-currency.ts
 */
import fs from 'fs';
import path from 'path';

const DIR = path.join(process.cwd(), 'src', 'content', 'articles');
const RATES: Record<string, { rate: number; unit: string }> = {
  cz: { rate: 25, unit: '(?:Kč|CZK)' },
  pl: { rate: 4.3, unit: '(?:zł|PLN)' },
  hu: { rate: 400, unit: '(?:Ft|HUF|forint\\p{L}*)' },
  ru: { rate: 100, unit: '(?:руб\\p{L}*\\.?|₽|RUB)' },
};

const num = (s: string) => parseFloat(s.replace(/[\s .](?=\d{3}\b)/g, '').replace(',', '.'));
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ','));

function round(eur: number): number {
  if (eur < 3) return Math.round(eur * 2) / 2;
  if (eur < 20) return Math.round(eur);
  if (eur < 100) return Math.round(eur / 5) * 5;
  return Math.round(eur / 10) * 10;
}

function euroValues(en: any): number[] {
  const t = JSON.stringify([en.content, en.faq, en.tableData, en.quickAnswer]);
  const n = '(\\d[\\d,]*(?:\\.\\d+)?)';
  const out: number[] = [];
  // "€20", "20€", and both ends of ranges like "€20-35" / "€20-€35" / "20-35 €"
  for (const m of t.matchAll(new RegExp(`€\\s?${n}(?:\\s?[–-]\\s?€?\\s?${n})?|${n}(?:\\s?[–-]\\s?${n})?\\s?€`, 'g'))) {
    for (const g of m.slice(1)) if (g) out.push(parseFloat(g.replace(/,/g, '')));
  }
  return out;
}

function toEur(local: number, rate: number, en: number[]): number {
  const raw = local / rate;
  let best: number | null = null;
  for (const v of en) if (Math.abs(v - raw) / Math.max(v, 1) <= 0.1 && (best === null || Math.abs(v - raw) < Math.abs(best - raw))) best = v;
  if (best !== null) return best;
  // the translator multiplied by a round rate, so an exact quotient is the original
  if (Math.abs(raw - Math.round(raw)) < 0.05) return Math.round(raw);
  return round(raw);
}

export function convert(text: string, lang: string, en: number[]): { text: string; n: number } {
  const { rate, unit } = RATES[lang];
  const amount = '(\\d{1,3}(?:[\\s\\u00a0.]\\d{3})+|\\d+(?:[.,]\\d+)?)';
  // "250–500 Kč", "250 - 500 Kč", "od 250 do 500 Kč" stays a range; "500 Kč"
  const re = new RegExp(`${amount}(\\s?[–-]\\s?)${amount}\\s?${unit}|${amount}\\s?${unit}`, 'gu');
  let n = 0;
  const out = text.replace(re, (_m, a, dash, b, single) => {
    n++;
    if (single !== undefined) return `${fmt(toEur(num(single), rate, en))} €`;
    return `${fmt(toEur(num(a), rate, en))}${dash}${fmt(toEur(num(b), rate, en))} €`;
  });
  return { text: out, n };
}

/**
 * Translations often gave both: "60–130 zł (10–20 EUR)" or "10–20 € (43–86 zł)".
 * After conversion that reads "15–30 € (10–20 EUR)". Keep one amount: the one
 * found in the English original, else the one written as EUR / "€N" (the
 * translator's untouched original), else the first.
 */
export function collapsePairs(text: string, en: number[]): { text: string; n: number } {
  const amt = '(\\d[\\d.,]*(?:\\s?[–-]\\s?\\d[\\d.,]*)?)';
  const re = new RegExp(`(€\\s?)?${amt}(\\s?(?:€|EUR))?\\s*\\(\\s*[^\\d()]{0,15}?(€\\s?)?${amt}\\s?(€|EUR)?\\s*\\)`, 'g');
  let n = 0;
  const nums = (s: string) => s.split(/\s?[–-]\s?/).map(x => parseFloat(x.replace(',', '.')));
  const inEn = (s: string) => nums(s).every(v => en.some(e => Math.abs(e - v) < 0.01));
  const out = text.replace(re, (m, pre1, a, post1, pre2, b, post2) => {
    if (!(pre1 || post1) || !(pre2 || post2)) return m; // not two euro amounts
    n++;
    const keepB = (inEn(b) && !inEn(a)) || (!inEn(a) && (post2 === 'EUR' || pre2) && !(post1 === ' EUR' || pre1));
    return `${keepB ? b : a} €`;
  });
  return { text: out, n };
}

function walk(v: any, f: (s: string) => string): any {
  if (typeof v === 'string') return f(v);
  if (Array.isArray(v)) return v.map(x => walk(x, f));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x, f)]));
  return v;
}

function main() {
  const dry = process.argv.includes('--dry-run');
  const FIELDS = ['title', 'metaDescription', 'quickAnswer', 'content', 'faq', 'tableData'];
  let files = 0, total = 0, shown = 0;
  for (const lang of Object.keys(RATES)) {
    for (const f of fs.readdirSync(path.join(DIR, lang))) {
      const p = path.join(DIR, lang, f);
      const a = JSON.parse(fs.readFileSync(p, 'utf8'));
      const enPath = path.join(DIR, 'en', f);
      const en = fs.existsSync(enPath) ? euroValues(JSON.parse(fs.readFileSync(enPath, 'utf8'))) : [];
      let n = 0;
      for (const k of FIELDS) {
        if (a[k] === undefined) continue;
        a[k] = walk(a[k], s => {
          const r = convert(s, lang, en);
          const c = collapsePairs(r.text, en);
          r.text = c.text; r.n += c.n;
          if (r.n && dry && shown < 12) {
            const m = s.match(new RegExp(`[^.\\n]{0,40}\\d[^.\\n]{0,10}${RATES[lang].unit}[^.\\n]{0,20}`, 'u'));
            const i = m ? s.indexOf(m[0]) : 0;
            console.log(`${lang}/${f}\n   − ${m?.[0]}\n   + ${r.text.slice(i, i + (m?.[0].length ?? 60))}`);
            shown++;
          }
          n += r.n;
          return r.text;
        });
      }
      if (n) { files++; total += n; if (!dry) fs.writeFileSync(p, JSON.stringify(a, null, 2)); }
    }
  }
  console.log(`\n${files} files, ${total} prices converted back to euro`);
}

if (require.main === module) main();
