/**
 * Fix Broken Images Script
 *
 * Scans all articles for broken image URLs (HTTP 400/404/etc)
 * and replaces them with fresh images from Pexels/Unsplash/Pixabay.
 * Updates all 13 language versions of each article.
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

const LOCALES = ['en', 'hr', 'de', 'fr', 'it', 'es', 'pl', 'cz', 'sk', 'sl', 'nl', 'ru', 'hu'];

interface BrokenArticle {
  slug: string;
  destination: string;
  theme: string;
  imageUrl: string;
}

function checkUrl(url: string): Promise<{ ok: boolean; status: string }> {
  return new Promise((resolve) => {
    if (!url || url.trim() === '') {
      resolve({ ok: false, status: 'EMPTY' });
      return;
    }
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { timeout: 10000 }, (res) => {
      resolve({ ok: (res.statusCode || 0) >= 200 && (res.statusCode || 0) < 400, status: String(res.statusCode) });
      res.resume();
    });
    req.on('error', (e) => resolve({ ok: false, status: 'ERROR: ' + e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, status: 'TIMEOUT' }); });
  });
}

// Simple image search from Pexels (no AI validation - just get a working image)
async function searchPexels(query: string): Promise<{ url: string; photographer: string; photographerUrl: string } | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`, {
      headers: { Authorization: apiKey }
    });
    const data = await res.json();
    if (data.photos && data.photos.length > 0) {
      const photo = data.photos[Math.floor(Math.random() * Math.min(data.photos.length, 5))];
      return {
        url: photo.src.large2x || photo.src.large,
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url
      };
    }
  } catch (e) {
    // ignore
  }
  return null;
}

async function searchUnsplash(query: string): Promise<{ url: string; photographer: string; photographerUrl: string } | null> {
  const apiKey = process.env.UNSPLASH_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`, {
      headers: { Authorization: `Client-ID ${apiKey}` }
    });
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const photo = data.results[Math.floor(Math.random() * Math.min(data.results.length, 5))];
      return {
        url: photo.urls.regular,
        photographer: photo.user.name,
        photographerUrl: photo.user.links.html
      };
    }
  } catch (e) {
    // ignore
  }
  return null;
}

// Build search queries based on destination and theme
function getSearchQueries(destination: string, theme: string): string[] {
  const queries: string[] = [];

  // Destination + theme specific
  queries.push(`${destination} ${theme} Croatia`);
  queries.push(`${destination} Croatia`);

  // Theme specific queries
  const themeQueries: Record<string, string[]> = {
    'pool': ['swimming pool hotel', 'resort pool mediterranean'],
    'parking': ['parking lot city', 'street parking europe'],
    'beach': [`${destination} beach`, 'mediterranean beach croatia'],
    'restaurants': [`${destination} restaurant`, 'mediterranean restaurant outdoor'],
    'nightlife': ['nightlife bar europe', 'cocktail bar evening'],
    'local-food': ['croatian food traditional', 'mediterranean cuisine'],
    'hidden-gems': [`${destination} old town`, 'charming european street'],
    'pet-friendly': ['dog travel europe', 'pet friendly vacation'],
    'families-with-toddlers': ['family vacation children', 'family travel europe'],
    'families-with-teens': ['family teenagers travel', 'teens vacation europe'],
    'first-time-visitors': [`${destination} landmarks`, `${destination} city center`],
    'couples': ['romantic couple europe', 'romantic european city'],
    'digital-nomads': ['laptop cafe coworking', 'digital nomad workspace'],
    'seniors': ['senior travel europe', 'elderly couple vacation'],
    'lgbt-friendly': ['rainbow flag pride europe', 'diverse travelers city'],
    'solo-travel': ['solo traveler europe', 'backpacker european city'],
    'budget': ['budget travel europe', 'affordable vacation'],
    'luxury': ['luxury hotel europe', 'five star resort'],
    'prices': ['shopping market europe', 'european market prices'],
    'weather': [`${destination} skyline`, `${destination} panorama`],
    'things-to-do': [`${destination} attractions`, `${destination} sightseeing`],
    'day-trips': ['scenic road trip europe', 'day trip excursion'],
    'safety': ['safe european city', 'peaceful european street'],
    'apartments': ['apartment balcony view', 'vacation rental mediterranean'],
    'family': ['family holiday europe', 'family activities vacation'],
    'crowds-by-month': [`${destination} crowds tourists`, 'tourist crowd europe'],
    'best-time-to-visit': [`${destination} summer`, `${destination} scenic view`],
    'shoulder-season': ['autumn europe travel', 'spring mediterranean'],
    'off-season': ['winter europe city', 'quiet european town winter'],
    'peak-season': ['summer europe crowded', 'summer vacation beach'],
    'airport-access': ['airport terminal', 'airport taxi transfer'],
    'public-transport-quality': ['public transport bus', 'tram european city'],
    'walkability': ['walking european old town', 'pedestrian street europe'],
    'coast-vs-inland': ['coast vs mountains', 'seaside and mountains europe'],
    'mobile-coverage': ['smartphone travel', 'phone map navigation'],
    'wifi-quality': ['wifi cafe laptop', 'internet cafe europe'],
    'wheelchair-access': ['wheelchair accessible travel', 'accessible european city'],
    'stroller-friendly': ['stroller family city', 'baby stroller travel'],
    'parking-difficulty': ['parking difficulty city', 'narrow european street parking'],
    'car-vs-no-car': ['car rental europe', 'road trip europe'],
    'ferry-connections': ['ferry boat adriatic', 'ferry port croatia'],
  };

  // Add theme-specific queries
  const specific = themeQueries[theme];
  if (specific) {
    queries.push(...specific);
  }

  // Add "vs" article queries
  if (theme.startsWith('vs-')) {
    const otherDest = theme.replace('vs-', '');
    queries.push(`${destination} ${otherDest} comparison`);
    queries.push(`${destination} Croatia`);
  }

  return queries;
}

async function findNewImage(destination: string, theme: string): Promise<{
  imageUrl: string;
  imageAlt: string;
  imageCredit: string;
  imageCreditUrl: string;
  imageSource: string;
} | null> {
  const queries = getSearchQueries(destination, theme);

  for (const query of queries) {
    // Try Pexels first, then Unsplash
    const pexels = await searchPexels(query);
    if (pexels) {
      // Verify the URL works
      const check = await checkUrl(pexels.url);
      if (check.ok) {
        return {
          imageUrl: pexels.url,
          imageAlt: `${destination} - ${theme.replace(/-/g, ' ')}`,
          imageCredit: pexels.photographer,
          imageCreditUrl: pexels.photographerUrl,
          imageSource: 'pexels',
        };
      }
    }

    const unsplash = await searchUnsplash(query);
    if (unsplash) {
      const check = await checkUrl(unsplash.url);
      if (check.ok) {
        return {
          imageUrl: unsplash.url,
          imageAlt: `${destination} - ${theme.replace(/-/g, ' ')}`,
          imageCredit: unsplash.photographer,
          imageCreditUrl: unsplash.photographerUrl,
          imageSource: 'unsplash',
        };
      }
    }

    // Small delay between searches
    await new Promise(r => setTimeout(r, 200));
  }

  return null;
}

async function main() {
  console.log('🔍 Scanning all articles for broken images...\n');

  const articlesDir = path.join(process.cwd(), 'src', 'content', 'articles', 'en');
  const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.json'));

  // Find all broken articles
  const broken: BrokenArticle[] = [];

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(articlesDir, file), 'utf-8'));
    const slug = file.replace('.json', '');

    if (!data.imageUrl || data.imageUrl.trim() === '') {
      broken.push({ slug, destination: data.destination || '', theme: data.theme || '', imageUrl: '' });
      continue;
    }

    const check = await checkUrl(data.imageUrl);
    if (!check.ok) {
      broken.push({ slug, destination: data.destination || '', theme: data.theme || '', imageUrl: data.imageUrl });
    }
  }

  console.log(`Found ${broken.length} articles with broken images.\n`);

  if (broken.length === 0) {
    console.log('✅ All images are working!');
    return;
  }

  // Fix each broken article
  let fixed = 0;
  let failed = 0;

  for (let i = 0; i < broken.length; i++) {
    const article = broken[i];
    console.log(`[${i + 1}/${broken.length}] Fixing ${article.slug}...`);

    const newImage = await findNewImage(article.destination, article.theme);
    if (!newImage) {
      console.log(`  ❌ Could not find replacement image`);
      failed++;
      continue;
    }

    console.log(`  ✅ Found: ${newImage.imageSource} by ${newImage.imageCredit}`);

    // Update all locales
    for (const locale of LOCALES) {
      const articlePath = path.join(process.cwd(), 'src', 'content', 'articles', locale, `${article.slug}.json`);
      if (fs.existsSync(articlePath)) {
        const articleData = JSON.parse(fs.readFileSync(articlePath, 'utf-8'));
        articleData.imageUrl = newImage.imageUrl;
        articleData.imageAlt = newImage.imageAlt;
        articleData.imageCredit = newImage.imageCredit;
        articleData.imageCreditUrl = newImage.imageCreditUrl;
        articleData.imageSource = newImage.imageSource;
        fs.writeFileSync(articlePath, JSON.stringify(articleData, null, 2), 'utf-8');
      }
    }

    fixed++;

    // Rate limit - small delay between articles
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Fixed: ${fixed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Total: ${broken.length}`);
}

main().catch(console.error);
