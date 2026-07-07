import { describe, it, expect } from 'vitest';
import { shouldNotifyAdminsOfFeedback } from '../http/helpers/should-notify-admins-of-feedback';

describe('shouldNotifyAdminsOfFeedback', () => {
  it('returns true when there is no previous feedback', () => {
    expect(shouldNotifyAdminsOfFeedback(null, new Date())).toBe(true);
  });

  it('returns true when the previous feedback is over an hour old', () => {
    const now = new Date('2026-01-01T12:00:00Z');
    const previous = new Date('2026-01-01T10:59:00Z');
    expect(shouldNotifyAdminsOfFeedback(previous, now)).toBe(true);
  });

  it('returns false when the previous feedback is within the last hour', () => {
    const now = new Date('2026-01-01T12:00:00Z');
    const previous = new Date('2026-01-01T11:30:00Z');
    expect(shouldNotifyAdminsOfFeedback(previous, now)).toBe(false);
  });

  it('returns false at exactly one hour', () => {
    const now = new Date('2026-01-01T12:00:00Z');
    const previous = new Date('2026-01-01T11:00:00Z');
    expect(shouldNotifyAdminsOfFeedback(previous, now)).toBe(false);
  });
});
