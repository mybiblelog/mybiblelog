import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type DailyReminderRecord, type UserRecord } from '../repositories/helpers/types';

/**
 * Unit tests for the reminder service's `triggerReminders` pipeline
 * (api/services/reminder.service.ts). Repositories and the email service are
 * mocked so the whole due-reminder -> deactivate/advance/send flow can be
 * exercised in-process, and so that a failure in one reminder's send can be
 * verified to not abort the rest of the batch.
 */

vi.mock('../config', () => ({
  getConfig: () => ({
    siteUrl: 'https://app.test',
    emailUnsubscribeAddress: 'unsubscribe@example.com',
    emailSendingDomain: 'example.com',
  }),
}));

const findDue = vi.fn();
const deactivate = vi.fn(async () => {});
const advanceSchedule = vi.fn(async () => {});
const findById = vi.fn();
const listRecentByOwner = vi.fn(async () => []);

vi.mock('../repositories/useRepositories', () => ({
  default: async () => ({
    dailyReminders: { findDue, deactivate, advanceSchedule },
    users: { findById },
    logEntries: { listRecentByOwner },
  }),
}));

import init from '../services/reminder.service';

const makeReminder = (overrides: Partial<DailyReminderRecord> = {}): DailyReminderRecord => ({
  id: 'reminder-1',
  ownerId: 'user-1',
  hour: 8,
  minute: 0,
  timezoneOffset: 0,
  active: true,
  publicToken: 'token-1',
  emailsSentSinceLastEngagement: 0,
  nextOccurrence: Date.now(),
  ...overrides,
});

const makeUser = (overrides: Partial<UserRecord> = {}): UserRecord => ({
  id: 'user-1',
  email: 'user@example.com',
  settings: { locale: 'en' },
  ...overrides,
} as UserRecord);

describe('reminder.service triggerReminders (unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deactivate.mockImplementation(async () => {});
    advanceSchedule.mockImplementation(async () => {});
    listRecentByOwner.mockImplementation(async () => []);
  });

  it('sends the second reminder even when sending the first one throws', async () => {
    const reminderA = makeReminder({ id: 'reminder-a', ownerId: 'user-a', publicToken: 'token-a' });
    const reminderB = makeReminder({ id: 'reminder-b', ownerId: 'user-b', publicToken: 'token-b' });
    findDue.mockResolvedValue([reminderA, reminderB]);

    findById.mockImplementation(async (id: string) => makeUser({ id }));

    const send = vi.fn()
      .mockImplementationOnce(() => { throw new Error('send failed'); })
      .mockImplementationOnce(async () => {});

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Access the internal triggerReminders by re-implementing init's return
    // is not public, so drive it through the setInterval side effect: call
    // init(), then invoke the scheduled callback directly.
    const originalSetInterval = global.setInterval;
    let scheduledCallback: (() => void) | undefined;
    // @ts-expect-error - simplified stub matching the subset used by the service
    global.setInterval = (cb: () => void) => {
      scheduledCallback = cb;
      return { unref: () => {} };
    };

    try {
      await init({ emailService: { send } as never });
    }
    finally {
      global.setInterval = originalSetInterval;
    }

    expect(scheduledCallback).toBeDefined();
    // The scheduled callback triggers triggerReminders().catch(...); await it.
    scheduledCallback!();
    // Allow the async triggerReminders() invoked by the interval callback to settle.
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));

    // Both reminders should have been attempted.
    expect(send).toHaveBeenCalledTimes(2);
    // The second reminder's schedule was still advanced (not skipped).
    expect(advanceSchedule).toHaveBeenCalledWith('reminder-a');
    expect(advanceSchedule).toHaveBeenCalledWith('reminder-b');
    // The failure from reminder-a was logged, not thrown/unhandled.
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('deactivates a reminder that has exceeded the max unengaged emails instead of sending', async () => {
    const reminder = makeReminder({ emailsSentSinceLastEngagement: 3 });
    findDue.mockResolvedValue([reminder]);

    const send = vi.fn(async () => {});
    let scheduledCallback: (() => void) | undefined;
    const originalSetInterval = global.setInterval;
    // @ts-expect-error - simplified stub matching the subset used by the service
    global.setInterval = (cb: () => void) => {
      scheduledCallback = cb;
      return { unref: () => {} };
    };

    try {
      await init({ emailService: { send } as never });
    }
    finally {
      global.setInterval = originalSetInterval;
    }

    scheduledCallback!();
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));

    expect(deactivate).toHaveBeenCalledWith(reminder.id);
    expect(send).not.toHaveBeenCalled();
    expect(advanceSchedule).not.toHaveBeenCalled();
  });
});
