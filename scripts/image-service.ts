/**
 * Multi-Provider Image Service for Article Images
 *
 * Searches across Pexels, Unsplash, and Pixabay to find the best image.
 * Uses AI validation to ensure images match the article theme and destination.
 *
 * Search Strategy:
 * 1. First search for specific destination + theme (e.g., "Dubrovnik crowds")
 * 2. If not enough results, search for generic theme (e.g., "crowded old town europe")
 * 3. AI validates that image actually matches the theme
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// ============================================================================
// API Keys (read lazily for dotenv compatibility)
// ============================================================================

function getPexelsApiKey(): string {
  return process.env.PEXELS_API_KEY || '';
}

function getUnsplashApiKey(): string {
  return process.env.UNSPLASH_API_KEY || '';
}

function getPixabayApiKey(): string {
  return process.env.PIXABAY_API_KEY || '';
}

function getGeminiImageApiKey(): string {
  return process.env.GEMINI_API_KEY_IMAGE || '';
}

// ============================================================================
// Configuration
// ============================================================================

const ENABLE_AI_VALIDATION = true;
const MAX_VALIDATION_ATTEMPTS = 8; // 8 attempts per article, 50 articles × 8 = 400 (under 1500 limit)
const MAX_DAILY_VALIDATIONS = 1400; // Stay under 1500 free tier limit (buffer for safety)

// Track daily validation count
let dailyValidationCount = 0;
let lastResetTime = 0;

/**
 * Check if we can validate - respects Google's daily quota reset at 9:00 UTC
 * Google resets quotas at midnight Pacific Time (8:00 UTC winter / 7:00 UTC summer)
 * We use 8:00 UTC to be safe
 */
function canValidate(): boolean {
  const now = Date.now();
  const resetHourUTC = 8; // Google quota resets around 8:00 UTC

  // Calculate last reset time (8:00 UTC today or yesterday)
  const nowDate = new Date(now);
  const todayReset = new Date(Date.UTC(
    nowDate.getUTCFullYear(),
    nowDate.getUTCMonth(),
    nowDate.getUTCDate(),
    resetHourUTC, 0, 0, 0
  )).getTime();

  const currentResetTime = now >= todayReset ? todayReset : todayReset - 24 * 60 * 60 * 1000;

  // Reset counter if we've passed a new reset time
  if (currentResetTime > lastResetTime) {
    dailyValidationCount = 0;
    lastResetTime = currentResetTime;
    console.log(`  🔄 Validation counter reset (Google quota reset at 8:00 UTC)`);
  }

  return dailyValidationCount < MAX_DAILY_VALIDATIONS;
}

function incrementValidationCount(): void {
  dailyValidationCount++;
}

function getRemainingValidations(): number {
  return MAX_DAILY_VALIDATIONS - dailyValidationCount;
}

// ============================================================================
// Types
// ============================================================================

interface ImageCandidate {
  url: string;
  photographer: string;
  photographerUrl: string;
  alt: string;
  source: 'pexels' | 'unsplash' | 'pixabay';
}

// ============================================================================
// Theme to Search Query Mapping
// ============================================================================

