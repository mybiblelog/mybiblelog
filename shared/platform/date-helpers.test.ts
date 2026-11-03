import { afterEach, describe, it, expect, vi } from 'vitest';
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
    expect(displayDate('2026-02-30')).toBe('');
  });

  it('uses the date part of a stored date/time', () => {
    expect(displayDate('2026-01-15T00:00:00.000Z')).toBe('Thursday, January 15, 2026');
  });

  it('localizes', () => {
    expect(displayDate('2026-01-15', 'de')).toBe('Donnerstag, 15. Januar 2026');
  });
});

describe('displayDateTime', () => {
  it('formats a morning time', () => {
    expect(displayDateTime('2026-01-15T09:05:00')).toBe('January 15, 2026 @ 09:05 AM');
  });

  it('formats an afternoon time in 12-hour English', () => {
    expect(displayDateTime('2026-01-15T15:30:00')).toBe('January 15, 2026 @ 03:30 PM');
  });

  it('formats noon as PM and midnight as 12 AM', () => {
    expect(displayDateTime('2026-01-15T12:00:00')).toBe('January 15, 2026 @ 12:00 PM');
    expect(displayDateTime('2026-01-15T00:10:00')).toBe('January 15, 2026 @ 12:10 AM');
  });

  it('uses the locale clock convention', () => {
    expect(displayDateTime('2026-01-15T15:30:00', 'de')).toBe('15. Januar 2026 @ 15:30');
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

  it('rolls up to days and months', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 12, 0, 0));
    expect(displayTimeSince('2026-01-12T12:00:00')).toBe('3 days ago');
    expect(displayTimeSince('2025-10-15T12:00:00')).toBe('3 months ago');
    expect(displayTimeSince('2024-01-15T12:00:00')).toBe('2 years ago');
  });

  it('localizes', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 12, 0, 0));
    expect(displayTimeSince('2026-01-15T10:00:00', 'es')).toBe('hace 2 horas');
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

  it('counts calendar days regardless of the time of day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 23, 59));
    expect(displayDaysSince('2026-01-15')).toBe('today');
    expect(displayDaysSince('2026-01-14')).toBe('yesterday');
    expect(displayDaysSince('2026-01-16')).toBe('tomorrow');
  });

  it('rolls up to months and years', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15));
    expect(displayDaysSince('2025-12-01')).toBe('last month');
    expect(displayDaysSince('2025-10-15')).toBe('3 months ago');
    expect(displayDaysSince('2024-01-15')).toBe('2 years ago');
  });
});
