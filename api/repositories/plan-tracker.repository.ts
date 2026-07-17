import { ObjectId } from 'mongodb';
import type { Collections } from '../mongo/useCollections';
import type { PlanTrackerDocument } from '../mongo/documents';
import { ApiErrorDetailCode } from '../http/errors/error-codes';
import { ValidationError } from '../http/errors/validation-errors';
import { NotFoundError } from '../http/errors/http-errors';
import { PlanTrackerCreateInput, PlanTrackerPatch, PlanTrackerRecord } from './helpers/types';

const activeTrackerExistsError = () =>
  new ValidationError([{ field: 'planId', code: ApiErrorDetailCode.Unique }]);

const toPlanTrackerRecord = (doc: PlanTrackerDocument): PlanTrackerRecord => ({
  id: doc._id.toString(),
  ownerId: doc.owner.toString(),
  planId: doc.planId.toString(),
  startDate: doc.startDate,
  completedDate: doc.completedDate,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

export const createPlanTrackerRepository = ({ planTrackers, readingPlans }: Collections) => {
  return {
    async listByOwner(ownerId: string): Promise<PlanTrackerRecord[]> {
      const docs = await planTrackers
        .find({ owner: new ObjectId(ownerId) })
        .sort({ createdAt: 1 })
        .toArray();
      return docs.map(toPlanTrackerRecord);
    },

    async findByIdForOwner(ownerId: string, id: string): Promise<PlanTrackerRecord | null> {
      const doc = await planTrackers.findOne({ owner: new ObjectId(ownerId), _id: new ObjectId(id) });
      return doc && toPlanTrackerRecord(doc);
    },

    async create(ownerId: string, input: PlanTrackerCreateInput): Promise<PlanTrackerRecord> {
      const owner = new ObjectId(ownerId);
      const planId = new ObjectId(input.planId);

      // The plan must exist and belong to this user.
      const plan = await readingPlans.findOne({ owner, _id: planId });
      if (!plan) {
        throw new NotFoundError();
      }

      // Only one active (incomplete) tracker per plan at a time.
      const activeExists = await planTrackers.countDocuments({ owner, planId, completedDate: null });
      if (activeExists > 0) {
        throw activeTrackerExistsError();
      }

      const now = new Date();
      const doc: PlanTrackerDocument = {
        _id: new ObjectId(),
        owner,
        planId,
        startDate: input.startDate,
        completedDate: null,
        createdAt: now,
        updatedAt: now,
      };
      await planTrackers.insertOne(doc);
      return toPlanTrackerRecord(doc);
    },

    async update(ownerId: string, id: string, patch: PlanTrackerPatch): Promise<PlanTrackerRecord | null> {
      const doc = await planTrackers.findOne({ owner: new ObjectId(ownerId), _id: new ObjectId(id) });
      if (!doc) {
        return null;
      }

      if (patch.completedDate !== undefined) { doc.completedDate = patch.completedDate; }

      doc.updatedAt = new Date();
      await planTrackers.updateOne(
        { _id: doc._id },
        { $set: { completedDate: doc.completedDate, updatedAt: doc.updatedAt } },
      );
      return toPlanTrackerRecord(doc);
    },

    async deleteByIdForOwner(ownerId: string, id: string): Promise<number> {
      const result = await planTrackers.deleteOne({ owner: new ObjectId(ownerId), _id: new ObjectId(id) });
      return result.deletedCount;
    },

    async deleteAllByOwner(ownerId: string): Promise<void> {
      await planTrackers.deleteMany({ owner: new ObjectId(ownerId) });
    },
  };
};

export type PlanTrackerRepository = ReturnType<typeof createPlanTrackerRepository>;
