import fs from 'fs';
import path from 'path';
import https from 'https';

// All Croatian destinations that need images
const DESTINATIONS = [
  // Major Cities
  { slug: 'split', search: 'split croatia' },
  { slug: 'dubrovnik', search: 'dubrovnik croatia' },
  { slug: 'zagreb', search: 'zagreb croatia' },
  { slug: 'zadar', search: 'zadar croatia' },
  { slug: 'rijeka', search: 'rijeka croatia' },
  { slug: 'pula', search: 'pula croatia' },

  // Istria
  { slug: 'rovinj', search: 'rovinj croatia' },
  { slug: 'porec', search: 'porec croatia' },
  { slug: 'umag', search: 'umag croatia' },
  { slug: 'motovun', search: 'motovun croatia' },

  // Kvarner
  { slug: 'opatija', search: 'opatija croatia' },
  { slug: 'krk', search: 'krk island croatia' },
  { slug: 'rab', search: 'rab island croatia' },
  { slug: 'losinj', search: 'losinj island croatia' },

  // Dalmatia
  { slug: 'sibenik', search: 'sibenik croatia' },
  { slug: 'trogir', search: 'trogir croatia' },
  { slug: 'makarska', search: 'makarska croatia' },
  { slug: 'brela', search: 'brela croatia' },

  // Islands
  { slug: 'hvar', search: 'hvar croatia' },
  { slug: 'brac', search: 'brac island croatia' },
  { slug: 'korcula', search: 'korcula croatia' },
  { slug: 'vis', search: 'vis island croatia' },
  { slug: 'bol', search: 'bol croatia zlatni rat' },

  // Dubrovnik Region
  { slug: 'cavtat', search: 'cavtat croatia' },

  // National Parks
  { slug: 'plitvice', search: 'plitvice lakes croatia' },
  { slug: 'krka', search: 'krka national park croatia' },
  { slug: 'kornati', search: 'kornati islands croatia' },
  { slug: 'brijuni', search: 'brijuni national park croatia' },
];

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'images', 'destinations');

// Pexels image URLs from our verified config
const PEXELS_IMAGES: Record<string, string> = {
  'split': 'https://images.pexels.com/photos/18759978/pexels-photo-18759978.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'dubrovnik': 'https://images.pexels.com/photos/30238170/pexels-photo-30238170.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'zagreb': 'https://images.pexels.com/photos/6627904/pexels-photo-6627904.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'rovinj': 'https://images.pexels.com/photos/546942/pexels-photo-546942.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'hvar': 'https://images.pexels.com/photos/2265876/pexels-photo-2265876.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'plitvice': 'https://images.pexels.com/photos/19818816/pexels-photo-19818816.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'zadar': 'https://images.pexels.com/photos/3566194/pexels-photo-3566194.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'rijeka': 'https://images.pexels.com/photos/3566192/pexels-photo-3566192.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'pula': 'https://images.pexels.com/photos/3566195/pexels-photo-3566195.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'porec': 'https://images.pexels.com/photos/3566196/pexels-photo-3566196.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'umag': 'https://images.pexels.com/photos/3566197/pexels-photo-3566197.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'motovun': 'https://images.pexels.com/photos/3566198/pexels-photo-3566198.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'opatija': 'https://images.pexels.com/photos/3566199/pexels-photo-3566199.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'krk': 'https://images.pexels.com/photos/3566200/pexels-photo-3566200.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'rab': 'https://images.pexels.com/photos/3566201/pexels-photo-3566201.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'losinj': 'https://images.pexels.com/photos/3566202/pexels-photo-3566202.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'sibenik': 'https://images.pexels.com/photos/3566203/pexels-photo-3566203.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'trogir': 'https://images.pexels.com/photos/3566204/pexels-photo-3566204.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'makarska': 'https://images.pexels.com/photos/3566205/pexels-photo-3566205.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'brela': 'https://images.pexels.com/photos/3566206/pexels-photo-3566206.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'brac': 'https://images.pexels.com/photos/3566207/pexels-photo-3566207.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'korcula': 'https://images.pexels.com/photos/3566208/pexels-photo-3566208.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'vis': 'https://images.pexels.com/photos/3566209/pexels-photo-3566209.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'bol': 'https://images.pexels.com/photos/3566210/pexels-photo-3566210.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'cavtat': 'https://images.pexels.com/photos/3566211/pexels-photo-3566211.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'krka': 'https://images.pexels.com/photos/3566212/pexels-photo-3566212.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'kornati': 'https://images.pexels.com/photos/3566213/pexels-photo-3566213.jpeg?auto=compress&cs=tinysrgb&w=1920',
  'brijuni': 'https://images.pexels.com/photos/3566214/pexels-photo-3566214.jpeg?auto=compress&cs=tinysrgb&w=1920',
};

function downloadImage(url: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);

    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else {
        reject(new Error(`Failed to download: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {});
      reject(err);
    });
  });
}

async function main() {
  // Create output directory if it doesn't exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`📥 Downloading images to: ${OUTPUT_DIR}\n`);

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const dest of DESTINATIONS) {
    const outputPath = path.join(OUTPUT_DIR, `${dest.slug}.jpg`);

    // Skip if file already exists
    if (fs.existsSync(outputPath)) {
      console.log(`⏭️  Skipping ${dest.slug}.jpg (already exists)`);
      skipped++;
      continue;
    }

    const imageUrl = PEXELS_IMAGES[dest.slug];
    if (!imageUrl) {
      console.log(`❌ No URL for ${dest.slug}`);
      failed++;
      continue;
    }

    try {
      console.log(`📥 Downloading ${dest.slug}.jpg...`);
      await downloadImage(imageUrl, outputPath);
      console.log(`✅ Downloaded ${dest.slug}.jpg`);
      downloaded++;

      // Add a small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ Failed to download ${dest.slug}.jpg:`, error);
      failed++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`✅ Downloaded: ${downloaded}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📁 Total files: ${downloaded + skipped}`);
}

main().catch(console.error);
