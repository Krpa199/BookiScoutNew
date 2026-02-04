/**
 * Refresh all article images with better Croatia-focused queries
 *
 * Run with: PEXELS_API_KEY=xxx npx tsx scripts/refresh-article-images.ts
 */

import fs from 'fs';
import path from 'path';
import { getArticleImage } from './pexels';

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'articles');

interface Article {
  theme: string;
  imageUrl?: string;
  imageAlt?: string;
  imageCredit?: string;
  imageCreditUrl?: string;
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

async function refreshArticleImages() {
  console.log('\n🖼️  Refreshing all article images with better queries\n');

  // Get all language directories
  const langDirs = fs.readdirSync(CONTENT_DIR).filter(dir => {
    const fullPath = path.join(CONTENT_DIR, dir);
    return fs.statSync(fullPath).isDirectory();
  });

  let totalUpdated = 0;
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
        if (article.theme) {
          themesNeeded.add(article.theme);
        }
      } catch {
        // Skip invalid files
      }
    }
  }

  console.log(`📋 Found ${themesNeeded.size} unique themes\n`);

  // Fetch NEW images for all themes
  console.log('🔄 Fetching new images for each theme...\n');

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

    // Delay to respect API rate limits
    await new Promise(resolve => setTimeout(resolve, 400));
  }

  console.log('\n📝 Updating all article files...\n');

  // Second pass: update ALL articles (remove old images, add new ones)
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

        // Get new image for this theme
        const imageData = imageCache.get(article.theme);

        if (imageData) {
          // Add new image data
          const updatedArticle = {
            ...article,
            ...imageData,
          };
          fs.writeFileSync(filePath, JSON.stringify(updatedArticle, null, 2));
        } else {
          // Save without image
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
