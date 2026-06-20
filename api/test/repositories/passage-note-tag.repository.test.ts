import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import { ValidationError } from '../../http/errors/validation-errors';
import { getRepos, ensureIndexes, clearCollections, makeOwner, sleep, expectObjectId } from './helpers';

const tagInput = (overrides: Record<string, unknown> = {}) => ({
  label: 'Faith',
  color: '#0099ff',
  description: 'Verses about faith',
  ...overrides,
});

describe('passage-note-tag.repository', () => {
  let ownerId: string;

  beforeAll(async () => {
    // The compound { owner, label } unique index backstops the duplicate check.
    await ensureIndexes();
  });

  beforeEach(async () => {
    await clearCollections();
    ownerId = (await makeOwner()).id;
  });

  describe('create', () => {
    it('creates a tag with an ObjectId id, owner string, and timestamps', async () => {
      const { passageNoteTags } = await getRepos();

      const tag = await passageNoteTags.create(ownerId, tagInput());

      expectObjectId(tag.id);
      expect(tag.ownerId).toBe(ownerId);
      expect(tag.label).toBe('Faith');
      expect(tag.color).toBe('#0099ff');
      expect(tag.description).toBe('Verses about faith');
      expect(tag.createdAt).toBeInstanceOf(Date);
      expect(tag.updatedAt).toBeInstanceOf(Date);
    });

    it('rejects a duplicate label for the same owner (per-owner uniqueness)', async () => {
      const { passageNoteTags } = await getRepos();
      await passageNoteTags.create(ownerId, tagInput({ label: 'Hope' }));

      await expect(passageNoteTags.create(ownerId, tagInput({ label: 'Hope' }))).rejects.toBeInstanceOf(ValidationError);
    });

    it('allows the same label for a different owner', async () => {
      const { passageNoteTags } = await getRepos();
      const otherOwner = (await makeOwner()).id;
      await passageNoteTags.create(ownerId, tagInput({ label: 'Grace' }));

      const otherTag = await passageNoteTags.create(otherOwner, tagInput({ label: 'Grace' }));
      expect(otherTag.label).toBe('Grace');
    });

    it('rejects an invalid hex color', async () => {
      const { passageNoteTags } = await getRepos();
      await expect(passageNoteTags.create(ownerId, tagInput({ color: 'blue' }))).rejects.toThrow();
    });
  });

  describe('listing and lookup', () => {
    it('lists all tags for an owner', async () => {
      const { passageNoteTags } = await getRepos();
      await passageNoteTags.create(ownerId, tagInput({ label: 'A' }));
      await passageNoteTags.create(ownerId, tagInput({ label: 'B' }));

      expect(await passageNoteTags.listByOwner(ownerId)).toHaveLength(2);
    });

    it('finds a tag only for its owner', async () => {
      const { passageNoteTags } = await getRepos();
      const tag = await passageNoteTags.create(ownerId, tagInput());
      const otherOwner = (await makeOwner()).id;

      expect((await passageNoteTags.findByIdForOwner(ownerId, tag.id))?.id).toBe(tag.id);
      expect(await passageNoteTags.findByIdForOwner(otherOwner, tag.id)).toBeNull();
    });
  });

  describe('update', () => {
    it('updates fields and advances updatedAt', async () => {
      const { passageNoteTags } = await getRepos();
      const tag = await passageNoteTags.create(ownerId, tagInput());

      await sleep(10);
      const updated = await passageNoteTags.update(ownerId, tag.id, { label: 'Renamed', color: '#fff', description: 'new' });

      expect(updated!.label).toBe('Renamed');
      expect(updated!.color).toBe('#fff');
      expect(updated!.description).toBe('new');
      expect(updated!.updatedAt.getTime()).toBeGreaterThan(tag.updatedAt.getTime());
      expect(updated!.createdAt.getTime()).toBe(tag.createdAt.getTime());
    });

    it('rejects a rename that collides with another tag owned by the user', async () => {
      const { passageNoteTags } = await getRepos();
      await passageNoteTags.create(ownerId, tagInput({ label: 'Taken' }));
      const movable = await passageNoteTags.create(ownerId, tagInput({ label: 'Movable' }));

      await expect(passageNoteTags.update(ownerId, movable.id, { label: 'Taken' })).rejects.toBeInstanceOf(ValidationError);
    });

    it('returns null updating a tag the owner does not own', async () => {
      const { passageNoteTags } = await getRepos();
      const tag = await passageNoteTags.create(ownerId, tagInput());
      const otherOwner = (await makeOwner()).id;

      expect(await passageNoteTags.update(otherOwner, tag.id, { label: 'Nope' })).toBeNull();
    });
  });

  describe('deletion', () => {
    it('deletes only for the owner', async () => {
      const { passageNoteTags } = await getRepos();
      const tag = await passageNoteTags.create(ownerId, tagInput());
      const otherOwner = (await makeOwner()).id;

      expect(await passageNoteTags.deleteByIdForOwner(otherOwner, tag.id)).toBe(0);
      expect(await passageNoteTags.deleteByIdForOwner(ownerId, tag.id)).toBe(1);
    });

    it('deletes all tags for an owner', async () => {
      const { passageNoteTags } = await getRepos();
      await passageNoteTags.create(ownerId, tagInput({ label: 'X' }));
      await passageNoteTags.create(ownerId, tagInput({ label: 'Y' }));

      await passageNoteTags.deleteAllByOwner(ownerId);
      expect(await passageNoteTags.listByOwner(ownerId)).toHaveLength(0);
    });
  });

  describe('ownsAll', () => {
    it('returns true only when every id is a well-formed tag owned by the user', async () => {
      const { passageNoteTags } = await getRepos();
      const a = await passageNoteTags.create(ownerId, tagInput({ label: 'A' }));
      const b = await passageNoteTags.create(ownerId, tagInput({ label: 'B' }));
      const otherOwner = (await makeOwner()).id;
      const foreign = await passageNoteTags.create(otherOwner, tagInput({ label: 'C' }));

      expect(await passageNoteTags.ownsAll(ownerId, [a.id, b.id])).toBe(true);
      expect(await passageNoteTags.ownsAll(ownerId, [a.id, foreign.id])).toBe(false);
      expect(await passageNoteTags.ownsAll(ownerId, [a.id, new Types.ObjectId().toString()])).toBe(false);
      expect(await passageNoteTags.ownsAll(ownerId, ['not-an-object-id'])).toBe(false);
    });
  });
});
