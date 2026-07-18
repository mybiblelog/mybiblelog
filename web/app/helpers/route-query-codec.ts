export const MAX_PAGE_SIZE = 50;

export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

export function parseIntOr(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : parseInt(`${value}`, 10);
  return Number.isFinite(n) ? n : fallback;
}

export function pickEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  const v = `${value ?? ''}` as T;
  return (allowed as readonly string[]).includes(v) ? v : fallback;
}
