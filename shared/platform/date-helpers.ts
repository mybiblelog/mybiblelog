import { isoDateToLocalDate, normalizeISODate, toISODate, todayISODate, diffDays } from './iso-date';

/**
 * Returns the number of days in a given month.
 * @param {number} year Full year: 1984, 2000, etc.
 * @param {number} month January = 0, February = 1, etc.
 */
export const daysInMonth = (year: number, month: number) => {
  // We look at the date of the last day of the month
  // We access it as the zeroeth day of the next month
  return new Date(year, month + 1, 0).getDate();
};

/**
 * Returns the numerical weekday, with Sunday = 1, Monday = 2, etc.
 * @param {number} year Full year: 1984, 2000, etc.
 * @param {number} month January = 0, February = 1, etc.
 * @param {number} date 1, 2, 3, etc.
 */
export const indexOfWeekday = (year: number, month: number, date: number) => {
  return new Date(year, month, date).getDay();
};

/**
 * Generates an array of 7 date-like objects representing the week
 * in which the specified date occurs.
 * @param {number} year Full year: 1984, 2000, etc.
 * @param {number} month January = 0, February = 1, etc.
 * @param {number} date 1, 2, 3, etc.
 */
export const weekFromDate = (year: number, month: number, date: number) => {
  // Use noon to avoid DST rollover issues when shifting days below
  const referenceDate = new Date(year, month, date, 12);

  const daysSinceSunday = referenceDate.getDay();
  referenceDate.setDate(referenceDate.getDate() - daysSinceSunday);

  const result = [];
  for (let i = 0; i < 7; i++) {
    result.push(toISODate(referenceDate));
    referenceDate.setDate(referenceDate.getDate() + 1);
  }
  return result;
};

export const getWeekStartAndEnd = (year: number, month: number, date: number) => {
  const week = weekFromDate(year, month, date);
  const startDate = week[0];
  const endDate = week[6];
  return {
    startDate,
    endDate,
  };
};

export const displayDate = (dateString: string, locale = 'en') => {
  const isoDate = normalizeISODate(dateString);
  if (!isoDate) {
    return '';
  }
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return isoDateToLocalDate(isoDate).toLocaleDateString(locale, options);
};

export const displayDateTime = (dateString: string, locale = 'en') => {
  const date = new Date(dateString);
  const displayDate = date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
  const displayTime = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  return `${displayDate} @ ${displayTime}`;
};

const relativeTimeFormatters = new Map<string, Intl.RelativeTimeFormat>();

const getRelativeTimeFormatter = (locale: string, numeric: 'always' | 'auto') => {
  const key = `${locale}|${numeric}`;
  let formatter = relativeTimeFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.RelativeTimeFormat(locale, { numeric });
    relativeTimeFormatters.set(key, formatter);
  }
  return formatter;
};

/**
 * Picks the largest sensible unit for a span of days, rounding the way people
 * speak about it ("3 months ago", not "92 days ago").
 */
const toCoarseUnit = (days: number): [number, Intl.RelativeTimeFormatUnit] => {
  const abs = Math.abs(days);
  if (abs < 26) {
    return [days, 'day'];
  }
  const sign = Math.sign(days);
  const months = Math.round(abs / 30.4);
  if (months < 11) {
    return [sign * Math.max(1, months), 'month'];
  }
  return [sign * Math.max(1, Math.round(abs / 365)), 'year'];
};

/**
 * Returns the time between now and the given date/time in a human readable
 * format. For example: "12 seconds ago", "8 hours ago", "in 2 days".
 *
 * Mobile keeps its own version (`mobile/src/i18n/relative-time.ts`) because
 * some Hermes builds lack `Intl.RelativeTimeFormat`.
 * @param {string} dateTimeString ISO date/time
 * @param {string} locale 'en', 'es', etc.
 * @returns {string}
 */
export const displayTimeSince = (dateTimeString: string, locale = 'en') => {
  const formatter = getRelativeTimeFormatter(locale, 'always');
  const ms = new Date(dateTimeString).getTime() - Date.now();
  const sign = Math.sign(ms);
  const seconds = Math.round(Math.abs(ms) / 1000);
  if (seconds < 45) {
    return formatter.format(sign * seconds, 'second');
  }
  const minutes = Math.round(seconds / 60);
  if (minutes < 45) {
    return formatter.format(sign * minutes, 'minute');
  }
  const hours = Math.round(minutes / 60);
  if (hours < 22) {
    return formatter.format(sign * hours, 'hour');
  }
  const [value, unit] = toCoarseUnit(sign * Math.max(1, Math.round(hours / 24)));
  return formatter.format(value, unit);
};

/**
 * Returns the number of calendar days between today and the given date in a
 * human readable format. For example: "yesterday", "2 days ago", "in 3 days".
 *
 * Mobile keeps its own version (`mobile/src/i18n/relative-time.ts`) because
 * some Hermes builds lack `Intl.RelativeTimeFormat`.
 * @param {string} dateString 'YYYY-MM-DD'
 * @param {string} locale 'en', 'es', etc.
 * @returns {string}
 */
export const displayDaysSince = (dateString: string, locale = 'en') => {
  const [value, unit] = toCoarseUnit(diffDays(dateString, todayISODate()));
  return getRelativeTimeFormatter(locale, 'auto').format(value, unit);
};

const dateTimeFormatters = new Map<string, Intl.DateTimeFormat>();

/**
 * Formats a `YYYY-MM-DD` date with `Intl.DateTimeFormat`, e.g.
 * `{ month: 'short', day: 'numeric' }` → "Jun 14" / "14. Juni". Formatters are
 * cached per locale and options, since charts call this once per data point.
 * Returns an empty string for an invalid date.
 */
export const formatCalendarDate = (
  dateString: string,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): string => {
  const isoDate = normalizeISODate(dateString);
  if (!isoDate) {
    return '';
  }
  const key = `${locale}|${JSON.stringify(options)}`;
  let formatter = dateTimeFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options);
    dateTimeFormatters.set(key, formatter);
  }
  return formatter.format(isoDateToLocalDate(isoDate));
};
