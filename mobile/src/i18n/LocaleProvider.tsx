import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { type TranslationKey, i18n } from "@/src/i18n";

export type SupportedLocale = "en" | "es";

const STORAGE_KEY = "locale.v1";

function getDevicePreferredLocale(): SupportedLocale {
  const languageCode = Localization.getLocales()[0]?.languageCode;
  return languageCode === "es" ? "es" : "en";
}

function normalizeLocale(value: unknown): SupportedLocale | null {
  if (value === "en" || value === "es") return value;
  return null;
}

type LocaleContextValue = {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(
    getDevicePreferredLocale()
  );

  // Initialize i18n right away (so first render uses a supported locale).
  i18n.locale = locale;

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const normalized = normalizeLocale(stored);
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
    void AsyncStorage.setItem(STORAGE_KEY, locale);
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
    (key: TranslationKey, options?: Record<string, unknown>) =>
      i18n.t(key, { ...options, locale }),
    [locale]
  );
}

