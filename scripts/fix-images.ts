import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const PEXELS_KEY = process.env.PEXELS_API_KEY;

interface ImageResult {
  url: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
}

async function searchPexels(query: string): Promise<ImageResult | null> {
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5`,
      { headers: { Authorization: PEXELS_KEY! } }
    );
    const data = await res.json();
    if (data.photos && data.photos[0]) {
      const photo = data.photos[0];
      return {
        url: photo.src.large,
        alt: photo.alt || query,
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url,
      };
    }
  } catch (e) {
    console.log(`  Error searching: ${query}`);
  }
  return null;
}

async function updateArticleImage(slug: string, image: ImageResult) {
  const locales = ['en', 'hr', 'de', 'fr', 'it', 'es', 'pl', 'cz', 'sk', 'sl', 'nl', 'ru', 'hu'];

  for (const locale of locales) {
    const filePath = path.join('src/content/articles', locale, `${slug}.json`);
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      data.imageUrl = image.url;
      data.imageAlt = image.alt;
      data.imageCredit = image.photographer;
      data.imageCreditUrl = image.photographerUrl;
      data.imageSource = 'pexels';
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }
  }
  console.log(`  ✅ Updated ${slug} in all locales`);
}

// Theme to search query mapping
const themeQueries: Record<string, string[]> = {
  'pool': ['swimming pool hotel resort', 'hotel pool luxury'],
  'parking': ['parking lot europe city', 'car parking urban'],
  'parking-difficulty': ['parking lot europe city', 'street parking'],
  'transport': ['tram city europe', 'public transport bus'],
  'local-food': ['croatian food traditional plate', 'mediterranean cuisine dish'],
  'restaurants': ['restaurant terrace europe outdoor dining', 'cafe terrace european city'],
  'lgbt-friendly': ['pride flag rainbow', 'lgbt friendly cafe'],
  'luxury': ['luxury hotel lobby europe', 'elegant hotel interior'],
  'pet-friendly': ['dog travel vacation europe', 'pet friendly hotel'],
  'ferry-connections': ['ferry boat adriatic', 'car ferry croatia'],
  'beach': ['lake swimming europe', 'plitvice lakes croatia'],
  'solo-travel': ['woman backpacker europe', 'solo traveler old town'],
  'peak-season': ['busy city summer tourists', 'crowded european square'],
  'weather': ['sunny city europe', 'blue sky european city'],
  'vs-dubrovnik': ['split coast vs dubrovnik', 'croatia coastal cities'],
  'vs-split': ['dubrovnik old town', 'croatia coast comparison'],
  'vs-istria': ['zagreb city architecture', 'central europe capital'],
  'vs-zadar': ['zagreb cathedral square', 'croatia capital city'],
  'vs-zagreb': ['dubrovnik walls', 'croatia coast'],
};

// Articles to fix with their destinations
const articlesToFix = [
  // Zagreb with sea images - need city/inland images
  { slug: 'zagreb-beach', theme: 'beach', dest: 'zagreb', query: 'lake swimming central europe' },
  { slug: 'zagreb-ferry-connections', theme: 'ferry-connections', dest: 'zagreb', query: 'bus train station europe' },
  { slug: 'zagreb-lgbt-friendly', theme: 'lgbt-friendly', dest: 'zagreb', query: 'pride flag rainbow celebration' },
  { slug: 'zagreb-luxury', theme: 'luxury', dest: 'zagreb', query: 'luxury hotel lobby elegant' },
  { slug: 'zagreb-peak-season', theme: 'peak-season', dest: 'zagreb', query: 'crowded city square tourists summer' },
  { slug: 'zagreb-pet-friendly', theme: 'pet-friendly', dest: 'zagreb', query: 'dog travel vacation city' },
  { slug: 'zagreb-solo-travel', theme: 'solo-travel', dest: 'zagreb', query: 'woman backpacker european city' },
  { slug: 'zagreb-vs-istria', theme: 'vs-istria', dest: 'zagreb', query: 'zagreb cathedral square croatia' },
  { slug: 'zagreb-vs-split', theme: 'vs-split', dest: 'zagreb', query: 'zagreb city skyline croatia' },
  { slug: 'zagreb-vs-zadar', theme: 'vs-zadar', dest: 'zagreb', query: 'zagreb ban jelacic square' },
  { slug: 'zagreb-weather', theme: 'weather', dest: 'zagreb', query: 'sunny european city blue sky' },

  // Zagreb theme mismatches
  { slug: 'zagreb-pool', theme: 'pool', dest: 'zagreb', query: 'swimming pool hotel luxury' },
  { slug: 'zagreb-parking-difficulty', theme: 'parking-difficulty', dest: 'zagreb', query: 'parking lot europe city cars' },
  { slug: 'zagreb-transport', theme: 'transport', dest: 'zagreb', query: 'zagreb tram blue city' },
  { slug: 'zagreb-local-food', theme: 'local-food', dest: 'zagreb', query: 'croatian food traditional dish plate' },
  { slug: 'zagreb-restaurants', theme: 'restaurants', dest: 'zagreb', query: 'restaurant terrace outdoor dining' },
  { slug: 'zagreb-vs-dubrovnik', theme: 'vs-dubrovnik', dest: 'zagreb', query: 'zagreb city center croatia' },

  // Dubrovnik/Split mismatches
  { slug: 'dubrovnik-ferry-connections', theme: 'ferry-connections', dest: 'dubrovnik', query: 'ferry boat adriatic croatia' },
  { slug: 'dubrovnik-local-food', theme: 'local-food', dest: 'dubrovnik', query: 'seafood mediterranean dish croatia' },
  { slug: 'dubrovnik-parking-difficulty', theme: 'parking-difficulty', dest: 'dubrovnik', query: 'parking lot city europe' },
  { slug: 'dubrovnik-parking', theme: 'parking', dest: 'dubrovnik', query: 'parking garage cars urban' },
  { slug: 'dubrovnik-transport', theme: 'transport', dest: 'dubrovnik', query: 'bus public transport croatia' },
  { slug: 'dubrovnik-vs-zagreb', theme: 'vs-zagreb', dest: 'dubrovnik', query: 'dubrovnik old town walls' },
  { slug: 'split-parking', theme: 'parking', dest: 'split', query: 'parking lot cars croatia' },
  { slug: 'split-transport', theme: 'transport', dest: 'split', query: 'bus station croatia transport' },
];

async function main() {
  console.log('🔄 Starting image fixes...\n');

  for (const article of articlesToFix) {
    console.log(`📷 ${article.slug}`);
    const image = await searchPexels(article.query);

    if (image) {
      await updateArticleImage(article.slug, image);
    } else {
      console.log(`  ❌ No image found for ${article.slug}`);
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 200));
  }

  console.log('\n✅ Done!');
}

main();
