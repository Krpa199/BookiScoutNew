// 13 languages covering 95%+ of Croatian tourists
export const LANGUAGES = {
  en: { name: 'English', flag: '🇬🇧', locale: 'en-US' },
  de: { name: 'Deutsch', flag: '🇩🇪', locale: 'de-DE' },
  pl: { name: 'Polski', flag: '🇵🇱', locale: 'pl-PL' },
  cz: { name: 'Čeština', flag: '🇨🇿', locale: 'cs-CZ' },
  it: { name: 'Italiano', flag: '🇮🇹', locale: 'it-IT' },
  hu: { name: 'Magyar', flag: '🇭🇺', locale: 'hu-HU' },
  sk: { name: 'Slovenčina', flag: '🇸🇰', locale: 'sk-SK' },
  nl: { name: 'Nederlands', flag: '🇳🇱', locale: 'nl-NL' },
  sl: { name: 'Slovenščina', flag: '🇸🇮', locale: 'sl-SI' },
  fr: { name: 'Français', flag: '🇫🇷', locale: 'fr-FR' },
  es: { name: 'Español', flag: '🇪🇸', locale: 'es-ES' },
  ru: { name: 'Русский', flag: '🇷🇺', locale: 'ru-RU' },
  hr: { name: 'Hrvatski', flag: '🇭🇷', locale: 'hr-HR' },
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

// Tourist percentage by country (2024 data)
export const TOURIST_SHARE = {
  de: 27.4, // Germany + Austria
  sl: 9.8,
  pl: 8.3,
  cz: 5.7,
  it: 4.6,
  hu: 4.6,
  sk: 4.0,
  en: 4.0, // UK + others
  nl: 3.4,
  fr: 2.5,
  es: 3.2, // Spain - growing market
  ru: 1.5, // Russia - reduced but still present
  hr: 10.0, // Domestic
  // Total: ~89% direct + English for rest = 95%+ coverage
} as const;
