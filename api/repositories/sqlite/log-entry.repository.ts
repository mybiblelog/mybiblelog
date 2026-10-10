import { and, count, countDistinct, desc, eq, gte, lte, type SQL } from 'drizzle-orm';
import type { SqliteDb } from '../../sqlite/database';
import { generateId } from '../../sqlite/ids';
import { logEntries } from '../../sqlite/schema';
import type { LogEntryRepository } from '../log-entry.repository';
import { LogEntryInput, LogEntryRecord } from '../helpers/types';
import { assertValidLogEntryDate, assertValidLogEntryRange } from '../helpers/validators';

type LogEntryRow = typeof logEntries.$inferSelect;

const toLogEntryRecord = (row: LogEntryRow): LogEntryRecord => ({
  id: row.id,
  ownerId: row.ownerId,
  date: row.date,
  startVerseId: row.startVerseId,
  endVerseId: row.endVerseId,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export const createSqliteLogEntryRepository = (db: SqliteDb): LogEntryRepository => {
  const findRow = async (ownerId: string, id: string): Promise<LogEntryRow | undefined> => {
    return db.select().from(logEntries)
      .where(and(eq(logEntries.ownerId, ownerId), eq(logEntries.id, id)))
      .get();
  };

  return {
    async listByOwner(ownerId: string, range: { startDate?: string; endDate?: string } = {}): Promise<LogEntryRecord[]> {
      const conditions: SQL[] = [eq(logEntries.ownerId, ownerId)];
      if (range.startDate) {
        conditions.push(gte(logEntries.date, range.startDate));
      }
      if (range.endDate) {
        conditions.push(lte(logEntries.date, range.endDate));
      }
      const rows = await db.select().from(logEntries).where(and(...conditions));
      return rows.map(toLogEntryRecord);
    },

    async listRecentByOwner(ownerId: string, limit = 10): Promise<LogEntryRecord[]> {
      const rows = await db.select().from(logEntries)
        .where(eq(logEntries.ownerId, ownerId))
        .orderBy(desc(logEntries.date))
        .limit(limit);
      return rows.map(toLogEntryRecord);
    },

    async findByIdForOwner(ownerId: string, id: string): Promise<LogEntryRecord | null> {
      const row = await findRow(ownerId, id);
      return row ? toLogEntryRecord(row) : null;
    },

    async create(ownerId: string, input: LogEntryInput): Promise<LogEntryRecord> {
      assertValidLogEntryDate(input.date);
      assertValidLogEntryRange(input.startVerseId, input.endVerseId);
      const now = new Date();
      const row: LogEntryRow = {
        id: generateId(),
        ownerId,
        date: input.date,
        startVerseId: input.startVerseId,
        endVerseId: input.endVerseId,
        createdAt: now,
        updatedAt: now,
      };
      await db.insert(logEntries).values(row);
      return toLogEntryRecord(row);
    },

    async update(ownerId: string, id: string, patch: Partial<LogEntryInput>): Promise<LogEntryRecord | null> {
      const row = await findRow(ownerId, id);
      if (!row) {
        return null;
      }

      if (patch.date) { assertValidLogEntryDate(patch.date); row.date = patch.date; }
      if (patch.startVerseId) { row.startVerseId = patch.startVerseId; }
      if (patch.endVerseId) { row.endVerseId = patch.endVerseId; }

      assertValidLogEntryRange(row.startVerseId, row.endVerseId);
      row.updatedAt = new Date();
      await db.update(logEntries)
        .set({ date: row.date, startVerseId: row.startVerseId, endVerseId: row.endVerseId, updatedAt: row.updatedAt })
        .where(eq(logEntries.id, row.id));
      return toLogEntryRecord(row);
    },

    async deleteByIdForOwner(ownerId: string, id: string): Promise<number> {
      const deleted = await db.delete(logEntries)
        .where(and(eq(logEntries.ownerId, ownerId), eq(logEntries.id, id)))
        .returning({ id: logEntries.id });
      return deleted.length;
    },

    async deleteAllByOwner(ownerId: string): Promise<void> {
      await db.delete(logEntries).where(eq(logEntries.ownerId, ownerId));
    },

    async countByOwner(ownerId: string): Promise<number> {
      const result = await db.select({ value: count() }).from(logEntries).where(eq(logEntries.ownerId, ownerId)).get();
      return result?.value ?? 0;
    },

    async findLatestEntryDate(ownerId: string): Promise<string | null> {
      const row = await db.select({ date: logEntries.date }).from(logEntries)
        .where(eq(logEntries.ownerId, ownerId))
        .orderBy(desc(logEntries.date))
        .limit(1)
        .get();
      return row?.date ?? null;
    },

    async countDistinctOwnersOnDate(date: string): Promise<number> {
      const result = await db.select({ value: countDistinct(logEntries.ownerId) }).from(logEntries)
        .where(eq(logEntries.date, date))
        .get();
      return result?.value ?? 0;
    },
  };
};
