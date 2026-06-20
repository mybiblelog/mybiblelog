import { describe, it, expect, beforeEach } from 'vitest';
import { getNextOccurrence } from '../../repositories/helpers/reminder-schedule';
import { getRepos, getModels, clearCollections, makeOwner, expectObjectId } from './helpers';

describe('daily-reminder.repository', () => {
  let ownerId: string;

  beforeEach(async () => {
    await clearCollections();
    ownerId = (await makeOwner()).id;
  });

  describe('getOrCreateForOwner', () => {
    it('creates a single inactive reminder with sensible defaults', async () => {
      const { dailyReminders } = await getRepos();

      const reminder = await dailyReminders.getOrCreateForOwner(ownerId);

      expectObjectId(reminder.id);
      expect(reminder.ownerId).toBe(ownerId);
      expect(reminder.hour).toBe(12);
      expect(reminder.minute).toBe(0);
      expect(reminder.active).toBe(false);
      expect(reminder.publicToken).toMatch(/^[A-Za-z0-9_-]+$/); // base64url
      expect(typeof reminder.nextOccurrence).toBe('number');
      expect(reminder.lastEmailEngagementAt).toBeNull();
    });

    it('is idempotent (returns the same reminder, never a second document)', async () => {
      const { dailyReminders } = await getRepos();
      const { DailyReminder } = await getModels();

      const first = await dailyReminders.getOrCreateForOwner(ownerId);
      const second = await dailyReminders.getOrCreateForOwner(ownerId);

      expect(second.id).toBe(first.id);
      expect(await DailyReminder.countDocuments({})).toBe(1);
    });

    it('records createdAt/updatedAt on the underlying document', async () => {
      const { dailyReminders } = await getRepos();
      const { DailyReminder } = await getModels();
      const reminder = await dailyReminders.getOrCreateForOwner(ownerId);

      const doc = await DailyReminder.findById(reminder.id);
      expect(doc?.createdAt).toBeInstanceOf(Date);
      expect(doc?.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('updateForOwner (pre-save hook)', () => {
    it('recomputes nextOccurrence from hour/minute/timezoneOffset', async () => {
      const { dailyReminders } = await getRepos();
      await dailyReminders.getOrCreateForOwner(ownerId);

      const updated = await dailyReminders.updateForOwner(ownerId, { hour: 8, minute: 30, timezoneOffset: 60 });

      const expected = getNextOccurrence({ hour: 8, minute: 30, timezoneOffset: 60 }).getTime();
      expect(Math.abs(updated.nextOccurrence - expected)).toBeLessThan(2000);
      expect(updated.nextOccurrence).toBeGreaterThan(Date.now());
    });

    it('rotates the public token and seeds lastEmailEngagementAt on activation', async () => {
      const { dailyReminders } = await getRepos();
      const created = await dailyReminders.getOrCreateForOwner(ownerId);

      const activated = await dailyReminders.updateForOwner(ownerId, { active: true });

      expect(activated.active).toBe(true);
      expect(activated.publicToken).not.toBe(created.publicToken);
      expect(activated.lastEmailEngagementAt).toBeInstanceOf(Date);
    });

    it('rejects out-of-range hour, minute, and timezone offset', async () => {
      const { dailyReminders } = await getRepos();
      await dailyReminders.getOrCreateForOwner(ownerId);

      await expect(dailyReminders.updateForOwner(ownerId, { hour: 24 })).rejects.toThrow();
      await expect(dailyReminders.updateForOwner(ownerId, { minute: 60 })).rejects.toThrow();
      await expect(dailyReminders.updateForOwner(ownerId, { timezoneOffset: 100 * 60 })).rejects.toThrow();
    });
  });

  describe('engagement and deactivation', () => {
    it('recordEngagement stamps lastEmailEngagementAt by public token', async () => {
      const { dailyReminders } = await getRepos();
      const created = await dailyReminders.getOrCreateForOwner(ownerId);

      await dailyReminders.recordEngagement(created.publicToken);

      const after = await dailyReminders.getOrCreateForOwner(ownerId);
      expect(after.lastEmailEngagementAt).toBeInstanceOf(Date);
    });

    it('deactivateByPublicToken deactivates a reminder or returns null for an unknown token', async () => {
      const { dailyReminders } = await getRepos();
      const activated = await dailyReminders.updateForOwner(ownerId, { active: true });

      const deactivated = await dailyReminders.deactivateByPublicToken(activated.publicToken);
      expect(deactivated?.active).toBe(false);
      expect(await dailyReminders.deactivateByPublicToken('unknown-token')).toBeNull();
    });

    it('deactivate(id) turns off an active reminder', async () => {
      const { dailyReminders } = await getRepos();
      const activated = await dailyReminders.updateForOwner(ownerId, { active: true });

      await dailyReminders.deactivate(activated.id);

      const after = await dailyReminders.getOrCreateForOwner(ownerId);
      expect(after.active).toBe(false);
    });

    it('advanceSchedule seeds lastEmailEngagementAt and recomputes nextOccurrence', async () => {
      const { dailyReminders } = await getRepos();
      const created = await dailyReminders.getOrCreateForOwner(ownerId);
      expect(created.lastEmailEngagementAt).toBeNull();

      await dailyReminders.advanceSchedule(created.id);

      const after = await dailyReminders.getOrCreateForOwner(ownerId);
      expect(after.lastEmailEngagementAt).toBeInstanceOf(Date);
      expect(after.nextOccurrence).toBeGreaterThan(Date.now());
    });
  });

  describe('findDue', () => {
    it('returns active reminders due at or before the given time, excluding inactive and future ones', async () => {
      const { dailyReminders } = await getRepos();
      const active = await dailyReminders.updateForOwner(ownerId, { active: true });

      const otherOwner = (await makeOwner()).id;
      await dailyReminders.getOrCreateForOwner(otherOwner); // inactive

      const dueIds = (await dailyReminders.findDue(active.nextOccurrence + 1000)).map((r) => r.id);
      expect(dueIds).toContain(active.id);
      expect(dueIds).toHaveLength(1); // the inactive reminder is excluded

      const notYetDue = await dailyReminders.findDue(active.nextOccurrence - 1000);
      expect(notYetDue.map((r) => r.id)).not.toContain(active.id);
    });
  });

  it('deleteAllByOwner removes the owner reminder', async () => {
    const { dailyReminders } = await getRepos();
    const { DailyReminder } = await getModels();
    await dailyReminders.getOrCreateForOwner(ownerId);

    await dailyReminders.deleteAllByOwner(ownerId);
    expect(await DailyReminder.countDocuments({})).toBe(0);
  });
});
