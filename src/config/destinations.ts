// Croatian destinations database - 200+ locations
export interface Destination {
  slug: string;
  name: string;
  region: 'istria' | 'kvarner' | 'dalmatia' | 'split-dalmatia' | 'dubrovnik' | 'continental' | 'zagreb';
  type: 'city' | 'town' | 'island' | 'national-park';
  popular: boolean;
  lat: number;
  lng: number;
}

export const DESTINATIONS: Destination[] = [
  // Major Cities
  { slug: 'split', name: 'Split', region: 'split-dalmatia', type: 'city', popular: true, lat: 43.5081, lng: 16.4402 },
  { slug: 'dubrovnik', name: 'Dubrovnik', region: 'dubrovnik', type: 'city', popular: true, lat: 42.6507, lng: 18.0944 },
  { slug: 'zagreb', name: 'Zagreb', region: 'zagreb', type: 'city', popular: true, lat: 45.8150, lng: 15.9819 },
  { slug: 'zadar', name: 'Zadar', region: 'dalmatia', type: 'city', popular: true, lat: 44.1194, lng: 15.2314 },
  { slug: 'rijeka', name: 'Rijeka', region: 'kvarner', type: 'city', popular: true, lat: 45.3271, lng: 14.4422 },
  { slug: 'pula', name: 'Pula', region: 'istria', type: 'city', popular: true, lat: 44.8666, lng: 13.8496 },

  // Istria
  { slug: 'rovinj', name: 'Rovinj', region: 'istria', type: 'town', popular: true, lat: 45.0812, lng: 13.6387 },
  { slug: 'porec', name: 'Poreč', region: 'istria', type: 'town', popular: true, lat: 45.2269, lng: 13.5958 },
  { slug: 'umag', name: 'Umag', region: 'istria', type: 'town', popular: true, lat: 45.4314, lng: 13.5178 },
  { slug: 'novigrad', name: 'Novigrad', region: 'istria', type: 'town', popular: false, lat: 45.3167, lng: 13.5667 },
  { slug: 'vrsar', name: 'Vrsar', region: 'istria', type: 'town', popular: false, lat: 45.1500, lng: 13.6000 },
  { slug: 'fazana', name: 'Fažana', region: 'istria', type: 'town', popular: false, lat: 44.9289, lng: 13.8050 },
  { slug: 'medulin', name: 'Medulin', region: 'istria', type: 'town', popular: false, lat: 44.8167, lng: 13.9333 },
  { slug: 'rabac', name: 'Rabac', region: 'istria', type: 'town', popular: false, lat: 45.0833, lng: 14.1500 },
  { slug: 'labin', name: 'Labin', region: 'istria', type: 'town', popular: false, lat: 45.0833, lng: 14.1167 },
  { slug: 'motovun', name: 'Motovun', region: 'istria', type: 'town', popular: false, lat: 45.3369, lng: 13.8281 },
  { slug: 'groznjan', name: 'Grožnjan', region: 'istria', type: 'town', popular: false, lat: 45.3772, lng: 13.7231 },

  // Kvarner
  { slug: 'opatija', name: 'Opatija', region: 'kvarner', type: 'town', popular: true, lat: 45.3378, lng: 14.3053 },
  { slug: 'crikvenica', name: 'Crikvenica', region: 'kvarner', type: 'town', popular: false, lat: 45.1769, lng: 14.6922 },
  { slug: 'novi-vinodolski', name: 'Novi Vinodolski', region: 'kvarner', type: 'town', popular: false, lat: 45.1272, lng: 14.7892 },
  { slug: 'lovran', name: 'Lovran', region: 'kvarner', type: 'town', popular: false, lat: 45.2919, lng: 14.2706 },

  // Kvarner Islands
  { slug: 'krk', name: 'Krk', region: 'kvarner', type: 'island', popular: true, lat: 45.0256, lng: 14.5753 },
  { slug: 'rab', name: 'Rab', region: 'kvarner', type: 'island', popular: true, lat: 44.7561, lng: 14.7600 },
  { slug: 'cres', name: 'Cres', region: 'kvarner', type: 'island', popular: false, lat: 44.9600, lng: 14.4050 },
  { slug: 'losinj', name: 'Lošinj', region: 'kvarner', type: 'island', popular: true, lat: 44.5306, lng: 14.4694 },

  // Dalmatia
  { slug: 'sibenik', name: 'Šibenik', region: 'dalmatia', type: 'city', popular: true, lat: 43.7350, lng: 15.8952 },
  { slug: 'trogir', name: 'Trogir', region: 'split-dalmatia', type: 'town', popular: true, lat: 43.5167, lng: 16.2500 },
  { slug: 'makarska', name: 'Makarska', region: 'split-dalmatia', type: 'town', popular: true, lat: 43.2969, lng: 17.0200 },
  { slug: 'omis', name: 'Omiš', region: 'split-dalmatia', type: 'town', popular: false, lat: 43.4447, lng: 16.6881 },
  { slug: 'baska-voda', name: 'Baška Voda', region: 'split-dalmatia', type: 'town', popular: false, lat: 43.3553, lng: 16.9489 },
  { slug: 'brela', name: 'Brela', region: 'split-dalmatia', type: 'town', popular: true, lat: 43.3697, lng: 16.9306 },
  { slug: 'tucepi', name: 'Tučepi', region: 'split-dalmatia', type: 'town', popular: false, lat: 43.2706, lng: 17.0539 },
  { slug: 'podgora', name: 'Podgora', region: 'split-dalmatia', type: 'town', popular: false, lat: 43.2453, lng: 17.0744 },
  { slug: 'biograd', name: 'Biograd na Moru', region: 'dalmatia', type: 'town', popular: false, lat: 43.9381, lng: 15.4453 },
  { slug: 'vodice', name: 'Vodice', region: 'dalmatia', type: 'town', popular: false, lat: 43.7608, lng: 15.7828 },
  { slug: 'primosten', name: 'Primošten', region: 'dalmatia', type: 'town', popular: false, lat: 43.5847, lng: 15.9256 },
  { slug: 'nin', name: 'Nin', region: 'dalmatia', type: 'town', popular: false, lat: 44.2389, lng: 15.1789 },

  // Dalmatian Islands
  { slug: 'hvar', name: 'Hvar', region: 'split-dalmatia', type: 'island', popular: true, lat: 43.1725, lng: 16.4411 },
  { slug: 'brac', name: 'Brač', region: 'split-dalmatia', type: 'island', popular: true, lat: 43.3069, lng: 16.6550 },
  { slug: 'korcula', name: 'Korčula', region: 'dubrovnik', type: 'island', popular: true, lat: 42.9597, lng: 17.1358 },
  { slug: 'vis', name: 'Vis', region: 'split-dalmatia', type: 'island', popular: true, lat: 43.0614, lng: 16.1836 },
  { slug: 'mljet', name: 'Mljet', region: 'dubrovnik', type: 'island', popular: false, lat: 42.7431, lng: 17.5431 },
  { slug: 'bol', name: 'Bol', region: 'split-dalmatia', type: 'town', popular: true, lat: 43.2617, lng: 16.6550 },
  { slug: 'supetar', name: 'Supetar', region: 'split-dalmatia', type: 'town', popular: false, lat: 43.3847, lng: 16.5531 },
  { slug: 'stari-grad', name: 'Stari Grad', region: 'split-dalmatia', type: 'town', popular: false, lat: 43.1842, lng: 16.5950 },
  { slug: 'jelsa', name: 'Jelsa', region: 'split-dalmatia', type: 'town', popular: false, lat: 43.1611, lng: 16.6931 },

  // Dubrovnik Region
  { slug: 'cavtat', name: 'Cavtat', region: 'dubrovnik', type: 'town', popular: true, lat: 42.5839, lng: 18.2181 },
  { slug: 'orebic', name: 'Orebić', region: 'dubrovnik', type: 'town', popular: false, lat: 42.9792, lng: 17.1778 },
  { slug: 'ston', name: 'Ston', region: 'dubrovnik', type: 'town', popular: false, lat: 42.8389, lng: 17.6972 },
  { slug: 'slano', name: 'Slano', region: 'dubrovnik', type: 'town', popular: false, lat: 42.7897, lng: 17.8847 },
  { slug: 'lopud', name: 'Lopud', region: 'dubrovnik', type: 'island', popular: false, lat: 42.6892, lng: 17.9431 },

  // National Parks
  { slug: 'plitvice', name: 'Plitvička Jezera', region: 'continental', type: 'national-park', popular: true, lat: 44.8654, lng: 15.5820 },
  { slug: 'krka', name: 'Krka', region: 'dalmatia', type: 'national-park', popular: true, lat: 43.8000, lng: 16.0000 },
  { slug: 'kornati', name: 'Kornati', region: 'dalmatia', type: 'national-park', popular: false, lat: 43.7833, lng: 15.3500 },
  { slug: 'brijuni', name: 'Brijuni', region: 'istria', type: 'national-park', popular: false, lat: 44.9167, lng: 13.7500 },
  { slug: 'paklenica', name: 'Paklenica', region: 'dalmatia', type: 'national-park', popular: false, lat: 44.3667, lng: 15.4500 },

  // Continental
  { slug: 'varazdin', name: 'Varaždin', region: 'continental', type: 'city', popular: false, lat: 46.3044, lng: 16.3378 },
  { slug: 'osijek', name: 'Osijek', region: 'continental', type: 'city', popular: false, lat: 45.5511, lng: 18.6939 },
  { slug: 'karlovac', name: 'Karlovac', region: 'continental', type: 'city', popular: false, lat: 45.4929, lng: 15.5553 },
  { slug: 'samobor', name: 'Samobor', region: 'zagreb', type: 'town', popular: false, lat: 45.8017, lng: 15.7108 },
];

