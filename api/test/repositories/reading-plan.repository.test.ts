import { describe, it, expect, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { MAX_DAYS_PER_PLAN, MAX_PASSAGES_PER_PLAN, MAX_READING_PLANS_PER_USER } from '@mybiblelog/shared';
import { getRepos, clearCollections, makeOwner, expectObjectId } from './helpers';

// Genesis 1:1-5 and Genesis 1:6-10.
const GEN_1_1_5 = { startVerseId: 101001001, endVerseId: 101001005 };
const GEN_1_6_10 = { startVerseId: 101001006, endVerseId: 101001010 };

describe('reading-plan.repository', () => {
  let ownerId: string;

  beforeEach(async () => {
    await clearCollections();
    ownerId = (await makeOwner()).id;
  });

  describe('create', () => {
    it('creates a plan with string ids, days, and timestamps', async () => {
      const { readingPlans } = await getRepos();
      const plan = await readingPlans.create(ownerId, {
        name: 'My Plan',
        days: [{ passages: [GEN_1_1_5] }, { passages: [GEN_1_6_10] }],
      });

      expectObjectId(plan.id);
      expect(plan.ownerId).toBe(ownerId);
      expect(plan.name).toBe('My Plan');
      expect(plan.days).toHaveLength(2);
      expectObjectId(plan.days[0]!._id);
      expectObjectId(plan.days[0]!.passages[0]!._id);
      expect(plan.days[0]!.passages[0]).toMatchObject(GEN_1_1_5);
      expect(plan.createdAt).toBeInstanceOf(Date);
    });

    it('defaults to an empty day series and trims the name', async () => {
      const { readingPlans } = await getRepos();
      const plan = await readingPlans.create(ownerId, { name: '  Spaced  ' });
      expect(plan.name).toBe('Spaced');
      expect(plan.days).toEqual([]);
    });

    it('rejects an empty name', async () => {
      const { readingPlans } = await getRepos();
      await expect(readingPlans.create(ownerId, { name: '   ' })).rejects.toThrow();
    });

    it('rejects an invalid verse range', async () => {
      const { readingPlans } = await getRepos();
      await expect(
        readingPlans.create(ownerId, { name: 'Bad', days: [{ passages: [{ startVerseId: 101001005, endVerseId: 101001001 }] }] }),
      ).rejects.toThrow();
    });

    it('rejects more than the maximum days per plan', async () => {
      const { readingPlans } = await getRepos();
      const days = Array.from({ length: MAX_DAYS_PER_PLAN + 1 }, () => ({ passages: [] }));
      await expect(readingPlans.create(ownerId, { name: 'Too many days', days })).rejects.toThrow();
    });

    it('rejects more than the maximum passages per plan across all days', async () => {
      const { readingPlans } = await getRepos();
      const passages = Array.from({ length: MAX_PASSAGES_PER_PLAN + 1 }, () => GEN_1_1_5);
      await expect(readingPlans.create(ownerId, { name: 'Too many', days: [{ passages }] })).rejects.toThrow();
    });

    it('rejects creating more than the maximum plans per user', async () => {
      const { readingPlans } = await getRepos();
      for (let i = 0; i < MAX_READING_PLANS_PER_USER; i++) {
        await readingPlans.create(ownerId, { name: `Plan ${i}` });
      }
      expect(await readingPlans.countByOwner(ownerId)).toBe(MAX_READING_PLANS_PER_USER);
      await expect(readingPlans.create(ownerId, { name: 'One too many' })).rejects.toThrow();
    });

    it('scopes the plan limit per user', async () => {
      const { readingPlans } = await getRepos();
      const otherOwner = (await makeOwner()).id;
      for (let i = 0; i < MAX_READING_PLANS_PER_USER; i++) {
        await readingPlans.create(ownerId, { name: `Plan ${i}` });
      }
      // A different user is unaffected by the first user's full quota.
      const otherPlan = await readingPlans.create(otherOwner, { name: 'Other user plan' });
      expect(otherPlan.ownerId).toBe(otherOwner);
    });
  });

  describe('update', () => {
    it('applies a partial patch and re-validates', async () => {
      const { readingPlans } = await getRepos();
      const created = await readingPlans.create(ownerId, { name: 'Original', days: [{ passages: [GEN_1_1_5] }] });

      const updated = await readingPlans.update(ownerId, created.id, { name: 'Renamed', days: [{ passages: [GEN_1_6_10] }] });
      expect(updated!.name).toBe('Renamed');
      expect(updated!.days[0]!.passages[0]).toMatchObject(GEN_1_6_10);

      await expect(
        readingPlans.update(ownerId, created.id, { days: [{ passages: [{ startVerseId: 101001005, endVerseId: 101001001 }] }] }),
      ).rejects.toThrow();
    });

    it('returns null updating a plan the owner does not own', async () => {
      const { readingPlans } = await getRepos();
      const created = await readingPlans.create(ownerId, { name: 'Mine' });
      const otherOwner = (await makeOwner()).id;
      expect(await readingPlans.update(otherOwner, created.id, { name: 'Hijack' })).toBeNull();
    });
  });

  describe('listing and deletion', () => {
    it('lists only the owner’s plans, oldest first', async () => {
      const { readingPlans } = await getRepos();
      await readingPlans.create(ownerId, { name: 'A' });
      await readingPlans.create(ownerId, { name: 'B' });
      const otherOwner = (await makeOwner()).id;
      await readingPlans.create(otherOwner, { name: 'Other' });

      const plans = await readingPlans.listByOwner(ownerId);
      expect(plans.map(p => p.name)).toEqual(['A', 'B']);
    });

    it('deletes a plan only for its owner and cascades to its trackers', async () => {
      const { readingPlans, planTrackers } = await getRepos();
      const plan = await readingPlans.create(ownerId, { name: 'Tracked' });
      await planTrackers.create(ownerId, { planId: plan.id, startDate: '2024-01-01' });
      const otherOwner = (await makeOwner()).id;

      expect(await readingPlans.deleteByIdForOwner(otherOwner, plan.id)).toBe(0);
      expect(await readingPlans.deleteByIdForOwner(ownerId, plan.id)).toBe(1);
      // The tracker was removed alongside its plan.
      expect(await planTrackers.listByOwner(ownerId)).toHaveLength(0);
    });

    it('deletes all plans for an owner', async () => {
      const { readingPlans } = await getRepos();
      await readingPlans.create(ownerId, { name: 'A' });
      await readingPlans.create(ownerId, { name: 'B' });
      await readingPlans.deleteAllByOwner(ownerId);
      expect(await readingPlans.countByOwner(ownerId)).toBe(0);
    });
  });

  it('treats a random ObjectId as not found', async () => {
    const { readingPlans } = await getRepos();
    expect(await readingPlans.findByIdForOwner(ownerId, new ObjectId().toString())).toBeNull();
  });
});
