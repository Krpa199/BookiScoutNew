import { MetadataRoute } from 'next';
import { DESTINATIONS } from '@/config/destinations';
import { locales, defaultLocale } from '@/i18n/config';
import fs from 'fs';
import path from 'path';
import { SITE_URL as BASE_URL, hreflangLanguages } from '@/lib/urls';

// hreflang alternates (language-only codes, cs not cz, x-default → English)
function createAlternates(basePath: string, available?: readonly string[]): Record<string, string> {
  return hreflangLanguages(basePath, available);
}

const ARTICLES_DIR = path.join(process.cwd(), 'src', 'content', 'articles');

// Which locales each guide exists in — hreflang must not point at 404s.
function getGuideLocales(): Map<string, string[]> {
  const bySlug = new Map<string, string[]>();
  for (const locale of locales) {
    const dir = path.join(ARTICLES_DIR, locale);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.json')) continue;
      const slug = file.replace('.json', '');
      const list = bySlug.get(slug) ?? [];
      list.push(locale);
      bySlug.set(slug, list);
    }
  }
  return bySlug;
}

// Real last-modified date of a guide (EN version, else any locale). Using the
// deploy time for every URL made all 2,600 entries look "changed" on each
// deploy, so Google ignored our lastmod and Bing recrawled blindly.
function getGuideLastModified(slug: string, guideLocales: string[]): Date | undefined {
  const locale = guideLocales.includes(defaultLocale) ? defaultLocale : guideLocales[0];
  try {
    const a = JSON.parse(fs.readFileSync(path.join(ARTICLES_DIR, locale, `${slug}.json`), 'utf-8'));
    const iso = a.updatedAt || a.generatedAt;
    return iso ? new Date(iso) : undefined;
  } catch {
    return undefined;
  }
}

// Articles per page must match _lib/get-articles.ts:ARTICLES_PER_PAGE.
const GUIDES_PER_PAGE = 60;

// Count article files in a locale's content dir.
function getArticleCount(locale: string): number {
  const dir = path.join(process.cwd(), 'src', 'content', 'articles', locale);
  try {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      return fs.readdirSync(dir).filter(f => f.endsWith('.json')).length;
    }
  } catch {
    /* missing */
  }
  return 0;
}

// Get all stay-check area page slugs
function getStayCheckSlugs(): string[] {
  const slugs: string[] = [];
  const dir = path.join(process.cwd(), 'src', 'content', 'stay-check', 'en');

  try {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          slugs.push(file.replace('.json', ''));
        }
      }
    }
  } catch {
    // Directory doesn't exist yet
  }

  return slugs;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const guideLocales = getGuideLocales();
  const guideSlugs = [...guideLocales.keys()];
  const guideDates = new Map(guideSlugs.map(slug => [slug, getGuideLastModified(slug, guideLocales.get(slug)!)]));

  // A destination page changes when one of its guides does
  const destinationLastModified = (destSlug: string): Date | undefined => {
    let latest: Date | undefined;
    for (const [slug, date] of guideDates) {
      if (date && slug.startsWith(`${destSlug}-`) && (!latest || date > latest)) latest = date;
    }
    return latest;
  };

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
  // PAGINATED GUIDES LISTING - per-locale (counts differ per locale)
  // ============================================
  for (const locale of locales) {
    const count = getArticleCount(locale);
    const totalPages = Math.max(1, Math.ceil(count / GUIDES_PER_PAGE));
    for (let n = 2; n <= totalPages; n++) {
      const localePrefix = locale === defaultLocale ? '' : `/${locale}`;
      entries.push({
        url: `${BASE_URL}${localePrefix}/guides/page/${n}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
  }

  // ============================================
  // STAY CHECK - All languages (main product)
  // ============================================
  entries.push({
    url: `${BASE_URL}/stay-check`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.95,
    alternates: {
      languages: createAlternates('/stay-check'),
    },
  });

  // ============================================
  // STATIC PAGES - English only (legal/info pages)
  // ============================================
  const staticPages = ['about', 'contact', 'privacy', 'terms'];
  for (const page of staticPages) {
    entries.push({
      url: `${BASE_URL}/${page}`,
      changeFrequency: 'monthly',
      priority: 0.5,
    });
  }

  // ============================================
  // INDIVIDUAL DESTINATIONS - All languages
  // ============================================
  for (const dest of DESTINATIONS) {
    entries.push({
      url: `${BASE_URL}/destinations/${dest.slug}`,
      lastModified: destinationLastModified(dest.slug),
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
      lastModified: guideDates.get(slug),
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: {
        languages: createAlternates(`/guides/${slug}`, guideLocales.get(slug)),
      },
    });
  }

  // ============================================
  // STAY CHECK AREA PAGES - All languages
  // ============================================
  const stayCheckSlugs = getStayCheckSlugs();
  for (const slug of stayCheckSlugs) {
    entries.push({
      url: `${BASE_URL}/stay-check/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.85,
      alternates: {
        languages: createAlternates(`/stay-check/${slug}`),
      },
    });
  }

  return entries;
}
