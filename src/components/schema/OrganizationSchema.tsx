const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bookiscout.com';

export default function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'BookiScout',
    alternateName: 'Booki Scout',
    url: BASE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${BASE_URL}/icon.png`,
      width: 512,
      height: 512,
    },
    description: 'AI-optimized travel decision guides for Croatia. Expert recommendations for destinations, accommodations, and travel planning.',
    foundingDate: '2024',
    // What the organization does
    knowsAbout: [
      'Croatia Travel',
      'Croatian Destinations',
      'Travel Planning',
      'Vacation Guides',
      'Tourism',
      'Dalmatia',
      'Istria',
      'Croatian Islands',
      'Adriatic Coast',
    ],
    // Areas served
    areaServed: {
      '@type': 'Country',
      name: 'Croatia',
      alternateName: 'Hrvatska',
      identifier: 'HR',
    },
    // Contact and social (update when you have them)
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['English', 'Croatian', 'German', 'Italian', 'French', 'Spanish', 'Polish', 'Czech', 'Slovak', 'Hungarian', 'Dutch', 'Slovenian', 'Russian'],
    },
    // Indicates this is a travel-focused publisher
    publishingPrinciples: `${BASE_URL}/about`,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
