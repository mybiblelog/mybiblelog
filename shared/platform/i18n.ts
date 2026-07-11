// Shared i18n configuration that works for both API and Nuxt
export type LocaleCode = 'en' | 'de' | 'es' | 'fr' | 'ko' | 'pt' | 'uk';

export interface Locale {
  code: LocaleCode;
  iso: string;
  name: string;
}

export const locales: Locale[] = [
  // The only place where English is hoisted out of alphabetical order
  { code: 'en', iso: 'en-US', name: 'English' },
  { code: 'de', iso: 'de-DE', name: 'Deutsch' },
  { code: 'es', iso: 'es-ES', name: 'Español' },
  { code: 'fr', iso: 'fr-FR', name: 'Français' },
  { code: 'ko', iso: 'ko-KR', name: '한국어' },
  { code: 'pt', iso: 'pt-BR', name: 'Português' },
  { code: 'uk', iso: 'uk-UA', name: 'українська' },
];

export const defaultLocale: LocaleCode = 'en';

// Helper function to get locale codes
export const getLocaleCodes = (): LocaleCode[] => {
  return locales.map((locale) => locale.code);
};

// Helper function to check if a locale code is valid
export const isValidLocaleCode = (code: string): code is LocaleCode => {
  return locales.some((locale) => locale.code === code);
};
