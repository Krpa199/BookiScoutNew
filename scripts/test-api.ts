import * as dotenv from 'dotenv';

// Load .env.local
dotenv.config({ path: '.env.local' });
dotenv.config();

console.log('='.repeat(60));
console.log('API KEY TEST');
console.log('='.repeat(60));

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.log('❌ NO API KEY FOUND');
  console.log('Checked: GEMINI_API_KEY');
  process.exit(1);
}

console.log(`✅ API Key found: ${apiKey.substring(0, 10)}...`);
console.log('');
console.log('Ready to generate topics!');
