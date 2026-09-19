// Shared i18n configuration that works for both API and Nuxt
export type LocaleCode = 'en' | 'de' | 'es' | 'fr' | 'ko' | 'pt' | 'uk';

export interface Locale {
  code: LocaleCode;
  name: string;
}

export const locales: Locale[] = [
  // The only place where English is hoisted out of alphabetical order
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'ko', name: '한국어' },
  { code: 'pt', name: 'Português' },
  { code: 'uk', name: 'українська' },
];

export const defaultLocale: LocaleCode = 'en';

export const getLocaleCodes = (): LocaleCode[] => {
  return locales.map((locale) => locale.code);
};

export const isValidLocaleCode = (code: string): code is LocaleCode => {
  return locales.some((locale) => locale.code === code);
};
