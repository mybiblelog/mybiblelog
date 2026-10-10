import { count, desc, eq } from 'drizzle-orm';
import type { SqliteDb } from '../../sqlite/database';
import { generateId } from '../../sqlite/ids';
import { feedback } from '../../sqlite/schema';
import { NotFoundError } from '../../http/errors/http-errors';
import type { FeedbackRepository } from '../feedback.repository';
import { FeedbackCreateInput, FeedbackPatch, FeedbackRecord, FeedbackStatus } from '../helpers/types';
import { validateFeedback } from '../helpers/validators';

type FeedbackRow = typeof feedback.$inferSelect;

const toFeedbackRecord = (row: FeedbackRow): FeedbackRecord => ({
  _id: row.id,
  ip: row.ip,
  owner: row.ownerId,
  email: row.email,
  kind: row.kind,
  message: row.message,
  status: row.status as FeedbackStatus,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export const createSqliteFeedbackRepository = (db: SqliteDb): FeedbackRepository => {
  return {
    async create(input: FeedbackCreateInput): Promise<FeedbackRecord> {
      validateFeedback(input);
      const now = new Date();
      const row: FeedbackRow = {
        id: generateId(),
        ip: input.ip,
        ownerId: input.ownerId || null,
        email: input.email,
        kind: input.kind,
        message: input.message,
        status: 'open',
        createdAt: now,
        updatedAt: now,
      };
      await db.insert(feedback).values(row);
      return toFeedbackRecord(row);
    },

    async listPaginated({ offset, limit, status }: { offset: number; limit: number; status?: FeedbackStatus }): Promise<{ results: FeedbackRecord[]; total: number }> {
      const where = status !== undefined ? eq(feedback.status, status) : undefined;
      const [totalRow, rows] = await Promise.all([
        db.select({ value: count() }).from(feedback).where(where).get(),
        db.select().from(feedback).where(where).orderBy(desc(feedback.createdAt)).limit(limit).offset(offset),
      ]);
      return { results: rows.map(toFeedbackRecord), total: totalRow?.value ?? 0 };
    },

    async countByOwner(ownerId: string): Promise<number> {
      const result = await db.select({ value: count() }).from(feedback).where(eq(feedback.ownerId, ownerId)).get();
      return result?.value ?? 0;
    },

    /** The `createdAt` of the most recently submitted feedback, or `null` if there is none. */
    async findMostRecentCreatedAt(): Promise<Date | null> {
      const row = await db.select({ createdAt: feedback.createdAt }).from(feedback)
        .orderBy(desc(feedback.createdAt))
        .limit(1)
        .get();
      return row?.createdAt ?? null;
    },

    async update(id: string, patch: FeedbackPatch): Promise<FeedbackRecord> {
      const [updated] = await db.update(feedback)
        .set({ status: patch.status, updatedAt: new Date() })
        .where(eq(feedback.id, id))
        .returning();
      if (!updated) {
        throw new NotFoundError();
      }
      return toFeedbackRecord(updated);
    },

    async deleteById(id: string): Promise<boolean> {
      const deleted = await db.delete(feedback).where(eq(feedback.id, id)).returning({ id: feedback.id });
      return deleted.length > 0;
    },
  };
};
