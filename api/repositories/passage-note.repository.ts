import { ObjectId } from 'mongodb';
import { Bible } from '@mybiblelog/shared';
import type { Collections } from '../mongo/useCollections';
import type { PassageNoteDocument, PassageSubdocument } from '../mongo/documents';
import {
  PassageNoteInput,
  PassageNoteRecord,
  PassageNoteSearchQuery,
  PassageNoteSearchResultItem,
  PassageRecord,
} from './helpers/types';

const CONTENT_MAX_LENGTH = 3000; // an average single-spaced page

/**
 * Validates a passage note's final state. Replaces the two PassageNote
 * pre-validate hooks (per-passage verse range, and content-or-passages
 * required) plus the content max-length validator.
 */
const assertValidPassageNote = (
  passages: { startVerseId: number; endVerseId: number }[],
  content: string,
): void => {
  for (const passage of passages) {
    if (!Bible.validateRange(passage.startVerseId, passage.endVerseId)) {
      throw new Error('Invalid Verse Range');
    }
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new Error('Content is too long');
  }
  if (!content.length && !passages.length) {
    throw new Error('One of `passages` or `content` required');
  }
};

/** Builds passage subdocuments, giving each its own ObjectId (as Mongoose did). */
const toPassageSubdocuments = (passages: { startVerseId: number; endVerseId: number }[]): PassageSubdocument[] => {
  return passages.map((passage) => ({
    _id: new ObjectId(),
    startVerseId: passage.startVerseId,
    endVerseId: passage.endVerseId,
  }));
};

const toPassageRecords = (passages: { _id?: unknown; startVerseId: number; endVerseId: number }[]): PassageRecord[] => {
  return passages.map((passage) => ({
    _id: String(passage._id),
    startVerseId: passage.startVerseId,
    endVerseId: passage.endVerseId,
  }));
};

