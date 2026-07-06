/**
 * Locale-aware date helpers for `YYYY-MM-DD` strings.
 *
 * Dates are parsed by components (never `new Date(string)`) to avoid timezone
 * shifts, and `Intl.DateTimeFormat` instances are cached per locale — the
 * constructor is expensive and these formatters run once per visible list row.
 */

export function parseYmdToDate(ymd: string): Date | null {
  const parts = ymd.split("-").map((p) => Number(p));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  const [year, month, day] = parts;
  const d = new Date(year, month - 1, day);
  return Number.isNaN(d.getTime()) ? null : d;
}

const longDateFormatters = new Map<string, Intl.DateTimeFormat>();

function getLongDateFormatter(locale: string): Intl.DateTimeFormat {
  let formatter = longDateFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    longDateFormatters.set(locale, formatter);
  }
  return formatter;
}

/** "June 27, 2026" (per locale). Returns the input unchanged if unparseable. */
export function formatLongDate(ymd: string, locale: string): string {
  const d = parseYmdToDate(ymd);
  if (!d) return ymd;
  return getLongDateFormatter(locale).format(d);
}

/** JS weekday index for a `YYYY-MM-DD` string: Sunday=0 … Saturday=6. */
export function getWeekdayIndex(ymd: string): number {
  return parseYmdToDate(ymd)?.getDay() ?? 0;
}

export type RelativeDateInfo =
  { unit: "today" | "yesterday" } | { unit: "days" | "weeks" | "months" | "years"; count: number };

/**
 * Buckets how long ago a past `YYYY-MM-DD` date was (today/yesterday/N
 * days-weeks-months-years). Callers localize the result via `t()` — this
 * avoids `Intl.RelativeTimeFormat`, which some Hermes/Android builds don't
 * implement even though `Intl.DateTimeFormat` works fine. Returns `null` if
 * unparseable.
 */
export function getRelativeDateInfo(ymd: string): RelativeDateInfo | null {
  const d = parseYmdToDate(ymd);
  if (!d) return null;

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.round((start.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return { unit: "today" };
  if (diffDays === 1) return { unit: "yesterday" };
  if (diffDays < 7) return { unit: "days", count: diffDays };
  if (diffDays < 30) return { unit: "weeks", count: Math.round(diffDays / 7) };
  if (diffDays < 365) return { unit: "months", count: Math.round(diffDays / 30) };
  return { unit: "years", count: Math.round(diffDays / 365) };
}
