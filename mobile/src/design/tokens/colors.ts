/**
 * Color tokens.
 *
 * `brand` holds the raw, scheme-independent brand hues. `colorsByScheme`
 * maps semantic roles (background, surface, text, primary, …) to concrete
 * values per light/dark scheme. Always reference semantic roles via
 * `useTheme().colors` — never import raw `brand` values into a screen.
 *
 * Roles mirror web's `--mbl-*` semantic layer (`web/app/assets/css/tokens.css`),
 * which is the source of truth for style. The mapping is noted per role so a
 * value can be checked against web without guessing which token it came from.
 */

export const brand = {
  primary: "#00aaf9",
  secondary: "#0965f7",
  tertiary: "#00d1b2",
} as const;

export type ColorSchemeName = "light" | "dark";

export type ThemeColors = {
  /** Outer canvas behind all surfaces (web `--mbl-app-canvas-bg`). */
  background: string;
  /** Primary surface — nav, sheets (web `--mbl-bg`). */
  surface: string;
  /** Cards and list tiles; lifts above `surface` in dark (web `--mbl-bg-elevated`). */
  surfaceElevated: string;
  /** Muted fill — secondary buttons, disabled states (web `--mbl-bg-muted`). */
  surfaceMuted: string;
  /** Barely-there fill (web `--mbl-bg-subtle`). */
  surfaceSubtle: string;
  /** Primary text (web `--mbl-text`). */
  text: string;
  /** Body copy, a step softer than `text` (web `--mbl-text-body`). */
  textBody: string;
  /** De-emphasized text (web `--mbl-text-muted`). */
  mutedText: string;
  border: string;
  /** Heavier rule — grid outlines, dotted underlines (web `--mbl-border-strong`). */
  borderStrong: string;
  /** Hairline rule, also the skeleton bar fill (web `--mbl-border-soft`). */
  borderSoft: string;
  primary: string;
  secondary: string;
  tertiary: string;
  success: string;
  warning: string;
  onWarning: string;
  info: string;
  onPrimary: string;
  destructive: string;
  onDestructive: string;
  /** Interactive accent (web `--mbl-link`). */
  link: string;
  /** Saturated accent used for progress fills (web `--mbl-link-bright`). */
  linkBright: string;
  /** Softer accent for contextual row headers (web `--mbl-link-muted`). */
  linkMuted: string;
  progressTrack: string;
  progressFillInactive: string;
  backdrop: string;
  placeholder: string;
  /** Subtle highlight tint used by skeletons / shimmer. */
  skeleton: string;
  /** Info callout chrome (web `--mbl-message-info-*`). */
  messageInfoBorder: string;
  messageInfoBg: string;
  messageInfoFg: string;
  messageInfoAccent: string;
  /** Success callout chrome (web `--mbl-message-success-*`). */
  messageSuccessBorder: string;
  messageSuccessBg: string;
  messageSuccessFg: string;
  messageSuccessAccent: string;
  /** Gold used for "fully read" stars (web `--mbl-star-earned`). */
  starGold: string;
  /** Unearned star fill (web `--mbl-star-unearned`). */
  starUnearned: string;
  /** Gray/blue for achievement-modal particle stars (web `--mbl-message-info-accent`). */
  starParticle: string;
  /**
   * Shadow ink. The only layer of the shadow system the scheme overrides —
   * geometry lives in `shadows.ts`. Mirrors web `--mbl-shadow-color-*`.
   */
  shadowKey: string;
  shadowAmbient: string;
  shadowRim: string;
};

