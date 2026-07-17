import { describe, it, expect, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { getRepos, clearCollections, makeOwner, expectObjectId } from './helpers';

describe('plan-tracker.repository', () => {
  let ownerId: string;
  let planId: string;

  beforeEach(async () => {
    await clearCollections();
    ownerId = (await makeOwner()).id;
    const { readingPlans } = await getRepos();
    planId = (await readingPlans.create(ownerId, { name: 'Plan' })).id;
  });

  describe('create', () => {
    it('creates an incomplete tracker for an owned plan', async () => {
      const { planTrackers } = await getRepos();
      const tracker = await planTrackers.create(ownerId, { planId, startDate: '2024-01-01' });

      expectObjectId(tracker.id);
      expect(tracker.ownerId).toBe(ownerId);
      expect(tracker.planId).toBe(planId);
      expect(tracker.startDate).toBe('2024-01-01');
      expect(tracker.completedDate).toBeNull();
    });

    it('throws when the plan does not exist or is not owned', async () => {
      const { planTrackers } = await getRepos();
      const otherOwner = (await makeOwner()).id;
      // Another user cannot track this plan.
      await expect(planTrackers.create(otherOwner, { planId, startDate: '2024-01-01' })).rejects.toThrow();
      // A non-existent plan id is rejected too.
      await expect(
        planTrackers.create(ownerId, { planId: new ObjectId().toString(), startDate: '2024-01-01' }),
      ).rejects.toThrow();
    });

    it('rejects a second active tracker for the same plan', async () => {
      const { planTrackers } = await getRepos();
      await planTrackers.create(ownerId, { planId, startDate: '2024-01-01' });
      await expect(planTrackers.create(ownerId, { planId, startDate: '2024-02-01' })).rejects.toThrow();
    });

    it('allows a new tracker once the previous one is completed', async () => {
      const { planTrackers } = await getRepos();
      const first = await planTrackers.create(ownerId, { planId, startDate: '2024-01-01' });
      await planTrackers.update(ownerId, first.id, { completedDate: '2024-01-31' });

      const second = await planTrackers.create(ownerId, { planId, startDate: '2024-02-01' });
      expect(second.completedDate).toBeNull();
    });
  });

  describe('update', () => {
    it('marks a tracker complete and can reopen it', async () => {
      const { planTrackers } = await getRepos();
      const tracker = await planTrackers.create(ownerId, { planId, startDate: '2024-01-01' });

      const completed = await planTrackers.update(ownerId, tracker.id, { completedDate: '2024-01-31' });
      expect(completed!.completedDate).toBe('2024-01-31');

      const reopened = await planTrackers.update(ownerId, tracker.id, { completedDate: null });
      expect(reopened!.completedDate).toBeNull();
    });

    it('returns null updating a tracker the owner does not own', async () => {
      const { planTrackers } = await getRepos();
      const tracker = await planTrackers.create(ownerId, { planId, startDate: '2024-01-01' });
      const otherOwner = (await makeOwner()).id;
      expect(await planTrackers.update(otherOwner, tracker.id, { completedDate: '2024-01-31' })).toBeNull();
    });
  });

  describe('listing and deletion', () => {
    it('lists only the owner’s trackers', async () => {
      const { planTrackers } = await getRepos();
      await planTrackers.create(ownerId, { planId, startDate: '2024-01-01' });
      expect(await planTrackers.listByOwner(ownerId)).toHaveLength(1);

      const otherOwner = (await makeOwner()).id;
      expect(await planTrackers.listByOwner(otherOwner)).toHaveLength(0);
    });

    it('deletes a tracker only for its owner', async () => {
      const { planTrackers } = await getRepos();
      const tracker = await planTrackers.create(ownerId, { planId, startDate: '2024-01-01' });
      const otherOwner = (await makeOwner()).id;

      expect(await planTrackers.deleteByIdForOwner(otherOwner, tracker.id)).toBe(0);
      expect(await planTrackers.deleteByIdForOwner(ownerId, tracker.id)).toBe(1);
    });
  });
});
