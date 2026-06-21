import { ObjectId } from 'mongodb';
import dayjs from 'dayjs';
import { Bible } from '@mybiblelog/shared';
import type { Collections } from '../mongo/useCollections';
import type { LogEntryDocument } from '../mongo/documents';
import { LogEntryInput, LogEntryRecord } from './helpers/types';

/** Replaces the LogEntry `date` schema validator. */
const assertValidDate = (date: string): void => {
  if (!dayjs(date, 'YYYY-MM-DD', true).isValid()) {
    throw new Error(`${date} is not a valid date string`);
  }
};

/** Replaces the LogEntry pre-validate hook and verse-existence validators. */
const assertValidRange = (startVerseId: number, endVerseId: number): void => {
  if (!Bible.validateRange(startVerseId, endVerseId)) {
    throw new Error('Invalid Verse Range');
  }
};

const toLogEntryRecord = (doc: LogEntryDocument): LogEntryRecord => {
  return {
    id: doc._id.toString(),
    ownerId: doc.owner.toString(),
    date: doc.date,
    startVerseId: doc.startVerseId,
    endVerseId: doc.endVerseId,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

export const createLogEntryRepository = ({ logEntries }: Collections) => {
  return {
    async listByOwner(ownerId: string, range: { startDate?: string; endDate?: string } = {}): Promise<LogEntryRecord[]> {
      const filter: Record<string, unknown> = { owner: new ObjectId(ownerId) };
      if (range.startDate && range.endDate) {
        filter.date = { $gte: range.startDate, $lte: range.endDate };
      }
      else if (range.startDate) {
        filter.date = { $gte: range.startDate };
      }
      else if (range.endDate) {
        filter.date = { $lte: range.endDate };
      }
      const docs = await logEntries.find(filter).toArray();
      return docs.map(toLogEntryRecord);
    },

    async listRecentByOwner(ownerId: string, limit = 10): Promise<LogEntryRecord[]> {
      const docs = await logEntries
        .find({ owner: new ObjectId(ownerId) })
        .sort({ date: -1 })
        .limit(limit)
        .toArray();
      return docs.map(toLogEntryRecord);
    },

    async findByIdForOwner(ownerId: string, id: string): Promise<LogEntryRecord | null> {
      const doc = await logEntries.findOne({ owner: new ObjectId(ownerId), _id: new ObjectId(id) });
      return doc && toLogEntryRecord(doc);
    },

    async create(ownerId: string, input: LogEntryInput): Promise<LogEntryRecord> {
      assertValidDate(input.date);
      assertValidRange(input.startVerseId, input.endVerseId);
      const now = new Date();
      const doc: LogEntryDocument = {
        _id: new ObjectId(),
        owner: new ObjectId(ownerId),
        date: input.date,
        startVerseId: input.startVerseId,
        endVerseId: input.endVerseId,
        createdAt: now,
        updatedAt: now,
      };
      await logEntries.insertOne(doc);
      return toLogEntryRecord(doc);
    },

    async update(ownerId: string, id: string, patch: Partial<LogEntryInput>): Promise<LogEntryRecord | null> {
      const doc = await logEntries.findOne({ owner: new ObjectId(ownerId), _id: new ObjectId(id) });
      if (!doc) {
        return null;
      }

      if (patch.date) { assertValidDate(patch.date); doc.date = patch.date; }
      if (patch.startVerseId) { doc.startVerseId = patch.startVerseId; }
      if (patch.endVerseId) { doc.endVerseId = patch.endVerseId; }

      assertValidRange(doc.startVerseId, doc.endVerseId);
      doc.updatedAt = new Date();
      await logEntries.updateOne(
        { _id: doc._id },
        { $set: { date: doc.date, startVerseId: doc.startVerseId, endVerseId: doc.endVerseId, updatedAt: doc.updatedAt } },
      );
      return toLogEntryRecord(doc);
    },

    async deleteByIdForOwner(ownerId: string, id: string): Promise<number> {
      const result = await logEntries.deleteOne({ owner: new ObjectId(ownerId), _id: new ObjectId(id) });
      return result.deletedCount;
    },

    async deleteAllByOwner(ownerId: string): Promise<void> {
      await logEntries.deleteMany({ owner: new ObjectId(ownerId) });
    },

    async countByOwner(ownerId: string): Promise<number> {
      return logEntries.countDocuments({ owner: new ObjectId(ownerId) });
    },

    async findLatestEntryDate(ownerId: string): Promise<string | null> {
      const doc = await logEntries.findOne(
        { owner: new ObjectId(ownerId) },
        { sort: { date: -1 }, projection: { date: 1 } },
      );
      return doc?.date ?? null;
    },

    async countDistinctOwnersOnDate(date: string): Promise<number> {
      const result = await logEntries.aggregate<{ uniqueOwners: number }>([
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
      ]).toArray();

      return result.length > 0 ? result[0]!.uniqueOwners : 0;
    },
  };
};

export type LogEntryRepository = ReturnType<typeof createLogEntryRepository>;
