import * as Localization from "expo-localization";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  type MobileLocale,
  type TranslationKey,
  fallbackLocale,
  i18n,
  mobileLocales,
} from "@/src/i18n";
import { appStorage } from "@/src/storage/keys";

/** Locales the app ships translations for (mirrors shared product locales). */
export type SupportedLocale = MobileLocale;

function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === "string" && (mobileLocales as readonly string[]).includes(value);
}

function getDevicePreferredLocale(): SupportedLocale {
  const languageCode = Localization.getLocales()[0]?.languageCode;
  return isSupportedLocale(languageCode) ? languageCode : fallbackLocale;
}

function normalizeLocale(value: unknown): SupportedLocale | null {
  return isSupportedLocale(value) ? value : null;
}

type LocaleContextValue = {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    const initial = getDevicePreferredLocale();
    // Initialize the ambient i18n locale once (for the standalone `t()`
    // helper); `useT` always passes the locale explicitly, and the effect
    // below keeps the ambient value in sync on changes.
    i18n.locale = initial;
    return initial;
  });

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const normalized = normalizeLocale(await appStorage.get("locale"));
        if (isMounted && normalized) {
          setLocaleState(normalized);
        }
      } catch (err) {
        console.warn("Failed to load locale", err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    i18n.locale = locale;
    void appStorage.set("locale", locale);
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale: (next) => setLocaleState(next),
    }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}

export function useT() {
  const { locale } = useLocale();
  return useCallback(
    (key: TranslationKey, options?: Record<string, unknown>) => i18n.t(key, { ...options, locale }),
    [locale]
  );
}
