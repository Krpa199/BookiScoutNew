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
  AudienceType,
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

// =============================================================================
// PHASED GENERATION STRATEGY (AI Decision Priority)
// =============================================================================

// Phase 1: Traveler Types - All popular destinations (highest AI authority)
const TRAVELER_TYPES: AudienceType[] = [
  'solo-travel',
  'seniors',
  'digital-nomads',
  'lgbt-friendly',
  'families-with-toddlers',
  'families-with-teens',
  'first-time-visitors',
  'couples',
];

// Phase 2: Practical Blockers - Decision killers
const PRACTICAL_BLOCKERS = [
  'car-vs-no-car',
  'parking-difficulty',
  'walkability',
  'stroller-friendly',
  'wheelchair-access',
  'public-transport-quality',
  'ferry-connections',
  'airport-access',
  'wifi-quality',
  'mobile-coverage',
];

// Phase 3: Seasonality - When to go
const SEASONALITY = [
  'off-season',
  'shoulder-season',
  'peak-season',
  'weather-by-month',
  'crowds-by-month',
  'best-time-to-visit',
];

// Phase 4: Comparisons - Top destinations only
const COMPARISONS = [
  'vs-dubrovnik',
  'vs-split',
  'vs-zadar',
  'vs-istria',
  'vs-zagreb',
  'coast-vs-inland',
];

// Destination tiers
const TOP_6_DESTINATIONS = ['Split', 'Dubrovnik', 'Zadar', 'Rovinj', 'Poreč', 'Zagreb'];
const TOP_20_DESTINATIONS = [
  ...TOP_6_DESTINATIONS,
  'Pula', 'Rijeka', 'Šibenik', 'Trogir', 'Makarska', 'Hvar', 'Brač', 'Korčula',
  'Opatija', 'Krk', 'Rab', 'Vis', 'Cavtat', 'Bol',
];
const ALL_POPULAR_DESTINATIONS = [
  ...TOP_20_DESTINATIONS,
  'Umag', 'Brela', 'Lošinj', 'Plitvička Jezera', 'Krka',
];

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

