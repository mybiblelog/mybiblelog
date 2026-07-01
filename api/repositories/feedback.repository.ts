import { ObjectId } from 'mongodb';
import type { Collections } from '../mongo/useCollections';
import type { FeedbackDocument } from '../mongo/documents';
import { NotFoundError } from '../http/errors/http-errors';
import { FeedbackCreateInput, FeedbackPatch, FeedbackRecord, FeedbackStatus } from './helpers/types';

const FEEDBACK_KINDS = ['bug', 'feature', 'comment'];
const MESSAGE_MAX_LENGTH = 1500; // an average double-spaced page

/** Replaces the Feedback `kind` enum and `message` length schema validators. */
const validateFeedback = (input: FeedbackCreateInput): void => {
  if (!FEEDBACK_KINDS.includes(input.kind)) {
    throw new Error(`${input.kind} is not a valid feedback kind`);
  }
  if (input.message.length > MESSAGE_MAX_LENGTH) {
    throw new Error('Feedback message is too long');
  }
};

const toFeedbackRecord = (doc: FeedbackDocument): FeedbackRecord => {
  return {
    _id: doc._id.toString(),
    ip: doc.ip,
    owner: doc.owner ? doc.owner.toString() : null,
    email: doc.email,
    kind: doc.kind,
    message: doc.message,
    status: doc.status as FeedbackStatus,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

export const createFeedbackRepository = ({ feedback }: Collections) => {
  return {
    async create(input: FeedbackCreateInput): Promise<FeedbackRecord> {
      validateFeedback(input);
      const now = new Date();
      const doc: FeedbackDocument = {
        _id: new ObjectId(),
        ip: input.ip,
        owner: input.ownerId ? new ObjectId(input.ownerId) : null,
        email: input.email,
        kind: input.kind,
        message: input.message,
        status: 'open',
        createdAt: now,
        updatedAt: now,
      };
      await feedback.insertOne(doc);
      return toFeedbackRecord(doc);
    },

    async listPaginated({ offset, limit, status }: { offset: number; limit: number; status?: FeedbackStatus }): Promise<{ results: FeedbackRecord[]; total: number }> {
      const filterQuery = status !== undefined ? { status } : {};
      const [total, docs] = await Promise.all([
        feedback.countDocuments(filterQuery),
        feedback.find(filterQuery).sort({ createdAt: -1 }).skip(offset).limit(limit).toArray(),
      ]);
      return { results: docs.map(toFeedbackRecord), total };
    },

    async countByOwner(ownerId: string): Promise<number> {
      return feedback.countDocuments({ owner: new ObjectId(ownerId) });
    },

    /** The `createdAt` of the most recently submitted feedback, or `null` if there is none. */
    async findMostRecentCreatedAt(): Promise<Date | null> {
      const [mostRecent] = await feedback.find().sort({ createdAt: -1 }).limit(1).toArray();
      return mostRecent ? mostRecent.createdAt : null;
    },

    async update(id: string, patch: FeedbackPatch): Promise<FeedbackRecord> {
      const updated = await feedback.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { status: patch.status, updatedAt: new Date() } },
        { returnDocument: 'after' },
      );
      if (!updated) {
        throw new NotFoundError();
      }
      return toFeedbackRecord(updated);
    },

    async deleteById(id: string): Promise<boolean> {
      const result = await feedback.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    },
  };
};

export type FeedbackRepository = ReturnType<typeof createFeedbackRepository>;
