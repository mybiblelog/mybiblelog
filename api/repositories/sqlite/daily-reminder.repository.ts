import crypto from 'node:crypto';
import { and, eq, lte } from 'drizzle-orm';
import type { SqliteDb } from '../../sqlite/database';
import { generateId } from '../../sqlite/ids';
import { dailyReminders } from '../../sqlite/schema';
import type { DailyReminderRepository } from '../daily-reminder.repository';
import { getNextOccurrence } from '../helpers/reminder-schedule';
import { DailyReminderPatch, DailyReminderRecord } from '../helpers/types';
import { assertValidReminderSchedule } from '../helpers/validators';

type DailyReminderRow = typeof dailyReminders.$inferSelect;

/** Recomputes a reminder's nextOccurrence from its schedule; called before every save. */
const recomputeNextOccurrence = (reminder: DailyReminderRow): void => {
  reminder.nextOccurrence = getNextOccurrence({
    hour: reminder.hour,
    minute: reminder.minute,
    timezoneOffset: reminder.timezoneOffset,
  }).getTime();
};

const toDailyReminderRecord = (row: DailyReminderRow): DailyReminderRecord => ({
  id: row.id,
  ownerId: row.ownerId,
  hour: row.hour,
  minute: row.minute,
  timezoneOffset: row.timezoneOffset,
  active: row.active,
  publicToken: row.publicToken,
  emailsSentSinceLastEngagement: row.emailsSentSinceLastEngagement,
  nextOccurrence: row.nextOccurrence,
});

export const createSqliteDailyReminderRepository = (db: SqliteDb): DailyReminderRepository => {
  // Persists the mutable fields of an existing reminder, advancing updatedAt.
  const persist = async (reminder: DailyReminderRow): Promise<void> => {
    reminder.updatedAt = new Date();
    await db.update(dailyReminders)
      .set({
        hour: reminder.hour,
        minute: reminder.minute,
        timezoneOffset: reminder.timezoneOffset,
        active: reminder.active,
        publicToken: reminder.publicToken,
        emailsSentSinceLastEngagement: reminder.emailsSentSinceLastEngagement,
        nextOccurrence: reminder.nextOccurrence,
        updatedAt: reminder.updatedAt,
      })
      .where(eq(dailyReminders.id, reminder.id));
  };

  const findRow = async (where: ReturnType<typeof eq>): Promise<DailyReminderRow | undefined> => {
    return db.select().from(dailyReminders).where(where).get();
  };

  /**
   * Returns the single daily reminder for the given user, first creating it if
   * necessary. The reminder time defaults to 12:00 noon UTC, which is fine since
   * it isn't active until the user updates it.
   */
  const getOrCreateRowForOwner = async (ownerId: string): Promise<DailyReminderRow> => {
    const existing = await findRow(eq(dailyReminders.ownerId, ownerId));
    if (existing) {
      return existing;
    }
    const now = new Date();
    const reminder: DailyReminderRow = {
      id: generateId(),
      ownerId,
      hour: 12,
      minute: 0,
      timezoneOffset: 0,
      active: false,
      publicToken: crypto.randomBytes(16).toString('base64url'),
      emailsSentSinceLastEngagement: 0,
      nextOccurrence: now.getTime(),
      createdAt: now,
      updatedAt: now,
    };
    recomputeNextOccurrence(reminder);
    await db.insert(dailyReminders).values(reminder);
    return reminder;
  };

  return {
    async getOrCreateForOwner(ownerId: string): Promise<DailyReminderRecord> {
      return toDailyReminderRecord(await getOrCreateRowForOwner(ownerId));
    },

    async updateForOwner(ownerId: string, patch: DailyReminderPatch): Promise<DailyReminderRecord> {
      const reminder = await getOrCreateRowForOwner(ownerId);
      const wasActive = reminder.active;
      if (typeof patch.hour !== 'undefined') { reminder.hour = patch.hour; }
      if (typeof patch.minute !== 'undefined') { reminder.minute = patch.minute; }
      if (typeof patch.timezoneOffset !== 'undefined') { reminder.timezoneOffset = patch.timezoneOffset; }
      if (typeof patch.active !== 'undefined') { reminder.active = patch.active; }

      // If the daily reminder was just activated, rotate the public token
      // (email links, tracking, unsubscribe) and reset engagement tracking.
      if (!wasActive && reminder.active) {
        reminder.publicToken = crypto.randomBytes(16).toString('base64url');
        reminder.emailsSentSinceLastEngagement = 0;
      }

      assertValidReminderSchedule(reminder);
      recomputeNextOccurrence(reminder);
      await persist(reminder);
      return toDailyReminderRecord(reminder);
    },

    /** Resets emailsSentSinceLastEngagement for the reminder with the given public token, if any. */
    async recordEngagement(publicToken: string): Promise<void> {
      const reminder = await findRow(eq(dailyReminders.publicToken, publicToken));
      if (reminder) {
        reminder.emailsSentSinceLastEngagement = 0;
        recomputeNextOccurrence(reminder);
        await persist(reminder);
      }
    },

    async deactivateByPublicToken(publicToken: string): Promise<DailyReminderRecord | null> {
      const reminder = await findRow(eq(dailyReminders.publicToken, publicToken));
      if (!reminder) {
        return null;
      }
      reminder.active = false;
      recomputeNextOccurrence(reminder);
      await persist(reminder);
      return toDailyReminderRecord(reminder);
    },

    async deleteAllByOwner(ownerId: string): Promise<void> {
      await db.delete(dailyReminders).where(eq(dailyReminders.ownerId, ownerId));
    },

    /** Returns active reminders whose nextOccurrence is at or before the given UTC time (ms). */
    async findDue(utcNowMs: number): Promise<DailyReminderRecord[]> {
      const rows = await db.select().from(dailyReminders)
        .where(and(eq(dailyReminders.active, true), lte(dailyReminders.nextOccurrence, utcNowMs)));
      return rows.map(toDailyReminderRecord);
    },

    /** Deactivates a single reminder by id (used when a user stops engaging). */
    async deactivate(id: string): Promise<void> {
      const reminder = await findRow(eq(dailyReminders.id, id));
      if (reminder) {
        reminder.active = false;
        recomputeNextOccurrence(reminder);
        await persist(reminder);
      }
    },

    /**
     * Advances a reminder's schedule ahead of sending an email: increments
     * emailsSentSinceLastEngagement and recomputes nextOccurrence, then saves.
     */
    async advanceSchedule(id: string): Promise<void> {
      const reminder = await findRow(eq(dailyReminders.id, id));
      if (!reminder) {
        return;
      }
      reminder.emailsSentSinceLastEngagement += 1;
      recomputeNextOccurrence(reminder);
      await persist(reminder);
    },
  };
};
