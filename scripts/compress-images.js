/**
 * Compress BookiScout Images
 *
 * Smanjuje slike s 8MB na ~200-300KB
 * Koristi Sharp library za kompresiju
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '../public/images/destinations');
const BACKUP_DIR = path.join(__dirname, '../public/images/destinations-backup');

// Postavke kompresije
const COMPRESSION_CONFIG = {
  width: 1920, // Max širina (dovoljno za full HD)
  quality: 80, // JPEG kvaliteta
  format: 'jpeg', // Output format
};

async function compressImage(filePath) {
  const fileName = path.basename(filePath);
  const stats = fs.statSync(filePath);
  const originalSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log(`\n📸 Processing: ${fileName} (${originalSizeMB} MB)`);

  try {
    const outputPath = filePath;

    // Komprimiraj sliku
    await sharp(filePath)
      .resize(COMPRESSION_CONFIG.width, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: COMPRESSION_CONFIG.quality })
      .toFile(outputPath + '.tmp');

    // Zamijeni originalnu sliku
    fs.renameSync(outputPath + '.tmp', outputPath);

    const newStats = fs.statSync(filePath);
    const newSizeMB = (newStats.size / (1024 * 1024)).toFixed(2);
    const savings = ((1 - newStats.size / stats.size) * 100).toFixed(1);

    console.log(`✅ Compressed: ${originalSizeMB} MB → ${newSizeMB} MB (saved ${savings}%)`);
  } catch (error) {
    console.error(`❌ Failed to compress ${fileName}:`, error.message);
  }
}

async function compressAll() {
  console.log('🚀 Starting image compression...\n');
  console.log(`📁 Directory: ${IMAGES_DIR}`);
  console.log(`⚙️  Config: ${COMPRESSION_CONFIG.width}px, ${COMPRESSION_CONFIG.quality}% quality\n`);

  // Kreiraj backup folder
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`📦 Created backup directory: ${BACKUP_DIR}\n`);
  }

  // Backup svih slika
  const files = fs.readdirSync(IMAGES_DIR).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));

  console.log(`💾 Backing up ${files.length} images...\n`);
  files.forEach(file => {
    const src = path.join(IMAGES_DIR, file);
    const dest = path.join(BACKUP_DIR, file);
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(src, dest);
    }
  });

  console.log('✅ Backup complete!\n');
  console.log('─'.repeat(60));

  // Komprimiraj sve slike
  for (const file of files) {
    const filePath = path.join(IMAGES_DIR, file);
    await compressImage(filePath);
  }

  console.log('\n' + '─'.repeat(60));
  console.log('\n🎉 Image compression complete!');
  console.log(`💾 Original images backed up to: ${BACKUP_DIR}`);

  // Izračunaj ukupnu uštedu
  const totalOriginal = fs.readdirSync(BACKUP_DIR)
    .reduce((sum, f) => sum + fs.statSync(path.join(BACKUP_DIR, f)).size, 0);

  const totalCompressed = fs.readdirSync(IMAGES_DIR)
    .reduce((sum, f) => sum + fs.statSync(path.join(IMAGES_DIR, f)).size, 0);

  const totalSavings = ((1 - totalCompressed / totalOriginal) * 100).toFixed(1);

  console.log(`\n📊 Total savings: ${totalSavings}%`);
  console.log(`   Before: ${(totalOriginal / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`   After:  ${(totalCompressed / (1024 * 1024)).toFixed(2)} MB`);
}

compressAll();
