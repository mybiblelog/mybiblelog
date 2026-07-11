import { I18n } from "i18n-js";
import * as Localization from "expo-localization";
import { type LocaleCode, defaultLocale } from "@mybiblelog/shared";
import { en } from "./en";
import { de } from "./de";
import { es } from "./es";
import { fr } from "./fr";
import { ko } from "./ko";
import { pt } from "./pt";
import { uk } from "./uk";

export type TranslationKey = keyof typeof en;

/**
 * Locales the mobile app ships translation tables for. Tied to the shared
 * `LocaleCode` union via `satisfies`, so each entry must be a valid shared
 * locale. Expanding this set requires adding the matching table above (and a
 * label in the language settings screen). Mirrors all locales listed in the
 * shared `i18n.ts`.
 */
export const mobileLocales = [
  "en",
  "de",
  "es",
  "fr",
  "ko",
  "pt",
  "uk",
] as const satisfies readonly LocaleCode[];

export type MobileLocale = (typeof mobileLocales)[number];

export const fallbackLocale: MobileLocale = defaultLocale as MobileLocale;

export const i18n = new I18n({
  en,
  de,
  es,
  fr,
  ko,
  pt,
  uk,
});

i18n.enableFallback = true;
i18n.defaultLocale = "en";
i18n.locale = Localization.getLocales()[0]?.languageTag ?? "en";

export function t(key: TranslationKey, options?: Record<string, unknown>) {
  return i18n.t(key, options);
}
