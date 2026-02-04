/**
 * Refresh all article images using multi-provider service
 *
 * Now searches Pexels + Unsplash + Pixabay with destination-specific queries
 * and AI validation that checks if image actually matches the theme.
 *
 * Run with: npx tsx scripts/refresh-article-images.ts
 */

// Load environment variables BEFORE importing modules
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';
import { getArticleImage } from './image-service';

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'articles');

interface Article {
  theme: string;
  destination: string;
  imageUrl?: string;
  imageAlt?: string;
  imageCredit?: string;
  imageCreditUrl?: string;
  imageSource?: string;
  [key: string]: unknown;
}

// Cache images by destination+theme to avoid duplicate API calls
const imageCache: Map<string, Awaited<ReturnType<typeof getArticleImage>>> = new Map();

async function getImageForArticle(destination: string, theme: string) {
  const cacheKey = `${destination}-${theme}`;
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey);
  }

  const image = await getArticleImage(theme, destination);
  imageCache.set(cacheKey, image);
  return image;
}

async function refreshArticleImages() {
  console.log('\n🖼️  Refreshing article images with multi-provider search\n');
  console.log('📡 Providers: Pexels + Unsplash + Pixabay');
  console.log('🤖 AI validation: Checking theme relevance\n');

  // Get all language directories
  const langDirs = fs.readdirSync(CONTENT_DIR).filter(dir => {
    const fullPath = path.join(CONTENT_DIR, dir);
    return fs.statSync(fullPath).isDirectory();
  });

  let totalUpdated = 0;
  let totalErrors = 0;

  // First pass: collect all unique destination+theme combinations
  const articlesToProcess: Array<{ destination: string; theme: string }> = [];
  const processedCombos = new Set<string>();

  for (const lang of langDirs) {
    // Only process English to get unique combos
    if (lang !== 'en') continue;

    const langDir = path.join(CONTENT_DIR, lang);
    const files = fs.readdirSync(langDir).filter(f => f.endsWith('.json'));

    for (const file of files) {
      const filePath = path.join(langDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const article: Article = JSON.parse(content);
        const combo = `${article.destination}-${article.theme}`;

        if (!processedCombos.has(combo) && article.destination && article.theme) {
          processedCombos.add(combo);
          articlesToProcess.push({
            destination: article.destination,
            theme: article.theme,
          });
        }
      } catch {
        // Skip invalid files
      }
    }
  }

  console.log(`📋 Found ${articlesToProcess.length} unique destination+theme combinations\n`);

  // Fetch images for each combination
  console.log('🔄 Fetching images...\n');

  let count = 0;
  for (const { destination, theme } of articlesToProcess) {
    count++;
    console.log(`\n[${count}/${articlesToProcess.length}] ${destination} / ${theme}`);

    const image = await getImageForArticle(destination, theme);
    if (image) {
      console.log(`  ✅ Found (${image.imageSource}): ${image.imageCredit}`);
    } else {
      console.log(`  ⚠️ No image found`);
    }

    // Delay to respect API rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n\n📝 Updating all article files...\n');

  // Second pass: update ALL articles in all languages
  for (const lang of langDirs) {
    const langDir = path.join(CONTENT_DIR, lang);
    const files = fs.readdirSync(langDir).filter(f => f.endsWith('.json'));

    for (const file of files) {
      const filePath = path.join(langDir, file);

      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const article: Article = JSON.parse(content);

        // Remove old image data
        delete article.imageUrl;
        delete article.imageAlt;
        delete article.imageCredit;
        delete article.imageCreditUrl;
        delete article.imageSource;

        // Get image for this destination+theme
        const cacheKey = `${article.destination}-${article.theme}`;
        const imageData = imageCache.get(cacheKey);

        if (imageData) {
          const updatedArticle = {
            ...article,
            ...imageData,
          };
          fs.writeFileSync(filePath, JSON.stringify(updatedArticle, null, 2));
        } else {
          fs.writeFileSync(filePath, JSON.stringify(article, null, 2));
        }

        totalUpdated++;
      } catch (error) {
        console.error(`  ❌ Error processing ${filePath}:`, error);
        totalErrors++;
      }
    }

    console.log(`  ✅ ${lang}: processed`);
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log(`   ✅ Updated: ${totalUpdated} articles`);
  console.log(`   ❌ Errors: ${totalErrors}`);
  console.log('='.repeat(50) + '\n');
}

// Run
refreshArticleImages().catch(console.error);