export const colorsByScheme: Record<ColorSchemeName, ThemeColors> = {
  light: {
    background: "#ffffff", // --neutral-0
    surface: "#ffffff", // --neutral-0
    surfaceElevated: "#ffffff", // == --mbl-bg in light
    surfaceMuted: "#f5f5f5", // --neutral-100
    surfaceSubtle: "#fafafa", // --neutral-50
    text: "#363636", // --neutral-700
    textBody: "#4a4a4a", // --neutral-600
    mutedText: "#7a7a7a",
    border: "#dbdbdb", // --neutral-200
    borderStrong: "#b5b5b5", // --neutral-300
    borderSoft: "#eeeeee", // --neutral-150
    primary: brand.primary,
    secondary: brand.secondary,
    tertiary: brand.tertiary,
    success: "#48c774",
    warning: "#ffdd57",
    onWarning: "#946c00",
    info: "#3298dc",
    onPrimary: "#ffffff",
    destructive: "#f14668",
    onDestructive: "#ffffff",
    link: brand.secondary,
    linkBright: "#0099ff",
    linkMuted: "#007bcc",
    progressTrack: "#000000",
    progressFillInactive: "#999999",
    backdrop: "rgba(0,0,0,0.35)",
    placeholder: "rgba(0,0,0,0.45)",
    skeleton: "#eeeeee", // == borderSoft, matching web's skeleton bars
    messageInfoBorder: "#b8d7f5",
    messageInfoBg: "#f5faff",
    messageInfoFg: "#1a5080",
    messageInfoAccent: "#7ab8e8",
    messageSuccessBorder: "#a3d9b1",
    messageSuccessBg: "#f0fff4",
    messageSuccessFg: "#1a6634",
    messageSuccessAccent: "#48c774",
    starGold: "#ffd700",
    starUnearned: "#eeeeee",
    starParticle: "#7ab8e8",
    shadowKey: "rgba(10,10,10,0.14)",
    shadowAmbient: "rgba(10,10,10,0.10)",
    shadowRim: "rgba(10,10,10,0.04)",
  },
  dark: {
    background: "#000000",
    surface: "#191919", // --neutral-900
    surfaceElevated: "#242424", // == --mbl-bg-muted, so cards read on the #000 canvas
    surfaceMuted: "#242424",
    surfaceSubtle: "#1f1f1f",
    text: "#f5f5f5", // --neutral-100
    textBody: "#dbdbdb", // --neutral-200
    mutedText: "#a8a8a8",
    border: "#383838",
    borderStrong: "#4a4a4a",
    borderSoft: "#2a2a2a",
    primary: brand.primary,
    secondary: brand.secondary,
    tertiary: brand.tertiary,
    success: "#48c774",
    warning: "#ffdd57",
    onWarning: "#946c00",
    info: "#3298dc",
    onPrimary: "#ffffff",
    destructive: "#f14668",
    onDestructive: "#ffffff",
    link: "#64a8ff", // web lifts this in dark; brand secondary reads too dim
    linkBright: "#0099ff",
    linkMuted: "#7aaef0",
    progressTrack: "#666666",
    progressFillInactive: "#cccccc",
    backdrop: "rgba(0,0,0,0.55)",
    placeholder: "rgba(245,245,247,0.45)",
    skeleton: "#2a2a2a",
    messageInfoBorder: "#23425f",
    messageInfoBg: "#11202f",
    messageInfoFg: "#c5e3ff",
    messageInfoAccent: "#5b8db8",
    messageSuccessBorder: "#1e4d30",
    messageSuccessBg: "#0d2118",
    messageSuccessFg: "#b8f5cc",
    messageSuccessAccent: "#3a9e5c",
    starGold: "#d08a2f",
    starUnearned: "#6e6e6e",
    starParticle: "#5b8db8",
    shadowKey: "rgba(0,0,0,0.55)",
    shadowAmbient: "rgba(0,0,0,0.40)",
    shadowRim: "rgba(255,255,255,0.06)",
  },
};

/**
 * `backdrop` deliberately stays lighter than web's `--mbl-scrim`
 * (rgba(10,10,10,0.86) / rgba(0,0,0,0.92)). Web's scrim backs full-page modals;
 * mobile's bottom sheets sit over a still-legible screen, and a near-opaque
 * scrim reads as a context switch rather than a sheet.
 */

/**
 * Insights book-recency ramp, indexed by level 0–4: 0 = not read in the
 * timeframe (near-black), 1 = oldest quarter (red) → 4 = most recent (green).
 * Kept separate from `ThemeColors` (a flat string map keyed by semantic role)
 * because it's an array, not a single color role.
 */
export const recencyByScheme: Record<
  ColorSchemeName,
  readonly [string, string, string, string, string]
> = {
  light: ["#1a1a1a", "#e5484d", "#f76b15", "#ffc53d", "#30a14e"],
  dark: ["#2a2a2e", "#ff6369", "#ff8b3d", "#ffd15c", "#3fb950"],
};
