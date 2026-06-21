import { describe, it, expect, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { getRepos, clearCollections, makeOwner, sleep, expectObjectId } from './helpers';

// Genesis 1:1-5 and Genesis 1:6-10 (verse ids encode book/chapter/verse).
const GEN_1_1_5 = { startVerseId: 101001001, endVerseId: 101001005 };
const GEN_1_6_10 = { startVerseId: 101001006, endVerseId: 101001010 };

describe('log-entry.repository', () => {
  let ownerId: string;

  beforeEach(async () => {
    await clearCollections();
    ownerId = (await makeOwner()).id;
  });

  describe('create', () => {
    it('creates an entry with ObjectId/owner strings and timestamps', async () => {
      const { logEntries } = await getRepos();

      const entry = await logEntries.create(ownerId, { date: '2024-01-01', ...GEN_1_1_5 });

      expectObjectId(entry.id);
      expect(entry.ownerId).toBe(ownerId);
      expect(entry.date).toBe('2024-01-01');
      expect(entry.startVerseId).toBe(GEN_1_1_5.startVerseId);
      expect(entry.endVerseId).toBe(GEN_1_1_5.endVerseId);
      expect(entry.createdAt).toBeInstanceOf(Date);
      expect(entry.updatedAt).toBeInstanceOf(Date);
    });

    it('rejects a reversed verse range (pre-validate hook)', async () => {
      const { logEntries } = await getRepos();
      await expect(
        logEntries.create(ownerId, { date: '2024-01-01', startVerseId: 101001005, endVerseId: 101001001 }),
      ).rejects.toThrow();
    });

    it('rejects a non-existent verse id', async () => {
      const { logEntries } = await getRepos();
      await expect(
        logEntries.create(ownerId, { date: '2024-01-01', startVerseId: 100000000, endVerseId: 100000001 }),
      ).rejects.toThrow();
    });

    it('rejects an invalid date string', async () => {
      const { logEntries } = await getRepos();
      await expect(
        logEntries.create(ownerId, { date: 'not-a-date', ...GEN_1_1_5 }),
      ).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('applies a partial patch, advances updatedAt, and keeps createdAt stable', async () => {
      const { logEntries } = await getRepos();
      const created = await logEntries.create(ownerId, { date: '2024-01-01', ...GEN_1_1_5 });

      await sleep(10);
      const updated = await logEntries.update(ownerId, created.id, { date: '2024-02-02', ...GEN_1_6_10 });

      expect(updated!.date).toBe('2024-02-02');
      expect(updated!.startVerseId).toBe(GEN_1_6_10.startVerseId);
      expect(updated!.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
      expect(updated!.createdAt.getTime()).toBe(created.createdAt.getTime());
    });

    it('re-runs the verse-range validation on update', async () => {
      const { logEntries } = await getRepos();
      const created = await logEntries.create(ownerId, { date: '2024-01-01', ...GEN_1_1_5 });

      await expect(
        logEntries.update(ownerId, created.id, { startVerseId: 101001005, endVerseId: 101001001 }),
      ).rejects.toThrow();
    });

    it('returns null when updating an entry the owner does not own', async () => {
      const { logEntries } = await getRepos();
      const created = await logEntries.create(ownerId, { date: '2024-01-01', ...GEN_1_1_5 });
      const otherOwner = (await makeOwner()).id;

      expect(await logEntries.update(otherOwner, created.id, { date: '2024-03-03' })).toBeNull();
    });
  });

  describe('listing', () => {
    it('lists by owner and filters by date range', async () => {
      const { logEntries } = await getRepos();
      await logEntries.create(ownerId, { date: '2024-01-01', ...GEN_1_1_5 });
      await logEntries.create(ownerId, { date: '2024-01-05', ...GEN_1_6_10 });
      await logEntries.create(ownerId, { date: '2024-01-10', ...GEN_1_1_5 });

      expect(await logEntries.listByOwner(ownerId)).toHaveLength(3);
      expect(await logEntries.listByOwner(ownerId, { startDate: '2024-01-05' })).toHaveLength(2);
      expect(await logEntries.listByOwner(ownerId, { endDate: '2024-01-05' })).toHaveLength(2);
      expect(await logEntries.listByOwner(ownerId, { startDate: '2024-01-02', endDate: '2024-01-06' })).toHaveLength(1);
    });

    it('lists recent entries newest-first and respects the limit', async () => {
      const { logEntries } = await getRepos();
      await logEntries.create(ownerId, { date: '2024-01-01', ...GEN_1_1_5 });
      await logEntries.create(ownerId, { date: '2024-03-01', ...GEN_1_6_10 });
      await logEntries.create(ownerId, { date: '2024-02-01', ...GEN_1_1_5 });

      const recent = await logEntries.listRecentByOwner(ownerId, 2);
      expect(recent).toHaveLength(2);
      expect(recent[0]!.date).toBe('2024-03-01');
      expect(recent[1]!.date).toBe('2024-02-01');
    });

    it('only returns entries owned by the requested owner', async () => {
      const { logEntries } = await getRepos();
      const created = await logEntries.create(ownerId, { date: '2024-01-01', ...GEN_1_1_5 });
      const otherOwner = (await makeOwner()).id;

      expect((await logEntries.findByIdForOwner(ownerId, created.id))?.id).toBe(created.id);
      expect(await logEntries.findByIdForOwner(otherOwner, created.id)).toBeNull();
    });
  });

  describe('deletion and counting', () => {
    it('deletes an entry only for its owner', async () => {
      const { logEntries } = await getRepos();
      const created = await logEntries.create(ownerId, { date: '2024-01-01', ...GEN_1_1_5 });
      const otherOwner = (await makeOwner()).id;

      expect(await logEntries.deleteByIdForOwner(otherOwner, created.id)).toBe(0);
      expect(await logEntries.deleteByIdForOwner(ownerId, created.id)).toBe(1);
    });

    it('deletes all entries for an owner and counts', async () => {
      const { logEntries } = await getRepos();
      await logEntries.create(ownerId, { date: '2024-01-01', ...GEN_1_1_5 });
      await logEntries.create(ownerId, { date: '2024-01-02', ...GEN_1_6_10 });
      expect(await logEntries.countByOwner(ownerId)).toBe(2);

      await logEntries.deleteAllByOwner(ownerId);
      expect(await logEntries.countByOwner(ownerId)).toBe(0);
    });

    it('findLatestEntryDate returns the most recent date or null', async () => {
      const { logEntries } = await getRepos();
      expect(await logEntries.findLatestEntryDate(ownerId)).toBeNull();

      await logEntries.create(ownerId, { date: '2024-01-01', ...GEN_1_1_5 });
      await logEntries.create(ownerId, { date: '2024-05-01', ...GEN_1_6_10 });
      expect(await logEntries.findLatestEntryDate(ownerId)).toBe('2024-05-01');
    });

    it('countDistinctOwnersOnDate counts unique owners for a date', async () => {
      const { logEntries } = await getRepos();
      const otherOwner = (await makeOwner()).id;
      await logEntries.create(ownerId, { date: '2024-07-04', ...GEN_1_1_5 });
      await logEntries.create(ownerId, { date: '2024-07-04', ...GEN_1_6_10 });
      await logEntries.create(otherOwner, { date: '2024-07-04', ...GEN_1_1_5 });

      expect(await logEntries.countDistinctOwnersOnDate('2024-07-04')).toBe(2);
      expect(await logEntries.countDistinctOwnersOnDate('2024-07-05')).toBe(0);
    });
  });

  it('treats a random ObjectId as not found', async () => {
    const { logEntries } = await getRepos();
    expect(await logEntries.findByIdForOwner(ownerId, new ObjectId().toString())).toBeNull();
  });
});
