import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import {
  generateDecisionTopics,
  generateDecisionArticle,
  translateJSON,
  getRemainingCalls,
  AIDecisionArticle,
  ValidatedTopic,
} from './gemini';

// Load environment variables from .env.local or .env
dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback to .env

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content');
const GUIDES_DIR = path.join(CONTENT_DIR, 'guides');
const TOPICS_FILE = path.join(CONTENT_DIR, 'topics.guides.json');
const PROGRESS_FILE = path.join(CONTENT_DIR, 'guides-generated.json');

const LANGUAGES = ['en', 'de', 'pl', 'cs', 'it', 'hu', 'sk', 'nl', 'sl', 'fr', 'hr'];
const PRIMARY_LANG = 'en';

// Start destinations (as per MASTER SPEC)
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

interface ProgressData {
  generatedGuides: string[]; // slugs that are complete
  lastRun: string;
  totalGenerated: number;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadTopics(): TopicsData | null {
  if (!fs.existsSync(TOPICS_FILE)) {
    return null;
  }
  try {
    const data = fs.readFileSync(TOPICS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function saveTopics(data: TopicsData): void {
  ensureDir(CONTENT_DIR);
  fs.writeFileSync(TOPICS_FILE, JSON.stringify(data, null, 2));
  console.log(`💾 Saved ${data.topics.length} topics to ${TOPICS_FILE}`);
}

function loadProgress(): ProgressData {
  if (!fs.existsSync(PROGRESS_FILE)) {
    return {
      generatedGuides: [],
      lastRun: new Date().toISOString(),
      totalGenerated: 0,
    };
  }
  try {
    const data = fs.readFileSync(PROGRESS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {
      generatedGuides: [],
      lastRun: new Date().toISOString(),
      totalGenerated: 0,
    };
  }
}

function saveProgress(data: ProgressData): void {
  ensureDir(CONTENT_DIR);
  data.lastRun = new Date().toISOString();
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(data, null, 2));
}

function saveGuide(guide: AIDecisionArticle, lang: string): void {
  const langDir = path.join(GUIDES_DIR, lang);
  ensureDir(langDir);

  const filePath = path.join(langDir, `${guide.slug}.json`);
  fs.writeFileSync(filePath, JSON.stringify(guide, null, 2));
  console.log(`    💾 Saved: ${lang}/${guide.slug}.json`);
}

function isGenerated(slug: string, progress: ProgressData): boolean {
  return progress.generatedGuides.includes(slug);
}

function markAsGenerated(slug: string, progress: ProgressData): void {
  if (!progress.generatedGuides.includes(slug)) {
    progress.generatedGuides.push(slug);
    progress.totalGenerated++;
  }
}

// =============================================================================
// GUARDRAILS
// =============================================================================

const BANNED_WORDS = [
  'booking',
  'accommodation',
  'hotel',
  'apartment',
  'price',
  'reserve',
  'deal',
];

function validateGuide(guide: AIDecisionArticle): boolean {
  const textToCheck = `${guide.title} ${guide.h1} ${guide.summary}`.toLowerCase();

  for (const word of BANNED_WORDS) {
    if (textToCheck.includes(word)) {
      console.log(`    ⚠️ BANNED WORD DETECTED: "${word}" in guide ${guide.slug}`);
      return false;
    }
  }

  return true;
}

// =============================================================================
// MAIN FUNCTIONS
// =============================================================================

async function generateTopicsIfNeeded(): Promise<TopicsData> {
  let topicsData = loadTopics();

  if (topicsData && topicsData.topics.length > 0) {
    console.log(`✅ Topics already exist (${topicsData.topics.length} topics)`);
    return topicsData;
  }

  console.log('🧠 Generating new topics...');
  const topics = await generateDecisionTopics(START_DESTINATIONS, 'families_kids_3_10');

  topicsData = {
    generatedAt: new Date().toISOString(),
    lang: PRIMARY_LANG,
    destinations: START_DESTINATIONS,
    topics,
  };

  saveTopics(topicsData);
  return topicsData;
}

async function generateGuidesForTopics(topicsData: TopicsData): Promise<void> {
  const progress = loadProgress();
  const remaining = getRemainingCalls();

  console.log('\n📊 API Capacity:');
  console.log(`   Pro calls remaining: ${remaining.pro}`);
  console.log(`   Flash calls remaining: ${remaining.flash}`);
  console.log(`\n📈 Progress: ${progress.totalGenerated} guides generated so far\n`);

  let generatedThisSession = 0;
  let skippedThisSession = 0;

  for (const topic of topicsData.topics) {
    if (isGenerated(topic.slug, progress)) {
      console.log(`⏭️  Already generated: ${topic.slug}`);
      skippedThisSession++;
      continue;
    }

    console.log(`\n📝 Generating: ${topic.topic}`);

    // Generate English version
    const enGuide = await generateDecisionArticle(topic, PRIMARY_LANG);

    if (!enGuide) {
      console.log(`  ⚠️ Skipped (booking intent detected)`);
      continue;
    }

    // Validate guardrails
    if (!validateGuide(enGuide)) {
      console.log(`  ❌ Failed validation (banned words)`);
      continue;
    }

    // Save English version
    saveGuide(enGuide, PRIMARY_LANG);

    // Translate to other languages
    console.log(`  🌍 Translating to ${LANGUAGES.length - 1} languages...`);

    for (const lang of LANGUAGES) {
      if (lang === PRIMARY_LANG) continue;

      try {
        const translatedGuide = await translateJSON<AIDecisionArticle>(enGuide, lang);
        translatedGuide.lang = lang;
        saveGuide(translatedGuide, lang);
      } catch (error) {
        console.log(`    ⚠️ Translation failed for ${lang}, using English`);
        const fallbackGuide = { ...enGuide, lang };
        saveGuide(fallbackGuide, lang);
      }
    }

    // Mark as complete
    markAsGenerated(topic.slug, progress);
    saveProgress(progress);
    generatedThisSession++;

    console.log(`  ✅ Complete: ${topic.slug} (${LANGUAGES.length} languages)`);

    // Check if we should stop (API limits)
    const currentRemaining = getRemainingCalls();
    if (currentRemaining.pro < 5) {
      console.log('\n⚠️  Low on Pro API calls, stopping for today');
      break;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SESSION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Generated this session: ${generatedThisSession} guides`);
  console.log(`⏭️  Skipped (already done): ${skippedThisSession}`);
  console.log(`📈 Total guides generated: ${progress.totalGenerated}`);
  console.log(`🎯 Remaining topics: ${topicsData.topics.length - progress.generatedGuides.length}`);

  const finalRemaining = getRemainingCalls();
  console.log(`\n🔑 API Calls Remaining:`);
  console.log(`   Pro: ${finalRemaining.pro}`);
  console.log(`   Flash: ${finalRemaining.flash}`);
  console.log('='.repeat(60));
}

// =============================================================================
// ENTRY POINT
// =============================================================================

async function main() {
  console.log('🚀 BookiScout Guide Generator');
  console.log('='.repeat(60));

  try {
    // Step 1: Generate or load topics
    const topicsData = await generateTopicsIfNeeded();

    // Step 2: Generate guides from topics
    await generateGuidesForTopics(topicsData);

    console.log('\n✅ Guide generation complete!');
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