// What the theme ACTUALLY means (for AI validation)
const THEME_REQUIREMENTS: Record<string, string> = {
  // Seasonality - STRICT requirements
  'crowds-by-month': 'MUST show actual crowds of tourists, many people in streets or attractions',
  'peak-season': 'MUST show crowded streets with many tourists, summer crowds, busy areas',
  'off-season': 'MUST show empty or nearly empty streets, quiet atmosphere, few people',
  'shoulder-season': 'should show pleasant weather, spring flowers or autumn colors',
  'best-time-to-visit': 'should show beautiful weather, sunny day, pleasant conditions',
  'weather-by-month': 'should show weather conditions, sunny sky, clouds',

  // Traveler Types
  'solo-travel': 'should show a single person traveling alone, backpacker',
  'seniors': 'should show elderly/senior tourists, retired couple',
  'digital-nomads': 'MUST show person working on laptop in cafe or with sea view',
  'families-with-toddlers': 'should show family with small children, toddlers',
  'families-with-teens': 'should show family with teenagers',
  'first-time-visitors': 'should show tourists sightseeing, tour group',
  'couples': 'should show romantic couple, two people together',
  'lgbt-friendly': 'should show pride flag or LGBT-related imagery',

  // Practical
  'car-vs-no-car': 'should show car, road, or driving scene',
  'parking-difficulty': 'MUST show parking lot, parked cars, or street parking',
  'walkability': 'should show pedestrian street, people walking, cobblestone',
  'stroller-friendly': 'should show family with stroller or baby carriage',
  'wheelchair-access': 'should show wheelchair or accessibility features',
  'public-transport-quality': 'should show bus, tram, or public transport',
  'ferry-connections': 'MUST show ferry boat or passenger ship',
  'airport-access': 'should show airport or airplane',
  'wifi-quality': 'should show wifi symbol, laptop, cafe, or any internet/connectivity related image',
  'mobile-coverage': 'should show smartphone, phone, mobile device, or signal/network imagery',

  // Activities
  'beach': 'should show beach, sea, sand or pebbles',
  'things-to-do': 'should show tourist activities, sightseeing',
  'day-trips': 'should show excursion, boat trip, or tour',
  'nightlife': 'MUST show bar, nightclub, or evening entertainment scene',
  'restaurants': 'should show restaurant, outdoor dining, food',
  'local-food': 'should show local cuisine, traditional food, seafood',
  'hidden-gems': 'should show scenic view, secret beach, or beautiful spot',

  // Accommodation
  'apartments': 'should show apartment, vacation rental, balcony view',
  'pool': 'should show swimming pool',
  'luxury': 'should show luxury hotel or premium resort',
  'budget': 'should show hostel, backpacker accommodation',
  'pet-friendly': 'should show dog or pet in travel context',

  // Comparisons
  'vs-dubrovnik': 'should show Dubrovnik city walls or old town',
  'vs-split': 'should show Split, Diocletian Palace, or Riva',
  'vs-zadar': 'should show Zadar old town or sea organ',
  'vs-istria': 'should show Istrian landscape, Rovinj, or Pula',
  'vs-zagreb': 'should show Zagreb cathedral or city center',
  'coast-vs-inland': 'should show contrast of coast and inland',

  // Other
  'safety': 'should show peaceful street or friendly atmosphere',
  'parking': 'should show parking lot or parked cars',
  'weather': 'should show sunny weather, blue sky',
  'prices': 'can show money, budget concept, or generic travel',
  'transport': 'should show bus, ferry, or transportation',
  'family': 'should show family with children on vacation',
};

