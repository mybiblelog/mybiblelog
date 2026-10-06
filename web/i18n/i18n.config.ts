// Loaded by @nuxtjs/i18n as the Vue I18n config. The module resolves this from
// its `restructureDir` (default `i18n/`), so the file must live here — not under
// app/. It supplies the global message catalog (locales.ts) consumed app-wide,
// including api_error.* used by $terr for form validation messages.
import locales from './locales/locales';

const numberFormats = {
  decimal: { style: 'decimal' as const, minimumFractionDigits: 0, maximumFractionDigits: 2 },
  percent: { style: 'percent' as const, minimumFractionDigits: 0, maximumFractionDigits: 2 },
  grouped: { style: 'decimal' as const, useGrouping: true, minimumFractionDigits: 0, maximumFractionDigits: 0 },
};

// Ukrainian has three plural forms (1 / 2-4 / 5+, with the 11-14 exception); vue-i18n's
// default rule only distinguishes singular from plural. Messages use "one | few | many".
const ukrainianPlural = (choice: number, choicesLength: number): number => {
  if (choicesLength < 3) {
    return choice === 1 ? 0 : 1;
  }
  const mod10 = choice % 10;
  const mod100 = choice % 100;
  if (mod10 === 1 && mod100 !== 11) { return 0; }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) { return 1; }
  return 2;
};

export default defineI18nConfig(() => ({
  pluralRules: {
    uk: ukrainianPlural,
  },
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  silentFallbackWarn: true,
  numberFormats: {
    en: numberFormats,
    de: numberFormats,
    es: numberFormats,
    fr: numberFormats,
    ko: numberFormats,
    pt: numberFormats,
    uk: numberFormats,
  },
  messages: locales,
}));
