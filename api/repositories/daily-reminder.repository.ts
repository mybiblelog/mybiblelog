import { Types } from 'mongoose';
import type useMongooseModels from '../mongoose/useMongooseModels';
import { translateMongooseError } from './translate-mongoose-error';
import { DailyReminderPatch, DailyReminderRecord } from './types';

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
      try {
        await reminder.save();
      }
      catch (error) {
        translateMongooseError(error);
      }
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
  };
};

export type DailyReminderRepository = ReturnType<typeof createDailyReminderRepository>;
