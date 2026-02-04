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
