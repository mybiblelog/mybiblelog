import { Types } from 'mongoose';
import { Bible } from '@mybiblelog/shared';
import type useMongooseModels from '../mongoose/useMongooseModels';
import { ValidationError } from '../router/errors/validation-errors';
import {
  PassageNoteInput,
  PassageNoteRecord,
  PassageNoteSearchQuery,
  PassageNoteSearchResultItem,
  PassageRecord,
} from './types';

type Models = Awaited<ReturnType<typeof useMongooseModels>>;
type PassageNoteDoc = ReturnType<Models['PassageNote']['hydrate']>;

const toPassageRecords = (passages: { _id?: unknown; startVerseId: number; endVerseId: number }[]): PassageRecord[] => {
  return passages.map((passage) => ({
    _id: String(passage._id),
    startVerseId: passage.startVerseId,
    endVerseId: passage.endVerseId,
  }));
};

const toPassageNoteRecord = (passageNote: PassageNoteDoc): PassageNoteRecord => {
  return {
    id: passageNote._id.toString(),
    ownerId: String(passageNote.owner),
    content: passageNote.content,
    passages: toPassageRecords(passageNote.passages),
    tags: passageNote.tags.map(String),
    createdAt: passageNote.createdAt,
    updatedAt: passageNote.updatedAt,
  };
};

const buildSearchFilter = (ownerId: string, query: PassageNoteSearchQuery): Record<string, unknown> => {
  const filterQuery: Record<string, unknown> = {
    owner: new Types.ObjectId(ownerId),
  };

  const filterTags = query.filterTags.map((tagId) => new Types.ObjectId(tagId));

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

export const createPassageNoteRepository = ({ PassageNote }: Models) => {
  return {
    async search(ownerId: string, query: PassageNoteSearchQuery): Promise<{ results: PassageNoteSearchResultItem[]; total: number }> {
      const filterQuery = buildSearchFilter(ownerId, query);

      const sortQuery: Record<string, 1 | -1> = {
        [query.sortOn]: query.sortDirection,
      };

      const passageNotes = await PassageNote
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
        ]);

      const total = await PassageNote.countDocuments(filterQuery);

      const results: PassageNoteSearchResultItem[] = passageNotes.map((item) => ({
        ...item,
        id: String(item.id),
        tags: (item.tags ?? []).map(String),
        passages: toPassageRecords(item.passages ?? []),
      }));

      return { results, total };
    },

    async findByIdForOwner(ownerId: string, id: string): Promise<PassageNoteRecord | null> {
      const passageNote = await PassageNote.findOne({ owner: new Types.ObjectId(ownerId), _id: id });
      return passageNote && toPassageNoteRecord(passageNote);
    },

    async create(ownerId: string, input: PassageNoteInput): Promise<PassageNoteRecord> {
      const passageNote = new PassageNote({
        owner: new Types.ObjectId(ownerId),
        content: input.content,
        passages: input.passages,
        tags: input.tags,
      });
      try {
        await passageNote.validate();
      }
      catch (error) {
        throw new ValidationError();
      }
      await passageNote.save();
      return toPassageNoteRecord(passageNote);
    },

    async update(ownerId: string, id: string, patch: PassageNoteInput): Promise<PassageNoteRecord | null> {
      const passageNote = await PassageNote.findOne({ owner: new Types.ObjectId(ownerId), _id: id });
      if (!passageNote) {
        return null;
      }

      if (typeof patch.content === 'string') { passageNote.content = patch.content; }
      if (patch.passages) { passageNote.set('passages', patch.passages); }
      if (patch.tags) { passageNote.set('tags', patch.tags); }

      try {
        await passageNote.validate();
      }
      catch (error) {
        throw new ValidationError();
      }
      await passageNote.save();
      return toPassageNoteRecord(passageNote);
    },

    async deleteByIdForOwner(ownerId: string, id: string): Promise<number> {
      const result = await PassageNote.deleteOne({ owner: new Types.ObjectId(ownerId), _id: id });
      return result.deletedCount;
    },

    async deleteAllByOwner(ownerId: string): Promise<void> {
      await PassageNote.deleteMany({ owner: new Types.ObjectId(ownerId) });
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

      const result = await PassageNote.aggregate([
        {
          $match: {
            owner: new Types.ObjectId(ownerId),
          },
        },
        {
          $facet: facetQuery,
        },
        {
          $project: projectQuery,
        },
      ]);

      return result[0];
    },

    async countByTag(tagId: string): Promise<number> {
      return PassageNote.countDocuments({ tags: new Types.ObjectId(tagId) });
    },

    async countByOwner(ownerId: string): Promise<number> {
      return PassageNote.countDocuments({ owner: new Types.ObjectId(ownerId) });
    },

    async findLatestCreatedAt(ownerId: string): Promise<Date | null> {
      const passageNote = await PassageNote
        .findOne({ owner: new Types.ObjectId(ownerId) })
        .sort({ createdAt: -1 })
        .select({ createdAt: 1 })
        .exec();
      return passageNote?.createdAt ?? null;
    },

    async countDistinctOwnersCreatedBetween(start: Date, end: Date): Promise<number> {
      const result = await PassageNote.aggregate([
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
      ]).exec();

      return result.length > 0 ? result[0].uniqueOwners : 0;
    },
  };
};

export type PassageNoteRepository = ReturnType<typeof createPassageNoteRepository>;
