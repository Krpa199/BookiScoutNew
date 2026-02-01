import { MetadataRoute } from 'next';
import { DESTINATIONS } from '@/config/destinations';
import { locales, defaultLocale } from '@/i18n/config';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bookiscout.com';

// Helper to create alternates for all languages
function createAlternates(basePath: string): Record<string, string> {
  const alternates: Record<string, string> = {};

  for (const locale of locales) {
    if (locale === defaultLocale) {
      // Default locale has no prefix
      alternates[locale] = `${BASE_URL}${basePath}`;
    } else {
      alternates[locale] = `${BASE_URL}/${locale}${basePath}`;
    }
  }

  // x-default points to the default locale version
  alternates['x-default'] = `${BASE_URL}${basePath}`;

  return alternates;
}

// Get all guide slugs
function getGuideSlugs(): string[] {
  const slugs: string[] = [];
  const guidesDir = path.join(process.cwd(), 'src', 'content', 'guides');

  try {
    // Check first available language directory
    for (const locale of locales) {
      const langDir = path.join(guidesDir, locale);
      if (fs.existsSync(langDir) && fs.statSync(langDir).isDirectory()) {
        const files = fs.readdirSync(langDir);
        for (const file of files) {
          if (file.endsWith('.json')) {
            const slug = file.replace('.json', '');
            if (!slugs.includes(slug)) {
              slugs.push(slug);
            }
          }
        }
      }
    }
  } catch (error) {
    // Directory doesn't exist yet
  }

  return slugs;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const guideSlugs = getGuideSlugs();

  const entries: MetadataRoute.Sitemap = [];

  // ============================================
  // HOMEPAGE - All languages
  // ============================================
  entries.push({
    url: BASE_URL,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 1.0,
    alternates: {
      languages: createAlternates(''),
    },
  });

  // ============================================
  // DESTINATIONS LISTING - All languages
  // ============================================
  entries.push({
    url: `${BASE_URL}/destinations`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.9,
    alternates: {
      languages: createAlternates('/destinations'),
    },
  });

  // ============================================
  // GUIDES LISTING - All languages
  // ============================================
  entries.push({
    url: `${BASE_URL}/guides`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.9,
    alternates: {
      languages: createAlternates('/guides'),
    },
  });

  // ============================================
  // INDIVIDUAL DESTINATIONS - All languages
  // ============================================
  for (const dest of DESTINATIONS) {
    entries.push({
      url: `${BASE_URL}/destinations/${dest.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: dest.popular ? 0.85 : 0.7,
      alternates: {
        languages: createAlternates(`/destinations/${dest.slug}`),
      },
    });
  }

  // ============================================
  // INDIVIDUAL GUIDES - All languages
  // ============================================
  for (const slug of guideSlugs) {
    entries.push({
      url: `${BASE_URL}/guides/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: {
        languages: createAlternates(`/guides/${slug}`),
      },
    });
  }

  return entries;
}
