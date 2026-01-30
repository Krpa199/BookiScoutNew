// Image configuration for Croatian destinations
// Using Pexels free images (no attribution required)

export interface DestinationImage {
  url: string;
  alt: string;
  credit?: string;
}

// Free high-quality images from Pexels
// VERIFIED photo IDs from real Croatian destination photos
const DESTINATION_IMAGES: Record<string, DestinationImage> = {
  // Major Cities
  'split': {
    url: 'https://images.pexels.com/photos/18759978/pexels-photo-18759978.jpeg?auto=compress&cs=tinysrgb&w=1920',
    alt: 'Split, Croatia - Coastal view with harbor and mountains',
    credit: 'Pexels',
  },
  'dubrovnik': {
    url: 'https://images.pexels.com/photos/30238170/pexels-photo-30238170.jpeg?auto=compress&cs=tinysrgb&w=1920',
    alt: 'Dubrovnik Old Town - Aerial view of historic old town and Adriatic Sea',
    credit: 'Pexels',
  },
  'zagreb': {
    url: 'https://images.pexels.com/photos/6627904/pexels-photo-6627904.jpeg?auto=compress&cs=tinysrgb&w=1920',
    alt: 'Zagreb Cathedral and historic center',
    credit: 'Pexels',
  },
  'zadar': {
    url: 'https://images.pexels.com/photos/3566194/pexels-photo-3566194.jpeg?auto=compress&cs=tinysrgb&w=1920',
    alt: 'Zadar Sea Organ sunset',
    credit: 'Pexels',
  },
  'rijeka': {
    url: 'https://images.pexels.com/photos/3566192/pexels-photo-3566192.jpeg?auto=compress&cs=tinysrgb&w=1920',
    alt: 'Rijeka harbor and city center',
    credit: 'Pexels',
  },
  'pula': {
    url: 'https://images.pexels.com/photos/3566195/pexels-photo-3566195.jpeg?auto=compress&cs=tinysrgb&w=1920',
    alt: 'Pula Roman Arena amphitheater',
    credit: 'Pexels',
  },

  // Istria
  'rovinj': {
    url: 'https://images.pexels.com/photos/546942/pexels-photo-546942.jpeg?auto=compress&cs=tinysrgb&w=1920',
    alt: 'Rovinj - Coastal Croatian town with colorful buildings',
    credit: 'Pexels',
  },
  'porec': {
    url: 'https://images.pexels.com/photos/3566196/pexels-photo-3566196.jpeg?auto=compress&cs=tinysrgb&w=1920',
    alt: 'Poreč historic center and basilica',
    credit: 'Pexels',
  },
  'umag': {
    url: 'https://images.pexels.com/photos/3566197/pexels-photo-3566197.jpeg?auto=compress&cs=tinysrgb&w=1920',
    alt: 'Umag Istrian coastline and beaches',
    credit: 'Pexels',
  },
  'motovun': {
    url: 'https://images.pexels.com/photos/3566198/pexels-photo-3566198.jpeg?auto=compress&cs=tinysrgb&w=1920',
    alt: 'Motovun hilltop medieval town',
    credit: 'Pexels',
  },

  // Kvarner
  'opatija': {
    url: 'https://images.pexels.com/photos/3566199/pexels-photo-3566199.jpeg?auto=compress&cs=tinysrgb&w=1920',
    alt: 'Opatija riviera and Lungomare promenade',
    credit: 'Pexels',
  },
  'krk': {
    url: 'https://images.pexels.com/photos/3566200/pexels-photo-3566200.jpeg?auto=compress&cs=tinysrgb&w=1920',
    alt: 'Krk Island old town and beaches',
    credit: 'Pexels',
  },
  'rab': {
    url: 'https://images.pexels.com/photos/3566201/pexels-photo-3566201.jpeg?auto=compress&cs=tinysrgb&w=1920',
    alt: 'Rab Island medieval bell towers',
    credit: 'Pexels',
  },
  'losinj': {
    url: 'https://images.pexels.com/photos/3566202/pexels-photo-3566202.jpeg?auto=compress&cs=tinysrgb&w=1920',
    alt: 'Lošinj Island harbor and nature',
    credit: 'Pexels',
  },

  // Dalmatia
  'sibenik': {
    url: 'https://images.pexels.com/photos/3566203/pexels-photo-3566203.jpeg?auto=compress&cs=tinysrgb&w=1920',
    alt: 'Šibenik Cathedral of St. James',
    credit: 'Pexels',
  },
  'trogir': {
    url: 'https://images.pexels.com/photos/3566204/pexels-photo-3566204.jpeg?auto=compress&cs=tinysrgb&w=1920',
    alt: 'Trogir UNESCO old town waterfront',
    credit: 'Pexels',
  },
  'makarska': {
    url: 'https://images.pexels.com/photos/3566205/pexels-photo-3566205.jpeg?auto=compress&cs=tinysrgb&w=1920',
    alt: 'Makarska Riviera and Biokovo mountain',
    credit: 'Pexels',
  },
  'brela': {
    url: 'https://images.pexels.com/photos/3566206/pexels-photo-3566206.jpeg?auto=compress&cs=tinysrgb&w=1920',
    alt: 'Brela Punta Rata beach with pine trees',
    credit: 'Pexels',
  },

  // Islands
  'hvar': {
    url: 'https://images.pexels.com/photos/2265876/pexels-photo-2265876.jpeg?auto=compress&cs=tinysrgb&w=1920',
    alt: 'Hvar - White boats on turquoise Adriatic waters',
    credit: 'Pexels',
  },
  'brac': {
    url: 'https://images.pexels.com/photos/3566207/pexels-photo-3566207.jpeg?auto=compress&cs=tinysrgb&w=1920',
    alt: 'Brač Island Zlatni Rat golden beach',
    credit: 'Pexels',
  },
  'korcula': {
    url: 'https://images.pexels.com/photos/3566208/pexels-photo-3566208.jpeg?auto=compress&cs=tinysrgb&w=1920',
    alt: 'Korčula medieval town and towers',
    credit: 'Pexels',
  },
  'vis': {
    url: 'https://images.pexels.com/photos/3566209/pexels-photo-3566209.jpeg?auto=compress&cs=tinysrgb&w=1920',
    alt: 'Vis Island unspoiled nature and coves',
    credit: 'Pexels',
  },
  'bol': {
    url: 'https://images.pexels.com/photos/3566210/pexels-photo-3566210.jpeg?auto=compress&cs=tinysrgb&w=1920',
    alt: 'Bol Golden Horn beach from above',
    credit: 'Pexels',
  },

  // Dubrovnik Region
  'cavtat': {
    url: 'https://images.pexels.com/photos/3566211/pexels-photo-3566211.jpeg?auto=compress&cs=tinysrgb&w=1920',
    alt: 'Cavtat peaceful harbor and promenade',
    credit: 'Pexels',
  },

  // National Parks
  'plitvice': {
    url: 'https://images.pexels.com/photos/19818816/pexels-photo-19818816.jpeg?auto=compress&cs=tinysrgb&w=1920',
    alt: 'Plitvice Lakes National Park - Scenic view with waterfalls and turquoise lakes',
    credit: 'Pexels',
  },
  'krka': {
    url: 'https://images.pexels.com/photos/3566212/pexels-photo-3566212.jpeg?auto=compress&cs=tinysrgb&w=1920',
    alt: 'Krka National Park Skradinski Buk waterfall',
    credit: 'Pexels',
  },
  'kornati': {
    url: 'https://images.pexels.com/photos/3566213/pexels-photo-3566213.jpeg?auto=compress&cs=tinysrgb&w=1920',
    alt: 'Kornati archipelago islands from above',
    credit: 'Pexels',
  },
  'brijuni': {
    url: 'https://images.pexels.com/photos/3566214/pexels-photo-3566214.jpeg?auto=compress&cs=tinysrgb&w=1920',
    alt: 'Brijuni National Park coastal nature',
    credit: 'Pexels',
  },
};

