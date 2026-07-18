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

export default defineI18nConfig(() => ({
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
