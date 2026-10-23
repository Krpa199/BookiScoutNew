import fs from 'fs';
import path from 'path';
import { generateArticle, translateArticle, ArticleData, getRemainingCalls } from './gemini';
import { LANGUAGES, LanguageCode } from '../src/config/languages';
import { Destination, Theme, DESTINATIONS, THEMES, GENERATION_TIERS, isThemeAvailableFor } from '../src/config/destinations';
import { getArticleImage } from './image-service';
import { generateArticleClaude, writeArticlesBatch } from './claude-writer';

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

// Covers already used by any article: a new article never gets one of these,
// so two guides about the same place don't show the same photo side by side.
function usedCoverUrls(): Set<string> {
  const dir = path.join(CONTENT_DIR, 'en');
  const used = new Set<string>();
  if (!fs.existsSync(dir)) return used;
  for (const f of fs.readdirSync(dir)) {
    try { const u = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')).imageUrl; if (u) used.add(u); } catch { /* skip */ }
  }
  return used;
}

// English source text. EN_WRITER=claude (daily workflow): Claude Sonnet with web
// search; Gemini otherwise, or when the Claude call fails (no key, no credit,
// refusal, unusable output) so a bad day never stops generation.
export async function generateEnglish(destination: Destination, theme: Theme): Promise<ArticleData> {
  if (process.env.EN_WRITER === 'claude') {
    try {
      return await generateArticleClaude(destination, theme);
    } catch (error) {
      console.log(`  ⚠️ Claude failed (${(error as Error).message}), falling back to Gemini`);
    }
  }
  return generateArticle(destination, theme, 'en');
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
// translateArticle falls back to the English original when Gemini's output
// can't be parsed. Saving that under another language is how ~600 "German"
// pages ended up in English, so treat it as a failure and let the caller
// retry; after the last attempt the language is simply left missing.
export async function translateChecked(enArticle: ArticleData, lang: LanguageCode): Promise<ArticleData> {
  const translated = await translateArticle(enArticle, lang);
  if ((translated.content || '').slice(0, 200) === (enArticle.content || '').slice(0, 200)) {
    throw new Error('translation came back in English');
  }
  // Flash-Lite sometimes leaves the title English ("Isis Cavtat Worth Visiting
  // in 2027? Honest Guide & Costs" on the Croatian page). Fail if most of the
  // English title's words survive.
  const words = (s: string) => s.toLowerCase().split(/[^\p{L}]+/u).filter(w => w.length >= 4);
  const enWords = words(enArticle.title || '');
  const kept = enWords.filter(w => words(translated.title || '').includes(w)).length;
  if (enWords.length >= 3 && kept / enWords.length > 0.5) {
    throw new Error(`title came back in English ("${translated.title}")`);
  }
  // Other Flash-Lite glitches seen in titles: a doubled "Is" ("Isisplati li
  // se…"), Greek letters inside a Slovak word ("dovolenής").
  const t = translated.title || '';
  if (/^Isis/.test(t) || (lang !== 'ru' && /[Ͱ-ϿЀ-ӿ]/.test(t))) {
    throw new Error(`garbled title ("${t}")`);
  }
  return translated;
}

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

  // Build the FULL pending list, then shuffle within priority tiers.
  //
  // Why shuffle: generating destination-by-destination, theme-by-theme in a fixed
  // order publishes dozens of near-adjacent articles about the same place in a row.
  // Google reads that batch pattern as scaled/automated content. Interleaving the
  // daily batch across many destinations and themes looks organic instead — the
  // single biggest lever against a "scaled content abuse" penalty.
  //
  // We still respect priority: theme tiers (GENERATION_TIERS — planner themes
  // only) are drained in order, and within a tier popular destinations come
  // first. The shuffle only randomises order *within* each group, so a day's
  // output is a varied mix rather than "50 Zagreb articles".
  const buildPending = (destinations: Destination[], themes: readonly Theme[]) => {
    const list: { destination: Destination; theme: Theme }[] = [];
    for (const destination of destinations) {
      for (const theme of themes) {
        if (!isThemeAvailableFor(destination.slug, theme)) continue;
        // Never compare a place with itself (this produced split-vs-split).
        if (theme === `vs-${destination.slug}`) continue;
        const key = `${destination.slug}-${theme}`;
        if (!tracker.generated.includes(key)) {
          list.push({ destination, theme });
        }
      }
    }
    // Fisher-Yates shuffle
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };

  const pendingTopics = GENERATION_TIERS.flatMap(themes => [
    ...buildPending(DESTINATIONS.filter(d => d.popular), themes),
    ...buildPending(DESTINATIONS.filter(d => !d.popular), themes),
  ]).slice(0, count);

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

  // CLAUDE_BATCH=on: write every English article in one Message Batch first
  // (half the token price); any article missing from it is written one by one
  // below (normal Claude call, then Gemini).
  const batchArticles = process.env.EN_WRITER === 'claude' && process.env.CLAUDE_BATCH === 'on'
    ? await writeArticlesBatch(pendingTopics)
    : new Map<string, ArticleData>();

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
        imageData = await getArticleImage(theme, destination.slug, { excludeUrls: usedCoverUrls() });
        if (imageData) {
          console.log(`  │  ✅ Found validated image from ${imageData.imageSource}`);
        } else {
          console.log(`  │  ⚠️ No suitable image found, continuing without`);
        }
      } catch (error: any) {
        console.log(`  │  ⚠️ Image search error: ${error.message}`);
      }

      // Generate in English first (uses Pro model)
      console.log(`  ├─ Generating EN...`);
      const enArticle = batchArticles.get(`${destination.slug}-${theme}`) ?? await generateEnglish(destination, theme);

      // Add image data to article
      const enArticleWithImages = imageData
        ? { ...enArticle, ...imageData }
        : enArticle;
      saveArticle(enArticleWithImages, 'en', destination, theme);
      articlesGenerated++;

      // Translate to other languages (uses Flash model)
      // Track translations for this article separately
      let thisArticleTranslations = 0;

      // GENERATE_EN_ONLY=on (daily workflow): English only. The review
      // workflow first has Claude fix the English, then translates the
      // corrected text (scripts/translate-articles.ts), so errors in the
      // source aren't copied into 12 languages.
      const translateNow = process.env.GENERATE_EN_ONLY !== 'on';

      for (const lang of translateNow ? allLanguages : []) {
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
            const translated = await translateChecked(enArticle, lang);
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
    imageData = await getArticleImage(theme, destination.slug, { excludeUrls: usedCoverUrls() });
    if (imageData) {
      console.log(`  │  ✅ Found validated image from ${imageData.imageSource}`);
    } else {
      console.log(`  │  ⚠️ No suitable image found, continuing without`);
    }
  } catch (error: any) {
    console.log(`  │  ⚠️ Image search error: ${error.message}`);
  }

  // Generate in English first
  console.log(`  ├─ Generating EN...`);
  const enArticle = await generateEnglish(destination, theme);

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
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const translated = await translateChecked(enArticle, lang);
        // Add same image data to translated article
        const translatedWithImages = imageData
          ? { ...translated, ...imageData }
          : translated;
        saveArticle(translatedWithImages, lang, destination, theme);
        translatedCount++;
        break;
      } catch (error) {
        console.log(`  ⚠️ Translation failed for ${lang} (attempt ${attempt}/3): ${(error as Error).message}`);
      }
    }
  }

  // Mark as generated so the daily cron doesn't regenerate it
  const tracker = loadTracker();
  const key = `${destination.slug}-${theme}`;
  if (!tracker.generated.includes(key)) {
    tracker.generated.push(key);
    tracker.totalArticles += 1 + translatedCount;
    saveTracker(tracker);
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
