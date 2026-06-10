import { Types } from 'mongoose';
import type useMongooseModels from '../mongoose/useMongooseModels';
import { translateMongooseError } from './translate-mongoose-error';
import { FeedbackCreateInput, FeedbackRecord } from './types';

type Models = Awaited<ReturnType<typeof useMongooseModels>>;
type FeedbackDoc = ReturnType<Models['Feedback']['hydrate']>;

const toFeedbackRecord = (feedback: FeedbackDoc): FeedbackRecord => {
  return {
    _id: feedback._id.toString(),
    ip: feedback.ip,
    owner: feedback.owner ? feedback.owner.toString() : null,
    email: feedback.email,
    kind: feedback.kind,
    message: feedback.message,
    createdAt: feedback.createdAt,
    updatedAt: feedback.updatedAt,
    __v: feedback.__v,
  };
};

export const createFeedbackRepository = ({ Feedback }: Models) => {
  return {
    async create(input: FeedbackCreateInput): Promise<FeedbackRecord> {
      const feedback = new Feedback({
        ip: input.ip,
        owner: input.ownerId ? new Types.ObjectId(input.ownerId) : null,
        email: input.email,
        kind: input.kind,
        message: input.message,
      });
      try {
        await feedback.save();
      }
      catch (error) {
        translateMongooseError(error);
      }
      return toFeedbackRecord(feedback);
    },

    async listPaginated({ offset, limit }: { offset: number; limit: number }): Promise<{ results: FeedbackRecord[]; total: number }> {
      const [total, feedback] = await Promise.all([
        Feedback.countDocuments(),
        Feedback.find().sort({ createdAt: -1 }).skip(offset).limit(limit).exec(),
      ]);
      return { results: feedback.map(toFeedbackRecord), total };
    },

    async countByOwner(ownerId: string): Promise<number> {
      return Feedback.countDocuments({ owner: new Types.ObjectId(ownerId) });
    },
  };
};

export type FeedbackRepository = ReturnType<typeof createFeedbackRepository>;