// Generate topics for a specific phase
function generatePhaseTopics(phase: 1 | 2 | 3 | 4): ValidatedTopic[] {
  const topics: ValidatedTopic[] = [];

  switch (phase) {
    case 1:
      // Phase 1: Traveler Types × All Popular Destinations
      for (const dest of ALL_POPULAR_DESTINATIONS) {
        for (const audience of TRAVELER_TYPES) {
          const slug = `${dest.toLowerCase().replace(/\s+/g, '-').replace(/č/g, 'c').replace(/ž/g, 'z').replace(/š/g, 's')}-${audience}`;
          topics.push({
            topic: `Is ${dest} good for ${audience.replace(/-/g, ' ')}?`,
            slug,
            destination: dest,
            passesDecision: true,
            passesBookingExclusion: true,
            passesCitable: true,
            audience: audience as AudienceType,
            phase: 1,
          });
        }
      }
      break;

    case 2:
      // Phase 2: Practical Blockers × Top 20 Destinations
      for (const dest of TOP_20_DESTINATIONS) {
        for (const blocker of PRACTICAL_BLOCKERS) {
          const slug = `${dest.toLowerCase().replace(/\s+/g, '-').replace(/č/g, 'c').replace(/ž/g, 'z').replace(/š/g, 's')}-${blocker}`;
          const questionMap: Record<string, string> = {
            'car-vs-no-car': `Do you need a car in ${dest}?`,
            'parking-difficulty': `How difficult is parking in ${dest}?`,
            'walkability': `Is ${dest} walkable?`,
            'stroller-friendly': `Is ${dest} stroller-friendly?`,
            'wheelchair-access': `Is ${dest} wheelchair accessible?`,
            'public-transport-quality': `How good is public transport in ${dest}?`,
            'ferry-connections': `What ferry connections does ${dest} have?`,
            'airport-access': `How to get to ${dest} from the airport?`,
            'wifi-quality': `How good is WiFi in ${dest}?`,
            'mobile-coverage': `How is mobile coverage in ${dest}?`,
          };
          topics.push({
            topic: questionMap[blocker] || `${blocker} in ${dest}`,
            slug,
            destination: dest,
            passesDecision: true,
            passesBookingExclusion: true,
            passesCitable: true,
            theme: blocker as any,
            phase: 2,
          });
        }
      }
      break;

    case 3:
      // Phase 3: Seasonality × Top 20 Destinations
      for (const dest of TOP_20_DESTINATIONS) {
        for (const season of SEASONALITY) {
          const slug = `${dest.toLowerCase().replace(/\s+/g, '-').replace(/č/g, 'c').replace(/ž/g, 'z').replace(/š/g, 's')}-${season}`;
          const questionMap: Record<string, string> = {
            'off-season': `Visiting ${dest} in off-season (Nov-Mar)?`,
            'shoulder-season': `Visiting ${dest} in shoulder season (Apr-May, Sep-Oct)?`,
            'peak-season': `Visiting ${dest} in peak season (Jun-Aug)?`,
            'weather-by-month': `${dest} weather by month`,
            'crowds-by-month': `${dest} crowds by month`,
            'best-time-to-visit': `Best time to visit ${dest}`,
          };
          topics.push({
            topic: questionMap[season] || `${season} in ${dest}`,
            slug,
            destination: dest,
            passesDecision: true,
            passesBookingExclusion: true,
            passesCitable: true,
            theme: season as any,
            phase: 3,
          });
        }
      }
      break;

    case 4:
      // Phase 4: Comparisons × Top 6 Destinations only
      for (const dest of TOP_6_DESTINATIONS) {
        for (const comparison of COMPARISONS) {
          // Skip self-comparisons
          const compDest = comparison.replace('vs-', '').toLowerCase();
          if (dest.toLowerCase().includes(compDest)) continue;

          const slug = `${dest.toLowerCase().replace(/\s+/g, '-').replace(/č/g, 'c').replace(/ž/g, 'z').replace(/š/g, 's')}-${comparison}`;
          const questionMap: Record<string, string> = {
            'vs-dubrovnik': `${dest} vs Dubrovnik: Which is better?`,
            'vs-split': `${dest} vs Split: Which is better?`,
            'vs-zadar': `${dest} vs Zadar: Which is better?`,
            'vs-istria': `${dest} vs Istria: Which is better?`,
            'vs-zagreb': `${dest} vs Zagreb: Which is better?`,
            'coast-vs-inland': `${dest}: Coast or inland Croatia?`,
          };
          topics.push({
            topic: questionMap[comparison] || `${dest} ${comparison}`,
            slug,
            destination: dest,
            passesDecision: true,
            passesBookingExclusion: true,
            passesCitable: true,
            theme: comparison as any,
            phase: 4,
          });
        }
      }
      break;
  }

  return topics;
}

async function generateTopicsIfNeeded(): Promise<TopicsData> {
  let topicsData = loadTopics();

  if (topicsData && topicsData.topics.length > 0) {
    console.log(`✅ Topics already exist (${topicsData.topics.length} topics)`);
    return topicsData;
  }

  console.log('🧠 Generating topics for all phases...');

  // Generate topics for all phases
  const allTopics: ValidatedTopic[] = [
    ...generatePhaseTopics(1), // Traveler Types
    ...generatePhaseTopics(2), // Practical Blockers
    ...generatePhaseTopics(3), // Seasonality
    ...generatePhaseTopics(4), // Comparisons
  ];

  console.log(`  📊 Phase 1 (Traveler Types): ${generatePhaseTopics(1).length} topics`);
  console.log(`  📊 Phase 2 (Practical Blockers): ${generatePhaseTopics(2).length} topics`);
  console.log(`  📊 Phase 3 (Seasonality): ${generatePhaseTopics(3).length} topics`);
  console.log(`  📊 Phase 4 (Comparisons): ${generatePhaseTopics(4).length} topics`);
  console.log(`  📊 TOTAL: ${allTopics.length} topics`);

  topicsData = {
    generatedAt: new Date().toISOString(),
    lang: PRIMARY_LANG,
    destinations: ALL_POPULAR_DESTINATIONS,
    topics: allTopics,
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
