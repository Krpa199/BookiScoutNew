import fs from 'fs';
import path from 'path';
import { generateArticle, translateArticle, ArticleData } from './gemini';
import { LANGUAGES, LanguageCode } from '../src/config/languages';
import { Destination, Theme, DESTINATIONS, THEMES } from '../src/config/destinations';

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'articles');
const TRACKING_FILE = path.join(process.cwd(), 'src', 'content', 'generated.json');

interface GeneratedTracker {
  generated: string[]; // "destination-theme" slugs
  lastRun: string;
  totalArticles: number;
}

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
  console.log(`✅ Saved: ${language}/${filename}`);
}

export async function generateDailyArticles(count: number = 10) {
  const tracker = loadTracker();
  const allLanguages = Object.keys(LANGUAGES) as LanguageCode[];

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

  console.log(`\n📝 Generating ${pendingTopics.length} articles in ${allLanguages.length} languages...\n`);

  for (const { destination, theme } of pendingTopics) {
    try {
      console.log(`\n🌍 ${destination.name} - ${theme}`);

      // Generate in English first
      console.log(`  ├─ Generating EN...`);
      const enArticle = await generateArticle(destination, theme, 'en');
      saveArticle(enArticle, 'en', destination, theme);

      // Translate to other languages
      for (const lang of allLanguages) {
        if (lang === 'en') continue;

        console.log(`  ├─ Translating to ${LANGUAGES[lang].name}...`);
        const translated = await translateArticle(enArticle, lang);
        saveArticle(translated, lang, destination, theme);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Mark as generated
      tracker.generated.push(`${destination.slug}-${theme}`);
      tracker.totalArticles += allLanguages.length;
      tracker.lastRun = new Date().toISOString();
      saveTracker(tracker);

      console.log(`  └─ ✅ Done (${allLanguages.length} languages)`);

    } catch (error) {
      console.error(`  └─ ❌ Error: ${error}`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Total articles: ${tracker.totalArticles}`);
  console.log(`   Topics covered: ${tracker.generated.length}/${DESTINATIONS.length * THEMES.length}`);
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

  // Generate in English first
  const enArticle = await generateArticle(destination, theme, 'en');
  saveArticle(enArticle, 'en', destination, theme);

  // Translate to other languages
  for (const lang of targetLanguages) {
    if (lang === 'en') continue;
    const translated = await translateArticle(enArticle, lang);
    saveArticle(translated, lang, destination, theme);
  }

  console.log(`✅ Generated ${targetLanguages.length} versions`);
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
  };
}