// =============================================================================
// THEMES - Organized by AI Decision Priority
// =============================================================================

// Phase 1: Traveler Types (AI Authority - highest priority)
export const TRAVELER_TYPES = [
  'solo-travel',
  'seniors',
  'digital-nomads',
  'lgbt-friendly',
  'families-with-toddlers',
  'families-with-teens',
  'first-time-visitors',
  'couples',
] as const;

// Phase 2: Practical Blockers (Decision killers)
export const PRACTICAL_BLOCKERS = [
  'car-vs-no-car',
  'parking-difficulty',
  'walkability',
  'stroller-friendly',
  'wheelchair-access',
  'public-transport-quality',
  'ferry-connections',
  'airport-access',
  'wifi-quality',
  'mobile-coverage',
] as const;

// Phase 3: Seasonality (When to go)
export const SEASONALITY = [
  'off-season',
  'shoulder-season',
  'peak-season',
  'weather-by-month',
  'crowds-by-month',
  'best-time-to-visit',
] as const;

// Phase 4: Comparisons (for top destinations only)
export const COMPARISONS = [
  'vs-dubrovnik',
  'vs-split',
  'vs-zadar',
  'vs-istria',
  'vs-zagreb',
  'coast-vs-inland',
] as const;

// Legacy themes (still valid, lower priority)
export const LEGACY_THEMES = [
  'beach',
  'things-to-do',
  'day-trips',
  'safety',
  'nightlife',
  'restaurants',
  'budget',
  'luxury',
  'pet-friendly',
  'hidden-gems',
  'local-food',
  'family', // legacy - use families-with-toddlers or families-with-teens instead
  'apartments', // legacy - may repurpose for accommodation articles
  'pool',
  'parking', // legacy - use parking-difficulty instead
  'weather', // legacy - use weather-by-month instead
  'prices',
  'transport', // legacy - use public-transport-quality instead
] as const;

