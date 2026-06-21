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

      const page = await feedback.listPaginated({ offset: 0, limit: 2 });

      expect(page.total).toBe(3);
      expect(page.results).toHaveLength(2);
      expect(page.results[0]!._id).toBe(third._id); // newest first
      expect(page.results[1]!._id).toBe(second._id);
      expect(page.results.map((r) => r._id)).not.toContain(first._id); // pushed to page 2
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
