import { formatLongDate, getWeekdayIndex, parseYmdToDate } from './date';

describe('parseYmdToDate', () => {
  it('parses YYYY-MM-DD without timezone shifts', () => {
    const d = parseYmdToDate('2026-06-27');
    expect(d?.getFullYear()).toBe(2026);
    expect(d?.getMonth()).toBe(5);
    expect(d?.getDate()).toBe(27);
  });

  it('returns null for malformed input', () => {
    expect(parseYmdToDate('not-a-date')).toBeNull();
    expect(parseYmdToDate('2026-06')).toBeNull();
    expect(parseYmdToDate('')).toBeNull();
  });
});

describe('formatLongDate', () => {
  it('formats per locale', () => {
    expect(formatLongDate('2026-06-27', 'en')).toBe('June 27, 2026');
  });

  it('returns the input unchanged when unparseable', () => {
    expect(formatLongDate('garbage', 'en')).toBe('garbage');
  });

  it('reuses a cached formatter per locale (same output across calls)', () => {
    expect(formatLongDate('2026-01-02', 'en')).toBe(formatLongDate('2026-01-02', 'en'));
  });
});

describe('getWeekdayIndex', () => {
  it('returns the JS weekday (Sunday=0)', () => {
    expect(getWeekdayIndex('2026-06-28')).toBe(0); // a Sunday
    expect(getWeekdayIndex('2026-06-29')).toBe(1); // a Monday
  });

  it('returns 0 for malformed input', () => {
    expect(getWeekdayIndex('nope')).toBe(0);
  });
});
