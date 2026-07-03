/**
 * Color tokens.
 *
 * `brand` holds the raw, scheme-independent brand hues. `colorsByScheme`
 * maps semantic roles (background, surface, text, primary, …) to concrete
 * values per light/dark scheme. Always reference semantic roles via
 * `useTheme().colors` — never import raw `brand` values into a screen.
 */

export const brand = {
  primary: "#00aaf9",
  secondary: "#0965f7",
  tertiary: "#00d1b2",
  success: "#00cc00",
} as const;

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
  /** Subtle highlight tint used by skeletons / shimmer. */
  skeleton: string;
  /** Decorative gold used for "fully read" stars (same in both schemes). */
  starGold: string;
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
    skeleton: "rgba(0,0,0,0.08)",
    starGold: "#ffd700",
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
    skeleton: "rgba(245,245,247,0.10)",
    starGold: "#ffd700",
  },
};
