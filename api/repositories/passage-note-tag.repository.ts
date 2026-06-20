import { Types } from 'mongoose';
import type useMongooseModels from '../mongoose/useMongooseModels';
import { ApiErrorDetailCode } from '../http/errors/error-codes';
import { ValidationError } from '../http/errors/validation-errors';
import { isValidObjectId } from './helpers/ids';
import { isDuplicateKeyError } from './helpers/duplicate-key-error';
import { PassageNoteTagInput, PassageNoteTagRecord } from './helpers/types';

type Models = Awaited<ReturnType<typeof useMongooseModels>>;
type PassageNoteTagDoc = ReturnType<Models['PassageNoteTag']['hydrate']>;

const toPassageNoteTagRecord = (tag: PassageNoteTagDoc): PassageNoteTagRecord => {
  return {
    id: tag._id.toString(),
    ownerId: String(tag.owner),
    label: tag.label,
    color: tag.color,
    description: tag.description,
    noteCount: tag.noteCount ?? undefined,
    createdAt: tag.createdAt,
    updatedAt: tag.updatedAt,
  };
};

const labelInUseError = () =>
  new ValidationError([{ field: 'label', code: ApiErrorDetailCode.Unique }]);

export const createPassageNoteTagRepository = ({ PassageNoteTag }: Models) => {
  return {
    async listByOwner(ownerId: string): Promise<PassageNoteTagRecord[]> {
      const tags = await PassageNoteTag.find({ owner: new Types.ObjectId(ownerId) });
      return tags.map(toPassageNoteTagRecord);
    },

    async findByIdForOwner(ownerId: string, id: string): Promise<PassageNoteTagRecord | null> {
      const tag = await PassageNoteTag.findOne({ owner: new Types.ObjectId(ownerId), _id: id });
      return tag && toPassageNoteTagRecord(tag);
    },

    async create(ownerId: string, input: PassageNoteTagInput): Promise<PassageNoteTagRecord> {
      const owner = new Types.ObjectId(ownerId);

      // Enforce the per-user label uniqueness manually (the unique index
      // remains as a backstop against the read-then-write race below).
      const existing = await PassageNoteTag.countDocuments({ owner, label: input.label });
      if (existing > 0) {
        throw labelInUseError();
      }

      const tag = new PassageNoteTag({
        owner,
        label: input.label,
        color: input.color,
        description: input.description,
      });
      try {
        await tag.save();
      }
      catch (error) {
        if (isDuplicateKeyError(error)) {
          throw labelInUseError();
        }
        throw error;
      }
      return toPassageNoteTagRecord(tag);
    },

    async update(ownerId: string, id: string, patch: PassageNoteTagInput): Promise<PassageNoteTagRecord | null> {
      const owner = new Types.ObjectId(ownerId);
      const tag = await PassageNoteTag.findOne({ owner, _id: id });
      if (!tag) {
        return null;
      }

      // Reject a rename that would collide with another tag owned by this user.
      if (patch.label && patch.label !== tag.label) {
        const conflict = await PassageNoteTag.countDocuments({ owner, label: patch.label, _id: { $ne: tag._id } });
        if (conflict > 0) {
          throw labelInUseError();
        }
      }

      if (patch.label) { tag.label = patch.label; }
      if (patch.color) { tag.color = patch.color; }
      if (patch.description) { tag.description = patch.description; }

      try {
        await tag.save();
      }
      catch (error) {
        if (isDuplicateKeyError(error)) {
          throw labelInUseError();
        }
        throw error;
      }
      return toPassageNoteTagRecord(tag);
    },

    async deleteByIdForOwner(ownerId: string, id: string): Promise<number> {
      const result = await PassageNoteTag.deleteOne({ owner: new Types.ObjectId(ownerId), _id: id });
      return result.deletedCount;
    },

    async deleteAllByOwner(ownerId: string): Promise<void> {
      await PassageNoteTag.deleteMany({ owner: new Types.ObjectId(ownerId) });
    },

    /**
     * Verifies that every id in `tagIds` is a well-formed id referencing a
     * tag owned by `ownerId`. Used to prevent notes from referencing tags
     * owned by other users.
     */
    async ownsAll(ownerId: string, tagIds: string[]): Promise<boolean> {
      for (const tagId of tagIds) {
        // Reject anything that isn't a valid ObjectId to avoid query injection
        if (!isValidObjectId(tagId)) {
          return false;
        }
        const count = await PassageNoteTag.countDocuments({ _id: tagId, owner: new Types.ObjectId(ownerId) });
        if (!count) {
          return false;
        }
      }
      return true;
    },
  };
};

export type PassageNoteTagRepository = ReturnType<typeof createPassageNoteTagRepository>;