const toPassageNoteRecord = (doc: PassageNoteDocument): PassageNoteRecord => {
  return {
    id: doc._id.toString(),
    ownerId: doc.owner.toString(),
    content: doc.content,
    passages: toPassageRecords(doc.passages),
    tags: doc.tags.map(String),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

const buildSearchFilter = (ownerId: string, query: PassageNoteSearchQuery): Record<string, unknown> => {
  const filterQuery: Record<string, unknown> = {
    owner: new ObjectId(ownerId),
  };

  const filterTags = query.filterTags.map((tagId) => new ObjectId(tagId));

  if (filterTags.length || query.filterTagMatching === 'exact') {
    if (query.filterTagMatching === 'any') {
      filterQuery.tags = {
        $in: filterTags,
      };
    }
    else if (query.filterTagMatching === 'all') {
      filterQuery.tags = {
        $all: filterTags,
      };
    }
    else if (query.filterTagMatching === 'exact') {
      filterQuery.tags = filterTags;
    }
  }

  if (query.filterPassageStartVerseId && query.filterPassageEndVerseId) {
    if (query.filterPassageMatching === 'inclusive') {
      filterQuery.passages = {
        $elemMatch: {
          startVerseId: { $lte: query.filterPassageEndVerseId },
          endVerseId: { $gte: query.filterPassageStartVerseId },
        },
      };
    }
    else if (query.filterPassageMatching === 'exclusive') {
      filterQuery.passages = {
        $elemMatch: {
          startVerseId: { $gte: query.filterPassageStartVerseId },
          endVerseId: { $lte: query.filterPassageEndVerseId },
        },
      };
    }
  }

  if (query.searchText) {
    filterQuery.$text = {
      $search: query.searchText,
    };
  }

  return filterQuery;
};

export const createPassageNoteRepository = ({ passageNotes }: Collections) => {
  return {
    async search(ownerId: string, query: PassageNoteSearchQuery): Promise<{ results: PassageNoteSearchResultItem[]; total: number }> {
      const filterQuery = buildSearchFilter(ownerId, query);

      const sortQuery: Record<string, 1 | -1> = {
        [query.sortOn]: query.sortDirection,
      };

      const docs = await passageNotes
        .aggregate([
          { $match: filterQuery },
          { $sort: sortQuery },
          { $skip: query.offset },
          { $limit: query.limit },
          {
            $addFields: {
              id: '$_id',
            },
          },
          {
            $project: {
              _id: 0,
              __v: 0,
              owner: 0,
            },
          },
        ])
        .toArray();

      const total = await passageNotes.countDocuments(filterQuery);

      const results: PassageNoteSearchResultItem[] = docs.map((item) => ({
        ...item,
        id: String(item.id),
        content: item.content,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        tags: (item.tags ?? []).map(String),
        passages: toPassageRecords(item.passages ?? []),
      }));

      return { results, total };
    },

    async findByIdForOwner(ownerId: string, id: string): Promise<PassageNoteRecord | null> {
      const doc = await passageNotes.findOne({ owner: new ObjectId(ownerId), _id: new ObjectId(id) });
      return doc && toPassageNoteRecord(doc);
    },

    async create(ownerId: string, input: PassageNoteInput): Promise<PassageNoteRecord> {
      const content = (input.content ?? '').trim();
      const inputPassages = input.passages ?? [];
      assertValidPassageNote(inputPassages, content);

      const now = new Date();
      const doc: PassageNoteDocument = {
        _id: new ObjectId(),
        owner: new ObjectId(ownerId),
        content,
        passages: toPassageSubdocuments(inputPassages),
        tags: (input.tags ?? []).map((tagId) => new ObjectId(tagId)),
        createdAt: now,
        updatedAt: now,
      };
      await passageNotes.insertOne(doc);
      return toPassageNoteRecord(doc);
    },

    async update(ownerId: string, id: string, patch: PassageNoteInput): Promise<PassageNoteRecord | null> {
      const doc = await passageNotes.findOne({ owner: new ObjectId(ownerId), _id: new ObjectId(id) });
      if (!doc) {
        return null;
      }

      if (typeof patch.content === 'string') { doc.content = patch.content.trim(); }
      if (patch.passages) { doc.passages = toPassageSubdocuments(patch.passages); }
      if (patch.tags) { doc.tags = patch.tags.map((tagId) => new ObjectId(tagId)); }

      assertValidPassageNote(doc.passages, doc.content);
      doc.updatedAt = new Date();
      await passageNotes.updateOne(
        { _id: doc._id },
        { $set: { content: doc.content, passages: doc.passages, tags: doc.tags, updatedAt: doc.updatedAt } },
      );
      return toPassageNoteRecord(doc);
    },

    async deleteByIdForOwner(ownerId: string, id: string): Promise<number> {
      const result = await passageNotes.deleteOne({ owner: new ObjectId(ownerId), _id: new ObjectId(id) });
      return result.deletedCount;
    },

    async deleteAllByOwner(ownerId: string): Promise<void> {
      await passageNotes.deleteMany({ owner: new ObjectId(ownerId) });
    },

    /**
     * Counts the current user's notes per Bible book, returning an object
     * keyed by each book's bibleOrder value.
     */
    async countByBook(ownerId: string): Promise<Record<string, number>> {
      const facetQuery = {};
      const projectQuery = {};

      for (const book of Bible.getBooks()) {
        const { bibleOrder } = book;

        const firstVerseId = Bible.getFirstBookVerseId(bibleOrder);
        const lastVerseId = Bible.getLastBookVerseId(bibleOrder);
        facetQuery[bibleOrder] = [
          {
            $match: {
              passages: {
                $elemMatch: {
                  startVerseId: { $gte: firstVerseId },
                  endVerseId: { $lte: lastVerseId },
                },
              },
            },
          },
          {
            $count: 'count',
          },
        ];

        projectQuery[bibleOrder] = {
          $cond: [
            {
              $eq: [
                { $size: `$${bibleOrder}` },
                0,
              ],
            },
            0,
            { $arrayElemAt: [`$${bibleOrder}.count`, 0] },
          ],
        };
      }

      const result = await passageNotes.aggregate<Record<string, number>>([
        {
          $match: {
            owner: new ObjectId(ownerId),
          },
        },
        {
          $facet: facetQuery,
        },
        {
          $project: projectQuery,
        },
      ]).toArray();

      return result[0] ?? {};
    },

    async countByTag(tagId: string): Promise<number> {
      return passageNotes.countDocuments({ tags: new ObjectId(tagId) });
    },

    /**
     * Counts, in a single aggregation, how many notes reference each of the
     * given tags. Returns an object keyed by tag id; tags with no notes are
     * present with a count of 0. Avoids the N+1 of calling `countByTag` per tag.
     */
    async countByTags(tagIds: string[]): Promise<Record<string, number>> {
      const counts: Record<string, number> = {};
      for (const tagId of tagIds) {
        counts[tagId] = 0;
      }
      if (tagIds.length === 0) {
        return counts;
      }

      const objectIds = tagIds.map((tagId) => new ObjectId(tagId));
      const rows = await passageNotes.aggregate<{ _id: ObjectId; count: number }>([
        { $match: { tags: { $in: objectIds } } },
        { $unwind: '$tags' },
        { $match: { tags: { $in: objectIds } } },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
      ]).toArray();

      for (const row of rows) {
        counts[row._id.toString()] = row.count;
      }
      return counts;
    },

    async countByOwner(ownerId: string): Promise<number> {
      return passageNotes.countDocuments({ owner: new ObjectId(ownerId) });
    },

    async findLatestCreatedAt(ownerId: string): Promise<Date | null> {
      const doc = await passageNotes.findOne(
        { owner: new ObjectId(ownerId) },
        { sort: { createdAt: -1 }, projection: { createdAt: 1 } },
      );
      return doc?.createdAt ?? null;
    },

    async countDistinctOwnersCreatedBetween(start: Date, end: Date): Promise<number> {
      const result = await passageNotes.aggregate<{ uniqueOwners: number }>([
        {
          // Filter notes by the createdAt date range
          $match: {
            createdAt: { $gte: start, $lte: end },
          },
        },
        {
          // Group by the 'owner' field to count unique owners
          $group: {
            _id: '$owner',
          },
        },
        {
          // Count the number of distinct owners
          $count: 'uniqueOwners',
        },
      ]).toArray();

      return result.length > 0 ? result[0]!.uniqueOwners : 0;
    },
  };
};

export type PassageNoteRepository = ReturnType<typeof createPassageNoteRepository>;
