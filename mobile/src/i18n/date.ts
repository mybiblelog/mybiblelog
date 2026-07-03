/**
 * Locale-aware date helpers for `YYYY-MM-DD` strings.
 *
 * Dates are parsed by components (never `new Date(string)`) to avoid timezone
 * shifts, and `Intl.DateTimeFormat` instances are cached per locale — the
 * constructor is expensive and these formatters run once per visible list row.
 */

export function parseYmdToDate(ymd: string): Date | null {
  const parts = ymd.split('-').map((p) => Number(p));
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
      month: 'long',
      day: 'numeric',
      year: 'numeric',
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
