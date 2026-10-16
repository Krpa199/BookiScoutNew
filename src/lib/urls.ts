import { locales, defaultLocale } from '@/i18n/config';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bookiscout.com';

/**
 * Public URL for a page in a locale. Matches the middleware's
 * `localePrefix: 'as-needed'`: English has NO prefix (/en/... 307-redirects to /...),
 * so canonical/hreflang must never point at /en/....
 */
export function localizedUrl(locale: string, path: string = ''): string {
  return locale === defaultLocale ? `${SITE_URL}${path}` : `${SITE_URL}/${locale}${path}`;
}

/** hreflang value: language-only ISO 639-1 (not de-DE — that would exclude Austria).
 *  Our Czech locale is "cz" (a country code); the language code is "cs". */
export function hreflangCode(locale: string): string {
  return locale === 'cz' ? 'cs' : locale;
}

/** hreflang map for the given locales, plus x-default → English when available. */
export function hreflangLanguages(path: string, available: readonly string[] = locales): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const loc of available) languages[hreflangCode(loc)] = localizedUrl(loc, path);
  if (available.includes(defaultLocale)) languages['x-default'] = localizedUrl(defaultLocale, path);
  return languages;
}

/** Next.js `alternates` metadata: self-canonical + hreflang. */
export function localeAlternates(locale: string, path: string, available?: readonly string[]) {
  return {
    canonical: localizedUrl(locale, path),
    languages: hreflangLanguages(path, available),
  };
}