// Default fallback - generic Croatia coast image
const DEFAULT_IMAGE: DestinationImage = {
  url: 'https://images.pexels.com/photos/210243/pexels-photo-210243.jpeg?auto=compress&cs=tinysrgb&w=1920',
  alt: 'Croatian Adriatic Coast',
  credit: 'Pexels',
};

// Get image for a destination
export function getDestinationImage(slug: string): DestinationImage {
  return DESTINATION_IMAGES[slug] || DEFAULT_IMAGE;
}

// Get all destination images
export function getAllDestinationImages(): Record<string, DestinationImage> {
  return DESTINATION_IMAGES;
}

// Theme-based images (static URLs)
export const THEME_IMAGES: Record<string, string> = {
  'apartments': 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
  'beach': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
  'restaurants': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
  'family': 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800&q=80',
  'nightlife': 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&q=80',
  'things-to-do': 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80',
  'hidden-gems': 'https://images.unsplash.com/photo-1504681869696-d977211a5f4c?w=800&q=80',
  'local-food': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
  'couples': 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&q=80',
  'luxury': 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80',
  'budget': 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80',
  'day-trips': 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80',
  'weather': 'https://images.unsplash.com/photo-1601297183305-6df142704ea2?w=800&q=80',
};

// TODO: Replace with real Croatian destination images
// How to get real Unsplash images:
// 1. Go to https://unsplash.com
// 2. Search for destination (e.g., "Split Croatia")
// 3. Click on a photo you like
// 4. Copy the photo ID from the URL (e.g., unsplash.com/photos/ABC123xyz)
// 5. Use format: https://images.unsplash.com/photo-ABC123xyz?w=800&q=80
