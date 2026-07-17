import { ObjectId } from 'mongodb';
import { Bible, MAX_DAYS_PER_PLAN, MAX_PASSAGES_PER_PLAN, MAX_READING_PLANS_PER_USER } from '@mybiblelog/shared';
import type { Collections } from '../mongo/useCollections';
import type { PlanDaySubdocument, ReadingPlanDocument } from '../mongo/documents';
import { ApiErrorDetailCode } from '../http/errors/error-codes';
import { ValidationError } from '../http/errors/validation-errors';
import { PlanDayInput, PlanDayRecord, ReadingPlanInput, ReadingPlanRecord } from './helpers/types';

const NAME_MAX_LENGTH = 100;

const planLimitError = () =>
  new ValidationError([{ field: 'plan', code: ApiErrorDetailCode.LimitReached }]);

const dayLimitError = () =>
  new ValidationError([{ field: 'days', code: ApiErrorDetailCode.LimitReached }]);

const passageLimitError = () =>
  new ValidationError([{ field: 'passages', code: ApiErrorDetailCode.LimitReached }]);

/** Validates a plan's final state (name present, days/passages valid and within limits). */
const assertValidPlan = (name: string, days: PlanDayInput[]): void => {
  if (name.length < 1 || name.length > NAME_MAX_LENGTH) {
    throw new ValidationError([{ field: 'name', code: ApiErrorDetailCode.NotValid }]);
  }
  if (days.length > MAX_DAYS_PER_PLAN) {
    throw dayLimitError();
  }
  const passages = days.flatMap(day => day.passages);
  if (passages.length > MAX_PASSAGES_PER_PLAN) {
    throw passageLimitError();
  }
  for (const passage of passages) {
    if (!Bible.validateRange(passage.startVerseId, passage.endVerseId)) {
      throw new Error('Invalid Verse Range');
    }
  }
};

/** Builds day subdocuments, giving each day and passage its own ObjectId (matching PassageNote). */
const toDaySubdocuments = (days: PlanDayInput[]): PlanDaySubdocument[] =>
  days.map(day => ({
    _id: new ObjectId(),
    passages: day.passages.map(passage => ({
      _id: new ObjectId(),
      startVerseId: passage.startVerseId,
      endVerseId: passage.endVerseId,
    })),
  }));

const toDayRecords = (days: PlanDaySubdocument[]): PlanDayRecord[] =>
  days.map(day => ({
    _id: String(day._id),
    passages: day.passages.map(passage => ({
      _id: String(passage._id),
      startVerseId: passage.startVerseId,
      endVerseId: passage.endVerseId,
    })),
  }));

const toReadingPlanRecord = (doc: ReadingPlanDocument): ReadingPlanRecord => ({
  id: doc._id.toString(),
  ownerId: doc.owner.toString(),
  name: doc.name,
  days: toDayRecords(doc.days),
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

export const createReadingPlanRepository = ({ readingPlans, planTrackers }: Collections) => {
  return {
    async listByOwner(ownerId: string): Promise<ReadingPlanRecord[]> {
      const docs = await readingPlans
        .find({ owner: new ObjectId(ownerId) })
        .sort({ createdAt: 1 })
        .toArray();
      return docs.map(toReadingPlanRecord);
    },

    async findByIdForOwner(ownerId: string, id: string): Promise<ReadingPlanRecord | null> {
      const doc = await readingPlans.findOne({ owner: new ObjectId(ownerId), _id: new ObjectId(id) });
      return doc && toReadingPlanRecord(doc);
    },

    async create(ownerId: string, input: ReadingPlanInput): Promise<ReadingPlanRecord> {
      const owner = new ObjectId(ownerId);
      const name = (input.name ?? '').trim();
      const days = input.days ?? [];
      assertValidPlan(name, days);

      // Enforce the per-user plan limit (the create button is also disabled in
      // the UI once the limit is hit, but the API is the authority).
      const existing = await readingPlans.countDocuments({ owner });
      if (existing >= MAX_READING_PLANS_PER_USER) {
        throw planLimitError();
      }

      const now = new Date();
      const doc: ReadingPlanDocument = {
        _id: new ObjectId(),
        owner,
        name,
        days: toDaySubdocuments(days),
        createdAt: now,
        updatedAt: now,
      };
      await readingPlans.insertOne(doc);
      return toReadingPlanRecord(doc);
    },

    async update(ownerId: string, id: string, patch: ReadingPlanInput): Promise<ReadingPlanRecord | null> {
      const doc = await readingPlans.findOne({ owner: new ObjectId(ownerId), _id: new ObjectId(id) });
      if (!doc) {
        return null;
      }

      if (typeof patch.name === 'string') { doc.name = patch.name.trim(); }
      if (patch.days) { doc.days = toDaySubdocuments(patch.days); }

      assertValidPlan(doc.name, doc.days);
      doc.updatedAt = new Date();
      await readingPlans.updateOne(
        { _id: doc._id },
        { $set: { name: doc.name, days: doc.days, updatedAt: doc.updatedAt } },
      );
      return toReadingPlanRecord(doc);
    },

    async deleteByIdForOwner(ownerId: string, id: string): Promise<number> {
      const owner = new ObjectId(ownerId);
      const planId = new ObjectId(id);
      const result = await readingPlans.deleteOne({ owner, _id: planId });
      if (result.deletedCount > 0) {
        // Cascade: a plan's trackers are meaningless without the plan.
        await planTrackers.deleteMany({ owner, planId });
      }
      return result.deletedCount;
    },

    async deleteAllByOwner(ownerId: string): Promise<void> {
      await readingPlans.deleteMany({ owner: new ObjectId(ownerId) });
    },

    async countByOwner(ownerId: string): Promise<number> {
      return readingPlans.countDocuments({ owner: new ObjectId(ownerId) });
    },
  };
};

export type ReadingPlanRepository = ReturnType<typeof createReadingPlanRepository>;
