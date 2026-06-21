import { ObjectId } from 'mongodb';
import type { Collections } from '../mongo/useCollections';
import type { PassageNoteTagDocument } from '../mongo/documents';
import { ApiErrorDetailCode } from '../http/errors/error-codes';
import { ValidationError } from '../http/errors/validation-errors';
import { isValidObjectId } from './helpers/ids';
import { isDuplicateKeyError } from './helpers/duplicate-key-error';
import { PassageNoteTagInput, PassageNoteTagRecord } from './helpers/types';

const HEX_COLOR_PATTERN = /^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/;
const LABEL_MAX_LENGTH = 32;
const DESCRIPTION_MAX_LENGTH = 1500;

/**
 * Validates and normalizes tag fields. Replaces the field-level validators
 * (required, trim, length, hex color) that lived on the Mongoose schema.
 */
const normalizeLabel = (label: string): string => {
  const trimmed = label.trim();
  if (trimmed.length < 1 || trimmed.length > LABEL_MAX_LENGTH) {
    throw new Error('Invalid tag label');
  }
  return trimmed;
};

const validateColor = (color: string): void => {
  if (!HEX_COLOR_PATTERN.test(color)) {
    throw new Error(`${color} is not a valid hexadecimal color`);
  }
};

const normalizeDescription = (description: string): string => {
  const trimmed = description.trim();
  if (trimmed.length > DESCRIPTION_MAX_LENGTH) {
    throw new Error('Tag description is too long');
  }
  return trimmed;
};

const toPassageNoteTagRecord = (doc: PassageNoteTagDocument): PassageNoteTagRecord => {
  return {
    id: doc._id.toString(),
    ownerId: doc.owner.toString(),
    label: doc.label,
    color: doc.color,
    description: doc.description,
    // noteCount is not stored; it is computed and attached per request.
    noteCount: undefined,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

const labelInUseError = () =>
  new ValidationError([{ field: 'label', code: ApiErrorDetailCode.Unique }]);

export const createPassageNoteTagRepository = ({ passageNoteTags }: Collections) => {
  return {
    async listByOwner(ownerId: string): Promise<PassageNoteTagRecord[]> {
      const docs = await passageNoteTags.find({ owner: new ObjectId(ownerId) }).toArray();
      return docs.map(toPassageNoteTagRecord);
    },

    async findByIdForOwner(ownerId: string, id: string): Promise<PassageNoteTagRecord | null> {
      const doc = await passageNoteTags.findOne({ owner: new ObjectId(ownerId), _id: new ObjectId(id) });
      return doc && toPassageNoteTagRecord(doc);
    },

    async create(ownerId: string, input: PassageNoteTagInput): Promise<PassageNoteTagRecord> {
      const owner = new ObjectId(ownerId);
      const label = normalizeLabel(input.label ?? '');
      validateColor(input.color ?? '');
      const description = normalizeDescription(input.description ?? '');

      // Enforce the per-user label uniqueness manually (the unique index
      // remains as a backstop against the read-then-write race below).
      const existing = await passageNoteTags.countDocuments({ owner, label });
      if (existing > 0) {
        throw labelInUseError();
      }

      const now = new Date();
      const doc: PassageNoteTagDocument = {
        _id: new ObjectId(),
        owner,
        label,
        color: input.color as string,
        description,
        createdAt: now,
        updatedAt: now,
      };
      try {
        await passageNoteTags.insertOne(doc);
      }
      catch (error) {
        if (isDuplicateKeyError(error)) {
          throw labelInUseError();
        }
        throw error;
      }
      return toPassageNoteTagRecord(doc);
    },

    async update(ownerId: string, id: string, patch: PassageNoteTagInput): Promise<PassageNoteTagRecord | null> {
      const owner = new ObjectId(ownerId);
      const doc = await passageNoteTags.findOne({ owner, _id: new ObjectId(id) });
      if (!doc) {
        return null;
      }

      if (patch.label) {
        const label = normalizeLabel(patch.label);
        // Reject a rename that would collide with another tag owned by this user.
        if (label !== doc.label) {
          const conflict = await passageNoteTags.countDocuments({ owner, label, _id: { $ne: doc._id } });
          if (conflict > 0) {
            throw labelInUseError();
          }
        }
        doc.label = label;
      }
      if (patch.color) { validateColor(patch.color); doc.color = patch.color; }
      if (patch.description) { doc.description = normalizeDescription(patch.description); }

      doc.updatedAt = new Date();
      try {
        await passageNoteTags.updateOne(
          { _id: doc._id },
          { $set: { label: doc.label, color: doc.color, description: doc.description, updatedAt: doc.updatedAt } },
        );
      }
      catch (error) {
        if (isDuplicateKeyError(error)) {
          throw labelInUseError();
        }
        throw error;
      }
      return toPassageNoteTagRecord(doc);
    },

    async deleteByIdForOwner(ownerId: string, id: string): Promise<number> {
      const result = await passageNoteTags.deleteOne({ owner: new ObjectId(ownerId), _id: new ObjectId(id) });
      return result.deletedCount;
    },

    async deleteAllByOwner(ownerId: string): Promise<void> {
      await passageNoteTags.deleteMany({ owner: new ObjectId(ownerId) });
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
        const count = await passageNoteTags.countDocuments({ _id: new ObjectId(tagId), owner: new ObjectId(ownerId) });
        if (!count) {
          return false;
        }
      }
      return true;
    },
  };
};

export type PassageNoteTagRepository = ReturnType<typeof createPassageNoteTagRepository>;
