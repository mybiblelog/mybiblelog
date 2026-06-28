/**
 * Spacing scale (4pt base).
 *
 * Reference these instead of hard-coding numbers so the app stays visually
 * consistent. `screenH` / `screenTop` / `listBottom` are layout aliases used
 * by the Screen wrapper and scrollable lists.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  xxl: 16,
  xxxl: 24,
  /** Default horizontal gutter for screen content. */
  screenH: 16,
  /** Default top gap below the safe area / header. */
  screenTop: 16,
  /** Default bottom padding for scrollable list content. */
  listBottom: 24,
} as const;

/**
 * Minimum interactive target size (iOS HIG = 44pt, Material = 48dp).
 * Use as `minHeight` / `minWidth` on tappable controls, or derive a
 * `hitSlop` so the effective target reaches this size.
 */
export const TOUCH_TARGET = 44;