// Search queries for each theme - specific to Croatia/Europe
function getSearchQueries(theme: string, destination?: string): string[] {
  const queries: string[] = [];
  const dest = destination || 'croatia';
  const destCapitalized = dest.charAt(0).toUpperCase() + dest.slice(1);
  const isCoastal = isCoastalDestination(destination);

  // For continental destinations, use different queries
  if (!isCoastal) {
    // Continental-specific queries (no sea/beach!)
    const continentalQueries: Record<string, string[]> = {
      'crowds-by-month': [
        `crowded ${destCapitalized} tourists`,
        'crowded european city square tourists',
        'busy old town central europe',
        'tourists crowd prague vienna',
      ],
      'peak-season': [
        `${destCapitalized} summer tourists`,
        'busy european city summer',
        'summer crowd central europe city',
      ],
      'off-season': [
        `empty ${destCapitalized} winter`,
        'quiet european city winter',
        'empty streets central europe snow',
      ],
      'shoulder-season': [
        `${destCapitalized} spring flowers`,
        'spring central europe flowers',
        'autumn european city park',
      ],
      'best-time-to-visit': [
        `beautiful ${destCapitalized} sunny`,
        'sunny european city',
        'perfect weather central europe',
      ],
      'weather-by-month': [
        `sunny ${destCapitalized}`,
        'blue sky european city',
        'sunny central europe',
      ],
      'solo-travel': [
        'woman backpacker european city',
        'solo traveler old town europe',
        'backpacker central europe',
      ],
      'seniors': [
        'senior couple european city vacation',
        'elderly tourists european capital',
        'retired couple europe travel',
      ],
      'digital-nomads': [
        'laptop cafe city',
        'digital nomad working laptop cafe',
        'remote work cafe laptop europe',
        'freelancer laptop coffee urban',
      ],
      'families-with-toddlers': [
        'family toddler european city',
        'parents children park vacation',
        'family small kids playground',
      ],
      'families-with-teens': [
        'family teenagers vacation europe city',
        'teens sightseeing european capital',
        'family adventure city',
      ],
      'first-time-visitors': [
        `tourists ${destCapitalized} sightseeing`,
        'tourists european city square',
        'sightseeing tour group europe',
      ],
      'couples': [
        'romantic couple european city',
        'couple europe vacation city',
        'romantic dinner europe',
      ],
      'beach': [
        // For continental destinations, beach theme should show lakes/rivers
        `${destCapitalized} lake swimming`,
        'lake beach central europe',
        'river swimming europe',
        'plitvice lakes croatia',
      ],
      'things-to-do': [
        `${destCapitalized} attractions`,
        'european city sightseeing',
        'central europe tourism',
      ],
      'restaurants': [
        'restaurant terrace european city',
        'outdoor dining central europe',
        'traditional restaurant croatia',
      ],
      'local-food': [
        'croatian food traditional',
        'central european cuisine',
        'traditional food europe',
      ],
      'hidden-gems': [
        'hidden gem european city',
        'secret spot central europe',
        'scenic view city europe',
      ],
      'apartments': [
        'apartment city view europe',
        'vacation rental urban',
        'holiday apartment city',
      ],
      'nightlife': [
        'bar nightlife european city',
        'nightclub europe',
        'evening entertainment city',
      ],
      'transport': [
        'tram european city',
        'public transport europe',
        'city bus central europe',
      ],
      'safety': [
        'peaceful european city street',
        'safe streets europe',
        'friendly atmosphere city',
      ],
    };

    if (continentalQueries[theme]) {
      queries.push(...continentalQueries[theme]);
    }

    // Add destination-specific query first
    const baseTheme = theme.replace(/-/g, ' ');
    queries.unshift(`${destCapitalized} ${baseTheme}`);

    // Fallback for continental
    if (queries.length === 0) {
      queries.push(`${destCapitalized} city`, 'european city travel', 'central europe tourism');
    }

    return queries;
  }

  // COASTAL destinations - original queries
  const themeQueries: Record<string, string[]> = {
    'crowds-by-month': [
      `crowded ${destCapitalized} tourists`,
      'crowded dubrovnik old town tourists',
      'crowded european old town summer',
      'tourists crowd mediterranean city',
      'busy old town europe tourists',
    ],
    'peak-season': [
      `${destCapitalized} summer tourists crowded`,
      'crowded dubrovnik summer',
      'busy mediterranean beach tourists',
      'summer crowd european city',
    ],
    'off-season': [
      `empty ${destCapitalized} winter`,
      'empty dubrovnik streets winter',
      'quiet european old town',
      'empty mediterranean beach low season',
    ],
    'shoulder-season': [
      `${destCapitalized} spring flowers`,
      'spring croatia flowers bloom',
      'autumn dubrovnik pleasant weather',
    ],
    'best-time-to-visit': [
      `beautiful ${destCapitalized} sunny`,
      'perfect weather croatia coast',
      'sunny adriatic sea',
    ],
    'weather-by-month': [
      `sunny ${destCapitalized}`,
      'blue sky adriatic croatia',
      'mediterranean sunshine',
    ],
    'solo-travel': [
      'woman backpacker croatia',
      'solo traveler old town europe',
      'backpacker adriatic coast',
    ],
    'seniors': [
      'senior couple mediterranean vacation',
      'elderly tourists dubrovnik',
      'retired couple europe travel',
    ],
    'digital-nomads': [
      'laptop cafe sea view',
      'digital nomad working laptop coast',
      'remote work cafe laptop europe',
      'freelancer laptop coffee seaside',
    ],
    'families-with-toddlers': [
      'family toddler beach mediterranean',
      'parents children adriatic vacation',
      'family small kids beach',
    ],
    'families-with-teens': [
      'family teenagers vacation europe',
      'teens sightseeing old town',
      'family adventure adriatic',
    ],
    'first-time-visitors': [
      `tourists ${destCapitalized} sightseeing`,
      'tourists dubrovnik old town',
      'sightseeing tour group europe',
    ],
    'couples': [
      'romantic couple mediterranean sunset',
      'couple croatia vacation',
      'honeymoon adriatic coast',
    ],
    'lgbt-friendly': [
      'pride parade europe',
      'lgbt couple vacation',
      'rainbow flag travel',
    ],
    'car-vs-no-car': [
      'driving croatia coast road',
      'road trip adriatic',
      'scenic coastal road mediterranean',
    ],
    'parking-difficulty': [
      'parking lot mediterranean',
      'parked cars old town',
      'street parking croatia',
    ],
    'walkability': [
      `walking ${destCapitalized} streets`,
      'cobblestone street croatia old town',
      'pedestrians european old town',
    ],
    'stroller-friendly': [
      'family baby stroller travel',
      'parents pushing stroller city',
      'baby carriage walk',
      'mother stroller park',
    ],
    'wheelchair-access': [
      'wheelchair user traveling',
      'wheelchair tourism sightseeing',
      'person wheelchair city',
      'wheelchair accessible ramp',
    ],
    'public-transport-quality': [
      'tram croatia city',
      'public bus dubrovnik',
      'city transport europe',
    ],
    'ferry-connections': [
      'ferry croatia adriatic',
      'passenger ferry boat mediterranean',
      'ferry terminal croatia islands',
    ],
    'airport-access': [
      'airport croatia',
      'airplane adriatic coast',
      'airport terminal europe',
    ],
    'wifi-quality': [
      'wifi symbol icon',
      'free wifi sign',
      'laptop cafe working',
      'wifi coffee shop',
      'internet connection symbol',
    ],
    'mobile-coverage': [
      'smartphone signal bars',
      'mobile phone network',
      'person using smartphone',
      'cell phone signal',
      '5g network coverage',
    ],
    'beach': [
      `beach ${destCapitalized} adriatic`,
      'turquoise water croatia beach',
      'pebble beach mediterranean',
    ],
    'things-to-do': [
      `tourists ${destCapitalized} activities`,
      'sightseeing croatia',
      'kayaking adriatic',
    ],
    'day-trips': [
      'day trip boat croatia islands',
      'excursion adriatic',
      'tour boat mediterranean',
    ],
    'nightlife': [
      'bar nightlife croatia',
      'nightclub hvar',
      'evening entertainment mediterranean',
      'bar terrace night europe',
    ],
    'restaurants': [
      'restaurant terrace croatia',
      'outdoor dining mediterranean',
      'seafood restaurant adriatic',
    ],
    'local-food': [
      'croatian food grilled fish',
      'seafood platter adriatic',
      'mediterranean cuisine traditional',
    ],
    'hidden-gems': [
      'secret beach croatia',
      'hidden cove adriatic',
      'scenic view croatia coast',
    ],
    'apartments': [
      'apartment sea view croatia',
      'vacation rental balcony mediterranean',
      'holiday apartment adriatic',
    ],
    'pool': [
      'infinity pool adriatic',
      'hotel pool croatia',
      'swimming pool sea view',
    ],
    'luxury': [
      'luxury hotel croatia',
      'five star resort adriatic',
      'premium accommodation mediterranean',
    ],
    'budget': [
      'hostel europe backpacker',
      'budget accommodation croatia',
      'backpacker hostel adriatic',
    ],
    'pet-friendly': [
      'dog beach croatia',
      'pet friendly travel europe',
      'dog vacation mediterranean',
    ],
    'vs-dubrovnik': [
      'dubrovnik city walls',
      'dubrovnik old town aerial',
      'dubrovnik croatia sea',
    ],
    'vs-split': [
      'split diocletian palace',
      'split riva promenade',
      'split croatia old town',
    ],
    'vs-zadar': [
      'zadar sea organ sunset',
      'zadar old town croatia',
      'zadar greeting to sun',
    ],
    'vs-istria': [
      'rovinj istria croatia',
      'pula arena croatia',
      'istrian hilltop village',
    ],
    'vs-zagreb': [
      'zagreb cathedral croatia',
      'zagreb ban jelacic square',
      'zagreb upper town',
    ],
    'coast-vs-inland': [
      'croatia coast mountains',
      'plitvice lakes croatia',
      'adriatic sea landscape',
    ],
    'safety': [
      'peaceful european town',
      'safe streets croatia',
      'friendly atmosphere mediterranean',
    ],
    'parking': [
      'parking croatia',
      'car parked mediterranean',
      'parking lot coast',
    ],
    'weather': [
      'sunny croatia coast',
      'blue sky adriatic',
      'beautiful weather mediterranean',
    ],
    'prices': [
      'euro money',
      'budget vacation europe',
      'travel planning',
    ],
    'transport': [
      'ferry croatia',
      'bus adriatic',
      'transport dubrovnik',
    ],
    'family': [
      'family vacation beach mediterranean',
      'parents children croatia',
      'family holiday adriatic',
    ],
  };

  // Generic themes should skip destination-specific queries (they need generic images)
  const genericThemes = ['wifi-quality', 'mobile-coverage', 'wheelchair-access', 'stroller-friendly', 'digital-nomads'];
  const isGenericTheme = genericThemes.includes(theme);

  // Add theme-specific queries first for generic themes
  if (themeQueries[theme]) {
    queries.push(...themeQueries[theme]);
  }

  // Add specific destination query only for non-generic themes
  if (!isGenericTheme && destination && destination !== 'croatia') {
    const baseTheme = theme.replace(/-/g, ' ');
    queries.unshift(`${destCapitalized} ${baseTheme}`);
  }

  // Fallback
  if (queries.length === 0) {
    queries.push('croatia adriatic coast', 'mediterranean travel europe');
  }

  return queries;
}

