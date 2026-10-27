import { describe, it, expect } from 'vitest';
import { addDays, daysBetween, isDateString, todayIn } from '../src/dates';

describe('dates', () => {
  it('works out today in the user\'s time zone, not UTC', () => {
    const now = new Date('2026-10-27T03:00:00Z');
    expect(todayIn('UTC', now)).toBe('2026-10-27');
    expect(todayIn('America/Chicago', now)).toBe('2026-10-26');
    expect(todayIn('Asia/Seoul', now)).toBe('2026-10-27');
  });

  it('shifts dates by calendar days across a daylight saving change', () => {
    expect(addDays('2026-11-01', 1)).toBe('2026-11-02');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-10-27', -29)).toBe('2026-09-28');
  });

  it('counts days inclusively', () => {
    expect(daysBetween('2026-10-01', '2026-10-01')).toBe(1);
    expect(daysBetween('2026-09-28', '2026-10-27')).toBe(30);
  });

  it('accepts only real YYYY-MM-DD dates', () => {
    expect(isDateString('2026-10-27')).toBe(true);
    expect(isDateString('2026-02-30')).toBe(false);
    expect(isDateString('10/27/2026')).toBe(false);
    expect(isDateString('2026-10-27T00:00:00Z')).toBe(false);
  });
});
