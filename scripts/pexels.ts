/**
 * Pexels API Service for Article Images
 *
 * Fetches relevant images based on article theme (not destination).
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

// Theme to search query mapping - focused on theme, NOT destination
const THEME_SEARCH_QUERIES: Record<string, string[]> = {
  // Traveler Types
  'solo-travel': ['solo traveler backpack', 'person traveling alone', 'solo adventure'],
  'seniors': ['senior couple vacation', 'elderly tourists', 'retired travelers'],
  'digital-nomads': ['laptop cafe travel', 'remote work beach', 'digital nomad'],
  'lgbt-friendly': ['pride travel', 'rainbow flag vacation', 'diverse couples travel'],
  'families-with-toddlers': ['family vacation kids', 'toddler beach', 'family travel children'],
  'families-with-teens': ['family teenagers vacation', 'teen travel adventure', 'family holiday teens'],
  'first-time-visitors': ['tourist sightseeing', 'first trip europe', 'tourist map'],
  'couples': ['romantic couple travel', 'couple vacation sunset', 'honeymoon romantic'],

  // Practical Blockers
  'car-vs-no-car': ['car road trip', 'driving vacation', 'rental car scenic'],
  'parking-difficulty': ['parking lot city', 'street parking', 'car parked city'],
  'walkability': ['walking city tour', 'pedestrian street', 'walking cobblestone'],
  'stroller-friendly': ['stroller travel', 'baby carriage city', 'family stroller walk'],
  'wheelchair-access': ['wheelchair travel', 'accessible tourism', 'wheelchair ramp'],
  'public-transport-quality': ['city bus', 'public transport', 'bus stop city'],
  'ferry-connections': ['ferry boat sea', 'passenger ferry', 'boat harbor'],
  'airport-access': ['airport terminal', 'airplane travel', 'airport departure'],
  'wifi-quality': ['wifi cafe laptop', 'internet connection', 'mobile phone travel'],
  'mobile-coverage': ['smartphone travel', 'mobile phone vacation', 'phone signal'],

  // Seasonality
  'off-season': ['quiet beach winter', 'empty tourist place', 'low season travel'],
  'shoulder-season': ['spring travel europe', 'autumn vacation', 'mild weather travel'],
  'peak-season': ['crowded beach summer', 'busy tourist season', 'summer vacation crowd'],
  'weather-by-month': ['sunny weather travel', 'weather forecast', 'blue sky vacation'],
  'crowds-by-month': ['tourist crowd', 'busy street tourists', 'popular destination'],
  'best-time-to-visit': ['perfect weather vacation', 'ideal travel time', 'sunny destination'],

  // Comparisons
  'vs-dubrovnik': ['old town walls', 'medieval city coast', 'historic fortress sea'],
  'vs-split': ['ancient palace ruins', 'roman architecture', 'historic waterfront'],
  'vs-zadar': ['sea organ sunset', 'coastal city', 'waterfront promenade'],
  'vs-istria': ['hilltop village', 'vineyard coast', 'mediterranean town'],
  'vs-zagreb': ['european capital city', 'city square cathedral', 'urban architecture'],
  'coast-vs-inland': ['coast versus mountains', 'beach vs hills', 'seaside landscape'],

  // Legacy Themes
  'beach': ['beach mediterranean', 'sandy beach turquoise', 'beach umbrella sun'],
  'things-to-do': ['tourist activities', 'sightseeing tour', 'vacation activities'],
  'day-trips': ['day trip excursion', 'scenic drive', 'tour bus destination'],
  'safety': ['safe travel', 'tourist police', 'secure vacation'],
  'nightlife': ['nightclub party', 'bar nightlife', 'evening entertainment'],
  'restaurants': ['restaurant dining', 'outdoor cafe', 'food table restaurant'],
  'budget': ['backpacker hostel', 'budget travel', 'cheap accommodation'],
  'luxury': ['luxury hotel pool', 'five star resort', 'premium vacation'],
  'pet-friendly': ['dog travel vacation', 'pet friendly hotel', 'traveling with dog'],
  'hidden-gems': ['secret beach', 'hidden village', 'off beaten path'],
  'local-food': ['local cuisine dish', 'traditional food', 'street food market'],
  'family': ['family vacation beach', 'family holiday', 'parents kids travel'],
  'apartments': ['vacation apartment', 'holiday rental', 'apartment balcony view'],
  'pool': ['swimming pool hotel', 'resort pool', 'pool vacation'],
  'parking': ['parking garage', 'car park', 'parking space'],
  'weather': ['sunny weather', 'blue sky clouds', 'perfect weather day'],
  'prices': ['money travel budget', 'wallet vacation', 'travel expenses'],
  'transport': ['transportation travel', 'bus train', 'public transit'],
};

// Fallback queries if theme not found
const FALLBACK_QUERIES = ['travel vacation', 'mediterranean coast', 'tourism holiday'];

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
