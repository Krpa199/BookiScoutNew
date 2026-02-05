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
  // Atomic write: write to temp file first, then rename
  const tempFile = TRACKING_FILE + '.tmp';
  fs.writeFileSync(tempFile, JSON.stringify(tracker, null, 2));
  fs.renameSync(tempFile, TRACKING_FILE);
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

      // Find stock image with AI validation (Pexels/Unsplash/Pixabay)
      console.log(`  ├─ Finding stock image...`);
      let imageData = null;
      try {
        imageData = await getArticleImage(theme, destination.slug);
        if (imageData) {
          console.log(`  │  ✅ Found validated image from ${imageData.imageSource}`);
        } else {
          console.log(`  │  ⚠️ No suitable image found, continuing without`);
        }
      } catch (error: any) {
        console.log(`  │  ⚠️ Image search error: ${error.message}`);
      }

      // Generate in English first (uses Pro model)
      console.log(`  ├─ Generating EN (Gemini 2.5 Pro)...`);
      const enArticle = await generateArticle(destination, theme, 'en');

      // Add image data to article
      const enArticleWithImages = imageData
        ? { ...enArticle, ...imageData }
        : enArticle;
      saveArticle(enArticleWithImages, 'en', destination, theme);
      articlesGenerated++;

      // Translate to other languages (uses Flash model)
      // Track translations for this article separately
      let thisArticleTranslations = 0;

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

        // Retry logic for translations
        let translationSuccess = false;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const translated = await translateArticle(enArticle, lang);
            // Add same image data to translated article
            const translatedWithImages = imageData
              ? { ...translated, ...imageData }
              : translated;
            saveArticle(translatedWithImages, lang, destination, theme);
            thisArticleTranslations++;
            translationsGenerated++;
            translationSuccess = true;
            break; // Success, exit retry loop
          } catch (error: unknown) {
            const errorMessage = (error as Error).message || '';

            // If it's a rate limit error, wait and retry
            if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
              if (attempt < 3) {
                console.log(`  ⚠️ Rate limited for ${lang}, attempt ${attempt}/3, waiting 60s...`);
                await new Promise(resolve => setTimeout(resolve, 60000));
                continue;
              }
            }

            // If it's exhausted error, stop
            if (errorMessage.includes('exhausted')) {
              console.log(`  ⚠️ API exhausted, skipping remaining translations`);
              requestStop('All Flash API keys exhausted for today');
              break;
            }

            // Other errors - log and continue to next language
            console.log(`  ⚠️ Translation failed for ${lang} (attempt ${attempt}): ${errorMessage}`);
            if (attempt === 3) {
              console.log(`  ⚠️ Giving up on ${lang} after 3 attempts`);
            }
          }
        }

        // If we requested stop during translation, break
        if (shouldStop) break;
      }

      // Mark as generated (even if some translations failed)
      tracker.generated.push(`${destination.slug}-${theme}`);
      tracker.totalArticles += 1 + thisArticleTranslations;
      tracker.lastRun = new Date().toISOString();
      tracker.lastSessionStats = {
        articlesGenerated,
        translationsGenerated,
        stoppedReason: shouldStop ? stopReason : undefined,
      };
      saveTracker(tracker);

      console.log(`  └─ ✅ Done (EN + ${thisArticleTranslations} translations)`);

      // If we stopped during translations, break the main loop too
      if (shouldStop) break;

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

  // Find stock image with AI validation (Pexels/Unsplash/Pixabay)
  console.log(`  ├─ Finding stock image...`);
  let imageData = null;
  try {
    imageData = await getArticleImage(theme, destination.slug);
    if (imageData) {
      console.log(`  │  ✅ Found validated image from ${imageData.imageSource}`);
    } else {
      console.log(`  │  ⚠️ No suitable image found, continuing without`);
    }
  } catch (error: any) {
    console.log(`  │  ⚠️ Image search error: ${error.message}`);
  }

  // Generate in English first
  console.log(`  ├─ Generating EN (Gemini 2.5 Pro)...`);
  const enArticle = await generateArticle(destination, theme, 'en');

  // Add image data to article
  const enArticleWithImages = imageData
    ? { ...enArticle, ...imageData }
    : enArticle;
  saveArticle(enArticleWithImages, 'en', destination, theme);

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
      // Add same image data to translated article
      const translatedWithImages = imageData
        ? { ...translated, ...imageData }
        : translated;
      saveArticle(translatedWithImages, lang, destination, theme);
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
