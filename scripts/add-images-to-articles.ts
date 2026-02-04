/**
 * Add Pexels images to all existing articles
 *
 * Run with: npx ts-node scripts/add-images-to-articles.ts
 */

import fs from 'fs';
import path from 'path';
import { getArticleImage } from './pexels';

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'articles');

interface Article {
  theme: string;
  imageUrl?: string;
  [key: string]: unknown;
}

// Cache images by theme to avoid duplicate API calls
const imageCache: Map<string, Awaited<ReturnType<typeof getArticleImage>>> = new Map();

async function getImageForTheme(theme: string) {
  if (imageCache.has(theme)) {
    return imageCache.get(theme);
  }

  const image = await getArticleImage(theme);
  imageCache.set(theme, image);
  return image;
}

async function addImagesToArticles() {
  console.log('\n🖼️  Adding Pexels images to existing articles\n');

  // Get all language directories
  const langDirs = fs.readdirSync(CONTENT_DIR).filter(dir => {
    const fullPath = path.join(CONTENT_DIR, dir);
    return fs.statSync(fullPath).isDirectory();
  });

  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  // First pass: collect all unique themes
  const themesNeeded = new Set<string>();

  for (const lang of langDirs) {
    const langDir = path.join(CONTENT_DIR, lang);
    const files = fs.readdirSync(langDir).filter(f => f.endsWith('.json'));

    for (const file of files) {
      const filePath = path.join(langDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const article: Article = JSON.parse(content);

        if (!article.imageUrl && article.theme) {
          themesNeeded.add(article.theme);
        }
      } catch {
        // Skip invalid files
      }
    }
  }

  console.log(`📋 Found ${themesNeeded.size} unique themes that need images\n`);

  // Fetch images for all themes first (with delay to respect rate limits)
  console.log('🔄 Fetching images for each theme...\n');

  let themeCount = 0;
  for (const theme of themesNeeded) {
    themeCount++;
    console.log(`  [${themeCount}/${themesNeeded.size}] Fetching image for: ${theme}`);

    const image = await getImageForTheme(theme);
    if (image) {
      console.log(`    ✅ Found: ${image.imageCredit}`);
    } else {
      console.log(`    ⚠️ No image found`);
    }

    // Small delay to respect API rate limits (200/hour = ~3/second max)
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n📝 Updating article files...\n');

  // Second pass: update all articles with cached images
  for (const lang of langDirs) {
    const langDir = path.join(CONTENT_DIR, lang);
    const files = fs.readdirSync(langDir).filter(f => f.endsWith('.json'));

    for (const file of files) {
      const filePath = path.join(langDir, file);

      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const article: Article = JSON.parse(content);

        // Skip if already has image
        if (article.imageUrl) {
          totalSkipped++;
          continue;
        }

        // Get cached image for this theme
        const imageData = imageCache.get(article.theme);

        if (imageData) {
          // Add image data to article
          const updatedArticle = {
            ...article,
            ...imageData,
          };

          fs.writeFileSync(filePath, JSON.stringify(updatedArticle, null, 2));
          totalUpdated++;
        } else {
          totalSkipped++;
        }
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
  console.log(`   ⏭️  Skipped: ${totalSkipped} articles (already had images or no image found)`);
  console.log(`   ❌ Errors: ${totalErrors}`);
  console.log('='.repeat(50) + '\n');
}

// Run
addImagesToArticles().catch(console.error);