// ============================================================================
// API Fetchers
// ============================================================================

async function fetchFromPexels(query: string): Promise<ImageCandidate[]> {
  const apiKey = getPexelsApiKey();
  if (!apiKey) return [];

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`,
      { headers: { Authorization: apiKey } }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return (data.photos || []).map((photo: any) => ({
      url: photo.src.large,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      alt: photo.alt || query,
      source: 'pexels' as const,
    }));
  } catch {
    return [];
  }
}

async function fetchFromUnsplash(query: string): Promise<ImageCandidate[]> {
  const apiKey = getUnsplashApiKey();
  if (!apiKey) return [];

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${apiKey}` } }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return (data.results || []).map((photo: any) => ({
      url: photo.urls.regular,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      alt: photo.alt_description || query,
      source: 'unsplash' as const,
    }));
  } catch {
    return [];
  }
}

async function fetchFromPixabay(query: string): Promise<ImageCandidate[]> {
  const apiKey = getPixabayApiKey();
  if (!apiKey) return [];

  try {
    const response = await fetch(
      `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&per_page=10&orientation=horizontal&image_type=photo&category=travel&safesearch=true`
    );

    if (!response.ok) return [];

    const data = await response.json();
    return (data.hits || []).map((photo: any) => ({
      url: photo.largeImageURL,
      photographer: photo.user,
      photographerUrl: `https://pixabay.com/users/${photo.user}-${photo.user_id}/`,
      alt: photo.tags || query,
      source: 'pixabay' as const,
    }));
  } catch {
    return [];
  }
}

