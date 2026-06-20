import { Types } from 'mongoose';
import { Bible } from '@mybiblelog/shared';
import type useMongooseModels from '../mongoose/useMongooseModels';
import { LogEntryInput, LogEntryRecord } from './helpers/types';

/** Replaces the LogEntry pre-validate hook. */
const assertValidRange = (startVerseId: number, endVerseId: number): void => {
  if (!Bible.validateRange(startVerseId, endVerseId)) {
    throw new Error('Invalid Verse Range');
  }
};

type Models = Awaited<ReturnType<typeof useMongooseModels>>;
type LogEntryDoc = ReturnType<Models['LogEntry']['hydrate']>;

const toLogEntryRecord = (logEntry: LogEntryDoc): LogEntryRecord => {
  return {
    id: logEntry._id.toString(),
    ownerId: logEntry.owner.toString(),
    date: logEntry.date,
    startVerseId: logEntry.startVerseId,
    endVerseId: logEntry.endVerseId,
    createdAt: logEntry.createdAt,
    updatedAt: logEntry.updatedAt,
  };
};

export const createLogEntryRepository = ({ LogEntry }: Models) => {
  return {
    async listByOwner(ownerId: string, range: { startDate?: string; endDate?: string } = {}): Promise<LogEntryRecord[]> {
      const filter: Record<string, unknown> = { owner: new Types.ObjectId(ownerId) };
      if (range.startDate && range.endDate) {
        filter.date = { $gte: range.startDate, $lte: range.endDate };
      }
      else if (range.startDate) {
        filter.date = { $gte: range.startDate };
      }
      else if (range.endDate) {
        filter.date = { $lte: range.endDate };
      }
      const logEntries = await LogEntry.find(filter);
      return logEntries.map(toLogEntryRecord);
    },

    async listRecentByOwner(ownerId: string, limit = 10): Promise<LogEntryRecord[]> {
      const logEntries = await LogEntry
        .find({ owner: new Types.ObjectId(ownerId) })
        .sort({ date: -1 })
        .limit(limit)
        .exec();
      return logEntries.map(toLogEntryRecord);
    },

    async findByIdForOwner(ownerId: string, id: string): Promise<LogEntryRecord | null> {
      const logEntry = await LogEntry.findOne({ owner: new Types.ObjectId(ownerId), _id: id });
      return logEntry && toLogEntryRecord(logEntry);
    },

    async create(ownerId: string, input: LogEntryInput): Promise<LogEntryRecord> {
      assertValidRange(input.startVerseId, input.endVerseId);
      const logEntry = new LogEntry({
        owner: new Types.ObjectId(ownerId),
        date: input.date,
        startVerseId: input.startVerseId,
        endVerseId: input.endVerseId,
      });
      await logEntry.save();
      return toLogEntryRecord(logEntry);
    },

    async update(ownerId: string, id: string, patch: Partial<LogEntryInput>): Promise<LogEntryRecord | null> {
      const logEntry = await LogEntry.findOne({ owner: new Types.ObjectId(ownerId), _id: id });
      if (!logEntry) {
        return null;
      }

      if (patch.date) { logEntry.date = patch.date; }
      if (patch.startVerseId) { logEntry.startVerseId = patch.startVerseId; }
      if (patch.endVerseId) { logEntry.endVerseId = patch.endVerseId; }

      assertValidRange(logEntry.startVerseId, logEntry.endVerseId);
      await logEntry.save();
      return toLogEntryRecord(logEntry);
    },

    async deleteByIdForOwner(ownerId: string, id: string): Promise<number> {
      const result = await LogEntry.deleteOne({ owner: new Types.ObjectId(ownerId), _id: id });
      return result.deletedCount;
    },

    async deleteAllByOwner(ownerId: string): Promise<void> {
      await LogEntry.deleteMany({ owner: new Types.ObjectId(ownerId) });
    },

    async countByOwner(ownerId: string): Promise<number> {
      return LogEntry.countDocuments({ owner: new Types.ObjectId(ownerId) });
    },

    async findLatestEntryDate(ownerId: string): Promise<string | null> {
      const logEntry = await LogEntry
        .findOne({ owner: new Types.ObjectId(ownerId) })
        .sort({ date: -1 })
        .select({ date: 1 })
        .exec();
      return logEntry?.date ?? null;
    },

    async countDistinctOwnersOnDate(date: string): Promise<number> {
      const result = await LogEntry.aggregate([
        {
          // Match log entries by the exact date string
          $match: { date },
        },
        {
          // Group by owner to find unique owners
          $group: {
            _id: '$owner',
          },
        },
        {
          // Count the number of distinct owners
          $count: 'uniqueOwners',
        },
      ]).exec();

      return result.length > 0 ? result[0].uniqueOwners : 0;
    },
  };
};

export type LogEntryRepository = ReturnType<typeof createLogEntryRepository>;
