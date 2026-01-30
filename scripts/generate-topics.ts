import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { generateDecisionTopics, ValidatedTopic } from './gemini';

// Load environment variables from .env.local or .env
dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback to .env

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content');
const TOPICS_FILE = path.join(CONTENT_DIR, 'topics.guides.json');

const START_DESTINATIONS = ['Split', 'Zadar', 'Dubrovnik', 'Poreč', 'Rovinj', 'Zagreb'];

// =============================================================================
// TYPES
// =============================================================================

interface TopicsData {
  generatedAt: string;
  lang: string;
  destinations: string[];
  topics: ValidatedTopic[];
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('🧠 BookiScout Topic Generator');
  console.log('='.repeat(60));
  console.log(`Destinations: ${START_DESTINATIONS.join(', ')}`);
  console.log(`Target: families with kids aged 3-10`);
  console.log('='.repeat(60));

  try {
    const topics = await generateDecisionTopics(START_DESTINATIONS, 'families_kids_3_10');

    if (topics.length === 0) {
      console.log('\n❌ No valid topics generated');
      process.exit(1);
    }

    const topicsData: TopicsData = {
      generatedAt: new Date().toISOString(),
      lang: 'en',
      destinations: START_DESTINATIONS,
      topics,
    };

    // Ensure directory exists
    if (!fs.existsSync(CONTENT_DIR)) {
      fs.mkdirSync(CONTENT_DIR, { recursive: true });
    }

    // Save topics
    fs.writeFileSync(TOPICS_FILE, JSON.stringify(topicsData, null, 2));

    console.log('\n✅ Topics generated successfully!');
    console.log(`📊 Total: ${topics.length} valid topics`);
    console.log(`💾 Saved to: ${TOPICS_FILE}`);
    console.log('\nSample topics:');

    topics.slice(0, 5).forEach((topic, i) => {
      console.log(`  ${i + 1}. ${topic.topic}`);
      console.log(`     → ${topic.slug}`);
    });

    if (topics.length > 5) {
      console.log(`  ... and ${topics.length - 5} more`);
    }

    console.log('\n💡 Next step: Run `npm run generate:guides` to generate articles');
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
