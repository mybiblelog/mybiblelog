import { describe, it, expect, beforeEach } from 'vitest';
import { getRepos, clearCollections, makeOwner, sleep, expectObjectId } from './helpers';

const feedbackInput = (overrides: Record<string, unknown> = {}) => ({
  ip: '127.0.0.1',
  ownerId: null as string | null,
  email: 'reporter@example.com',
  kind: 'bug',
  message: 'Something is off',
  ...overrides,
});

describe('feedback.repository', () => {
  beforeEach(async () => {
    await clearCollections();
  });

  describe('create', () => {
    it('creates feedback for a logged-in user', async () => {
      const { feedback } = await getRepos();
      const ownerId = (await makeOwner()).id;

      const record = await feedback.create(feedbackInput({ ownerId }));

      expectObjectId(record._id);
      expect(record.owner).toBe(ownerId);
      expect(record.kind).toBe('bug');
      expect(record.email).toBe('reporter@example.com');
      expect(record.createdAt).toBeInstanceOf(Date);
      expect(record.updatedAt).toBeInstanceOf(Date);
      expect(typeof record.__v).toBe('number');
    });

    it('creates anonymous feedback with a null owner', async () => {
      const { feedback } = await getRepos();

      const record = await feedback.create(feedbackInput({ ownerId: null }));
      expect(record.owner).toBeNull();
    });

    it('rejects an invalid kind', async () => {
      const { feedback } = await getRepos();
      await expect(feedback.create(feedbackInput({ kind: 'nonsense' }))).rejects.toThrow();
    });

    it('rejects a message over the length limit', async () => {
      const { feedback } = await getRepos();
      await expect(feedback.create(feedbackInput({ message: 'a'.repeat(1501) }))).rejects.toThrow();
    });
  });

  describe('listPaginated', () => {
    it('returns newest-first with offset/limit and a total', async () => {
      const { feedback } = await getRepos();
      const first = await feedback.create(feedbackInput({ message: 'first' }));
      await sleep(10);
      const second = await feedback.create(feedbackInput({ message: 'second' }));
      await sleep(10);
      const third = await feedback.create(feedbackInput({ message: 'third' }));

      const page = await feedback.listPaginated({ offset: 0, limit: 2, archived: false });

      expect(page.total).toBe(3);
      expect(page.results).toHaveLength(2);
      expect(page.results[0]!._id).toBe(third._id); // newest first
      expect(page.results[1]!._id).toBe(second._id);
      expect(page.results.map((r) => r._id)).not.toContain(first._id); // pushed to page 2
    });

    it('defaults new feedback to unresolved and unarchived', async () => {
      const { feedback } = await getRepos();
      const record = await feedback.create(feedbackInput());
      expect(record.resolved).toBe(false);
      expect(record.archived).toBe(false);
    });

    it('only returns archived feedback when archived: true', async () => {
      const { feedback } = await getRepos();
      const inboxItem = await feedback.create(feedbackInput({ message: 'inbox' }));
      const archivedItem = await feedback.create(feedbackInput({ message: 'archived' }));
      await feedback.update(archivedItem._id, { archived: true });

      const inboxPage = await feedback.listPaginated({ offset: 0, limit: 10, archived: false });
      expect(inboxPage.results.map((r) => r._id)).toEqual([inboxItem._id]);

      const archivePage = await feedback.listPaginated({ offset: 0, limit: 10, archived: true });
      expect(archivePage.results.map((r) => r._id)).toEqual([archivedItem._id]);
    });
  });

  describe('findMostRecentCreatedAt', () => {
    it('returns null when there is no feedback', async () => {
      const { feedback } = await getRepos();
      expect(await feedback.findMostRecentCreatedAt()).toBeNull();
    });

    it('returns the createdAt of the newest feedback', async () => {
      const { feedback } = await getRepos();
      await feedback.create(feedbackInput({ message: 'first' }));
      await sleep(10);
      const second = await feedback.create(feedbackInput({ message: 'second' }));

      expect(await feedback.findMostRecentCreatedAt()).toEqual(second.createdAt);
    });
  });

  describe('update', () => {
    it('resolves a feedback submission', async () => {
      const { feedback } = await getRepos();
      const record = await feedback.create(feedbackInput());

      const updated = await feedback.update(record._id, { resolved: true });
      expect(updated.resolved).toBe(true);
      expect(updated.archived).toBe(false);
    });

    it('archives a feedback submission', async () => {
      const { feedback } = await getRepos();
      const record = await feedback.create(feedbackInput());

      const updated = await feedback.update(record._id, { archived: true });
      expect(updated.archived).toBe(true);
    });

    it('throws for a non-existent feedback id', async () => {
      const { feedback } = await getRepos();
      await expect(feedback.update('507f1f77bcf86cd799439011', { resolved: true })).rejects.toThrow();
    });
  });

  describe('deleteById', () => {
    it('deletes an existing feedback submission', async () => {
      const { feedback } = await getRepos();
      const record = await feedback.create(feedbackInput());

      expect(await feedback.deleteById(record._id)).toBe(true);
      const page = await feedback.listPaginated({ offset: 0, limit: 10, archived: false });
      expect(page.total).toBe(0);
    });

    it('returns false for a non-existent feedback id', async () => {
      const { feedback } = await getRepos();
      expect(await feedback.deleteById('507f1f77bcf86cd799439011')).toBe(false);
    });
  });

  describe('countByOwner', () => {
    it('counts feedback authored by an owner', async () => {
      const { feedback } = await getRepos();
      const ownerId = (await makeOwner()).id;
      await feedback.create(feedbackInput({ ownerId }));
      await feedback.create(feedbackInput({ ownerId }));
      await feedback.create(feedbackInput({ ownerId: null }));

      expect(await feedback.countByOwner(ownerId)).toBe(2);
    });
  });
});