// ============================================================================
// AI Validation
// ============================================================================

// Continental destinations that should NOT have sea/beach images
const CONTINENTAL_DESTINATIONS = [
  'zagreb', 'varazdin', 'osijek', 'karlovac', 'samobor', 'plitvice',
  'slavonski-brod', 'vukovar', 'sisak', 'cakovec', 'koprivnica', 'bjelovar'
];

function isCoastalDestination(destination?: string): boolean {
  if (!destination) return true; // Default to coastal
  return !CONTINENTAL_DESTINATIONS.includes(destination.toLowerCase());
}

async function validateImageWithAI(
  imageUrl: string,
  theme: string,
  destination?: string
): Promise<{ valid: boolean; reason: string }> {
  const apiKey = getGeminiImageApiKey();
  if (!apiKey) {
    console.log('    ⚠️ No AI validation key, skipping validation');
    return { valid: false, reason: 'No API key - rejecting to be safe' };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Fetch image as base64
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    const themeRequirement = THEME_REQUIREMENTS[theme] || `should relate to ${theme.replace(/-/g, ' ')}`;
    const isCoastal = isCoastalDestination(destination);

    // Generic themes don't need location-specific requirements
    const genericThemes = ['wifi-quality', 'mobile-coverage', 'wheelchair-access', 'stroller-friendly', 'digital-nomads', 'parking-difficulty', 'car-vs-no-car'];
    const isGenericTheme = genericThemes.includes(theme);

    // Build location rules based on destination type
    let locationRules: string;
    if (isGenericTheme) {
      locationRules = `2. Location doesn't matter - focus only on the theme content
3. NO explicit non-European text/signs (if visible)`;
    } else if (!isCoastal) {
      // Continental destinations (Zagreb, Plitvice, etc.)
      locationRules = `2. This is for a CONTINENTAL/INLAND destination - NO sea, NO beach, NO coastal scenes!
3. Should show: city architecture, parks, lakes, mountains, urban scenes, inland landscapes
4. REJECT if image shows: sea, beach, boats, harbor, coastal town, Mediterranean scenery
5. Must look European (Central European architecture preferred)
6. NO Islamic elements (mosques, minarets, hijabs)`;
    } else {
      // Coastal destinations
      locationRules = `2. Must look European/Mediterranean (architecture, landscape)
3. Coastal/sea imagery is acceptable for this destination
4. People must appear European/Caucasian (if visible)
5. NO Islamic elements (mosques, minarets, hijabs)
6. NO Asian/African architecture`;
    }

    const prompt = `You are a STRICT image validator for a Croatia travel website. Your job is to REJECT bad images.

CONTEXT:
- Article destination: ${destination || 'Croatia'}
- Article theme: "${theme.replace(/-/g, ' ')}"
- Destination type: ${isCoastal ? 'COASTAL (Adriatic sea is OK)' : 'CONTINENTAL/INLAND (NO sea, NO beach!)'}

THEME REQUIREMENT: ${themeRequirement}

VALIDATION CHECKLIST (check ALL):

1. THEME MATCH (MOST IMPORTANT - 50% weight):
   - Does the image CLEARLY show what the theme requires?
   - "${theme}" theme MUST show: ${themeRequirement}
   - If theme is "parking" → must show cars/parking lot
   - If theme is "crowds" → must show many people
   - If theme is "nightlife" → must show evening/night scene
   - If theme is "beach" → must show actual beach
   - If theme is "restaurants" → must show food/restaurant
   - REJECT if image doesn't clearly match the theme!

2. LOCATION MATCH (25% weight):
${locationRules}

3. IMAGE QUALITY (15% weight):
   - No blurry or low-resolution images
   - No watermarks or text overlays
   - No obvious stock photo staging (fake smiles, empty scenes)
   - Professional travel-worthy quality

4. CULTURAL FIT (10% weight):
   - Must look European/Mediterranean
   - NO Islamic architecture (mosques, minarets)
   - NO Asian/Middle Eastern/African scenery
   - NO people in religious clothing (hijabs, etc.)
   - Architecture should match Croatian/European style

AUTOMATIC REJECTION:
- Theme mismatch (e.g., "parking" shows landscape) → REJECT
- Wrong location type (inland destination shows sea) → REJECT
- Non-European appearance → REJECT
- Low quality or watermarked → REJECT
- Generic/irrelevant stock photo → REJECT

Be STRICT. A mediocre image is worse than no image. When in doubt, REJECT.

Respond ONLY with valid JSON (no markdown, no code blocks):
{"valid": true/false, "reason": "specific explanation why accepted or rejected"}`;

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
    console.log(`    ⚠️ Validation error: ${(error as Error).message}`);
    // On error, REJECT to be safe (don't allow potentially bad images)
    return { valid: false, reason: 'Validation error - rejecting to be safe' };
  }
}

