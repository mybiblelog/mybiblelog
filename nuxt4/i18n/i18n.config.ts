// This file is kept for reference; the active config loaded by @nuxtjs/i18n is app/i18n.config.ts
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
