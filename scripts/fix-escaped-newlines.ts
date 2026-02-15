/**
 * Fix articles that have literal \n (backslash + n) instead of real newlines
 * in the content field. This was caused by the nested JSON fix not fully
 * unescaping the content string.
 */

import fs from 'fs';
import path from 'path';

const ARTICLES_DIR = path.join(process.cwd(), 'src', 'content', 'articles');

function hasLiteralBackslashN(str: string): boolean {
  for (let i = 0; i < str.length - 1; i++) {
    if (str.charCodeAt(i) === 92 && str.charCodeAt(i + 1) === 110) {
      return true;
    }
  }
  return false;
}

function fixEscapedChars(str: string): string {
  let result = '';
  let i = 0;
  while (i < str.length) {
    if (str.charCodeAt(i) === 92 && i + 1 < str.length) {
      const next = str.charCodeAt(i + 1);
      if (next === 110) { result += '\n'; i += 2; continue; }      // \n -> newline
      if (next === 116) { result += '\t'; i += 2; continue; }      // \t -> tab
      if (next === 34) { result += '"'; i += 2; continue; }        // \" -> "
      if (next === 92) { result += '\\'; i += 2; continue; }       // \\ -> \
      if (next === 47) { result += '/'; i += 2; continue; }        // \/ -> /
    }
    result += str[i];
    i++;
  }
  return result;
}

const langs = fs.readdirSync(ARTICLES_DIR).filter(f =>
  fs.statSync(path.join(ARTICLES_DIR, f)).isDirectory()
);

let fixed = 0;
let total = 0;

for (const lang of langs) {
  const langDir = path.join(ARTICLES_DIR, lang);
  const files = fs.readdirSync(langDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const filePath = path.join(langDir, file);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      let changed = false;

      // Fix content
      if (data.content && typeof data.content === 'string' && hasLiteralBackslashN(data.content)) {
        data.content = fixEscapedChars(data.content);
        changed = true;
      }

      // Also fix title, metaDescription, quickAnswer if affected
      for (const field of ['title', 'metaDescription', 'quickAnswer'] as const) {
        if (data[field] && typeof data[field] === 'string' && hasLiteralBackslashN(data[field])) {
          data[field] = fixEscapedChars(data[field]);
          changed = true;
        }
      }

      if (changed) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        fixed++;
        console.log(`  ✅ Fixed: ${lang}/${file}`);
      }
      total++;
    } catch (e: any) {
      console.log(`  ❌ Error: ${lang}/${file}: ${e.message}`);
    }
  }
}

console.log(`\nResults: ${fixed} fixed out of ${total} articles`);
