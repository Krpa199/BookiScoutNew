import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { generateDecisionTopics, ValidatedTopic } from './gemini';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content');
const TOPICS_FILE = path.join(CONTENT_DIR, 'topics.guides.json');
const LOG_FILE = path.join(CONTENT_DIR, 'generation.log');

const START_DESTINATIONS = ['Split', 'Zadar', 'Dubrovnik', 'Poreč', 'Rovinj', 'Zagreb'];

function log(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(LOG_FILE, logMessage);
}

async function main() {
  try {
    log('='.repeat(60));
    log('🧠 BookiScout Topic Generator');
    log('='.repeat(60));

    // Check API keys
    const apiKeys = [];
    for (let i = 1; i <= 10; i++) {
      if (process.env[`GEMINI_API_KEY_${i}`]) {
        apiKeys.push(i);
      }
    }
    if (process.env.GEMINI_API_KEY) {
      apiKeys.push(0);
    }

    log(`🔑 Found ${apiKeys.length} API key(s): ${apiKeys.join(', ')}`);
    log(`📍 Destinations: ${START_DESTINATIONS.join(', ')}`);
    log(`🎯 Target: families with kids aged 3-10`);
    log('='.repeat(60));
    log('');

    log('🚀 Calling Gemini API...');
    const topics = await generateDecisionTopics(START_DESTINATIONS, 'families_kids_3_10');

    if (topics.length === 0) {
      log('❌ No valid topics generated');
      process.exit(1);
    }

    log(`✅ Generated ${topics.length} valid topics`);

    const topicsData = {
      generatedAt: new Date().toISOString(),
      lang: 'en',
      destinations: START_DESTINATIONS,
      topics,
    };

    // Ensure directory exists
    if (!fs.existsSync(CONTENT_DIR)) {
      log(`📁 Creating directory: ${CONTENT_DIR}`);
      fs.mkdirSync(CONTENT_DIR, { recursive: true });
    }

    // Save topics
    fs.writeFileSync(TOPICS_FILE, JSON.stringify(topicsData, null, 2));

    log('');
    log('✅ Topics generated successfully!');
    log(`📊 Total: ${topics.length} valid topics`);
    log(`💾 Saved to: ${TOPICS_FILE}`);
    log('');
    log('Sample topics:');

    topics.slice(0, 5).forEach((topic, i) => {
      log(`  ${i + 1}. ${topic.topic}`);
      log(`     → ${topic.slug}`);
    });

    if (topics.length > 5) {
      log(`  ... and ${topics.length - 5} more`);
    }

    log('');
    log('💡 Next step: Run `npm run generate:guides` to generate articles');

  } catch (error) {
    log('');
    log('❌ ERROR:');
    log(String(error));
    if (error instanceof Error) {
      log('Stack trace:');
      log(error.stack || 'No stack trace');
    }
    process.exit(1);
  }
}

main();
