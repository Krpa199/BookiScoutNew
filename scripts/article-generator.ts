import fs from 'fs';
import path from 'path';
import { generateArticle, translateArticle, ArticleData, getRemainingCalls } from './gemini';
import { LANGUAGES, LanguageCode } from '../src/config/languages';
import { Destination, Theme, DESTINATIONS, THEMES } from '../src/config/destinations';
import { getArticleImage } from './image-service';

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'articles');
const TRACKING_FILE = path.join(process.cwd(), 'src', 'content', 'generated.json');

interface GeneratedTracker {
  generated: string[]; // "destination-theme" slugs
  lastRun: string;
  totalArticles: number;
  lastSessionStats?: {
    articlesGenerated: number;
    translationsGenerated: number;
    stoppedReason?: string;
  };
}

// Graceful shutdown flag
let shouldStop = false;
let stopReason = '';

function ensureDirectoryExists(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadTracker(): GeneratedTracker {
  try {
    if (fs.existsSync(TRACKING_FILE)) {
      return JSON.parse(fs.readFileSync(TRACKING_FILE, 'utf-8'));
    }
  } catch {
    console.log('Creating new tracker file');
  }
  return { generated: [], lastRun: '', totalArticles: 0 };
}

function saveTracker(tracker: GeneratedTracker) {
  ensureDirectoryExists(path.dirname(TRACKING_FILE));
  fs.writeFileSync(TRACKING_FILE, JSON.stringify(tracker, null, 2));
}

function saveArticle(article: ArticleData, language: LanguageCode, destination: Destination, theme: Theme) {
  const langDir = path.join(CONTENT_DIR, language);
  ensureDirectoryExists(langDir);

  const filename = `${destination.slug}-${theme}.json`;
  const filepath = path.join(langDir, filename);

  const articleWithMeta = {
    ...article,
    destination: destination.slug,
    destinationName: destination.name,
    region: destination.region,
    theme,
    language,
    generatedAt: new Date().toISOString(),
    lat: destination.lat,
    lng: destination.lng,
  };

  fs.writeFileSync(filepath, JSON.stringify(articleWithMeta, null, 2));
  console.log(`  ✅ Saved: ${language}/${filename}`);
}

// Graceful shutdown handler
function requestStop(reason: string) {
  shouldStop = true;
  stopReason = reason;
  console.log(`\n⚠️ Stop requested: ${reason}`);
}

export async function generateDailyArticles(count: number = 10) {
  const tracker = loadTracker();
  const allLanguages = Object.keys(LANGUAGES) as LanguageCode[];

  // Reset stop flag
  shouldStop = false;
  stopReason = '';

  // Session stats
  let articlesGenerated = 0;
  let translationsGenerated = 0;

  // Get priority destinations (popular ones first)
  const priorityDestinations = DESTINATIONS.filter(d => d.popular);
  const otherDestinations = DESTINATIONS.filter(d => !d.popular);
  const sortedDestinations = [...priorityDestinations, ...otherDestinations];

  // Find next topics to generate
  const pendingTopics: { destination: Destination; theme: Theme }[] = [];

  for (const destination of sortedDestinations) {
    for (const theme of THEMES) {
      const key = `${destination.slug}-${theme}`;
      if (!tracker.generated.includes(key)) {
        pendingTopics.push({ destination, theme });
      }
      if (pendingTopics.length >= count) break;
    }
    if (pendingTopics.length >= count) break;
  }

  if (pendingTopics.length === 0) {
    console.log('🎉 All topics have been generated!');
    return;
  }

  // Check remaining API calls before starting
  const remaining = getRemainingCalls();
  console.log(`\n🔑 API Capacity:`);
  console.log(`   Pro calls remaining: ${remaining.pro}`);
  console.log(`   Flash calls remaining: ${remaining.flash}`);

  // Estimate if we have enough capacity
  const neededProCalls = pendingTopics.length;
  const neededFlashCalls = pendingTopics.length * (allLanguages.length - 1); // translations

  if (remaining.pro < neededProCalls) {
    console.log(`\n⚠️ Warning: Only ${remaining.pro} Pro calls available, but need ${neededProCalls}`);
    console.log(`   Will generate as many as possible and save progress.`);
  }

  console.log(`\n📝 Generating ${pendingTopics.length} articles in ${allLanguages.length} languages...\n`);

  for (const { destination, theme } of pendingTopics) {
    // Check if we should stop
    if (shouldStop) {
      console.log(`\n🛑 Stopping: ${stopReason}`);
      break;
    }

    // Check remaining capacity before each article
    const currentRemaining = getRemainingCalls();
    if (currentRemaining.pro <= 0) {
      requestStop('All Pro API keys exhausted for today');
      break;
    }

    try {
      console.log(`\n🌍 ${destination.name} - ${theme}`);
      console.log(`   Remaining: Pro=${currentRemaining.pro}, Flash=${currentRemaining.flash}`);

      // Fetch image for this theme from multiple providers
      console.log(`  ├─ Fetching image...`);
      const imageData = await getArticleImage(theme, destination.id);
      if (imageData) {
        console.log(`  │  ✅ Image found (${imageData.imageSource}): ${imageData.imageCredit}`);
      } else {
        console.log(`  │  ⚠️ No image found, continuing without`);
      }

      // Generate in English first (uses Pro model)
      console.log(`  ├─ Generating EN (Gemini 2.5 Pro)...`);
      const enArticle = await generateArticle(destination, theme, 'en');

      // Add image data to article
      const enArticleWithImage = imageData ? { ...enArticle, ...imageData } : enArticle;
      saveArticle(enArticleWithImage, 'en', destination, theme);
      articlesGenerated++;

      // Translate to other languages (uses Flash model)
      for (const lang of allLanguages) {
        if (lang === 'en') continue;

        // Check if we should stop
        if (shouldStop) break;

        // Check Flash capacity
        const flashRemaining = getRemainingCalls();
        if (flashRemaining.flash <= 0) {
          requestStop('All Flash API keys exhausted for today');
          break;
        }

        console.log(`  ├─ Translating to ${LANGUAGES[lang].name} (Flash Lite)...`);
        try {
          const translated = await translateArticle(enArticle, lang);
          // Add image data to translated article (same image for all languages)
          const translatedWithImage = imageData ? { ...translated, ...imageData } : translated;
          saveArticle(translatedWithImage, lang, destination, theme);
          translationsGenerated++;
        } catch (error: unknown) {
          const errorMessage = (error as Error).message || '';
          console.log(`  ⚠️ Translation failed for ${lang}: ${errorMessage}`);

          // If it's a rate limit error, stop translations for this article
          if (errorMessage.includes('exhausted')) {
            console.log(`  ⚠️ Skipping remaining translations for this article`);
            break;
          }
        }
      }

      // Mark as generated (even if some translations failed)
      tracker.generated.push(`${destination.slug}-${theme}`);
      tracker.totalArticles += 1 + translationsGenerated;
      tracker.lastRun = new Date().toISOString();
      tracker.lastSessionStats = {
        articlesGenerated,
        translationsGenerated,
        stoppedReason: shouldStop ? stopReason : undefined,
      };
      saveTracker(tracker);

      console.log(`  └─ ✅ Done (EN + ${translationsGenerated} translations)`);

      // Reset translation counter for next article
      const thisArticleTranslations = translationsGenerated;
      translationsGenerated = 0;

      // If we stopped during translations, break the main loop too
      if (shouldStop) break;

      // Add back the translations count for final stats
      translationsGenerated = thisArticleTranslations;

    } catch (error: unknown) {
      const errorMessage = (error as Error).message || String(error);
      console.error(`  └─ ❌ Error: ${errorMessage}`);

      // If it's an API exhaustion error, stop gracefully
      if (errorMessage.includes('exhausted') || errorMessage.includes('429')) {
        requestStop('API rate limit reached');
        break;
      }
    }
  }

  // Final summary
  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 Session Summary:`);
  console.log(`   Articles generated (EN): ${articlesGenerated}`);
  console.log(`   Translations generated: ${translationsGenerated}`);
  console.log(`   Total articles now: ${tracker.totalArticles}`);
  console.log(`   Topics covered: ${tracker.generated.length}/${DESTINATIONS.length * THEMES.length}`);

  if (shouldStop) {
    console.log(`\n⚠️ Session stopped early: ${stopReason}`);
    console.log(`   Progress has been saved. Run again tomorrow to continue.`);
  }

  // Show remaining capacity
  const finalRemaining = getRemainingCalls();
  console.log(`\n🔑 Remaining API Capacity:`);
  console.log(`   Pro: ${finalRemaining.pro} calls`);
  console.log(`   Flash: ${finalRemaining.flash} calls`);
}

export async function generateSingleArticle(
  destinationSlug: string,
  theme: Theme,
  languages?: LanguageCode[]
) {
  const destination = DESTINATIONS.find(d => d.slug === destinationSlug);
  if (!destination) {
    throw new Error(`Destination not found: ${destinationSlug}`);
  }

  const targetLanguages = languages || (Object.keys(LANGUAGES) as LanguageCode[]);

  console.log(`\n🌍 Generating: ${destination.name} - ${theme}`);

  // Check remaining capacity
  const remaining = getRemainingCalls();
  console.log(`🔑 API Capacity: Pro=${remaining.pro}, Flash=${remaining.flash}`);

  if (remaining.pro <= 0) {
    throw new Error('No Pro API calls remaining for today');
  }

  // Fetch image for this theme from Pexels
  console.log(`  ├─ Fetching image from Pexels...`);
  const imageData = await getArticleImage(theme);
  if (imageData) {
    console.log(`  │  ✅ Image found: ${imageData.imageCredit}`);
  } else {
    console.log(`  │  ⚠️ No image found, continuing without`);
  }

  // Generate in English first
  console.log(`  ├─ Generating EN (Gemini 2.5 Pro)...`);
  const enArticle = await generateArticle(destination, theme, 'en');
  const enArticleWithImage = imageData ? { ...enArticle, ...imageData } : enArticle;
  saveArticle(enArticleWithImage, 'en', destination, theme);

  // Translate to other languages
  let translatedCount = 0;
  for (const lang of targetLanguages) {
    if (lang === 'en') continue;

    const flashRemaining = getRemainingCalls();
    if (flashRemaining.flash <= 0) {
      console.log(`  ⚠️ Flash API exhausted, skipping remaining translations`);
      break;
    }

    console.log(`  ├─ Translating to ${LANGUAGES[lang].name}...`);
    try {
      const translated = await translateArticle(enArticle, lang);
      const translatedWithImage = imageData ? { ...translated, ...imageData } : translated;
      saveArticle(translatedWithImage, lang, destination, theme);
      translatedCount++;
    } catch (error) {
      console.log(`  ⚠️ Translation failed for ${lang}`);
    }
  }

  console.log(`  └─ ✅ Generated EN + ${translatedCount} translations`);
}

// Stats function
export function getGenerationStats() {
  const tracker = loadTracker();
  const totalPossible = DESTINATIONS.length * THEMES.length;

  return {
    generated: tracker.generated.length,
    total: totalPossible,
    percentage: Math.round((tracker.generated.length / totalPossible) * 100),
    totalArticles: tracker.totalArticles,
    lastRun: tracker.lastRun,
    remaining: totalPossible - tracker.generated.length,
    lastSessionStats: tracker.lastSessionStats,
  };
}
