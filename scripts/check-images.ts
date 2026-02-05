import fs from 'fs';
import path from 'path';

const articlesDir = 'src/content/articles/en';
const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.json'));

console.log('=== PROVJERA SLIKA ===\n');

const continentalDests = ['zagreb', 'plitvice', 'varazdin', 'osijek'];

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(articlesDir, file), 'utf-8'));
  const theme = data.theme;
  const dest = data.destination;
  const imageAlt = (data.imageAlt || '').toLowerCase();
  const slug = data.slug;

  const issues: string[] = [];

  // Continental destinations with sea images
  if (continentalDests.includes(dest)) {
    if (imageAlt.includes('sea') ||
        imageAlt.includes('beach') ||
        imageAlt.includes('adriatic') ||
        imageAlt.includes('coast') ||
        imageAlt.includes('boat') ||
        imageAlt.includes('yacht') ||
        imageAlt.includes('harbor') ||
        imageAlt.includes('marina') ||
        imageAlt.includes('mediterranean')) {
      issues.push('CONTINENTAL but SEA image');
    }
  }

  // Pool theme without pool
  if (theme === 'pool') {
    if (!imageAlt.includes('pool') && !imageAlt.includes('swim')) {
      issues.push('POOL theme no pool');
    }
  }

  // Parking theme without parking
  if (theme === 'parking' || theme === 'parking-difficulty') {
    if (!imageAlt.includes('park') && !imageAlt.includes('car') && !imageAlt.includes('vehicle')) {
      issues.push('PARKING theme no parking');
    }
  }

  // Restaurants without food
  if (theme === 'restaurants' || theme === 'local-food') {
    if (!imageAlt.includes('restaurant') && !imageAlt.includes('food') && !imageAlt.includes('dining') && !imageAlt.includes('cafe') && !imageAlt.includes('dish') && !imageAlt.includes('meal')) {
      issues.push('FOOD theme no food');
    }
  }

  // Wrong city mentioned
  if (dest === 'zagreb') {
    if (imageAlt.includes('dubrovnik') || imageAlt.includes('split') || imageAlt.includes('zadar') || imageAlt.includes('rovinj') || imageAlt.includes('hvar')) {
      issues.push('ZAGREB but other city in alt');
    }
  }
  if (dest === 'dubrovnik') {
    if (imageAlt.includes('zagreb') || imageAlt.includes('split')) {
      issues.push('DUBROVNIK but other city in alt');
    }
  }

  // Transport without transport
  if (theme === 'transport' || theme === 'public-transport-quality') {
    if (!imageAlt.includes('tram') && !imageAlt.includes('bus') && !imageAlt.includes('train') && !imageAlt.includes('transport') && !imageAlt.includes('station')) {
      issues.push('TRANSPORT theme no transport');
    }
  }

  // Airport without airport
  if (theme === 'airport-access') {
    if (!imageAlt.includes('airport') && !imageAlt.includes('plane') && !imageAlt.includes('terminal') && !imageAlt.includes('flight')) {
      issues.push('AIRPORT theme no airport');
    }
  }

  // Ferry without ferry
  if (theme === 'ferry-connections') {
    if (!imageAlt.includes('ferry') && !imageAlt.includes('boat') && !imageAlt.includes('ship') && !imageAlt.includes('port')) {
      issues.push('FERRY theme no ferry');
    }
  }

  if (issues.length > 0) {
    console.log(`❌ ${slug}`);
    console.log(`   Theme: ${theme} | Dest: ${dest}`);
    console.log(`   ImageAlt: ${data.imageAlt?.substring(0, 100) || 'none'}`);
    console.log(`   Issues: ${issues.join(', ')}`);
    console.log('');
  }
}

console.log('=== DONE ===');
