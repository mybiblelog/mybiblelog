/**
 * Stacking order for overlapping UI. Keep all `zIndex` / elevation decisions
 * here so overlays never fight each other.
 */
export const zIndex = {
  base: 0,
  card: 1,
  header: 10,
  sheet: 100,
  modal: 200,
  toast: 300,
  overlay: 400,
} as const;
