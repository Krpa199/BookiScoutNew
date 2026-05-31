/**
 * One-shot script: translate a single article JSON to a target locale via Gemini.
 * Used to fix the lone HR/dubrovnik-car-vs-no-car.json that was English by mistake.
 *
 * Usage:
 *   npx tsx scripts/translate-single-article.ts <article-slug> <target-locale>
 *   e.g. npx tsx scripts/translate-single-article.ts dubrovnik-car-vs-no-car hr
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

const [, , slug, targetLocale] = process.argv;
if (!slug || !targetLocale) {
  console.error('Usage: npx tsx scripts/translate-single-article.ts <slug> <locale>');
  process.exit(1);
}

const apiKey = process.env.GEMINI_API_KEY_1;
if (!apiKey) throw new Error('GEMINI_API_KEY_1 missing in .env.local');

const enPath = path.join('src', 'content', 'articles', 'en', `${slug}.json`);
const targetPath = path.join('src', 'content', 'articles', targetLocale, `${slug}.json`);

const enArticle = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
console.log(`📖 Loaded EN: ${enArticle.title}`);
console.log(`🌍 Translating to: ${targetLocale}`);

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
});

const prompt = `You are a professional travel content translator.

Translate this JSON article from English to language "${targetLocale}".

CRITICAL RULES:
- Translate ALL text values (title, metaDescription, content, headings, lists)
- Keep place names (Dubrovnik, Split, Trogir, etc.) in their original form
- Keep slug, destination, theme, slug fields UNCHANGED (technical identifiers)
- Keep numbers, prices, distances UNCHANGED
- Keep markdown formatting intact (# headings, *bold*, lists)
- Keep HTML tags intact if present
- Keep imageUrl, imageAlt, imageCredit, imageCreditUrl, imageSource UNCHANGED (technical)
- Output VALID JSON, no markdown code blocks around it
- Translate naturally — not literally — use idiomatic phrasing in the target language

ENGLISH ARTICLE:
${JSON.stringify(enArticle, null, 2)}`;

console.log(`⏳ Calling Gemini (this takes ~30-60s for a 13KB article)...`);
const start = Date.now();
const result = await model.generateContent(prompt);
const elapsed = ((Date.now() - start) / 1000).toFixed(1);
console.log(`✅ Gemini responded in ${elapsed}s`);

const text = result.response.text();
let translated: Record<string, unknown>;
try {
  translated = JSON.parse(text);
} catch (e) {
  // strip code fences if Gemini added them
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error(`Could not parse Gemini response: ${text.slice(0, 300)}`);
  translated = JSON.parse(m[0]);
}

// Backup the original (English-by-mistake) file
const backupPath = targetPath + '.en-backup-' + Date.now();
fs.copyFileSync(targetPath, backupPath);
console.log(`💾 Backed up original to: ${backupPath}`);

fs.writeFileSync(targetPath, JSON.stringify(translated, null, 2));
console.log(`✅ Wrote translated article to: ${targetPath}`);
console.log(`📝 New title: ${translated.title}`);
