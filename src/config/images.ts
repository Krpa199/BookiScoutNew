// Image configuration for Croatian destinations
// Using Pexels free images (no attribution required)

export interface DestinationImage {
  url: string;
  alt: string;
  credit?: string;
}

// Free high-quality images from Unsplash
// Croatian destination photos
const DESTINATION_IMAGES: Record<string, DestinationImage> = {
  // Major Cities
  'split': {
    url: 'https://plus.unsplash.com/premium_photo-1661885874118-09b795064a3c?w=1920&auto=format&fit=crop&q=80',
    alt: 'Split, Croatia - Coastal view with harbor and mountains',
    credit: 'Unsplash',
  },
  'dubrovnik': {
    url: 'https://images.unsplash.com/photo-1626699848008-7e419bc4e237?w=1920&auto=format&fit=crop&q=80',
    alt: 'Dubrovnik Old Town - Aerial view of historic old town and Adriatic Sea',
    credit: 'Unsplash',
  },
  'zagreb': {
    url: 'https://plus.unsplash.com/premium_photo-1661962786120-eecfb7a94778?w=1920&auto=format&fit=crop&q=80',
    alt: 'Zagreb Cathedral and historic center',
    credit: 'Unsplash',
  },
  'zadar': {
    url: 'https://images.unsplash.com/photo-1689693661258-4240f272a473?w=1920&auto=format&fit=crop&q=80',
    alt: 'Zadar Sea Organ sunset',
    credit: 'Unsplash',
  },
  'rijeka': {
    url: 'https://images.unsplash.com/photo-1654969936668-e8a5532aa1c7?w=1920&auto=format&fit=crop&q=80',
    alt: 'Rijeka harbor and city center',
    credit: 'Unsplash',
  },
  'pula': {
    url: 'https://images.unsplash.com/photo-1681500669814-ca219efa0514?w=1920&auto=format&fit=crop&q=80',
    alt: 'Pula Roman Arena amphitheater',
    credit: 'Unsplash',
  },

  // Istria
  'rovinj': {
    url: 'https://plus.unsplash.com/premium_photo-1661887265795-919eb4cc1882?w=1920&auto=format&fit=crop&q=80',
    alt: 'Rovinj - Coastal Croatian town with colorful buildings',
    credit: 'Unsplash',
  },
  'labin': {
    url: 'https://plus.unsplash.com/premium_photo-1661887454307-432f4f394791?w=1920&auto=format&fit=crop&q=80',
    alt: 'Labin historic hilltop town in Istria',
    credit: 'Unsplash',
  },
  'porec': {
    url: 'https://images.unsplash.com/photo-1691226203872-0837903332c8?w=1920&auto=format&fit=crop&q=80',
    alt: 'Poreč historic center and basilica',
    credit: 'Unsplash',
  },
  'umag': {
    url: '/images/destinations/umag.jpg',
    alt: 'Umag Istrian coastline and beaches',
    credit: 'Local',
  },
  'motovun': {
    url: 'https://images.unsplash.com/photo-1636144545669-49f6d58833fb?w=1920&auto=format&fit=crop&q=80',
    alt: 'Motovun hilltop medieval town',
    credit: 'Unsplash',
  },
  'novigrad': {
    url: 'https://images.unsplash.com/photo-1542571539-183913214de8?w=1920&auto=format&fit=crop&q=80',
    alt: 'Novigrad historic coastal town',
    credit: 'Unsplash',
  },
  'vrsar': {
    url: '/images/destinations/vrsar.jpg',
    alt: 'Vrsar picturesque Istrian town',
    credit: 'Local',
  },
  'fazana': {
    url: '/images/destinations/fazana.jpg',
    alt: 'Fažana fishing village near Brijuni',
    credit: 'Local',
  },
  'medulin': {
    url: '/images/destinations/medulin.jpg',
    alt: 'Medulin beaches and coastline',
    credit: 'Local',
  },
  'rabac': {
    url: '/images/destinations/rabac.jpg',
    alt: 'Rabac pearl of Kvarner Bay',
    credit: 'Local',
  },
  'groznjan': {
    url: '/images/destinations/groznjan.jpg',
    alt: 'Grožnjan artists town in Istria',
    credit: 'Local',
  },

  // Kvarner
  'opatija': {
    url: 'https://images.unsplash.com/photo-1654901679289-2782bd59dd52?w=1920&auto=format&fit=crop&q=80',
    alt: 'Opatija riviera and Lungomare promenade',
    credit: 'Unsplash',
  },
  'krk': {
    url: 'https://images.unsplash.com/photo-1626094905396-9cea81cc81a2?w=1920&auto=format&fit=crop&q=80',
    alt: 'Krk Island old town and beaches',
    credit: 'Unsplash',
  },
  'rab': {
    url: 'https://images.unsplash.com/photo-1539601591461-2a5e0edb6915?w=1920&auto=format&fit=crop&q=80',
    alt: 'Rab Island medieval bell towers',
    credit: 'Unsplash',
  },
  'losinj': {
    url: 'https://images.unsplash.com/photo-1594239330158-2e0042ff9766?w=1920&auto=format&fit=crop&q=80',
    alt: 'Lošinj Island harbor and nature',
    credit: 'Unsplash',
  },
  'crikvenica': {
    url: 'https://images.unsplash.com/photo-1698972654886-3f809666afc7?w=1920&auto=format&fit=crop&q=80',
    alt: 'Crikvenica beach resort town',
    credit: 'Unsplash',
  },
  'novi-vinodolski': {
    url: 'https://images.unsplash.com/photo-1745311634909-6d1d288b7f2f?w=1920&auto=format&fit=crop&q=80',
    alt: 'Novi Vinodolski coastal town',
    credit: 'Unsplash',
  },
  'lovran': {
    url: 'https://images.unsplash.com/photo-1621412524294-d5608a29160e?w=1920&auto=format&fit=crop&q=80',
    alt: 'Lovran historic town on Opatija riviera',
    credit: 'Unsplash',
  },
  'cres': {
    url: '/images/destinations/cres.jpg',
    alt: 'Cres Island nature and town',
    credit: 'Local',
  },

  // Dalmatia
  'sibenik': {
    url: 'https://plus.unsplash.com/premium_photo-1661963145574-d20ef3324451?w=1920&auto=format&fit=crop&q=80',
    alt: 'Šibenik Cathedral of St. James',
    credit: 'Unsplash',
  },
  'trogir': {
    url: 'https://images.unsplash.com/photo-1621848064451-efdb9232fb38?w=1920&auto=format&fit=crop&q=80',
    alt: 'Trogir UNESCO old town waterfront',
    credit: 'Unsplash',
  },
  'makarska': {
    url: 'https://images.unsplash.com/photo-1630521553027-c57d0793c4c7?w=1920&auto=format&fit=crop&q=80',
    alt: 'Makarska Riviera and Biokovo mountain',
    credit: 'Unsplash',
  },
  'brela': {
    url: 'https://images.unsplash.com/photo-1757002370559-897a82d96912?w=1920&auto=format&fit=crop&q=80',
    alt: 'Brela Punta Rata beach with pine trees',
    credit: 'Unsplash',
  },
  'omis': {
    url: 'https://images.unsplash.com/photo-1685291431649-6778b46b923f?w=1920&auto=format&fit=crop&q=80',
    alt: 'Omiš town at Cetina river canyon',
    credit: 'Unsplash',
  },
  'baska-voda': {
    url: '/images/destinations/baska-voda.jpg',
    alt: 'Baška Voda beach and promenade',
    credit: 'Local',
  },
  'tucepi': {
    url: '/images/destinations/tucepi.jpg',
    alt: 'Tučepi beach under Biokovo mountain',
    credit: 'Local',
  },
  'podgora': {
    url: '/images/destinations/podgora.jpg',
    alt: 'Podgora coastal town on Makarska Riviera',
    credit: 'Local',
  },
  'biograd': {
    url: 'https://images.unsplash.com/photo-1646434171915-2fd324ec9650?w=1920&auto=format&fit=crop&q=80',
    alt: 'Biograd na Moru historic coastal town',
    credit: 'Unsplash',
  },
  'vodice': {
    url: 'https://images.unsplash.com/photo-1686991440039-40029484fc07?w=1920&auto=format&fit=crop&q=80',
    alt: 'Vodice beach resort town',
    credit: 'Unsplash',
  },
  'primosten': {
    url: 'https://images.unsplash.com/photo-1553773077-91673524aafa?w=1920&auto=format&fit=crop&q=80',
    alt: 'Primošten peninsula town',
    credit: 'Unsplash',
  },
  'nin': {
    url: 'https://images.unsplash.com/photo-1739088771544-3bc8c5216733?w=1920&auto=format&fit=crop&q=80',
    alt: 'Nin historic royal Croatian town',
    credit: 'Unsplash',
  },

  // Islands
  'hvar': {
    url: 'https://plus.unsplash.com/premium_photo-1661887156382-edf8a21e4c28?w=1920&auto=format&fit=crop&q=80',
    alt: 'Hvar - White boats on turquoise Adriatic waters',
    credit: 'Unsplash',
  },
  'brac': {
    url: 'https://images.unsplash.com/photo-1614543116033-c4197bea2ec1?w=1920&auto=format&fit=crop&q=80',
    alt: 'Brač Island Zlatni Rat golden beach',
    credit: 'Unsplash',
  },
  'korcula': {
    url: 'https://images.unsplash.com/photo-1483652336121-476f6270c7d3?w=1920&auto=format&fit=crop&q=80',
    alt: 'Korčula medieval town and towers',
    credit: 'Unsplash',
  },
  'vis': {
    url: 'https://images.unsplash.com/photo-1631897886669-21e552363c34?w=1920&auto=format&fit=crop&q=80',
    alt: 'Vis Island unspoiled nature and coves',
    credit: 'Unsplash',
  },
  'bol': {
    url: 'https://plus.unsplash.com/premium_photo-1754272806188-aeeecff4d490?w=1920&auto=format&fit=crop&q=80',
    alt: 'Bol Golden Horn beach from above',
    credit: 'Unsplash',
  },
  'mljet': {
    url: 'https://images.unsplash.com/photo-1632154613912-db7c10789160?w=1920&auto=format&fit=crop&q=80',
    alt: 'Mljet island national park',
    credit: 'Unsplash',
  },
  'supetar': {
    url: '/images/destinations/supetar.jpg',
    alt: 'Supetar town on Brač island',
    credit: 'Local',
  },
  'stari-grad': {
    url: '/images/destinations/stari-grad.jpg',
    alt: 'Stari Grad on Hvar island',
    credit: 'Local',
  },
  'jelsa': {
    url: 'https://images.unsplash.com/photo-1502542210750-7c978b400449?w=1920&auto=format&fit=crop&q=80',
    alt: 'Jelsa town on Hvar island',
    credit: 'Unsplash',
  },
  'lopud': {
    url: 'https://images.unsplash.com/photo-1715401894632-9254a0ff0e3a?w=1920&auto=format&fit=crop&q=80',
    alt: 'Lopud island near Dubrovnik',
    credit: 'Unsplash',
  },

  // Dubrovnik Region
  'cavtat': {
    url: 'https://images.unsplash.com/photo-1436638844003-fc74b29810d5?w=1920&auto=format&fit=crop&q=80',
    alt: 'Cavtat peaceful harbor and promenade',
    credit: 'Unsplash',
  },
  'orebic': {
    url: '/images/destinations/orebic.jpg',
    alt: 'Orebić town on Pelješac peninsula',
    credit: 'Local',
  },
  'ston': {
    url: '/images/destinations/ston.jpg',
    alt: 'Ston walls and salt pans',
    credit: 'Local',
  },
  'slano': {
    url: '/images/destinations/slano.jpg',
    alt: 'Slano bay near Dubrovnik',
    credit: 'Local',
  },

  // National Parks
  'plitvice': {
    url: 'https://plus.unsplash.com/premium_photo-1661887188245-416a527406b7?w=1920&auto=format&fit=crop&q=80',
    alt: 'Plitvice Lakes National Park - Scenic view with waterfalls and turquoise lakes',
    credit: 'Unsplash',
  },
  'krka': {
    url: 'https://images.unsplash.com/photo-1554585343-acd99e31977b?w=1920&auto=format&fit=crop&q=80',
    alt: 'Krka National Park Skradinski Buk waterfall',
    credit: 'Unsplash',
  },
  'kornati': {
    url: 'https://images.unsplash.com/photo-1744144081946-7b2125836a69?w=1920&auto=format&fit=crop&q=80',
    alt: 'Kornati archipelago islands from above',
    credit: 'Unsplash',
  },
  'brijuni': {
    url: 'https://images.unsplash.com/photo-1635760802693-48283b1cebb2?w=1920&auto=format&fit=crop&q=80',
    alt: 'Brijuni National Park coastal nature',
    credit: 'Unsplash',
  },
  'paklenica': {
    url: '/images/destinations/paklenica.jpg',
    alt: 'Paklenica National Park canyon',
    credit: 'Local',
  },

  // Continental
  'osijek': {
    url: 'https://plus.unsplash.com/premium_photo-1677340932064-d1c120e8285b?w=1920&auto=format&fit=crop&q=80',
    alt: 'Osijek city center and cathedral',
    credit: 'Unsplash',
  },
  'varazdin': {
    url: 'https://images.unsplash.com/photo-1648364395206-84a8e8b92e85?w=1920&auto=format&fit=crop&q=80',
    alt: 'Varaždin baroque city',
    credit: 'Unsplash',
  },
  'karlovac': {
    url: '/images/destinations/karlovac.jpg',
    alt: 'Karlovac star-shaped city',
    credit: 'Local',
  },
  'samobor': {
    url: '/images/destinations/samobor.jpg',
    alt: 'Samobor historic town near Zagreb',
    credit: 'Local',
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
