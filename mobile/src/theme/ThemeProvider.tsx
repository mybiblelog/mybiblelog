import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";
import { type ColorSchemeName, colorsByScheme } from "./colors";

export type ThemeMode = "system" | "light" | "dark";

const STORAGE_KEY = "themeMode.v1";

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  scheme: ColorSchemeName;
  colors: (typeof colorsByScheme)[ColorSchemeName];
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function normalizeMode(value: unknown): ThemeMode | null {
  if (value === "system" || value === "light" || value === "dark") return value;
  return null;
}

function resolveScheme(mode: ThemeMode, system: string | null): ColorSchemeName {
  if (mode === "light") return "light";
  if (mode === "dark") return "dark";
  return system === "dark" ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme(); // "light" | "dark" | null
  const [mode, setModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const normalized = normalizeMode(stored);
        if (isMounted && normalized) setModeState(normalized);
      } catch (err) {
        console.warn("Failed to load theme mode", err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    void AsyncStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const scheme = resolveScheme(mode, systemScheme);
  const colors = colorsByScheme[scheme];

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      setMode: (next) => setModeState(next),
      scheme,
      colors,
    }),
    [colors, mode, scheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

