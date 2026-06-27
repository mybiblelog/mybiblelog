import { brand } from "./brand";

export type ColorSchemeName = "light" | "dark";

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  mutedText: string;
  border: string;
  primary: string;
  secondary: string;
  tertiary: string;
  success: string;
  onPrimary: string;
  destructive: string;
  onDestructive: string;
  backdrop: string;
  placeholder: string;
};

export const colorsByScheme: Record<ColorSchemeName, ThemeColors> = {
  light: {
    background: "#ffffff",
    surface: "#ffffff",
    surfaceAlt: "rgba(0,0,0,0.06)",
    text: "#111111",
    mutedText: "rgba(0,0,0,0.65)",
    border: "rgba(0,0,0,0.15)",
    primary: brand.primary,
    secondary: brand.secondary,
    tertiary: brand.tertiary,
    success: brand.success,
    onPrimary: "#ffffff",
    destructive: "#b00020",
    onDestructive: "#ffffff",
    backdrop: "rgba(0,0,0,0.35)",
    placeholder: "rgba(0,0,0,0.45)",
  },
  dark: {
    background: "#0b0b0f",
    surface: "#11111a",
    surfaceAlt: "rgba(255,255,255,0.08)",
    text: "#f5f5f7",
    mutedText: "rgba(245,245,247,0.70)",
    border: "rgba(245,245,247,0.18)",
    primary: brand.primary,
    secondary: brand.secondary,
    tertiary: brand.tertiary,
    success: brand.success,
    onPrimary: "#ffffff",
    destructive: "#ff5a6a",
    onDestructive: "#0b0b0f",
    backdrop: "rgba(0,0,0,0.55)",
    placeholder: "rgba(245,245,247,0.45)",
  },
};

