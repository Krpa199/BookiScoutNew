/**
 * Pexels API Service for Article Images
 *
 * Fetches relevant images based on article theme.
 * Prioritizes Croatia-related images, falls back to generic travel images.
 * Rate limit: 200 requests/hour
 *
 * Includes AI image validation using Gemini Vision to ensure relevance.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';

// Dedicated Gemini API key for image validation (separate quota from article generation)
const GEMINI_API_KEY_IMAGE = process.env.GEMINI_API_KEY_IMAGE || '';

// Enable/disable AI validation (can be toggled for testing)
const ENABLE_AI_VALIDATION = true;
const MAX_VALIDATION_ATTEMPTS = 5; // Try up to 5 images before giving up

interface PexelsPhoto {
  id: number;
  url: string;
  photographer: string;
  photographer_url: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
  };
  alt: string;
}

interface PexelsResponse {
  photos: PexelsPhoto[];
  total_results: number;
}

// Theme descriptions for AI validation
const THEME_DESCRIPTIONS: Record<string, string> = {
  // Traveler Types
  'solo-travel': 'solo traveler, backpacker, single person traveling',
  'seniors': 'elderly people, senior tourists, retired couple traveling',
  'digital-nomads': 'person working on laptop, remote work, cafe with computer',
  'lgbt-friendly': 'LGBT pride, rainbow flag, inclusive travel',
  'families-with-toddlers': 'family with small children, toddlers, young kids on vacation',
  'families-with-teens': 'family with teenagers, teens traveling',
  'first-time-visitors': 'tourists sightseeing, first time visitors, tour group',
  'couples': 'romantic couple, two people in love, honeymoon',

  // Practical Blockers
  'car-vs-no-car': 'car driving, road trip, coastal road',
  'parking-difficulty': 'parking lot, parked cars, street parking',
  'walkability': 'walking in old town, pedestrian street, cobblestone',
  'stroller-friendly': 'family with stroller, baby carriage, parents with young children',
  'wheelchair-access': 'wheelchair accessible, disability access, accessible tourism',
  'public-transport-quality': 'bus, public transport, city transit',
  'ferry-connections': 'ferry boat, passenger ship, boat terminal',
  'airport-access': 'airport, airplane, airport terminal',
  'wifi-quality': 'laptop in cafe, wifi, working with computer',
  'mobile-coverage': 'smartphone, mobile phone, tourist using phone',

  // Seasonality
  'off-season': 'empty streets, quiet town, winter tourism, low season',
  'shoulder-season': 'spring flowers, autumn colors, pleasant weather',
  'peak-season': 'crowded streets, many tourists, summer crowds, busy',
  'weather-by-month': 'sunny weather, blue sky, good weather',
  'crowds-by-month': 'crowded tourist area, many people, busy streets',
  'best-time-to-visit': 'perfect weather, beautiful day, ideal conditions',

  // Comparisons - Croatian cities
  'vs-dubrovnik': 'Dubrovnik city walls, old town Dubrovnik, Croatian coast',
  'vs-split': 'Split Croatia, Diocletian Palace, Riva promenade',
  'vs-zadar': 'Zadar Croatia, sea organ, Zadar old town',
  'vs-istria': 'Istria Croatia, Rovinj, Pula Arena, hilltop village',
  'vs-zagreb': 'Zagreb Croatia, cathedral, Ban Jelacic square',
  'coast-vs-inland': 'Croatian coast, Adriatic sea, Plitvice lakes',

  // Legacy Themes
  'beach': 'beach, sea, swimming, sand or pebbles',
  'things-to-do': 'tourist activities, sightseeing, attractions',
  'day-trips': 'excursion, day trip, tour bus, boat trip',
  'safety': 'safe streets, peaceful town, friendly atmosphere',
  'nightlife': 'nightclub, bar, evening entertainment, nightlife',
  'restaurants': 'restaurant, outdoor dining, food, terrace',
  'budget': 'budget travel, backpacker, affordable',
  'luxury': 'luxury hotel, premium resort, five star',
  'pet-friendly': 'dog on beach, pet travel, dog friendly',
  'hidden-gems': 'secret beach, hidden cove, undiscovered place',
  'local-food': 'local cuisine, traditional food, seafood platter',
  'family': 'family vacation, parents with children',
  'apartments': 'apartment, vacation rental, accommodation',
  'pool': 'swimming pool, hotel pool, infinity pool',
  'parking': 'parking lot, car parked',
  'weather': 'sunny weather, blue sky',
  'prices': 'money, budget, euro',
  'transport': 'bus, ferry, transport',
};

// Theme to search query mapping
// Queries are specific to Croatia/Mediterranean/Europe to get relevant images
const THEME_SEARCH_QUERIES: Record<string, string[]> = {
  // Traveler Types
  'solo-travel': ['woman backpacker croatia', 'solo traveler old town europe', 'backpacker adriatic coast'],
  'seniors': ['senior couple croatia vacation', 'elderly tourists dubrovnik', 'retired couple mediterranean'],
  'digital-nomads': ['laptop cafe croatia', 'digital nomad adriatic', 'remote work seaside europe'],
  'lgbt-friendly': ['pride parade croatia', 'lgbt couple europe vacation', 'rainbow flag travel'],
  'families-with-toddlers': ['family toddler croatia beach', 'parents children adriatic', 'family vacation mediterranean sea'],
  'families-with-teens': ['family teenagers croatia', 'teen adventure adriatic', 'family sightseeing dubrovnik'],
  'first-time-visitors': ['tourists dubrovnik old town', 'sightseeing croatia', 'tourist group europe'],
  'couples': ['romantic couple croatia', 'couple sunset adriatic', 'honeymoon mediterranean coast'],

  // Practical Blockers
  'car-vs-no-car': ['driving croatia coast', 'road trip adriatic', 'scenic coastal road europe'],
  'parking-difficulty': ['parking dubrovnik', 'parking croatia old town', 'car parked mediterranean'],
  'walkability': ['walking dubrovnik streets', 'cobblestone street croatia', 'pedestrians old town europe'],
  'stroller-friendly': ['family stroller croatia', 'parents baby carriage europe', 'stroller cobblestone street'],
  'wheelchair-access': ['wheelchair accessible europe', 'accessible ramp croatia', 'wheelchair tourism'],
  'public-transport-quality': ['bus croatia city', 'public transport dubrovnik', 'city bus adriatic'],
  'ferry-connections': ['ferry croatia adriatic', 'jadrolinija ferry', 'passenger boat croatia islands'],
  'airport-access': ['airport croatia', 'dubrovnik airport', 'airplane adriatic coast'],
  'wifi-quality': ['wifi cafe croatia', 'laptop coffee dubrovnik', 'internet cafe europe'],
  'mobile-coverage': ['smartphone croatia travel', 'tourist phone europe', 'mobile phone adriatic'],

  // Seasonality
  'off-season': ['empty dubrovnik winter', 'quiet croatia beach', 'low season adriatic'],
  'shoulder-season': ['spring croatia flowers', 'autumn dubrovnik', 'pleasant weather adriatic'],
  'peak-season': ['crowded dubrovnik summer', 'tourists summer croatia', 'busy old town europe'],
  'weather-by-month': ['sunny croatia weather', 'blue sky adriatic', 'mediterranean sunshine'],
  'crowds-by-month': ['crowded dubrovnik streets', 'tourists croatia summer', 'busy european old town'],
  'best-time-to-visit': ['perfect weather croatia', 'sunny day adriatic', 'beautiful croatia coast'],

  // Comparisons - specific Croatian cities
  'vs-dubrovnik': ['dubrovnik croatia walls', 'dubrovnik old town aerial', 'dubrovnik city walls sea'],
  'vs-split': ['split croatia diocletian palace', 'split riva promenade', 'split old town'],
  'vs-zadar': ['zadar croatia sunset', 'zadar sea organ', 'zadar old town'],
  'vs-istria': ['istria croatia rovinj', 'istrian hilltop village', 'pula arena croatia'],
  'vs-zagreb': ['zagreb croatia cathedral', 'zagreb ban jelacic square', 'zagreb upper town'],
  'coast-vs-inland': ['croatia coast mountains', 'adriatic sea landscape', 'plitvice lakes croatia'],

  // Legacy Themes
  'beach': ['beach croatia adriatic', 'turquoise water croatia', 'pebble beach dubrovnik'],
  'things-to-do': ['tourists dubrovnik activities', 'sightseeing croatia', 'kayaking adriatic'],
  'day-trips': ['day trip croatia islands', 'excursion boat adriatic', 'tour bus dubrovnik'],
  'safety': ['safe croatia streets', 'peaceful dubrovnik', 'friendly croatia town'],
  'nightlife': ['nightlife croatia', 'bar dubrovnik', 'hvar nightclub'],
  'restaurants': ['restaurant croatia terrace', 'seafood dubrovnik', 'outdoor dining adriatic'],
  'budget': ['backpacker croatia hostel', 'budget travel adriatic', 'cheap accommodation europe'],
  'luxury': ['luxury hotel croatia', 'five star dubrovnik', 'premium resort adriatic'],
  'pet-friendly': ['dog beach croatia', 'pet friendly adriatic', 'dog vacation croatia'],
  'hidden-gems': ['secret beach croatia', 'hidden cove adriatic', 'undiscovered croatia'],
  'local-food': ['croatian food grilled fish', 'peka croatia traditional', 'seafood adriatic platter'],
  'family': ['family vacation croatia beach', 'parents children adriatic', 'family croatia holiday'],
  'apartments': ['apartment croatia sea view', 'vacation rental dubrovnik', 'holiday apartment adriatic'],
  'pool': ['pool hotel croatia', 'infinity pool adriatic', 'resort pool dubrovnik'],
  'parking': ['parking croatia', 'car parked dubrovnik', 'parking lot adriatic'],
  'weather': ['sunny croatia', 'blue sky adriatic', 'beautiful weather dubrovnik'],
  'prices': ['euro croatia', 'kuna money', 'budget vacation europe'],
  'transport': ['bus croatia', 'ferry adriatic', 'transport dubrovnik'],
};

// Fallback queries if theme not found
const FALLBACK_QUERIES = ['croatia adriatic', 'mediterranean coast travel', 'european vacation'];

/**
 * Get search queries for a theme
 */
