import type { TextStyle } from "react-native";

/**
 * Shared layout tokens.
 *
 * These codify the spacing / radius / type values that were previously
 * re-typed as literals across every screen. Reference these instead of
 * hard-coding numbers so the app stays visually consistent.
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  xxl: 16,
  /** Default horizontal gutter for screen content. */
  screenH: 16,
  /** Default top gap below the safe area / header. */
  screenTop: 16,
  /** Default bottom padding for scrollable list content. */
  listBottom: 24,
} as const;

export const radius = {
  sm: 10,
  md: 12,
  lg: 14,
  xl: 16,
  pill: 999,
} as const;

/**
 * Minimum interactive target size (iOS HIG = 44pt, Material = 48dp).
 * Use as `minHeight` / `minWidth` on tappable controls, or derive a
 * `hitSlop` so the effective target reaches this size.
 */
export const TOUCH_TARGET = 44;

export const typography = {
  /** Large top-level screen title (Today / Log / Checklist …). */
  screenTitle: { fontSize: 28, fontWeight: "800" } as TextStyle,
  /** Uppercase-ish grouping label above setting cards. */
  sectionLabel: { fontSize: 13, fontWeight: "800" } as TextStyle,
  /** Primary button label. */
  buttonLabel: { fontSize: 16, fontWeight: "800" } as TextStyle,
} as const;
