const fs = require('fs');
const path = require('path');

const articlesDir = path.join(process.cwd(), 'src', 'content', 'articles');
const langs = fs.readdirSync(articlesDir).filter(f => fs.statSync(path.join(articlesDir, f)).isDirectory());

let total = 0;
let issues = [];

for (const lang of langs) {
  const langDir = path.join(articlesDir, lang);
  const files = fs.readdirSync(langDir).filter(f => f.endsWith('.json'));

  for (const file of files) {
    total++;
    const filePath = path.join(langDir, file);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      // Check for nested JSON in content
      if (data.content && data.content.trim().startsWith('```json')) {
        issues.push({ file: lang + '/' + file, issue: 'Nested JSON in content' });
      }
      if (data.content && data.content.trim().startsWith('{"')) {
        issues.push({ file: lang + '/' + file, issue: 'JSON object in content' });
      }

      // Check for empty quickAnswer
      if (!data.quickAnswer || data.quickAnswer.trim() === '') {
        issues.push({ file: lang + '/' + file, issue: 'Empty quickAnswer' });
      }

      // Check for empty FAQ
      if (!data.faq || data.faq.length === 0) {
        issues.push({ file: lang + '/' + file, issue: 'Empty FAQ' });
      }

      // Check for empty content
      if (!data.content || data.content.trim() === '') {
        issues.push({ file: lang + '/' + file, issue: 'Empty content' });
      }

      // Check for placeholder title
      if (data.title && data.title.match(/^vs-\w+ in \w+ 2026$/)) {
        issues.push({ file: lang + '/' + file, issue: 'Placeholder title: ' + data.title });
      }

    } catch (e) {
      issues.push({ file: lang + '/' + file, issue: 'JSON parse error: ' + e.message });
    }
  }
}

console.log('Total articles:', total);
console.log('Issues found:', issues.length);
console.log('');
if (issues.length > 0) {
  console.log('Problems:');
  issues.forEach(i => console.log('  -', i.file, ':', i.issue));
} else {
  console.log('✅ All articles are valid!');
}

// Summary by language
console.log('\n--- Articles per language ---');
for (const lang of langs) {
  const langDir = path.join(articlesDir, lang);
  const count = fs.readdirSync(langDir).filter(f => f.endsWith('.json')).length;
  console.log(`  ${lang}: ${count} articles`);
}
