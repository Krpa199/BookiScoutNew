/**
 * JSON-LD Schema for Stay Check page
 * Optimized for AI Overview and rich search results
 */

export default function StayCheckSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'BookiScout Stay Check',
    description: 'Free accommodation area analyzer for Croatia. Paste your Booking.com or Airbnb link and discover what the neighborhood is really like based on thousands of real guest reviews.',
    url: 'https://bookiscout.com/stay-check',
    applicationCategory: 'TravelApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free accommodation area analysis',
    },
    creator: {
      '@type': 'Organization',
      name: 'BookiScout',
      url: 'https://bookiscout.com',
    },
    featureList: [
      'Area review analysis from Google Maps',
      'Personalized scoring by traveler type',
      'Noise level assessment',
      'Walkability score',
      'Parking availability check',
      'Beach quality analysis',
      'Restaurant and cafe recommendations',
      'Budget estimation',
      'Seasonal travel advice',
      'Alternative area suggestions',
    ],
    screenshot: 'https://bookiscout.com/og-image.jpg',
    softwareVersion: '1.0',
    inLanguage: ['en', 'de', 'hr', 'it', 'fr', 'es', 'pl', 'cz', 'hu', 'sk', 'nl', 'sl', 'ru'],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is BookiScout Stay Check?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Stay Check is a free tool that analyzes the neighborhood around your booked accommodation in Croatia. It uses real Google Maps reviews from nearby restaurants, beaches, cafes, and other places to give you an honest picture of what the area is really like.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does Stay Check work?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Paste your accommodation link from Booking.com, Airbnb, or Apartmanija.hr. We geocode the location, find nearby places within 1km, analyze their Google reviews for patterns (noise, parking, crowds, prices), and generate a personalized report based on your traveler type.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is Stay Check free?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, Stay Check is completely free. We analyze real public reviews from Google Maps and provide personalized insights at no cost.',
        },
      },
      {
        '@type': 'Question',
        name: 'What platforms does Stay Check support?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Stay Check supports links from Booking.com, Airbnb, Apartmanija.hr, and Laganini.hr. You can also manually enter any accommodation name and location in Croatia.',
        },
      },
      {
        '@type': 'Question',
        name: 'Where does the review data come from?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'All review data comes from Google Maps via the official Google Places API. We analyze reviews from restaurants, cafes, beaches, parking, and other places near your accommodation. Every insight is backed by real guest experiences.',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
