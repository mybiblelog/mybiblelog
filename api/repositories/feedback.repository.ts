import { ObjectId } from 'mongodb';
import type { Collections } from '../mongo/useCollections';
import type { FeedbackDocument } from '../mongo/documents';
import { FeedbackCreateInput, FeedbackRecord } from './helpers/types';

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
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    __v: doc.__v,
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
        createdAt: now,
        updatedAt: now,
        __v: 0,
      };
      await feedback.insertOne(doc);
      return toFeedbackRecord(doc);
    },

    async listPaginated({ offset, limit }: { offset: number; limit: number }): Promise<{ results: FeedbackRecord[]; total: number }> {
      const [total, docs] = await Promise.all([
        feedback.countDocuments(),
        feedback.find().sort({ createdAt: -1 }).skip(offset).limit(limit).toArray(),
      ]);
      return { results: docs.map(toFeedbackRecord), total };
    },

    async countByOwner(ownerId: string): Promise<number> {
      return feedback.countDocuments({ owner: new ObjectId(ownerId) });
    },
  };
};

export type FeedbackRepository = ReturnType<typeof createFeedbackRepository>;
