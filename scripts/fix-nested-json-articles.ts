/**
 * Fix articles where Gemini returned nested JSON in the content field.
 *
 * Uses string walking to extract fields from the inner JSON that's
 * embedded as a string in the content field. Works on parsed data
 * (after JSON.parse of the file) since extractRawJsonField can handle
 * both escaped and unescaped formats.
 */

import fs from 'fs';
import path from 'path';

const ARTICLES_DIR = path.join(process.cwd(), 'src', 'content', 'articles');

function extractRawJsonField(raw: string, fieldName: string): string | null {
  // Try unescaped pattern first: "fieldName": "
  const pattern1 = `"${fieldName}": "`;
  let startIdx = raw.indexOf(pattern1);
  if (startIdx !== -1) {
    const valueStart = startIdx + pattern1.length;
    let i = valueStart;
    while (i < raw.length) {
      if (raw[i] === '\\') { i += 2; continue; }
      if (raw[i] === '"') return raw.substring(valueStart, i);
      i++;
    }
    return null;
  }

  // Try escaped pattern: \"fieldName\": \"
  const pattern2 = `\\"${fieldName}\\": \\"`;
  startIdx = raw.indexOf(pattern2);
  if (startIdx !== -1) {
    const valueStart = startIdx + pattern2.length;
    let i = valueStart;
    while (i < raw.length) {
      if (raw[i] === '\\') {
        if (raw[i + 1] === '\\') { i += 2; continue; }
        if (raw[i + 1] === '"') return raw.substring(valueStart, i);
        if (raw[i + 1] === 'n' || raw[i + 1] === 't' || raw[i + 1] === '/') { i += 2; continue; }
        i += 2; continue;
      }
      i++;
    }
    return null;
  }

  return null;
}

