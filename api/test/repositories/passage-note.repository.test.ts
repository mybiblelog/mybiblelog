import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import type { PassageNoteSearchQuery } from '../../repositories/helpers/types';
import { getRepos, ensureIndexes, clearCollections, makeOwner, sleep, expectObjectId } from './helpers';

const GEN_1_1_5 = { startVerseId: 101001001, endVerseId: 101001005 };
const GEN_1_6_10 = { startVerseId: 101001006, endVerseId: 101001010 };

const baseSearch = (overrides: Partial<PassageNoteSearchQuery> = {}): PassageNoteSearchQuery => ({
  limit: 50,
  offset: 0,
  sortOn: 'createdAt',
  sortDirection: -1,
  filterTags: [],
  filterTagMatching: 'any',
  searchText: '',
  filterPassageStartVerseId: 0,
  filterPassageEndVerseId: 0,
  filterPassageMatching: 'inclusive',
  ...overrides,
});

describe('passage-note.repository', () => {
  let ownerId: string;

  beforeAll(async () => {
    // The PassageNote $text index is required for searchText queries.
    await ensureIndexes();
  });

  beforeEach(async () => {
    await clearCollections();
    ownerId = (await makeOwner()).id;
  });

  describe('create', () => {
    it('creates a note, gives each passage subdocument its own ObjectId, and sets timestamps', async () => {
      const { passageNotes } = await getRepos();

      const note = await passageNotes.create(ownerId, { content: 'A note', passages: [GEN_1_1_5] });

      expectObjectId(note.id);
      expect(note.ownerId).toBe(ownerId);
      expect(note.content).toBe('A note');
      expect(note.passages).toHaveLength(1);
      expectObjectId(note.passages[0]!._id); // nested subdocument auto-_id
      expect(note.passages[0]!.startVerseId).toBe(GEN_1_1_5.startVerseId);
      expect(note.createdAt).toBeInstanceOf(Date);
      expect(note.updatedAt).toBeInstanceOf(Date);
    });

    it('allows a content-only note and a passages-only note', async () => {
      const { passageNotes } = await getRepos();

      const contentOnly = await passageNotes.create(ownerId, { content: 'thoughts' });
      expect(contentOnly.passages).toHaveLength(0);

      const passagesOnly = await passageNotes.create(ownerId, { passages: [GEN_1_1_5] });
      expect(passagesOnly.content).toBe('');
    });

    it('rejects a note with neither content nor passages (pre-validate hook)', async () => {
      const { passageNotes } = await getRepos();
      await expect(passageNotes.create(ownerId, {})).rejects.toThrow();
    });

    it('rejects a passage with a reversed verse range (subdocument pre-validate hook)', async () => {
      const { passageNotes } = await getRepos();
      await expect(
        passageNotes.create(ownerId, { passages: [{ startVerseId: 101001005, endVerseId: 101001001 }] }),
      ).rejects.toThrow();
    });

    it('rejects content longer than the 3000 character limit', async () => {
      const { passageNotes } = await getRepos();
      await expect(passageNotes.create(ownerId, { content: 'a'.repeat(3001) })).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('replaces content, passages and tags and advances updatedAt', async () => {
      const { passageNotes, passageNoteTags } = await getRepos();
      const tag = await passageNoteTags.create(ownerId, { label: 'T', color: '#abcdef' });
      const created = await passageNotes.create(ownerId, { content: 'old', passages: [GEN_1_1_5] });

      await sleep(10);
      const updated = await passageNotes.update(ownerId, created.id, {
        content: 'new',
        passages: [GEN_1_6_10],
        tags: [tag.id],
      });

      expect(updated!.content).toBe('new');
      expect(updated!.passages[0]!.startVerseId).toBe(GEN_1_6_10.startVerseId);
      expect(updated!.tags).toEqual([tag.id]);
      expect(updated!.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
      expect(updated!.createdAt.getTime()).toBe(created.createdAt.getTime());
    });

    it('returns null and finds nothing across owners', async () => {
      const { passageNotes } = await getRepos();
      const created = await passageNotes.create(ownerId, { content: 'mine' });
      const otherOwner = (await makeOwner()).id;

      expect(await passageNotes.update(otherOwner, created.id, { content: 'hax' })).toBeNull();
      expect(await passageNotes.findByIdForOwner(otherOwner, created.id)).toBeNull();
      expect((await passageNotes.findByIdForOwner(ownerId, created.id))?.id).toBe(created.id);
      expect(await passageNotes.findByIdForOwner(ownerId, new ObjectId().toString())).toBeNull();
    });
  });

  describe('deletion and counting', () => {
    it('deletes only for the owner, deletes all, and counts', async () => {
      const { passageNotes } = await getRepos();
      const created = await passageNotes.create(ownerId, { content: 'one' });
      await passageNotes.create(ownerId, { content: 'two' });
      const otherOwner = (await makeOwner()).id;

      expect(await passageNotes.deleteByIdForOwner(otherOwner, created.id)).toBe(0);
      expect(await passageNotes.deleteByIdForOwner(ownerId, created.id)).toBe(1);
      expect(await passageNotes.countByOwner(ownerId)).toBe(1);

      await passageNotes.deleteAllByOwner(ownerId);
      expect(await passageNotes.countByOwner(ownerId)).toBe(0);
    });

    it('countByTag counts notes referencing a tag', async () => {
      const { passageNotes, passageNoteTags } = await getRepos();
      const tag = await passageNoteTags.create(ownerId, { label: 'Tagged', color: '#123456' });
      await passageNotes.create(ownerId, { content: 'a', tags: [tag.id] });
      await passageNotes.create(ownerId, { content: 'b', tags: [tag.id] });
      await passageNotes.create(ownerId, { content: 'c' });

      expect(await passageNotes.countByTag(tag.id)).toBe(2);
    });

    it('countByTags counts notes per tag in a single query', async () => {
      const { passageNotes, passageNoteTags } = await getRepos();
      const tagA = await passageNoteTags.create(ownerId, { label: 'A', color: '#111111' });
      const tagB = await passageNoteTags.create(ownerId, { label: 'B', color: '#222222' });
      const tagC = await passageNoteTags.create(ownerId, { label: 'C', color: '#333333' });
      await passageNotes.create(ownerId, { content: 'a', tags: [tagA.id] });
      await passageNotes.create(ownerId, { content: 'ab', tags: [tagA.id, tagB.id] });
      await passageNotes.create(ownerId, { content: 'untagged' });

      const counts = await passageNotes.countByTags([tagA.id, tagB.id, tagC.id]);
      expect(counts).toEqual({ [tagA.id]: 2, [tagB.id]: 1, [tagC.id]: 0 });
    });

    it('countByTags returns an empty object for no tags', async () => {
      const { passageNotes } = await getRepos();
      expect(await passageNotes.countByTags([])).toEqual({});
    });

    it('countByBook attributes a Genesis passage to exactly one book', async () => {
      const { passageNotes } = await getRepos();
      await passageNotes.create(ownerId, { passages: [GEN_1_1_5] });

      const counts = await passageNotes.countByBook(ownerId);
      const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
      expect(total).toBe(1);
    });

    it('findLatestCreatedAt returns the newest note time or null', async () => {
      const { passageNotes } = await getRepos();
      expect(await passageNotes.findLatestCreatedAt(ownerId)).toBeNull();

      await passageNotes.create(ownerId, { content: 'first' });
      const latest = await passageNotes.findLatestCreatedAt(ownerId);
      expect(latest).toBeInstanceOf(Date);
    });

    it('countDistinctOwnersCreatedBetween counts unique authors in a range', async () => {
      const { passageNotes } = await getRepos();
      const otherOwner = (await makeOwner()).id;
      await passageNotes.create(ownerId, { content: 'x' });
      await passageNotes.create(ownerId, { content: 'y' });
      await passageNotes.create(otherOwner, { content: 'z' });

      const from = new Date(Date.now() - 60 * 60 * 1000);
      const to = new Date(Date.now() + 60 * 60 * 1000);
      expect(await passageNotes.countDistinctOwnersCreatedBetween(from, to)).toBe(2);
    });
  });

  describe('search', () => {
    it('matches on full-text content and returns the search result shape (no owner)', async () => {
      const { passageNotes } = await getRepos();
      await passageNotes.create(ownerId, { content: 'grace abounds today' });
      await passageNotes.create(ownerId, { content: 'faith alone' });

      const { results, total } = await passageNotes.search(ownerId, baseSearch({ searchText: 'grace' }));

      expect(total).toBe(1);
      expect(results).toHaveLength(1);
      expect(typeof results[0]!.id).toBe('string');
      expect(results[0]).not.toHaveProperty('owner');
      expect(results[0]!.createdAt).toBeInstanceOf(Date);
    });

    it('filters by tags using any / all / exact matching', async () => {
      const { passageNotes, passageNoteTags } = await getRepos();
      const t1 = await passageNoteTags.create(ownerId, { label: 'T1', color: '#111111' });
      const t2 = await passageNoteTags.create(ownerId, { label: 'T2', color: '#222222' });
      await passageNotes.create(ownerId, { content: 'a', tags: [t1.id] });
      await passageNotes.create(ownerId, { content: 'b', tags: [t1.id, t2.id] });

      const any = await passageNotes.search(ownerId, baseSearch({ filterTags: [t1.id], filterTagMatching: 'any' }));
      expect(any.total).toBe(2);

      const all = await passageNotes.search(ownerId, baseSearch({ filterTags: [t1.id, t2.id], filterTagMatching: 'all' }));
      expect(all.total).toBe(1);

      const exact = await passageNotes.search(ownerId, baseSearch({ filterTags: [t1.id], filterTagMatching: 'exact' }));
      expect(exact.total).toBe(1);
    });

    it('filters by passage range with inclusive and exclusive matching', async () => {
      const { passageNotes } = await getRepos();
      await passageNotes.create(ownerId, { passages: [GEN_1_1_5] });
      await passageNotes.create(ownerId, { passages: [GEN_1_6_10] });

      const inclusive = await passageNotes.search(ownerId, baseSearch({
        filterPassageStartVerseId: 101001003,
        filterPassageEndVerseId: 101001007,
        filterPassageMatching: 'inclusive',
      }));
      expect(inclusive.total).toBe(2); // both passages overlap [3, 7]

      const exclusive = await passageNotes.search(ownerId, baseSearch({
        filterPassageStartVerseId: 101001001,
        filterPassageEndVerseId: 101001005,
        filterPassageMatching: 'exclusive',
      }));
      expect(exclusive.total).toBe(1); // only the 1-5 passage is fully contained
    });

    it('paginates and reports the total', async () => {
      const { passageNotes } = await getRepos();
      await passageNotes.create(ownerId, { content: 'one' });
      await passageNotes.create(ownerId, { content: 'two' });
      await passageNotes.create(ownerId, { content: 'three' });

      const { results, total } = await passageNotes.search(ownerId, baseSearch({ limit: 2, offset: 0 }));
      expect(total).toBe(3);
      expect(results).toHaveLength(2);
    });
  });

  describe('search sorted by passage', () => {
    // Mark 3. Verse ids are monotonic across the Bible, so a plain numeric
    // comparison is scripture order.
    const MARK_3_START = 141003001;
    const MARK_3_END = 141003035;

    const markPassage = (chapter: number, startVerse: number, endVerse: number) => ({
      startVerseId: 141000000 + chapter * 1000 + startVerse,
      endVerseId: 141000000 + chapter * 1000 + endVerse,
    });

    const passageSearch = (overrides: Partial<PassageNoteSearchQuery> = {}) => baseSearch({
      sortOn: 'passage',
      sortDirection: 1,
      filterPassageStartVerseId: MARK_3_START,
      filterPassageEndVerseId: MARK_3_END,
      ...overrides,
    });

    /**
     * Seeds notes whose creation order is the reverse of their scripture order,
     * so a passage sort cannot accidentally agree with a createdAt sort.
     */
    const seedNotes = async () => {
      const { passageNotes } = await getRepos();
      await passageNotes.create(ownerId, { content: 'late', passages: [markPassage(3, 20, 25)] });
      await sleep(5);
      // two passages overlapping Mark 3; the earlier (3:1-5) must order the note
      await passageNotes.create(ownerId, {
        content: 'two-passages',
        passages: [markPassage(3, 22, 30), markPassage(3, 1, 5)],
      });
      await sleep(5);
      await passageNotes.create(ownerId, { content: 'mid', passages: [markPassage(3, 10, 12)] });
      await sleep(5);
      // starts in Mark 2 and runs into Mark 3: overlaps inclusively, not contained
      await passageNotes.create(ownerId, {
        content: 'straddles',
        passages: [{ startVerseId: 141002020, endVerseId: 141003003 }],
      });
    };

    it('orders notes by their earliest passage overlapping the filter', async () => {
      const { passageNotes } = await getRepos();
      await seedNotes();

      const { results } = await passageNotes.search(ownerId, passageSearch());

      expect(results.map(r => r.content)).toEqual(['straddles', 'two-passages', 'mid', 'late']);
    });

    it('uses the earliest passage that matches, not the note\'s earliest passage overall', async () => {
      const { passageNotes } = await getRepos();
      // Mark 1 comes first in the note, but only the Mark 3 passages can match
      await passageNotes.create(ownerId, {
        content: 'earlier-passage-outside-filter',
        passages: [markPassage(1, 1, 5), markPassage(3, 30, 33)],
      });
      await sleep(5);
      await passageNotes.create(ownerId, { content: 'mid', passages: [markPassage(3, 10, 12)] });

      const { results } = await passageNotes.search(ownerId, passageSearch());

      expect(results.map(r => r.content)).toEqual(['mid', 'earlier-passage-outside-filter']);
    });

    it('orders under exclusive matching, which drops the straddling note', async () => {
      const { passageNotes } = await getRepos();
      await seedNotes();

      const { results, total } = await passageNotes.search(ownerId, passageSearch({ filterPassageMatching: 'exclusive' }));

      expect(total).toBe(3);
      expect(results.map(r => r.content)).toEqual(['two-passages', 'mid', 'late']);
    });

    it('reverses with a descending sort direction', async () => {
      const { passageNotes } = await getRepos();
      await seedNotes();

      const { results } = await passageNotes.search(ownerId, passageSearch({ sortDirection: -1 }));

      expect(results.map(r => r.content)).toEqual(['late', 'mid', 'two-passages', 'straddles']);
    });

    it('paginates in passage order', async () => {
      const { passageNotes } = await getRepos();
      await seedNotes();

      const first = await passageNotes.search(ownerId, passageSearch({ limit: 2, offset: 0 }));
      const second = await passageNotes.search(ownerId, passageSearch({ limit: 2, offset: 2 }));

      expect(first.total).toBe(4);
      expect(first.results.map(r => r.content)).toEqual(['straddles', 'two-passages']);
      expect(second.results.map(r => r.content)).toEqual(['mid', 'late']);
    });

    it('falls back to the earliest passage overall when no passage filter is set, sorting passage-less notes last', async () => {
      const { passageNotes } = await getRepos();
      await passageNotes.create(ownerId, { content: 'no-passages' });
      await sleep(5);
      await passageNotes.create(ownerId, { content: 'mark', passages: [markPassage(3, 10, 12)] });
      await sleep(5);
      await passageNotes.create(ownerId, { content: 'genesis', passages: [GEN_1_1_5] });

      const { results } = await passageNotes.search(ownerId, passageSearch({
        filterPassageStartVerseId: 0,
        filterPassageEndVerseId: 0,
      }));

      expect(results.map(r => r.content)).toEqual(['genesis', 'mark', 'no-passages']);
    });

    it('does not leak the internal sort key into results', async () => {
      const { passageNotes } = await getRepos();
      await seedNotes();

      const { results } = await passageNotes.search(ownerId, passageSearch());

      expect(results[0]).not.toHaveProperty('passageSortKey');
      expect(results[0]).not.toHaveProperty('owner');
    });
  });
});
