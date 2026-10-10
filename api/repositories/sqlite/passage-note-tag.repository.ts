import { and, eq, inArray, ne } from 'drizzle-orm';
import type { SqliteDb } from '../../sqlite/database';
import { generateId } from '../../sqlite/ids';
import { passageNoteTags } from '../../sqlite/schema';
import type { PassageNoteTagRepository } from '../passage-note-tag.repository';
import { isValidObjectId } from '../helpers/ids';
import { isDuplicateKeyError } from '../helpers/duplicate-key-error';
import { PassageNoteTagInput, PassageNoteTagRecord } from '../helpers/types';
import {
  normalizeTagDescription,
  normalizeTagLabel,
  tagLabelInUseError,
  validateTagColor,
} from '../helpers/validators';

type PassageNoteTagRow = typeof passageNoteTags.$inferSelect;

const toPassageNoteTagRecord = (row: PassageNoteTagRow): PassageNoteTagRecord => ({
  id: row.id,
  ownerId: row.ownerId,
  label: row.label,
  color: row.color,
  description: row.description,
  // noteCount is not stored; it is computed and attached per request.
  noteCount: undefined,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export const createSqlitePassageNoteTagRepository = (db: SqliteDb): PassageNoteTagRepository => {
  const findRow = async (ownerId: string, id: string): Promise<PassageNoteTagRow | undefined> => {
    return db.select().from(passageNoteTags)
      .where(and(eq(passageNoteTags.ownerId, ownerId), eq(passageNoteTags.id, id)))
      .get();
  };

  const labelTaken = async (ownerId: string, label: string, exceptId?: string): Promise<boolean> => {
    const conditions = [eq(passageNoteTags.ownerId, ownerId), eq(passageNoteTags.label, label)];
    if (exceptId) {
      conditions.push(ne(passageNoteTags.id, exceptId));
    }
    const row = await db.select({ id: passageNoteTags.id }).from(passageNoteTags).where(and(...conditions)).get();
    return Boolean(row);
  };

  return {
    async listByOwner(ownerId: string): Promise<PassageNoteTagRecord[]> {
      const rows = await db.select().from(passageNoteTags).where(eq(passageNoteTags.ownerId, ownerId));
      return rows.map(toPassageNoteTagRecord);
    },

    async findByIdForOwner(ownerId: string, id: string): Promise<PassageNoteTagRecord | null> {
      const row = await findRow(ownerId, id);
      return row ? toPassageNoteTagRecord(row) : null;
    },

    async create(ownerId: string, input: PassageNoteTagInput): Promise<PassageNoteTagRecord> {
      const label = normalizeTagLabel(input.label ?? '');
      validateTagColor(input.color ?? '');
      const description = normalizeTagDescription(input.description ?? '');

      // Enforce the per-user label uniqueness manually (the unique index
      // remains as a backstop against the read-then-write race below).
      if (await labelTaken(ownerId, label)) {
        throw tagLabelInUseError();
      }

      const now = new Date();
      const row: PassageNoteTagRow = {
        id: generateId(),
        ownerId,
        label,
        color: input.color as string,
        description,
        createdAt: now,
        updatedAt: now,
      };
      try {
        await db.insert(passageNoteTags).values(row);
      }
      catch (error) {
        if (isDuplicateKeyError(error)) {
          throw tagLabelInUseError();
        }
        throw error;
      }
      return toPassageNoteTagRecord(row);
    },

    async update(ownerId: string, id: string, patch: PassageNoteTagInput): Promise<PassageNoteTagRecord | null> {
      const row = await findRow(ownerId, id);
      if (!row) {
        return null;
      }

      if (patch.label) {
        const label = normalizeTagLabel(patch.label);
        // Reject a rename that would collide with another tag owned by this user.
        if (label !== row.label && await labelTaken(ownerId, label, row.id)) {
          throw tagLabelInUseError();
        }
        row.label = label;
      }
      if (patch.color) { validateTagColor(patch.color); row.color = patch.color; }
      if (patch.description) { row.description = normalizeTagDescription(patch.description); }

      row.updatedAt = new Date();
      try {
        await db.update(passageNoteTags)
          .set({ label: row.label, color: row.color, description: row.description, updatedAt: row.updatedAt })
          .where(eq(passageNoteTags.id, row.id));
      }
      catch (error) {
        if (isDuplicateKeyError(error)) {
          throw tagLabelInUseError();
        }
        throw error;
      }
      return toPassageNoteTagRecord(row);
    },

    async deleteByIdForOwner(ownerId: string, id: string): Promise<number> {
      const deleted = await db.delete(passageNoteTags)
        .where(and(eq(passageNoteTags.ownerId, ownerId), eq(passageNoteTags.id, id)))
        .returning({ id: passageNoteTags.id });
      return deleted.length;
    },

    async deleteAllByOwner(ownerId: string): Promise<void> {
      await db.delete(passageNoteTags).where(eq(passageNoteTags.ownerId, ownerId));
    },

    /**
     * Verifies that every id in `tagIds` is a well-formed id referencing a
     * tag owned by `ownerId`. Used to prevent notes from referencing tags
     * owned by other users.
     */
    async ownsAll(ownerId: string, tagIds: string[]): Promise<boolean> {
      if (!tagIds.every(isValidObjectId)) {
        return false;
      }
      const uniqueIds = [...new Set(tagIds)];
      if (uniqueIds.length === 0) {
        return true;
      }
      const owned = await db.select({ id: passageNoteTags.id }).from(passageNoteTags)
        .where(and(eq(passageNoteTags.ownerId, ownerId), inArray(passageNoteTags.id, uniqueIds)));
      return owned.length === uniqueIds.length;
    },
  };
};
