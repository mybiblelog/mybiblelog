import dayjs from 'dayjs';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { getLocaleCodes } from './i18n';
import {
  daysInMonth,
  displayDate,
  displayDateTime,
  displayDaysSince,
  displayTimeSince,
  getWeekStartAndEnd,
  indexOfWeekday,
  weekFromDate,
} from './date-helpers';

describe('dayjs locale imports stay in sync with i18n locales', () => {
  it('has a dayjs locale import for every configured locale', () => {
    const configured = getLocaleCodes()
      .filter((code) => code !== 'en')
      .sort();
    const loaded = Object.keys(dayjs.Ls)
      .filter((code) => code !== 'en')
      .sort();
    expect(loaded).toEqual(configured);
  });
});

describe('daysInMonth', () => {
  it('returns 29 for February in a leap year', () => {
    expect(daysInMonth(2024, 1)).toBe(29);
  });

  it('returns 28 for February in a non-leap year', () => {
    expect(daysInMonth(2023, 1)).toBe(28);
  });

  it('returns 31 for a 31-day month', () => {
    expect(daysInMonth(2026, 0)).toBe(31);
  });
});

describe('indexOfWeekday', () => {
  it('returns 0 for a Sunday', () => {
    expect(indexOfWeekday(2026, 0, 4)).toBe(0);
  });

  it('returns 4 for a Thursday', () => {
    expect(indexOfWeekday(2026, 0, 1)).toBe(4);
  });
});

describe('weekFromDate / getWeekStartAndEnd', () => {
  it('spans a month boundary correctly', () => {
    const week = weekFromDate(2024, 0, 30);
    expect(week).toEqual([
      '2024-01-28',
      '2024-01-29',
      '2024-01-30',
      '2024-01-31',
      '2024-02-01',
      '2024-02-02',
      '2024-02-03',
    ]);

    expect(getWeekStartAndEnd(2024, 0, 30)).toEqual({
      startDate: '2024-01-28',
      endDate: '2024-02-03',
    });
  });

  it('spans a DST transition correctly (uses noon reference to avoid rollover)', () => {
    // US spring-forward DST transition happens on 2026-03-08.
    const week = weekFromDate(2026, 2, 10);
    expect(week).toEqual([
      '2026-03-08',
      '2026-03-09',
      '2026-03-10',
      '2026-03-11',
      '2026-03-12',
      '2026-03-13',
      '2026-03-14',
    ]);

    expect(getWeekStartAndEnd(2026, 2, 10)).toEqual({
      startDate: '2026-03-08',
      endDate: '2026-03-14',
    });
  });
});

describe('displayDate', () => {
  it('formats a valid date as a long weekday/month/day/year string', () => {
    expect(displayDate('2026-01-15')).toBe('Thursday, January 15, 2026');
  });

  it('returns an empty string for an invalid date', () => {
    expect(displayDate('not-a-real-date')).toBe('');
  });
});

describe('displayDateTime', () => {
  it('formats a morning time using am', () => {
    expect(displayDateTime('2026-01-15T09:05:00')).toBe('January 15, 2026 @ 09:05 am');
  });

  it('formats an afternoon time using pm and converts to 12-hour', () => {
    expect(displayDateTime('2026-01-15T15:30:00')).toBe('January 15, 2026 @ 03:30 pm');
  });
});

describe('displayTimeSince', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('humanizes a time in the past', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 12, 0, 0));
    expect(displayTimeSince('2026-01-15T10:00:00')).toBe('2 hours ago');
  });

  it('humanizes a time in the future', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 12, 0, 0));
    expect(displayTimeSince('2026-01-15T14:00:00')).toBe('in 2 hours');
  });
});

describe('displayDaysSince', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('humanizes a date in the past', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15));
    expect(displayDaysSince('2026-01-13')).toBe('2 days ago');
  });

  it('humanizes a date in the future', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15));
    expect(displayDaysSince('2026-01-18')).toBe('in 3 days');
  });
});