function extractRawJsonArray(raw: string, fieldName: string): string | null {
  // Try unescaped pattern first: "fieldName": [
  let fieldPattern = `"${fieldName}": [`;
  let startIdx = raw.indexOf(fieldPattern);

  // Try escaped pattern: \"fieldName\": [
  if (startIdx === -1) {
    fieldPattern = `\\"${fieldName}\\": [`;
    startIdx = raw.indexOf(fieldPattern);
  }

  if (startIdx === -1) return null;

  const arrayStart = startIdx + fieldPattern.length - 1;
  let depth = 0; let inString = false; let escaped = false;
  for (let i = arrayStart; i < raw.length; i++) {
    if (escaped) { escaped = false; continue; }
    if (raw[i] === '\\') { escaped = true; continue; }
    if (raw[i] === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (raw[i] === '[') depth++;
    if (raw[i] === ']') { depth--; if (depth === 0) return raw.substring(arrayStart, i + 1); }
  }
  return null;
}

function unescapeJsonString(s: string): string {
  let result = '';
  let i = 0;
  while (i < s.length) {
    if (s[i] === '\\' && i + 1 < s.length) {
      const next = s[i + 1];
      if (next === 'n') { result += '\n'; i += 2; continue; }
      if (next === 't') { result += '\t'; i += 2; continue; }
      if (next === '"') { result += '"'; i += 2; continue; }
      if (next === '\\') { result += '\\'; i += 2; continue; }
      if (next === '/') { result += '/'; i += 2; continue; }
      result += s[i]; i++;
    } else { result += s[i]; i++; }
  }
  return result;
}

function isNestedJsonContent(content: string): boolean {
  const trimmed = content.trim();
  return trimmed.startsWith('```json') || trimmed.startsWith('```\n{') ||
         (trimmed.startsWith('{"') && trimmed.includes('"content"'));
}

function fixArticle(filePath: string): boolean {
  const rawFile = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(rawFile);

  if (!data.content || typeof data.content !== 'string') return false;
  if (!isNestedJsonContent(data.content)) return false;

  // Re-escape the parsed content string so extractRawJsonField works correctly.
  // After JSON.parse, data.content has real quotes/newlines. JSON.stringify re-escapes them.
  try {
    const reEscaped = JSON.stringify(data.content);
    let escaped = reEscaped.slice(1, -1); // strip outer quotes

    // Strip escaped markdown markers (in escaped string, \n = 2 chars: backslash+n)
    if (escaped.startsWith('```json\\n')) escaped = escaped.slice(9);
    else if (escaped.startsWith('```json')) escaped = escaped.slice(7);
    else if (escaped.startsWith('```\\n')) escaped = escaped.slice(5);
    else if (escaped.startsWith('```')) escaped = escaped.slice(3);
    if (escaped.endsWith('\\n```')) escaped = escaped.slice(0, -5);
    else if (escaped.endsWith('```')) escaped = escaped.slice(0, -3);
    while (escaped.startsWith('\\n') || escaped.startsWith('\\r') || escaped.startsWith('\\t')) {
      escaped = escaped.slice(2);
    }

    const innerContent = extractRawJsonField(escaped, 'content');
    if (innerContent) {
      const fixedContent = unescapeJsonString(innerContent);
      if (fixedContent && !isNestedJsonContent(fixedContent)) {
        const t = extractRawJsonField(escaped, 'title');
        const m = extractRawJsonField(escaped, 'metaDescription');
        const q = extractRawJsonField(escaped, 'quickAnswer');
        const td = extractRawJsonArray(escaped, 'tableData');
        const fq = extractRawJsonArray(escaped, 'faq');
        if (t) data.title = unescapeJsonString(t);
        if (m) data.metaDescription = unescapeJsonString(m);
        if (q) data.quickAnswer = unescapeJsonString(q);
        data.content = fixedContent;
        if (td) {
          try { data.tableData = JSON.parse(td); } catch {
            try { data.tableData = JSON.parse(unescapeJsonString(td)); } catch {}
          }
        }
        if (fq) {
          try { data.faq = JSON.parse(fq); } catch {
            try { data.faq = JSON.parse(unescapeJsonString(fq)); } catch {}
          }
        }
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
      }
    }
  } catch {
    // re-escape failed
  }

  // Fallback: try JSON.parse on inner content
  try {
    let innerJsonStr = data.content.trim();
    if (innerJsonStr.startsWith('```json')) innerJsonStr = innerJsonStr.slice(7);
    else if (innerJsonStr.startsWith('```')) innerJsonStr = innerJsonStr.slice(3);
    if (innerJsonStr.endsWith('```')) innerJsonStr = innerJsonStr.slice(0, -3);
    innerJsonStr = innerJsonStr.trim();
    const innerParsed = JSON.parse(innerJsonStr);
    if (innerParsed?.content && typeof innerParsed.content === 'string') {
      if (innerParsed.title) data.title = innerParsed.title;
      if (innerParsed.metaDescription) data.metaDescription = innerParsed.metaDescription;
      if (innerParsed.quickAnswer) data.quickAnswer = innerParsed.quickAnswer;
      if (Array.isArray(innerParsed.tableData) && innerParsed.tableData.length > 0) data.tableData = innerParsed.tableData;
      if (Array.isArray(innerParsed.faq) && innerParsed.faq.length > 0) data.faq = innerParsed.faq;
      data.content = innerParsed.content;
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return true;
    }
  } catch {
    // JSON.parse failed
  }

  return false;
}

// Find and fix all affected articles
const langs = fs.readdirSync(ARTICLES_DIR).filter(f =>
  fs.statSync(path.join(ARTICLES_DIR, f)).isDirectory()
);

let fixed = 0;
let failed = 0;
const affectedSlugs = new Set<string>();

for (const lang of langs) {
  const langDir = path.join(ARTICLES_DIR, lang);
  const files = fs.readdirSync(langDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const filePath = path.join(langDir, file);
    try {
      const rawFile = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(rawFile);
      if (data.content && typeof data.content === 'string' && isNestedJsonContent(data.content)) {
        const slug = file.replace('.json', '');
        if (fixArticle(filePath)) {
          console.log(`  ✅ Fixed: ${lang}/${file}`);
          fixed++;
          affectedSlugs.add(slug);
        } else {
          console.log(`  ❌ Failed: ${lang}/${file}`);
          failed++;
        }
      }
    } catch (e: any) {
      console.log(`  ❌ Error: ${lang}/${file}: ${e.message}`);
      failed++;
    }
  }
}

console.log(`\nResults: ${fixed} fixed, ${failed} failed`);
console.log(`Affected slugs (${affectedSlugs.size}): ${[...affectedSlugs].join(', ')}`);
