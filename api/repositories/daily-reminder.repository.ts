import crypto from 'node:crypto';
import { ObjectId } from 'mongodb';
import type { Collections } from '../mongo/useCollections';
import type { DailyReminderDocument } from '../mongo/documents';
import { getNextOccurrence } from './helpers/reminder-schedule';
import { DailyReminderPatch, DailyReminderRecord } from './helpers/types';

/**
 * Recomputes a reminder's nextOccurrence from its schedule. The old schema
 * pre-save hook did this on every save, so callers invoke it before each save.
 */
const recomputeNextOccurrence = (reminder: DailyReminderDocument): void => {
  reminder.nextOccurrence = getNextOccurrence({
    hour: reminder.hour,
    minute: reminder.minute,
    timezoneOffset: reminder.timezoneOffset,
  }).getTime();
};

/** Replaces the DailyReminder schema min/max validators on hour/minute/offset. */
const assertValidSchedule = (reminder: Pick<DailyReminderDocument, 'hour' | 'minute' | 'timezoneOffset'>): void => {
  if (reminder.hour < 0 || reminder.hour > 23) {
    throw new Error('hour must be between 0 and 23');
  }
  if (reminder.minute < 0 || reminder.minute > 59) {
    throw new Error('minute must be between 0 and 59');
  }
  if (reminder.timezoneOffset < -12 * 60 || reminder.timezoneOffset > 14 * 60) {
    throw new Error('timezoneOffset is out of range');
  }
};

const toDailyReminderRecord = (reminder: DailyReminderDocument): DailyReminderRecord => {
  return {
    id: reminder._id.toString(),
    ownerId: reminder.owner.toString(),
    hour: reminder.hour,
    minute: reminder.minute,
    timezoneOffset: reminder.timezoneOffset,
    active: reminder.active,
    publicToken: reminder.publicToken,
    lastEmailEngagementAt: reminder.lastEmailEngagementAt ?? null,
    nextOccurrence: reminder.nextOccurrence,
  };
};

export const createDailyReminderRepository = ({ dailyReminders }: Collections) => {
  // Persists the mutable fields of an existing reminder document, advancing
  // updatedAt (Mongoose used to maintain timestamps automatically).
  const persist = async (reminder: DailyReminderDocument): Promise<void> => {
    reminder.updatedAt = new Date();
    await dailyReminders.updateOne(
      { _id: reminder._id },
      {
        $set: {
          hour: reminder.hour,
          minute: reminder.minute,
          timezoneOffset: reminder.timezoneOffset,
          active: reminder.active,
          publicToken: reminder.publicToken,
          lastEmailEngagementAt: reminder.lastEmailEngagementAt,
          nextOccurrence: reminder.nextOccurrence,
          updatedAt: reminder.updatedAt,
        },
      },
    );
  };

  /**
   * Returns the single daily reminder document for the given user,
   * first creating it if necessary.
   * The reminder time defaults to 12:00 noon, and will be in UTC
   * until the user updates it.
   * This is OK since it won't be active until the user updates it.
   */
  const getOrCreateDocForOwner = async (ownerId: string): Promise<DailyReminderDocument> => {
    const existing = await dailyReminders.findOne({ owner: new ObjectId(ownerId) });
    if (existing) {
      return existing;
    }
    const now = new Date();
    const reminder: DailyReminderDocument = {
      _id: new ObjectId(),
      owner: new ObjectId(ownerId),
      hour: 12,
      minute: 0,
      timezoneOffset: 0,
      active: false,
      publicToken: crypto.randomBytes(16).toString('base64url'),
      lastEmailEngagementAt: null,
      nextOccurrence: now.getTime(),
      createdAt: now,
      updatedAt: now,
    };
    recomputeNextOccurrence(reminder);
    await dailyReminders.insertOne(reminder);
    return reminder;
  };

  return {
    async getOrCreateForOwner(ownerId: string): Promise<DailyReminderRecord> {
      const reminder = await getOrCreateDocForOwner(ownerId);
      return toDailyReminderRecord(reminder);
    },

    async updateForOwner(ownerId: string, patch: DailyReminderPatch): Promise<DailyReminderRecord> {
      const reminder = await getOrCreateDocForOwner(ownerId);
      const wasActive = reminder.active;
      if (typeof patch.hour !== 'undefined') { reminder.hour = patch.hour; }
      if (typeof patch.minute !== 'undefined') { reminder.minute = patch.minute; }
      if (typeof patch.timezoneOffset !== 'undefined') { reminder.timezoneOffset = patch.timezoneOffset; }
      if (typeof patch.active !== 'undefined') { reminder.active = patch.active; }

      // If the daily reminder was just activated, rotate the public token
      // (email links, tracking, unsubscribe) and seed engagement tracking.
      if (!wasActive && reminder.active) {
        reminder.publicToken = crypto.randomBytes(16).toString('base64url');
        reminder.lastEmailEngagementAt = new Date();
      }

      assertValidSchedule(reminder);
      recomputeNextOccurrence(reminder);
      await persist(reminder);
      return toDailyReminderRecord(reminder);
    },

    /** Updates lastEmailEngagementAt for the reminder with the given public token, if any. */
    async recordEngagement(publicToken: string): Promise<void> {
      const reminder = await dailyReminders.findOne({ publicToken });
      if (reminder) {
        reminder.lastEmailEngagementAt = new Date();
        recomputeNextOccurrence(reminder);
        await persist(reminder);
      }
    },

    async deactivateByPublicToken(publicToken: string): Promise<DailyReminderRecord | null> {
      const reminder = await dailyReminders.findOne({ publicToken });
      if (!reminder) {
        return null;
      }
      reminder.active = false;
      recomputeNextOccurrence(reminder);
      await persist(reminder);
      return toDailyReminderRecord(reminder);
    },

    async deleteAllByOwner(ownerId: string): Promise<void> {
      await dailyReminders.deleteMany({ owner: new ObjectId(ownerId) });
    },

    /** Returns active reminders whose nextOccurrence is at or before the given UTC time (ms). */
    async findDue(utcNowMs: number): Promise<DailyReminderRecord[]> {
      const reminders = await dailyReminders.find({
        nextOccurrence: { $lte: utcNowMs },
        active: true,
      }).toArray();
      return reminders.map(toDailyReminderRecord);
    },

    /** Deactivates a single reminder by id (used when a user stops engaging). */
    async deactivate(id: string): Promise<void> {
      const reminder = await dailyReminders.findOne({ _id: new ObjectId(id) });
      if (reminder) {
        reminder.active = false;
        recomputeNextOccurrence(reminder);
        await persist(reminder);
      }
    },

    /**
     * Advances a reminder's schedule by recomputing nextOccurrence and saving.
     * Reminders created before engagement tracking have no lastEmailEngagementAt;
     * this seeds it so they are not deactivated on the next cycle.
     */
    async advanceSchedule(id: string): Promise<void> {
      const reminder = await dailyReminders.findOne({ _id: new ObjectId(id) });
      if (!reminder) {
        return;
      }
      if (!reminder.lastEmailEngagementAt) {
        reminder.lastEmailEngagementAt = new Date();
      }
      recomputeNextOccurrence(reminder);
      await persist(reminder);
    },
  };
};

export type DailyReminderRepository = ReturnType<typeof createDailyReminderRepository>;