function getSearchQueries(theme: string): string[] {
  return THEME_SEARCH_QUERIES[theme] || FALLBACK_QUERIES;
}

/**
 * Get theme description for AI validation
 */
function getThemeDescription(theme: string): string {
  return THEME_DESCRIPTIONS[theme] || theme.replace(/-/g, ' ');
}

/**
 * Validate image using Gemini Vision API
 * Returns true if image is appropriate for the theme
 */
async function validateImageWithAI(imageUrl: string, theme: string): Promise<{ valid: boolean; reason: string }> {
  if (!GEMINI_API_KEY_IMAGE) {
    console.log('    ⚠️ GEMINI_API_KEY_IMAGE not set, skipping AI validation');
    return { valid: true, reason: 'No API key for validation' };
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY_IMAGE);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Fetch the image as base64
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    const themeDesc = getThemeDescription(theme);

    const prompt = `You are an image validator for a Croatia travel website. Croatia is a European country with Catholic/Christian heritage.

Analyze this image and determine if it's appropriate for an article about: "${themeDesc}"

STRICT REQUIREMENTS - The image must:
1. Look European/Mediterranean (architecture, landscape, style)
2. Feature people who appear European/Caucasian (if people are visible)
3. NOT contain any Islamic/Middle Eastern elements (mosques, minarets, Arabic text, hijabs)
4. NOT contain Asian, African, or other non-European architectural styles
5. Match the article theme reasonably well
6. Be professional and appropriate

Respond with ONLY a JSON object (no markdown):
{"valid": true/false, "reason": "brief explanation"}

REJECT images with:
- Mosques, minarets, or Islamic architecture
- Arabic/Middle Eastern cityscapes or buildings
- Asian temples, pagodas, or Asian architecture
- People in religious Islamic clothing (hijab, niqab)
- African architecture or landscapes
- Any non-European cultural elements

ACCEPT images with:
- European old towns, churches, cathedrals
- Mediterranean coastlines, beaches
- European-looking people (tourists, families, couples)
- Croatian/European architecture and landscapes
- Generic travel scenes that look European`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data: base64Image,
        },
      },
    ]);

    const responseText = result.response.text().trim();

    // Parse JSON response
    let cleanText = responseText;
    if (cleanText.startsWith('```json')) cleanText = cleanText.slice(7);
    if (cleanText.startsWith('```')) cleanText = cleanText.slice(3);
    if (cleanText.endsWith('```')) cleanText = cleanText.slice(0, -3);

    const validation = JSON.parse(cleanText.trim());
    return { valid: validation.valid, reason: validation.reason || 'Unknown' };
  } catch (error) {
    console.log(`    ⚠️ AI validation error: ${(error as Error).message}`);
    // On error, accept the image (fail open)
    return { valid: true, reason: 'Validation error, accepting image' };
  }
}

