/**
 * Spacing scale (4pt base).
 *
 * Mirrors web's `--mbl-space-*` ladder rung-for-rung (see
 * `web/app/assets/css/tokens.css`) so a rung name means the same number on
 * both platforms. Reference these instead of hard-coding numbers.
 *
 * The `2xs` / `2xl` / `3xl` / `4xl` rungs keep web's literal names even though
 * TS identifiers can't start with a digit — `spacing["2xs"]` is worth the
 * bracket access to keep the two ladders greppably identical.
 */
export const spacing = {
  "3xs": 2,
  "2xs": 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
  "4xl": 64,
  /** Horizontal gutter for screen content (web `--mbl-page-gutter`). */
  pageGutter: 16,
  /** Top gap below the safe area / header (web `--mbl-page-top`). */
  pageTop: 16,
  /** Bottom padding for scrollable list content (web `--mbl-page-bottom`). */
  listBottom: 24,
} as const;

/**
 * Minimum interactive target size (iOS HIG = 44pt, Material = 48dp).
 * Use as `minHeight` / `minWidth` on tappable controls, or derive a
 * `hitSlop` so the effective target reaches this size.
 */
export const TOUCH_TARGET = 44;
