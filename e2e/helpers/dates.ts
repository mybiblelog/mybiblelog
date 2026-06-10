/**
 * Date helpers for e2e tests. The app stores log entry dates as local-time
 * YYYY-MM-DD strings, so these intentionally use the local clock (not UTC).
 */

export const isoDate = (date: Date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const today = (): string => isoDate();

export const daysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return isoDate(date);
};
