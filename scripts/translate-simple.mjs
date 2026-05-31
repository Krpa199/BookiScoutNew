// Minimal translator using fetch only (no SDK deps).
// Usage: node scripts/translate-simple.mjs <slug> <locale>

import fs from 'fs';
import path from 'path';

const [, , slug, targetLocale] = process.argv;
const apiKey = process.env.GEMINI_API_KEY_1;

if (!slug || !targetLocale) {
  console.error('Usage: node scripts/translate-simple.mjs <slug> <locale>');
  process.exit(1);
}
if (!apiKey) throw new Error('GEMINI_API_KEY_1 missing');

const enPath = path.join('src', 'content', 'articles', 'en', `${slug}.json`);
const targetPath = path.join('src', 'content', 'articles', targetLocale, `${slug}.json`);

const enArticle = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
console.log(`📖 Source EN: "${enArticle.title}"`);
console.log(`🌍 Translating to: ${targetLocale}`);

const prompt = `You are a professional travel content translator.

Translate this JSON article from English to language "${targetLocale}".

CRITICAL RULES:
- Translate ALL text values (title, metaDescription, content, headings, lists)
- Keep place names (Dubrovnik, Split, Trogir, etc.) in their original form
- Keep slug, destination, theme fields UNCHANGED
- Keep numbers, prices, distances UNCHANGED
- Keep markdown formatting intact (# headings, *bold*, lists)
- Keep imageUrl, imageAlt, imageCredit, imageCreditUrl, imageSource UNCHANGED
- Output VALID JSON, no markdown code blocks around it
- Translate naturally — use idiomatic phrasing in the target language

ENGLISH ARTICLE:
${JSON.stringify(enArticle, null, 2)}`;

console.log(`⏳ Calling Gemini...`);
const start = Date.now();

const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
    }),
  }
);

if (!response.ok) {
  const err = await response.text();
  throw new Error(`Gemini API ${response.status}: ${err.slice(0, 500)}`);
}

const data = await response.json();
const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
if (!text) throw new Error(`Unexpected Gemini response: ${JSON.stringify(data).slice(0, 500)}`);

const elapsed = ((Date.now() - start) / 1000).toFixed(1);
console.log(`✅ Gemini responded in ${elapsed}s, output size: ${text.length} chars`);

let translated;
try {
  translated = JSON.parse(text);
} catch (e) {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error(`Could not parse: ${text.slice(0, 300)}`);
  translated = JSON.parse(m[0]);
}

const backupPath = targetPath + '.en-backup-' + Date.now();
fs.copyFileSync(targetPath, backupPath);
console.log(`💾 Backup: ${backupPath}`);

fs.writeFileSync(targetPath, JSON.stringify(translated, null, 2));
console.log(`✅ Written: ${targetPath}`);
console.log(`📝 New title: ${translated.title}`);
