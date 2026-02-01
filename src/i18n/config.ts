// Supported locales for BookiScout
// Covers 95%+ of Croatian tourists based on 2024 tourism data

export const locales = ['en', 'de', 'pl', 'cz', 'it', 'hu', 'sk', 'nl', 'sl', 'fr', 'es', 'ru', 'hr'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch',
  pl: 'Polski',
  cz: 'Čeština',
  it: 'Italiano',
  hu: 'Magyar',
  sk: 'Slovenčina',
  nl: 'Nederlands',
  sl: 'Slovenščina',
  fr: 'Français',
  es: 'Español',
  ru: 'Русский',
  hr: 'Hrvatski',
};

export const localeFlags: Record<Locale, string> = {
  en: '🇬🇧',
  de: '🇩🇪',
  pl: '🇵🇱',
  cz: '🇨🇿',
  it: '🇮🇹',
  hu: '🇭🇺',
  sk: '🇸🇰',
  nl: '🇳🇱',
  sl: '🇸🇮',
  fr: '🇫🇷',
  es: '🇪🇸',
  ru: '🇷🇺',
  hr: '🇭🇷',
};

// Full locale codes for HTML lang attribute and hreflang
export const localeToHtmlLang: Record<Locale, string> = {
  en: 'en-US',
  de: 'de-DE',
  pl: 'pl-PL',
  cz: 'cs-CZ',
  it: 'it-IT',
  hu: 'hu-HU',
  sk: 'sk-SK',
  nl: 'nl-NL',
  sl: 'sl-SI',
  fr: 'fr-FR',
  es: 'es-ES',
  ru: 'ru-RU',
  hr: 'hr-HR',
};
