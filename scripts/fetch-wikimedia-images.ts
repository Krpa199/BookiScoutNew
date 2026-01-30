#!/usr/bin/env node
/**
 * Fetch destination images from Wikimedia Commons
 *
 * This script searches Wikimedia Commons for high-quality images of Croatian destinations.
 * Wikimedia images require attribution but are free for commercial use.
 *
 * Usage:
 *   npm run fetch-images split
 *   npm run fetch-images --all
 */

interface WikimediaImage {
  title: string;
  url: string;
  thumbnail: string;
  description: string;
  author: string;
  license: string;
}

const DESTINATIONS = [
  'Split, Croatia',
  'Dubrovnik, Croatia',
  'Zagreb, Croatia',
  'Zadar, Croatia',
  'Hvar, Croatia',
  'Rovinj, Croatia',
  'Plitvice Lakes',
  'Krka National Park',
];

/**
 * Search Wikimedia Commons for images
 */
async function searchWikimedia(query: string, limit = 5): Promise<WikimediaImage[]> {
  const apiUrl = 'https://commons.wikimedia.org/w/api.php';

  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    generator: 'search',
    gsrsearch: `${query} filetype:bitmap`,
    gsrlimit: limit.toString(),
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: '800',
    origin: '*',
  });

  try {
    const response = await fetch(`${apiUrl}?${params}`);
    const data = await response.json();

    if (!data.query?.pages) {
      return [];
    }

    const images: WikimediaImage[] = [];

    for (const page of Object.values(data.query.pages) as any[]) {
      if (!page.imageinfo?.[0]) continue;

      const info = page.imageinfo[0];
      const metadata = info.extmetadata || {};

      images.push({
        title: page.title,
        url: info.url,
        thumbnail: info.thumburl || info.url,
        description: metadata.ImageDescription?.value || '',
        author: metadata.Artist?.value || 'Unknown',
        license: metadata.LicenseShortName?.value || 'Unknown',
      });
    }

    return images;
  } catch (error) {
    console.error(`Error fetching from Wikimedia:`, error);
    return [];
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const destinationFilter = args[0];

  console.log('🖼️  Fetching images from Wikimedia Commons...\n');

  const destinations = destinationFilter && destinationFilter !== '--all'
    ? DESTINATIONS.filter(d => d.toLowerCase().includes(destinationFilter.toLowerCase()))
    : DESTINATIONS;

  if (destinations.length === 0) {
    console.log(`❌ No destinations found matching: ${destinationFilter}`);
    return;
  }

  for (const destination of destinations) {
    console.log(`\n📍 ${destination}`);
    console.log('─'.repeat(50));

    const images = await searchWikimedia(destination, 5);

    if (images.length === 0) {
      console.log('  ❌ No images found');
      continue;
    }

    images.forEach((img, idx) => {
      console.log(`\n  ${idx + 1}. ${img.title}`);
      console.log(`     URL: ${img.thumbnail}`);
      console.log(`     License: ${img.license}`);
      console.log(`     Author: ${img.author.replace(/<[^>]*>/g, '').substring(0, 60)}`);
    });

    // Wait 1 second between requests to be respectful to Wikimedia API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n\n✅ Done! Copy the image URLs above to src/config/images.ts');
  console.log('📝 Remember to add attribution as per Wikimedia Commons license requirements');
}

main();
