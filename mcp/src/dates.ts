/**
 * Calendar-day helpers. My Bible Log dates are the user's own calendar day
 * (`YYYY-MM-DD`, no time zone), so "today" depends on where the user lives.
 */

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const isDateString = (value: string): boolean =>
  DATE_PATTERN.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
  new Date(`${value}T00:00:00Z`).toISOString().startsWith(value);

/** Today's date in `timeZone` (an IANA name such as "America/Chicago"), or the machine's zone. */
export const todayIn = (timeZone?: string, now = new Date()): string =>
  // en-CA formats dates as YYYY-MM-DD.
  new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);

/** Shifts a `YYYY-MM-DD` date by whole days, via UTC so daylight saving can't move it. */
export const addDays = (date: string, days: number): string =>
  new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

/** Inclusive count of calendar days from `start` to `end`. */
export const daysBetween = (start: string, end: string): number =>
  Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000) + 1;
