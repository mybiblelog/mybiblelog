import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getNextOccurrence } from '../repositories/helpers/reminder-schedule';

/**
 * `getNextOccurrence` builds a candidate two days in the past, then adds 24
 * hours (via `setHours`, which operates on local time) until it lands in the
 * future. Pinning both the system clock and `TZ=UTC` makes "local" and "UTC"
 * the same, so the expected instants below can be computed by hand.
 */
describe('getNextOccurrence', () => {
  const originalTz = process.env.TZ;
  const fixedNow = new Date('2026-01-10T12:00:00Z');

  beforeEach(() => {
    process.env.TZ = 'UTC';
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env.TZ = originalTz;
  });

  it('handles a negative timezoneOffset, rolling the minute back an hour', () => {
    // Base candidate (now - 2 days) is 2026-01-08T09:00Z; a -60 minute offset
    // rolls it back to 2026-01-08T08:00Z, then the while loop advances by
    // whole days until it's back in the future.
    const result = getNextOccurrence({ hour: 9, minute: 0, timezoneOffset: -60 });
    expect(result).toEqual(new Date('2026-01-11T08:00:00Z'));
  });

  it('handles an offset large enough to roll the minute value past 60', () => {
    // Base candidate is 2026-01-08T10:45Z; a +100 minute offset overflows
    // into 2026-01-08T12:25Z, then advances two whole days to catch up.
    const result = getNextOccurrence({ hour: 10, minute: 45, timezoneOffset: 100 });
    expect(result).toEqual(new Date('2026-01-10T12:25:00Z'));
  });

  it('stops advancing once the candidate exactly equals "now" (strict less-than boundary)', () => {
    // Base candidate is 2026-01-08T12:00Z; after two 24h advances it lands
    // exactly on the frozen "now" (2026-01-10T12:00Z). The while loop's
    // strict `<` comparison must not advance it a third time.
    const result = getNextOccurrence({ hour: 12, minute: 0, timezoneOffset: 0 });
    expect(result).toEqual(fixedNow);
  });
});
