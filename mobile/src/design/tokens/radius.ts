/**
 * Corner-radius scale, mirroring web's `--mbl-radius-*` ladder
 * (see `web/app/assets/css/tokens.css`). `pill` is for fully-rounded controls.
 *
 * Prefer the semantic aliases (`card` / `button` / `sheet`) at call sites —
 * web's rule is that component styles consume the semantic layer, not the raw
 * scale, so a change to "how round is a card" happens in one place.
 *
 * Web's `--mbl-radius-circle: 50%` has no RN analogue; use `width / 2`.
 */
const scale = {
  xs: 2,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  "2xl": 16,
  "3xl": 24,
  pill: 999,
} as const;

export const radius = {
  ...scale,
  /** web `--mbl-radius-card` */
  card: scale["2xl"],
  /** web `--mbl-radius-button` */
  button: scale.pill,
  /** web `--mbl-radius-sheet` */
  sheet: scale["2xl"],
} as const;
