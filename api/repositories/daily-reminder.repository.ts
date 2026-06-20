import { Types } from 'mongoose';
import type useMongooseModels from '../mongoose/useMongooseModels';
import { DailyReminderPatch, DailyReminderRecord } from './helpers/types';

type Models = Awaited<ReturnType<typeof useMongooseModels>>;
type DailyReminderDoc = ReturnType<Models['DailyReminder']['hydrate']>;

const toDailyReminderRecord = (reminder: DailyReminderDoc): DailyReminderRecord => {
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

export const createDailyReminderRepository = ({ DailyReminder }: Models) => {
  /**
   * Returns the single daily reminder document for the given user,
   * first creating it if necessary.
   * The reminder time defaults to 12:00 noon, and will be in UTC
   * until the user updates it.
   * This is OK since it won't be active until the user updates it.
   */
  const getOrCreateDocForOwner = async (ownerId: string): Promise<DailyReminderDoc> => {
    let reminder = await DailyReminder.findOne({ owner: new Types.ObjectId(ownerId) });
    if (!reminder) {
      reminder = new DailyReminder({
        owner: new Types.ObjectId(ownerId),
        hour: 12,
        minute: 0,
        timezoneOffset: 0,
        nextOccurrence: Date.now(),
        active: false,
      });
      await reminder.save();
    }
    return reminder;
  };

  return {
    async getOrCreateForOwner(ownerId: string): Promise<DailyReminderRecord> {
      const reminder = await getOrCreateDocForOwner(ownerId);
      return toDailyReminderRecord(reminder);
    },

    async updateForOwner(ownerId: string, patch: DailyReminderPatch): Promise<DailyReminderRecord> {
      const reminder = await getOrCreateDocForOwner(ownerId);
      // Assign through the hydrated document and save so the pre-save hook
      // recomputes nextOccurrence and rotates the public token on activation.
      if (typeof patch.hour !== 'undefined') { reminder.hour = patch.hour; }
      if (typeof patch.minute !== 'undefined') { reminder.minute = patch.minute; }
      if (typeof patch.timezoneOffset !== 'undefined') { reminder.timezoneOffset = patch.timezoneOffset; }
      if (typeof patch.active !== 'undefined') { reminder.active = patch.active; }
      await reminder.save();
      return toDailyReminderRecord(reminder);
    },

    /** Updates lastEmailEngagementAt for the reminder with the given public token, if any. */
    async recordEngagement(publicToken: string): Promise<void> {
      const reminder = await DailyReminder.findOne({ publicToken });
      if (reminder) {
        reminder.lastEmailEngagementAt = new Date();
        await reminder.save();
      }
    },

    async deactivateByPublicToken(publicToken: string): Promise<DailyReminderRecord | null> {
      const reminder = await DailyReminder.findOne({ publicToken });
      if (!reminder) {
        return null;
      }
      reminder.active = false;
      await reminder.save();
      return toDailyReminderRecord(reminder);
    },

    async deleteAllByOwner(ownerId: string): Promise<void> {
      await DailyReminder.deleteMany({ owner: new Types.ObjectId(ownerId) });
    },

    /** Returns active reminders whose nextOccurrence is at or before the given UTC time (ms). */
    async findDue(utcNowMs: number): Promise<DailyReminderRecord[]> {
      const reminders = await DailyReminder.find({
        nextOccurrence: { $lte: utcNowMs },
        active: true,
      });
      return reminders.map(toDailyReminderRecord);
    },

    /** Deactivates a single reminder by id (used when a user stops engaging). */
    async deactivate(id: string): Promise<void> {
      const reminder = await DailyReminder.findById(id);
      if (reminder) {
        reminder.active = false;
        await reminder.save();
      }
    },

    /**
     * Advances a reminder's schedule by saving the document, which triggers the
     * pre-save hook that recomputes nextOccurrence. Reminders created before
     * engagement tracking have no lastEmailEngagementAt; this seeds it so they
     * are not deactivated on the next cycle.
     */
    async advanceSchedule(id: string): Promise<void> {
      const reminder = await DailyReminder.findById(id);
      if (!reminder) {
        return;
      }
      if (!reminder.lastEmailEngagementAt) {
        reminder.lastEmailEngagementAt = new Date();
      }
      await reminder.save();
    },
  };
};

export type DailyReminderRepository = ReturnType<typeof createDailyReminderRepository>;
