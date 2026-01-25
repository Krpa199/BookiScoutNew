import { MetadataRoute } from 'next';
import { DESTINATIONS } from '@/config/destinations';
import { LANGUAGES } from '@/config/languages';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bookiscout.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = Object.keys(LANGUAGES);
  const now = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/destinations`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];

  // Language homepages
  const languagePages: MetadataRoute.Sitemap = languages.map(lang => ({
    url: `${BASE_URL}/${lang}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  // Destination pages
  const destinationPages: MetadataRoute.Sitemap = DESTINATIONS.map(dest => ({
    url: `${BASE_URL}/destinations/${dest.slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: dest.popular ? 0.8 : 0.7,
  }));

  return [...staticPages, ...languagePages, ...destinationPages];
}
