import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  addDays,
  addMonths,
  addYears,
  daysInMonthOf,
  diffDays,
  formatISODate,
  isISODate,
  isoDateToLocalDate,
  normalizeISODate,
  parseISODate,
  toISODate,
  todayISODate,
  weekdayOf,
} from './iso-date';

describe('parseISODate / isISODate', () => {
  it('accepts real calendar dates', () => {
    expect(parseISODate('2024-02-29')).toEqual({ year: 2024, month: 2, day: 29 });
    expect(isISODate('2026-12-31')).toBe(true);
  });

  it.each([
    '2023-02-29', // not a leap year
    '2024-02-30',
    '2024-13-01',
    '2024-00-10',
    '2024-01-00',
    '2024-1-5',
    '2024/01/05',
    '2024-01-05T00:00:00Z',
    ' 2024-01-05',
    '',
    'not-a-date',
  ])('rejects %j', (value) => {
    expect(parseISODate(value)).toBeNull();
    expect(isISODate(value)).toBe(false);
  });
});

describe('normalizeISODate', () => {
  it('keeps a plain date', () => {
    expect(normalizeISODate('2024-01-05')).toBe('2024-01-05');
  });

  it('drops a time part', () => {
    expect(normalizeISODate('2024-01-05T00:00:00.000Z')).toBe('2024-01-05');
  });

  it('returns null when no valid date remains', () => {
    expect(normalizeISODate('2024-02-30T00:00:00Z')).toBeNull();
    expect(normalizeISODate('garbage')).toBeNull();
  });
});

describe('formatISODate / daysInMonthOf', () => {
  it('pads parts', () => {
    expect(formatISODate({ year: 987, month: 1, day: 5 })).toBe('0987-01-05');
  });

  it('knows month lengths', () => {
    expect(daysInMonthOf(2024, 2)).toBe(29);
    expect(daysInMonthOf(2023, 2)).toBe(28);
    expect(daysInMonthOf(2100, 2)).toBe(28);
    expect(daysInMonthOf(2000, 2)).toBe(29);
    expect(daysInMonthOf(2026, 4)).toBe(30);
    expect(daysInMonthOf(2026, 12)).toBe(31);
  });
});

describe('addDays', () => {
  it('crosses month and year boundaries', () => {
    expect(addDays('2024-12-31', 1)).toBe('2025-01-01');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
    expect(addDays('2026-06-15', -364)).toBe('2025-06-16');
  });

  it('is unaffected by DST transitions', () => {
    // US spring-forward and fall-back days.
    expect(addDays('2026-03-07', 1)).toBe('2026-03-08');
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09');
    expect(addDays('2026-11-01', 1)).toBe('2026-11-02');
  });

  it('throws on an invalid date', () => {
    expect(() => addDays('2024-02-30', 1)).toThrow(RangeError);
  });
});

describe('addMonths / addYears', () => {
  it('clamps to the end of a shorter month', () => {
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29');
    expect(addMonths('2023-01-31', 1)).toBe('2023-02-28');
    expect(addMonths('2024-03-31', -1)).toBe('2024-02-29');
  });

  it('crosses year boundaries in both directions', () => {
    expect(addMonths('2024-11-15', 3)).toBe('2025-02-15');
    expect(addMonths('2024-02-15', -3)).toBe('2023-11-15');
    expect(addMonths('2024-06-15', -18)).toBe('2022-12-15');
  });

  it('adds years, clamping Feb 29', () => {
    expect(addYears('2024-02-29', 1)).toBe('2025-02-28');
    expect(addYears('2026-11-03', 1)).toBe('2027-11-03');
  });
});

describe('diffDays', () => {
  it('is positive when the first date is later', () => {
    expect(diffDays('2024-03-01', '2024-02-28')).toBe(2);
    expect(diffDays('2024-02-28', '2024-03-01')).toBe(-2);
    expect(diffDays('2026-01-01', '2025-01-01')).toBe(365);
  });

  it('is unaffected by DST transitions', () => {
    expect(diffDays('2026-03-09', '2026-03-07')).toBe(2);
    expect(diffDays('2026-11-02', '2026-10-31')).toBe(2);
  });
});

describe('weekdayOf', () => {
  it('returns 0 for Sunday through 6 for Saturday', () => {
    expect(weekdayOf('2026-01-04')).toBe(0);
    expect(weekdayOf('2026-01-01')).toBe(4);
    expect(weekdayOf('2026-01-10')).toBe(6);
  });
});

describe('local-time helpers', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('todayISODate reads the local calendar date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 15, 23, 59));
    expect(todayISODate()).toBe('2026-01-15');
    vi.setSystemTime(new Date(2026, 0, 16, 0, 1));
    expect(todayISODate()).toBe('2026-01-16');
  });

  it('toISODate uses local date parts', () => {
    expect(toISODate(new Date(2026, 1, 3, 0, 0))).toBe('2026-02-03');
  });

  it('isoDateToLocalDate lands on the same local calendar day', () => {
    const date = isoDateToLocalDate('2026-03-08');
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 2, 8]);
  });
});
