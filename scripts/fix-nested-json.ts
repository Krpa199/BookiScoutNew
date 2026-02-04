import fs from 'fs';
import path from 'path';

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'articles');

interface ArticleData {
  title: string;
  metaDescription: string;
  slug: string;
  content: string;
  faq: { question: string; answer: string }[];
  quickAnswer: string;
  tableData?: { name: string; price: string; rating: string; distance: string }[];
  destination: string;
  destinationName: string;
  region: string;
  theme: string;
  language: string;
  generatedAt: string;
  lat: number;
  lng: number;
}

// Extract field value using regex (for broken JSON with unescaped quotes)
function extractField(json: string, fieldName: string): string | null {
  // Match "fieldName": "value" pattern, handling escaped quotes
  const patterns = [
    new RegExp(`"${fieldName}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`),
    new RegExp(`"${fieldName}"\\s*:\\s*"([^"]*?)(?:"|,\\s*"[a-zA-Z])`),
  ];

  for (const pattern of patterns) {
    const match = json.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

// Extract content field which may span multiple lines with unescaped quotes
function extractContentField(json: string): string | null {
  // Find the start of content field
  const contentStart = json.indexOf('"content":');
  if (contentStart === -1) return null;

  // Find the opening quote of content value
  const valueStart = json.indexOf('"', contentStart + 10);
  if (valueStart === -1) return null;

  // Find "faq" which comes after content
  const faqStart = json.indexOf('"faq":', valueStart);
  if (faqStart === -1) return null;

  // Content ends just before the comma and "faq"
  // Look backwards from faq to find the closing quote
  let valueEnd = faqStart - 1;
  while (valueEnd > valueStart && json[valueEnd] !== '"') {
    valueEnd--;
  }

  if (valueEnd <= valueStart) return null;

  // Extract content value (without quotes)
  let content = json.substring(valueStart + 1, valueEnd);

  // Unescape basic escapes
  content = content
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');

  return content;
}

// Extract FAQ array
function extractFaqArray(json: string): { question: string; answer: string }[] {
  const faqStart = json.indexOf('"faq":');
  if (faqStart === -1) return [];

  // Find the opening bracket
  const arrayStart = json.indexOf('[', faqStart);
  if (arrayStart === -1) return [];

  // Find matching closing bracket
  let depth = 1;
  let arrayEnd = arrayStart + 1;
  while (depth > 0 && arrayEnd < json.length) {
    if (json[arrayEnd] === '[') depth++;
    if (json[arrayEnd] === ']') depth--;
    arrayEnd++;
  }

  try {
    const faqJson = json.substring(arrayStart, arrayEnd);
    return JSON.parse(faqJson);
  } catch {
    return [];
  }
}

// Extract tableData array
function extractTableDataArray(json: string): { name: string; price: string; rating: string; distance: string }[] {
  const tableStart = json.indexOf('"tableData":');
  if (tableStart === -1) return [];

  const arrayStart = json.indexOf('[', tableStart);
  if (arrayStart === -1) return [];

  let depth = 1;
  let arrayEnd = arrayStart + 1;
  while (depth > 0 && arrayEnd < json.length) {
    if (json[arrayEnd] === '[') depth++;
    if (json[arrayEnd] === ']') depth--;
    arrayEnd++;
  }

  try {
    const tableJson = json.substring(arrayStart, arrayEnd);
    return JSON.parse(tableJson);
  } catch {
    return [];
  }
}

function fixNestedJson(article: ArticleData): ArticleData | null {
  // Check if content contains nested JSON
  if (!article.content || typeof article.content !== 'string') {
    return null;
  }

  const contentTrimmed = article.content.trim();

  // Check if content starts with JSON markers
  if (!contentTrimmed.startsWith('```json') && !contentTrimmed.startsWith('{"')) {
    return null; // Not a nested JSON issue
  }

  console.log(`  🔧 Fixing nested JSON in: ${article.slug}`);

  let innerJson = contentTrimmed;
  if (innerJson.startsWith('```json')) innerJson = innerJson.slice(7);
  if (innerJson.startsWith('```')) innerJson = innerJson.slice(3);
  if (innerJson.endsWith('```')) innerJson = innerJson.slice(0, -3);
  innerJson = innerJson.trim();

  // First try standard JSON parse
  try {
    const innerData = JSON.parse(innerJson);
    return {
      ...article,
      title: innerData.title || article.title,
      metaDescription: innerData.metaDescription || article.metaDescription,
      content: innerData.content || '',
      faq: innerData.faq || [],
      quickAnswer: innerData.quickAnswer || '',
      tableData: innerData.tableData || [],
    };
  } catch {
    // Standard parse failed, use regex extraction
    console.log(`    Using regex extraction for broken JSON...`);

    const title = extractField(innerJson, 'title');
    const metaDescription = extractField(innerJson, 'metaDescription');
    const quickAnswer = extractField(innerJson, 'quickAnswer');
    const content = extractContentField(innerJson);
    const faq = extractFaqArray(innerJson);
    const tableData = extractTableDataArray(innerJson);

    if (!title && !content && !quickAnswer) {
      console.log(`  ❌ Failed to extract any fields for ${article.slug}`);
      return null;
    }

    return {
      ...article,
      title: title || article.title,
      metaDescription: metaDescription || article.metaDescription,
      content: content || '',
      faq: faq,
      quickAnswer: quickAnswer || '',
      tableData: tableData.length > 0 ? tableData : article.tableData,
    };
  }
}

async function main() {
  console.log('\n🔧 Fixing articles with nested JSON bug\n');

  let fixed = 0;
  let failed = 0;
  let skipped = 0;

  // Get all language directories
  const langDirs = fs.readdirSync(CONTENT_DIR).filter(dir => {
    const fullPath = path.join(CONTENT_DIR, dir);
    return fs.statSync(fullPath).isDirectory();
  });

  for (const lang of langDirs) {
    const langDir = path.join(CONTENT_DIR, lang);
    const files = fs.readdirSync(langDir).filter(f => f.endsWith('.json'));

    for (const file of files) {
      const filePath = path.join(langDir, file);

      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const article: ArticleData = JSON.parse(content);

        const fixedArticle = fixNestedJson(article);

        if (fixedArticle) {
          // Save fixed article
          fs.writeFileSync(filePath, JSON.stringify(fixedArticle, null, 2));
          console.log(`  ✅ Fixed: ${lang}/${file}`);
          fixed++;
        } else {
          skipped++;
        }
      } catch (error) {
        console.log(`  ❌ Error processing ${lang}/${file}:`, error);
        failed++;
      }
    }
  }

  console.log('\n================================');
  console.log(`✅ Fixed: ${fixed} articles`);
  console.log(`⏭️ Skipped: ${skipped} articles (no issue)`);
  console.log(`❌ Failed: ${failed} articles`);
  console.log('================================\n');
}

main().catch(console.error);
