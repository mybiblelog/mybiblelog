import { ObjectId } from 'mongodb';
import type { Collections } from '../mongo/useCollections';
import type { ReadingGoalDocument } from '../mongo/documents';
import { ReadingGoalInput, ReadingGoalRecord } from './helpers/types';

const toReadingGoalRecord = (doc: ReadingGoalDocument): ReadingGoalRecord => {
  return {
    id: doc._id.toString(),
    ownerId: doc.owner.toString(),
    title: doc.title,
    passages: doc.passages.map(({ startVerseId, endVerseId }) => ({ startVerseId, endVerseId })),
    startDate: doc.startDate,
    endDate: doc.endDate,
    active: doc.active,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

// Input is validated by the route's zod schema; copy only the known fields.
const toStoredFields = (input: ReadingGoalInput) => ({
  title: input.title,
  passages: input.passages.map(({ startVerseId, endVerseId }) => ({ startVerseId, endVerseId })),
  startDate: input.startDate,
  endDate: input.endDate,
  active: input.active,
});

export const createReadingGoalRepository = ({ readingGoals }: Collections) => {
  return {
    async listByOwner(ownerId: string): Promise<ReadingGoalRecord[]> {
      const docs = await readingGoals.find({ owner: new ObjectId(ownerId) }).sort({ createdAt: 1 }).toArray();
      return docs.map(toReadingGoalRecord);
    },

    async findByIdForOwner(ownerId: string, id: string): Promise<ReadingGoalRecord | null> {
      const doc = await readingGoals.findOne({ owner: new ObjectId(ownerId), _id: new ObjectId(id) });
      return doc && toReadingGoalRecord(doc);
    },

    async create(ownerId: string, input: ReadingGoalInput): Promise<ReadingGoalRecord> {
      const now = new Date();
      const doc: ReadingGoalDocument = {
        _id: new ObjectId(),
        owner: new ObjectId(ownerId),
        ...toStoredFields(input),
        createdAt: now,
        updatedAt: now,
      };
      await readingGoals.insertOne(doc);
      return toReadingGoalRecord(doc);
    },

    async replace(ownerId: string, id: string, input: ReadingGoalInput): Promise<ReadingGoalRecord | null> {
      const doc = await readingGoals.findOneAndUpdate(
        { owner: new ObjectId(ownerId), _id: new ObjectId(id) },
        { $set: { ...toStoredFields(input), updatedAt: new Date() } },
        { returnDocument: 'after' },
      );
      return doc && toReadingGoalRecord(doc);
    },

    async deleteByIdForOwner(ownerId: string, id: string): Promise<number> {
      const result = await readingGoals.deleteOne({ owner: new ObjectId(ownerId), _id: new ObjectId(id) });
      return result.deletedCount;
    },

    async deleteAllByOwner(ownerId: string): Promise<void> {
      await readingGoals.deleteMany({ owner: new ObjectId(ownerId) });
    },
  };
};

export type ReadingGoalRepository = ReturnType<typeof createReadingGoalRepository>;
