/**
 * Calendar-date helpers for `YYYY-MM-DD` strings.
 *
 * Why not `Temporal.PlainDate`: this package also runs in browsers and in the
 * mobile app (Hermes), and neither can be assumed to have `Temporal` yet. The
 * API runs only on Node and uses `Temporal` directly. Once every runtime has
 * it, these helpers can be reimplemented on `Temporal.PlainDate` without
 * changing their callers.
 * TECH-DEBT(shared-iso-date-temporal)
 *
 * Arithmetic runs on UTC timestamps so DST transitions can't shift a date.
 * Only `todayISODate` and `toISODate` read the local time zone.
 */

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

export type ISODateParts = {
  year: number;
  /** 1-12 */
  month: number;
  day: number;
};

const pad = (value: number, length = 2): string => String(value).padStart(length, '0');

/** Parses a strict `YYYY-MM-DD` calendar date. Returns `null` for anything else, including `2024-02-30`. */
export const parseISODate = (value: string): ISODateParts | null => {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonthOf(year, month)) {
    return null;
  }
  return { year, month, day };
};

/** True when `value` is a strict `YYYY-MM-DD` string naming a real calendar date. */
export const isISODate = (value: string): boolean => parseISODate(value) !== null;

const parseOrThrow = (value: string): ISODateParts => {
  const parts = parseISODate(value);
  if (!parts) {
    throw new RangeError(`Invalid YYYY-MM-DD date: ${value}`);
  }
  return parts;
};

const toUTCTime = (value: string): number => {
  const { year, month, day } = parseOrThrow(value);
  return Date.UTC(year, month - 1, day);
};

const fromUTCTime = (time: number): string => new Date(time).toISOString().slice(0, 10);

/** Number of days in a month. `month` is 1-12. */
export const daysInMonthOf = (year: number, month: number): number =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();

/** Builds a `YYYY-MM-DD` string from parts. `month` is 1-12. */
export const formatISODate = ({ year, month, day }: ISODateParts): string =>
  `${pad(year, 4)}-${pad(month)}-${pad(day)}`;

/** The calendar date of a `Date` in the local time zone. */
export const toISODate = (date: Date): string =>
  formatISODate({ year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() });

/** Today's date in the local time zone. */
export const todayISODate = (): string => toISODate(new Date());

/**
 * Reduces a stored date that may carry a time part (`2024-01-05T00:00:00.000Z`,
 * from older records) to its `YYYY-MM-DD` prefix. Returns `null` if no valid
 * date remains.
 */
export const normalizeISODate = (value: string): string | null => {
  const datePart = value.slice(0, 10);
  return isISODate(datePart) ? datePart : null;
};

export const addDays = (value: string, days: number): string =>
  fromUTCTime(toUTCTime(value) + days * MS_PER_DAY);

/** Adds calendar months, clamping the day to the end of a shorter month (Jan 31 + 1 month = Feb 28/29). */
export const addMonths = (value: string, months: number): string => {
  const { year, month, day } = parseOrThrow(value);
  const monthIndex = year * 12 + (month - 1) + months;
  const targetYear = Math.floor(monthIndex / 12);
  const targetMonth = monthIndex - targetYear * 12 + 1;
  return formatISODate({
    year: targetYear,
    month: targetMonth,
    day: Math.min(day, daysInMonthOf(targetYear, targetMonth)),
  });
};

export const addYears = (value: string, years: number): string => addMonths(value, years * 12);

/** Whole days from `from` to `to` (positive when `to` is later). */
export const diffDays = (to: string, from: string): number =>
  Math.round((toUTCTime(to) - toUTCTime(from)) / MS_PER_DAY);

/** Day of the week: Sunday = 0 … Saturday = 6. */
export const weekdayOf = (value: string): number => new Date(toUTCTime(value)).getUTCDay();

/**
 * A local `Date` on the given calendar day, for handing to `Intl.DateTimeFormat`
 * and similar APIs. It is set to noon so the day can't shift in a time zone
 * whose DST change happens at midnight.
 */
export const isoDateToLocalDate = (value: string): Date => {
  const { year, month, day } = parseOrThrow(value);
  return new Date(year, month - 1, day, 12);
};
