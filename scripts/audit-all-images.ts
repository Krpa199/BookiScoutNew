/**
 * AUDIT ALL ARTICLE IMAGES WITH AI
 *
 * This script goes through all articles and validates their images using Gemini Vision.
 * It will report any images that don't match the article theme/destination.
 *
 * Usage: npx tsx scripts/audit-all-images.ts
 *
 * Options:
 *   --fix    Also fix the bad images (find new ones)
 *   --limit=N  Only check N articles (for testing)
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config({ path: '.env.local' });

// ============================================================================
// Configuration
// ============================================================================

const ARTICLES_DIR = 'src/content/articles/en';
const FIX_MODE = process.argv.includes('--fix');
const LIMIT = parseInt(process.argv.find(a => a.startsWith('--limit='))?.split('=')[1] || '0') || Infinity;

// Continental destinations (no sea images!)
const CONTINENTAL_DESTINATIONS = [
  'zagreb', 'varazdin', 'osijek', 'karlovac', 'samobor', 'plitvice',
  'slavonski-brod', 'vukovar', 'sisak', 'cakovec', 'koprivnica', 'bjelovar'
];

// Theme requirements for validation
const THEME_REQUIREMENTS: Record<string, string> = {
  'parking': 'must show parking lot, garage, or parked cars',
  'parking-difficulty': 'must show parking lot, garage, or parked cars',
  'pool': 'must show swimming pool',
  'beach': 'must show beach or waterfront',
  'restaurants': 'must show restaurant, food, or dining scene',
  'local-food': 'must show food, dishes, or cuisine',
  'transport': 'must show tram, bus, train, or public transport',
  'ferry-connections': 'must show ferry, boat, or port',
  'airport-access': 'must show airport, plane, or terminal',
  'nightlife': 'must show evening/night scene, bar, or club',
  'couples': 'must show romantic couple or romantic setting',
  'solo-travel': 'must show solo traveler or independent exploration',
  'families-with-toddlers': 'must show family with small children',
  'families-with-teens': 'must show family with teenagers',
  'seniors': 'must show elderly people or senior-friendly activity',
  'digital-nomads': 'must show laptop, coworking, or remote work scene',
  'crowds-by-month': 'must show crowds of tourists or busy streets',
  'peak-season': 'must show busy tourist scene',
  'off-season': 'must show quiet, empty streets or winter scene',
  'luxury': 'must show luxury hotel, spa, or upscale setting',
  'budget': 'must show budget-friendly accommodation or hostel',
  'pet-friendly': 'must show pets (dogs/cats) or pet-friendly setting',
  'lgbt-friendly': 'must show pride flag, rainbow, or inclusive venue',
  'wheelchair-access': 'must show accessibility features or wheelchair',
  'stroller-friendly': 'must show stroller, baby carriage, or family path',
};

// ============================================================================
// AI Validation
// ============================================================================

function isCoastalDestination(destination: string): boolean {
  return !CONTINENTAL_DESTINATIONS.includes(destination.toLowerCase());
}

interface ValidationResult {
  valid: boolean;
  reason: string;
}

async function validateImageWithAI(
  imageUrl: string,
  theme: string,
  destination: string
): Promise<ValidationResult> {
  const apiKey = process.env.GEMINI_API_KEY_IMAGE || process.env.GEMINI_API_KEY_1;
  if (!apiKey) {
    return { valid: false, reason: 'No API key' };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Fetch image as base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return { valid: false, reason: `Image fetch failed: ${imageResponse.status}` };
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    const themeRequirement = THEME_REQUIREMENTS[theme] || `should relate to ${theme.replace(/-/g, ' ')}`;
    const isCoastal = isCoastalDestination(destination);

    // Build location rules
    let locationRules: string;
    if (!isCoastal) {
      locationRules = `This is for ${destination.toUpperCase()} - a CONTINENTAL/INLAND destination.
- NO sea, NO beach, NO coastal scenes, NO boats, NO yachts
- Should show: city architecture, parks, lakes, mountains, urban scenes`;
    } else {
      locationRules = `This is for ${destination.toUpperCase()} - a COASTAL destination.
- Sea/beach/coastal imagery is acceptable`;
    }

    const prompt = `You are validating an image for a travel article about "${theme.replace(/-/g, ' ')}" in ${destination}, Croatia.

THEME REQUIREMENT: The image ${themeRequirement}

LOCATION RULES:
${locationRules}

VALIDATION RULES:
1. Does the image match the THEME? (most important)
2. Does the image match the LOCATION type?
3. Does the image look European/Mediterranean?
4. Is it high quality (no blur, no watermarks)?

AUTOMATIC REJECTION:
- Theme mismatch (e.g., "couples" theme shows animal/meerkat) → REJECT
- Continental destination showing sea/beach → REJECT
- Non-European appearance → REJECT
- Random/generic image unrelated to theme → REJECT

Respond ONLY with JSON:
{"valid": true/false, "reason": "brief explanation"}`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType, data: base64Image } },
    ]);

    const responseText = result.response.text().trim();
    let cleanText = responseText;
    if (cleanText.startsWith('```json')) cleanText = cleanText.slice(7);
    if (cleanText.startsWith('```')) cleanText = cleanText.slice(3);
    if (cleanText.endsWith('```')) cleanText = cleanText.slice(0, -3);

    const validation = JSON.parse(cleanText.trim());
    return { valid: validation.valid === true, reason: validation.reason || 'Unknown' };
  } catch (error) {
    return { valid: false, reason: `Error: ${(error as Error).message}` };
  }
}

// ============================================================================
// Main
// ============================================================================

interface ArticleIssue {
  slug: string;
  theme: string;
  destination: string;
  imageUrl: string;
  imageAlt: string;
  reason: string;
}

async function main() {
  console.log('🔍 AUDITING ALL ARTICLE IMAGES WITH AI\n');
  console.log(`Mode: ${FIX_MODE ? '🔧 FIX (will replace bad images)' : '📋 AUDIT ONLY'}`);
  console.log(`Limit: ${LIMIT === Infinity ? 'All articles' : `First ${LIMIT} articles`}\n`);

  const files = fs.readdirSync(ARTICLES_DIR)
    .filter(f => f.endsWith('.json'))
    .slice(0, LIMIT);

  console.log(`Found ${files.length} articles to check\n`);

  const issues: ArticleIssue[] = [];
  let checked = 0;
  let valid = 0;
  let invalid = 0;
  let skipped = 0;

  for (const file of files) {
    const filePath = path.join(ARTICLES_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    const slug = data.slug;
    const theme = data.theme;
    const destination = data.destination;
    const imageUrl = data.imageUrl;
    const imageAlt = data.imageAlt || '';

    checked++;
    process.stdout.write(`[${checked}/${files.length}] ${slug}... `);

    if (!imageUrl) {
      console.log('⏭️  No image');
      skipped++;
      continue;
    }

    const result = await validateImageWithAI(imageUrl, theme, destination);

    if (result.valid) {
      console.log(`✅ OK`);
      valid++;
    } else {
      console.log(`❌ INVALID: ${result.reason}`);
      invalid++;
      issues.push({
        slug,
        theme,
        destination,
        imageUrl,
        imageAlt,
        reason: result.reason,
      });
    }

    // Rate limiting - 1 second between requests
    await new Promise(r => setTimeout(r, 1000));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total checked: ${checked}`);
  console.log(`✅ Valid: ${valid}`);
  console.log(`❌ Invalid: ${invalid}`);
  console.log(`⏭️  Skipped: ${skipped}`);

  if (issues.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('ISSUES FOUND');
    console.log('='.repeat(60));

    for (const issue of issues) {
      console.log(`\n❌ ${issue.slug}`);
      console.log(`   Theme: ${issue.theme}`);
      console.log(`   Destination: ${issue.destination}`);
      console.log(`   ImageAlt: ${issue.imageAlt.substring(0, 80)}`);
      console.log(`   Reason: ${issue.reason}`);
    }

    // Save issues to file for later fixing
    const issuesFile = 'scripts/image-audit-issues.json';
    fs.writeFileSync(issuesFile, JSON.stringify(issues, null, 2));
    console.log(`\n📄 Issues saved to ${issuesFile}`);

    if (FIX_MODE) {
      console.log('\n🔧 FIX MODE: Would fix these images (not implemented yet)');
      // TODO: Implement auto-fix using image-service.ts
    }
  } else {
    console.log('\n🎉 All images are valid!');
  }
}

main().catch(console.error);
