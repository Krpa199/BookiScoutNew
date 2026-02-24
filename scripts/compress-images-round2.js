/**
 * Round 2 Compression - Aggressive mode
 *
 * Smanjuje SVE slike na max 200KB
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '../public/images/destinations');

// Agresivnije postavke
const COMPRESSION_CONFIG = {
  width: 1600, // Malo manje (još uvijek dovoljno)
  quality: 75, // Niža kvaliteta (još uvijek dobra)
  format: 'jpeg',
};

async function compressImage(filePath) {
  const fileName = path.basename(filePath);
  const stats = fs.statSync(filePath);
  const originalSizeKB = (stats.size / 1024).toFixed(0);

  // Preskoči male slike (<300KB)
  if (stats.size < 300 * 1024) {
    console.log(`⏭️  Skipping ${fileName} (${originalSizeKB} KB - already small)`);
    return;
  }

  console.log(`\n📸 Processing: ${fileName} (${originalSizeKB} KB)`);

  try {
    const outputPath = filePath;

    await sharp(filePath)
      .resize(COMPRESSION_CONFIG.width, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: COMPRESSION_CONFIG.quality, mozjpeg: true })
      .toFile(outputPath + '.tmp');

    fs.renameSync(outputPath + '.tmp', outputPath);

    const newStats = fs.statSync(filePath);
    const newSizeKB = (newStats.size / 1024).toFixed(0);
    const savings = ((1 - newStats.size / stats.size) * 100).toFixed(1);

    console.log(`✅ Compressed: ${originalSizeKB} KB → ${newSizeKB} KB (saved ${savings}%)`);
  } catch (error) {
    console.error(`❌ Failed to compress ${fileName}:`, error.message);
  }
}

async function compressAll() {
  console.log('🚀 Round 2 - Aggressive Compression\n');
  console.log(`📁 Directory: ${IMAGES_DIR}`);
  console.log(`⚙️  Config: ${COMPRESSION_CONFIG.width}px, ${COMPRESSION_CONFIG.quality}% quality\n`);
  console.log('─'.repeat(60));

  const files = fs.readdirSync(IMAGES_DIR)
    .filter(f => f.endsWith('.jpg') || f.endsWith('.png'))
    .map(f => path.join(IMAGES_DIR, f));

  for (const filePath of files) {
    await compressImage(filePath);
  }

  console.log('\n' + '─'.repeat(60));
  console.log('\n🎉 Round 2 compression complete!');

  // Statistika
  const totalSize = files.reduce((sum, f) => {
    return sum + fs.statSync(f).size;
  }, 0);

  console.log(`\n📊 Total size now: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
}

compressAll();
