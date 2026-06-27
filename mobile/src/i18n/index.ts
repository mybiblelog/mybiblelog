import { I18n } from "i18n-js";
import * as Localization from "expo-localization";
import { en } from "./en";
import { es } from "./es";

export type TranslationKey = keyof typeof en;

export const i18n = new I18n({
  en,
  es,
});

i18n.enableFallback = true;
i18n.defaultLocale = "en";
i18n.locale = Localization.getLocales()[0]?.languageTag ?? "en";

export function t(key: TranslationKey, options?: Record<string, unknown>) {
  return i18n.t(key, options);
}

