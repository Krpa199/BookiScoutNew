/**
 * Pexels API Service for Article Images
 *
 * Fetches relevant images based on article theme.
 * Prioritizes Croatia-related images, falls back to generic travel images.
 * Rate limit: 200 requests/hour
 */

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';

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

// Theme to search query mapping
// First query includes Croatia, fallback queries are generic but relevant
const THEME_SEARCH_QUERIES: Record<string, string[]> = {
  // Traveler Types
  'solo-travel': ['solo traveler europe', 'woman traveling alone city', 'backpacker exploring old town'],
  'seniors': ['senior couple mediterranean vacation', 'elderly tourists europe', 'retired couple travel'],
  'digital-nomads': ['laptop cafe seaside', 'remote work mediterranean', 'freelancer working travel'],
  'lgbt-friendly': ['pride parade europe', 'diverse couples vacation', 'lgbt travel'],
  'families-with-toddlers': ['family toddler beach vacation', 'parents children mediterranean', 'family holiday seaside'],
  'families-with-teens': ['family teenagers vacation europe', 'teen travel adventure', 'family sightseeing city'],
  'first-time-visitors': ['tourists old town europe', 'sightseeing mediterranean city', 'first time traveler'],
  'couples': ['romantic couple mediterranean', 'couple sunset sea', 'romantic vacation europe'],

  // Practical Blockers
  'car-vs-no-car': ['driving coastal road', 'car road trip mediterranean', 'scenic drive coast'],
  'parking-difficulty': ['parking old town europe', 'street parking mediterranean', 'parking city center'],
  'walkability': ['walking cobblestone street europe', 'pedestrian old town', 'tourists walking city'],
  'stroller-friendly': ['family stroller european city', 'parents baby carriage old town', 'family walk city'],
  'wheelchair-access': ['wheelchair accessible travel', 'accessible tourism europe', 'wheelchair ramp city'],
  'public-transport-quality': ['bus mediterranean city', 'public transport europe', 'city bus tourists'],
  'ferry-connections': ['ferry adriatic sea', 'passenger ferry mediterranean', 'boat harbor croatia'],
  'airport-access': ['airport europe', 'airplane landing coast', 'airport terminal travel'],
  'wifi-quality': ['wifi cafe europe', 'laptop coffee shop', 'internet cafe travel'],
  'mobile-coverage': ['smartphone travel europe', 'tourist using phone', 'mobile phone vacation'],

  // Seasonality
  'off-season': ['empty beach winter', 'quiet old town europe', 'low season mediterranean'],
  'shoulder-season': ['spring mediterranean', 'autumn europe travel', 'pleasant weather coast'],
  'peak-season': ['crowded old town summer', 'tourists summer europe', 'busy mediterranean street'],
  'weather-by-month': ['sunny mediterranean', 'blue sky coast', 'perfect weather sea'],
  'crowds-by-month': ['tourist crowd old town', 'busy street europe summer', 'crowded landmark'],
  'best-time-to-visit': ['beautiful weather mediterranean', 'perfect day seaside', 'sunny coast europe'],

  // Comparisons - focus on cityscapes and architecture
  'vs-dubrovnik': ['dubrovnik croatia walls', 'old town walls sea', 'medieval fortress coast'],
  'vs-split': ['split croatia palace', 'roman ruins coast', 'ancient palace mediterranean'],
  'vs-zadar': ['zadar croatia sunset', 'sea organ croatia', 'waterfront promenade adriatic'],
  'vs-istria': ['istria croatia hilltop', 'istrian village vineyard', 'mediterranean hilltop town'],
  'vs-zagreb': ['zagreb croatia cathedral', 'european capital square', 'central europe city'],
  'coast-vs-inland': ['coast mountains croatia', 'adriatic sea hills', 'seaside landscape'],

  // Legacy Themes
  'beach': ['beach croatia adriatic', 'turquoise water mediterranean', 'pebble beach coast'],
  'things-to-do': ['tourists sightseeing europe', 'activities mediterranean', 'vacation activities coast'],
  'day-trips': ['scenic drive coast', 'excursion boat mediterranean', 'day trip destination'],
  'safety': ['safe european city', 'tourist friendly town', 'peaceful old town'],
  'nightlife': ['nightlife mediterranean', 'bar street europe', 'evening entertainment coast'],
  'restaurants': ['outdoor restaurant mediterranean', 'seafood restaurant coast', 'dining terrace sea view'],
  'budget': ['backpacker europe', 'budget travel mediterranean', 'hostel accommodation'],
  'luxury': ['luxury hotel mediterranean', 'five star resort coast', 'premium sea view'],
  'pet-friendly': ['dog friendly beach', 'pet travel europe', 'dog vacation coast'],
  'hidden-gems': ['secret beach croatia', 'hidden cove mediterranean', 'off beaten path'],
  'local-food': ['croatian food traditional', 'mediterranean cuisine seafood', 'local dish restaurant'],
  'family': ['family vacation mediterranean', 'parents children beach', 'family holiday europe'],
  'apartments': ['apartment sea view balcony', 'vacation rental mediterranean', 'holiday apartment coast'],
  'pool': ['swimming pool hotel sea', 'infinity pool coast', 'resort pool mediterranean'],
  'parking': ['parking city europe', 'car parked old town', 'parking garage'],
  'weather': ['sunny mediterranean weather', 'blue sky sea', 'beautiful day coast'],
  'prices': ['euro money travel', 'budget planning vacation', 'travel expenses'],
  'transport': ['bus train europe', 'public transportation city', 'ferry boat coast'],
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
 * Fetch image from Pexels API
 */
export async function fetchPexelsImage(theme: string): Promise<{
  url: string;
  photographer: string;
  photographerUrl: string;
  alt: string;
} | null> {
  if (!PEXELS_API_KEY) {
    console.warn('⚠️ PEXELS_API_KEY not set, skipping image fetch');
    return null;
  }

  const queries = getSearchQueries(theme);

  // Try each query until we find an image
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
        // Pick a random photo from results for variety
        const randomIndex = Math.floor(Math.random() * Math.min(data.photos.length, 10));
        const photo = data.photos[randomIndex];

        return {
          url: photo.src.large, // Good size for web (940x627)
          photographer: photo.photographer,
          photographerUrl: photo.photographer_url,
          alt: photo.alt || `${theme.replace(/-/g, ' ')} travel photo`,
        };
      }
    } catch (error) {
      console.error(`Error fetching from Pexels for query "${query}":`, error);
    }
  }

  console.warn(`No Pexels image found for theme: ${theme}`);
  return null;
}

/**
 * Get image for article (with caching consideration)
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
