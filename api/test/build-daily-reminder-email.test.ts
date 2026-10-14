import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildDailyReminderEmail } from '../services/helpers/build-daily-reminder-email';
import type { UserRecord, DailyReminderRecord } from '../repositories/helpers/types';

/**
 * Pure unit tests for the daily-reminder email builder, extracted from
 * `reminder.service.ts` so its date-boundary and unsubscribe-header branches
 * can be exercised without a running service or database. `TZ=UTC` plus a
 * frozen system clock make `serverTimezoneOffset` (derived from
 * `Date().getTimezoneOffset()`) predictably zero.
 */
describe('buildDailyReminderEmail', () => {
  const originalTz = process.env.TZ;

  beforeEach(() => {
    process.env.TZ = 'UTC';
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env.TZ = originalTz;
  });

  const baseConfig = {
    siteUrl: 'https://mybiblelog.com',
    emailSendingDomain: 'mybiblelog.com',
    emailUnsubscribeAddress: '',
  };

  const user = {
    id: '507f1f77bcf86cd799439011',
    email: 'user@example.com',
    settings: { locale: 'en' },
  } as unknown as UserRecord;

  const baseReminder = {
    id: '507f1f77bcf86cd799439012',
    ownerId: user.id,
    hour: 12,
    minute: 0,
    timezoneOffset: 0,
    active: true,
    publicToken: 'the-public-token',
    emailsSentSinceLastEngagement: 0,
    nextOccurrence: 0,
  } as unknown as DailyReminderRecord;

  it('rolls the email date back a day when the local trigger time pushes past the UTC day boundary', () => {
    // now = 2026-03-04T12:00:00Z. reminderTimeMs (20:00) + offset (+300min / GMT-5)
    // = 25h > 24h, so the UTC date must roll back to match the still-current local date.
    vi.setSystemTime(new Date('2026-03-04T12:00:00Z'));
    const reminder = { ...baseReminder, hour: 20, minute: 0, timezoneOffset: 300 };

    const email = buildDailyReminderEmail(user, reminder, [], baseConfig);

    // The rendered subject embeds the formatted emailDate; assert against the
    // known-good subject date rather than reaching into renderer internals.
    expect(email.subject).toMatch(/Mar 3/);
  });

  it('rolls the email date forward a day when the local trigger time is behind the UTC day', () => {
    // now = 2026-03-04T12:00:00Z. reminderTimeMs (07:00) + offset (-540min / GMT+9)
    // = -8h < 0, so the UTC date must roll forward to match the already-advanced local date.
    vi.setSystemTime(new Date('2026-03-04T12:00:00Z'));
    const reminder = { ...baseReminder, hour: 7, minute: 0, timezoneOffset: -540 };

    const email = buildDailyReminderEmail(user, reminder, [], baseConfig);

    expect(email.subject).toMatch(/Mar 5/);
  });

  it('does not roll the email date when the local trigger time stays within the UTC day', () => {
    vi.setSystemTime(new Date('2026-03-04T12:00:00Z'));
    const reminder = { ...baseReminder, hour: 12, minute: 0, timezoneOffset: 0 };

    const email = buildDailyReminderEmail(user, reminder, [], baseConfig);

    expect(email.subject).toMatch(/Mar 4/);
  });

  it('includes a mailto List-Unsubscribe entry when emailUnsubscribeAddress is configured', () => {
    vi.setSystemTime(new Date('2026-03-04T12:00:00Z'));

    const email = buildDailyReminderEmail(user, baseReminder, [], {
      ...baseConfig,
      emailUnsubscribeAddress: 'unsubscribe@mybiblelog.com',
    });

    expect(email.headers['List-Unsubscribe']).toContain('mailto:unsubscribe+the-public-token@mybiblelog.com');
    expect(email.headers['List-Unsubscribe']).toContain('daily-reminder-unsubscribe?code=the-public-token');
  });

  it('omits the mailto entry from List-Unsubscribe when emailUnsubscribeAddress is empty', () => {
    vi.setSystemTime(new Date('2026-03-04T12:00:00Z'));

    const email = buildDailyReminderEmail(user, baseReminder, [], baseConfig);

    expect(email.headers['List-Unsubscribe']).not.toContain('mailto:');
    expect(email.headers['List-Unsubscribe']).toContain('daily-reminder-unsubscribe?code=the-public-token');
  });
});
