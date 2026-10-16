/**
 * Add missing UI strings to messages/<lang>.json. English source lives here;
 * other languages are translated once with Gemini Flash and merged in
 * (existing keys are never overwritten).
 *
 *   npx tsx scripts/translate-ui-messages.ts
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { LANGUAGES } from '../src/config/languages';

// Theme labels that had no translation (UI fell back to "Island Hopping" etc.)
const THEME_LABELS: Record<string, string> = {
  transport: 'Getting around',
  publicTransportQuality: 'Public transport',
  visaAndEntry: 'Visa & entry rules',
  vsDubrovnik: 'Compared with Dubrovnik',
  vsSplit: 'Compared with Split',
  vsZadar: 'Compared with Zadar',
  vsIstria: 'Compared with Istria',
  vsZagreb: 'Compared with Zagreb',
  islandHopping: 'Island hopping',
  sailing: 'Sailing',
  hiking: 'Hiking',
  foodAndWine: 'Food & wine',
  snorkelingAndDiving: 'Snorkelling & diving',
  campingAndGlamping: 'Camping & glamping',
  itinerary: 'Itinerary',
  whereToStay: 'Where to stay',
  costGuide: 'Costs',
  roadTrip: 'Road trip',
  safety: 'Safety',
  historyAndCulture: 'History & culture',
  photoSpots: 'Photo spots',
  prices: 'Prices',
  petFriendly: 'With pets',
  sustainableTravel: 'Sustainable travel',
  isItWorthIt: 'Is it worth it?',
  overtourismAlternatives: 'Quieter alternatives',
  price2027: 'Prices 2027',
  scamsToAvoid: 'Tourist traps to avoid',
  worthTheDayTrip: 'Is the day trip worth it?',
  connectivity: 'Internet & mobile',
  safetyForWomen: 'Safety for women',
  remoteWorkCafes: 'Cafés for remote work',
  evCharging: 'EV charging',
  rainyDay: 'Rainy day',
  withADog: 'With a dog',
  localEtiquette: 'Local etiquette',
  advent: 'Advent & Christmas markets',
  coastVsInland: 'Coast or inland',
  pool: 'Pools',
  gameOfThrones: 'Game of Thrones',
  parking: 'Parking',
};

// New guide-page UI strings (previously hardcoded English)
const DETAIL_UI: Record<string, string> = {
  name: 'Name',
  price: 'Price',
  rating: 'Rating',
  distance: 'Distance',
  category: 'Category',
  winner: 'Winner',
  comparison: 'Comparison',
  topRecommendations: 'Top recommendations',
  relatedTitle: 'Related guides',
  relatedSubtitle: 'Read next',
  photoBy: 'Photo:',
  updated: 'Updated {date}',
  onThisPage: 'On this page',
  findStay: 'Find accommodation',
  inPlace: 'in {place}',
  guests: '{count} guests',
  guestsMore: '{count}+ guests',
  searchOnBooking: 'Search on Booking.com',
  poweredByBooking: 'Powered by Booking.com',
  featured: 'Popular right now',
  scHeroDesc: 'Enter your accommodation and we analyse reviews of the restaurants, beaches, cafés and parking around it, so you know what the area is really like before you arrive.',
  scStep1Title: 'Enter your stay',
  scStep1Desc: 'Type the accommodation name and town, from Booking.com, Airbnb or anywhere else.',
  scWhatYouGet: 'What your report covers',
  scBeaches: 'Beaches nearby',
  scFood: 'Restaurants & cafés',
  scNoise: 'Noise & nightlife',
  scParking: 'Parking',
  scShops: 'Shops & essentials',
  scVerdict: 'Pros, cons & alternatives',
  scFree: 'Free · ready in about a minute',
};

const model = () =>
  new GoogleGenerativeAI(process.env.GEMINI_API_KEY_1 || '').getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: { responseMimeType: 'application/json' },
  });

async function translate(source: Record<string, string>, langName: string): Promise<Record<string, string>> {
  const prompt = `Translate the values of this JSON (UI labels for a Croatia travel-guide website) from English into ${langName}.
Keep keys unchanged. Keep placeholders like {date} exactly. Use short, natural UI wording a native ${langName} website would use.
Use sentence case (capital letter only at the start and for proper nouns) unless the language requires otherwise (e.g. German nouns).
Keep "Game of Thrones" as is. Return only the JSON.

${JSON.stringify(source)}`;
  const res = await model().generateContent(prompt);
  return JSON.parse(res.response.text());
}

async function main() {
  const source = { ...Object.fromEntries(Object.entries(THEME_LABELS).map(([k, v]) => [`theme.${k}`, v])),
                   ...Object.fromEntries(Object.entries(DETAIL_UI).map(([k, v]) => [`ui.${k}`, v])) };

  for (const lang of Object.keys(LANGUAGES)) {
    const file = `messages/${lang}.json`;
    const raw = fs.readFileSync(file, 'utf-8');
    const messages = JSON.parse(raw);
    const strings = lang === 'en' ? source : await translate(source, LANGUAGES[lang as keyof typeof LANGUAGES].name);

    messages.guides.themes ??= {};
    messages.guides.detail.ui ??= {};
    for (const [key, value] of Object.entries(strings)) {
      const [group, name] = key.split('.');
      const target = group === 'theme' ? messages.guides.themes : messages.guides.detail.ui;
      if (!(name in target)) target[name] = value;
    }
    fs.writeFileSync(file, JSON.stringify(messages, null, 2) + '\n');
    console.log(`✅ ${lang}: ${strings['theme.islandHopping']} | ${strings['ui.relatedTitle']}`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