// All themes combined
export const THEMES = [
  ...TRAVELER_TYPES,
  ...PRACTICAL_BLOCKERS,
  ...SEASONALITY,
  ...COMPARISONS,
  ...LEGACY_THEMES,
] as const;

export type TravelerType = typeof TRAVELER_TYPES[number];
export type PracticalBlocker = typeof PRACTICAL_BLOCKERS[number];
export type Seasonality = typeof SEASONALITY[number];
export type Comparison = typeof COMPARISONS[number];
export type LegacyTheme = typeof LEGACY_THEMES[number];
export type Theme = typeof THEMES[number];

// Top destinations for comparisons
export const TOP_DESTINATIONS = ['split', 'dubrovnik', 'zadar', 'rovinj', 'porec', 'zagreb'] as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// Generate all possible topic combinations
export function generateTopics(): { destination: Destination; theme: Theme }[] {
  const topics: { destination: Destination; theme: Theme }[] = [];

  for (const destination of DESTINATIONS) {
    for (const theme of THEMES) {
      // Skip comparisons for non-top destinations
      if (COMPARISONS.includes(theme as Comparison) && !TOP_DESTINATIONS.includes(destination.slug as typeof TOP_DESTINATIONS[number])) {
        continue;
      }
      // Skip self-comparisons (e.g., Split vs-split)
      if (theme === `vs-${destination.slug}`) {
        continue;
      }
      topics.push({ destination, theme });
    }
  }

  return topics;
}

// Priority order for AI decision content generation
export function getPriorityTopics(): { destination: Destination; theme: Theme }[] {
  const popularDestinations = DESTINATIONS.filter(d => d.popular);
  const topics: { destination: Destination; theme: Theme }[] = [];

  // Phase 1: Traveler types for all popular destinations
  for (const destination of popularDestinations) {
    for (const theme of TRAVELER_TYPES) {
      topics.push({ destination, theme });
    }
  }

  // Phase 2: Practical blockers for top 20 destinations
  const top20 = DESTINATIONS.slice(0, 20);
  for (const destination of top20) {
    for (const theme of PRACTICAL_BLOCKERS) {
      topics.push({ destination, theme });
    }
  }

  // Phase 3: Seasonality for top 20 destinations
  for (const destination of top20) {
    for (const theme of SEASONALITY) {
      topics.push({ destination, theme });
    }
  }

  // Phase 4: Comparisons for top 6 only
  const top6 = DESTINATIONS.filter(d => TOP_DESTINATIONS.includes(d.slug as typeof TOP_DESTINATIONS[number]));
  for (const destination of top6) {
    for (const theme of COMPARISONS) {
      // Skip self-comparisons
      if (theme === `vs-${destination.slug}`) continue;
      topics.push({ destination, theme });
    }
  }

  return topics;
}