/**
 * Fetch multiple images from Pexels and return all candidates
 */
async function fetchPexelsImages(theme: string): Promise<PexelsPhoto[]> {
  if (!PEXELS_API_KEY) {
    console.warn('⚠️ PEXELS_API_KEY not set, skipping image fetch');
    return [];
  }

  const queries = getSearchQueries(theme);
  const allPhotos: PexelsPhoto[] = [];

  // Fetch from multiple queries to have more candidates
  for (const query of queries) {
    try {
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape`,
        {
          headers: {
            'Authorization': PEXELS_API_KEY,
          },
        }
      );

      if (!response.ok) {
        console.error(`Pexels API error: ${response.status}`);
        continue;
      }

      const data: PexelsResponse = await response.json();

      if (data.photos && data.photos.length > 0) {
        allPhotos.push(...data.photos);
      }
    } catch (error) {
      console.error(`Error fetching from Pexels for query "${query}":`, error);
    }
  }

  // Shuffle to get variety
  return allPhotos.sort(() => Math.random() - 0.5);
}

/**
 * Fetch image from Pexels API with AI validation
 */
export async function fetchPexelsImage(theme: string): Promise<{
  url: string;
  photographer: string;
  photographerUrl: string;
  alt: string;
} | null> {
  const photos = await fetchPexelsImages(theme);

  if (photos.length === 0) {
    console.warn(`No Pexels images found for theme: ${theme}`);
    return null;
  }

  // If AI validation is disabled, just return random image
  if (!ENABLE_AI_VALIDATION || !GEMINI_API_KEY_IMAGE) {
    const photo = photos[0];
    return {
      url: photo.src.large,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      alt: photo.alt || `${theme.replace(/-/g, ' ')} travel photo`,
    };
  }

  // Try images until we find a valid one
  const maxAttempts = Math.min(MAX_VALIDATION_ATTEMPTS, photos.length);

  for (let i = 0; i < maxAttempts; i++) {
    const photo = photos[i];
    console.log(`    🔍 Validating image ${i + 1}/${maxAttempts}...`);

    const validation = await validateImageWithAI(photo.src.large, theme);

    if (validation.valid) {
      console.log(`    ✅ Image approved: ${validation.reason}`);
      return {
        url: photo.src.large,
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url,
        alt: photo.alt || `${theme.replace(/-/g, ' ')} travel photo`,
      };
    } else {
      console.log(`    ❌ Image rejected: ${validation.reason}`);
    }

    // Small delay between validation attempts
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // If no valid image found, return the first one anyway (better than nothing)
  console.log(`    ⚠️ No validated image found, using first result`);
  const fallbackPhoto = photos[0];
  return {
    url: fallbackPhoto.src.large,
    photographer: fallbackPhoto.photographer,
    photographerUrl: fallbackPhoto.photographer_url,
    alt: fallbackPhoto.alt || `${theme.replace(/-/g, ' ')} travel photo`,
  };
}

/**
 * Get image for article (with AI validation)
 */
export async function getArticleImage(theme: string): Promise<{
  imageUrl: string;
  imageAlt: string;
  imageCredit: string;
  imageCreditUrl: string;
} | null> {
  const image = await fetchPexelsImage(theme);

  if (!image) {
    return null;
  }

  return {
    imageUrl: image.url,
    imageAlt: image.alt,
    imageCredit: image.photographer,
    imageCreditUrl: image.photographerUrl,
  };
}