// ============================================================================
// Main Export Functions
// ============================================================================

/**
 * Get article image from multiple providers with AI validation
 */
export async function getArticleImage(
  theme: string,
  destination?: string
): Promise<{
  imageUrl: string;
  imageAlt: string;
  imageCredit: string;
  imageCreditUrl: string;
  imageSource: string;
} | null> {
  const queries = getSearchQueries(theme, destination);
  const allCandidates: ImageCandidate[] = [];

  console.log(`  📷 Searching images for: ${destination || 'generic'} / ${theme}`);

  // Fetch from all providers in parallel for first query
  const firstQuery = queries[0];
  const [pexelsResults, unsplashResults, pixabayResults] = await Promise.all([
    fetchFromPexels(firstQuery),
    fetchFromUnsplash(firstQuery),
    fetchFromPixabay(firstQuery),
  ]);

  allCandidates.push(...pexelsResults, ...unsplashResults, ...pixabayResults);

  // If not enough results, try more queries
  if (allCandidates.length < 10 && queries.length > 1) {
    for (let i = 1; i < Math.min(queries.length, 3); i++) {
      const [p, u, x] = await Promise.all([
        fetchFromPexels(queries[i]),
        fetchFromUnsplash(queries[i]),
        fetchFromPixabay(queries[i]),
      ]);
      allCandidates.push(...p, ...u, ...x);
    }
  }

  console.log(`    Found ${allCandidates.length} candidates from all providers`);

  if (allCandidates.length === 0) {
    console.log(`    ⚠️ No images found`);
    return null;
  }

  // Shuffle for variety
  const shuffled = allCandidates.sort(() => Math.random() - 0.5);

  // If no AI validation or daily limit reached, return first result
  if (!ENABLE_AI_VALIDATION || !getGeminiImageApiKey() || !canValidate()) {
    if (!canValidate()) {
      console.log(`    ⚠️ Daily validation limit reached (${MAX_DAILY_VALIDATIONS}), skipping AI validation`);
    }
    const img = shuffled[0];
    return {
      imageUrl: img.url,
      imageAlt: img.alt,
      imageCredit: img.photographer,
      imageCreditUrl: img.photographerUrl,
      imageSource: img.source,
    };
  }

  // Validate candidates
  const maxAttempts = Math.min(MAX_VALIDATION_ATTEMPTS, shuffled.length);

  for (let i = 0; i < maxAttempts; i++) {
    // Check daily limit before each validation
    if (!canValidate()) {
      console.log(`    ⚠️ Daily validation limit reached, using current candidate`);
      const img = shuffled[i];
      return {
        imageUrl: img.url,
        imageAlt: img.alt,
        imageCredit: img.photographer,
        imageCreditUrl: img.photographerUrl,
        imageSource: img.source,
      };
    }

    const candidate = shuffled[i];
    console.log(`    🔍 [${i + 1}/${maxAttempts}] Validating (${candidate.source})... [${dailyValidationCount + 1}/${MAX_DAILY_VALIDATIONS} today]`);

    incrementValidationCount(); // Count BEFORE the call
    const validation = await validateImageWithAI(candidate.url, theme, destination);

    if (validation.valid) {
      console.log(`    ✅ Approved: ${validation.reason}`);
      return {
        imageUrl: candidate.url,
        imageAlt: candidate.alt,
        imageCredit: candidate.photographer,
        imageCreditUrl: candidate.photographerUrl,
        imageSource: candidate.source,
      };
    } else {
      console.log(`    ❌ Rejected: ${validation.reason}`);
    }

    // Small delay between validations
    await new Promise((r) => setTimeout(r, 300));
  }

  // Fallback: Use universal vacation/travel images that work for any theme/destination
  console.log(`    ⚠️ No validated image found, searching for universal vacation fallback...`);

  const fallbackQueries = [
    'vacation travel suitcase',
    'holiday travel europe',
    'summer vacation beach',
    'travel planning map passport',
    'tourist sightseeing europe',
  ];

  for (const fallbackQuery of fallbackQueries) {
    const [pFallback, uFallback, xFallback] = await Promise.all([
      fetchFromPexels(fallbackQuery),
      fetchFromUnsplash(fallbackQuery),
      fetchFromPixabay(fallbackQuery),
    ]);

    const fallbackCandidates = [...pFallback, ...uFallback, ...xFallback];

    if (fallbackCandidates.length > 0) {
      // Pick a random one from fallback results
      const fallbackImg = fallbackCandidates[Math.floor(Math.random() * fallbackCandidates.length)];
      const fallbackAlt = 'Travel and vacation concept';
      console.log(`    🧳 Using universal vacation fallback image from ${fallbackImg.source}`);
      return {
        imageUrl: fallbackImg.url,
        imageAlt: fallbackAlt,
        imageCredit: fallbackImg.photographer,
        imageCreditUrl: fallbackImg.photographerUrl,
        imageSource: fallbackImg.source,
      };
    }
  }

  console.log(`    ❌ No fallback image found either`);
  return null;
}

// Keep backward compatibility with old pexels.ts export
export { getArticleImage as fetchArticleImage };
