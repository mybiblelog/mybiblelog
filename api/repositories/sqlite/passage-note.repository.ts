import { and, asc, count, countDistinct, desc, eq, gte, inArray, lte, sql, type SQL } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';
import { Bible } from '@mybiblelog/shared';
import type { SqliteDb } from '../../sqlite/database';
import { generateId } from '../../sqlite/ids';
import { passageNotePassages, passageNoteTagLinks, passageNotes } from '../../sqlite/schema';
import type { PassageNoteRepository } from '../passage-note.repository';
import {
  PassageInput,
  PassageNoteInput,
  PassageNoteRecord,
  PassageNoteSearchQuery,
  PassageNoteSearchResultItem,
  PassageRecord,
} from '../helpers/types';
import { assertValidPassageNote } from '../helpers/validators';

type PassageNoteRow = typeof passageNotes.$inferSelect;
type PassageRow = typeof passageNotePassages.$inferSelect;

/** Sorts above every real verse id, so notes with no matching passage land last. */
const NO_PASSAGE_SORT_KEY = Number.MAX_SAFE_INTEGER;

/**
 * Words MongoDB's English `$text` index ignores, so a query like "the grace"
 * doesn't match every note containing "the". A subset of Mongo's list covering
 * the words that matter in practice.
 */
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'from', 'has', 'have', 'he',
  'her', 'his', 'i', 'in', 'is', 'it', 'its', 'me', 'my', 'of', 'on', 'or', 'our', 'she', 'so',
  'that', 'the', 'their', 'them', 'they', 'this', 'to', 'was', 'we', 'were', 'what', 'which',
  'who', 'will', 'with', 'you', 'your',
]);

// Quotes a term or phrase as an FTS5 string, neutralizing FTS5 query syntax.
const ftsString = (value: string): string => `"${value.replace(/"/g, '""')}"`;

/**
 * Translates a MongoDB `$text` `$search` string into an FTS5 MATCH expression,
 * or `null` when it can match nothing. Mirrors `$text` semantics: plain terms
 * are OR'd; if any "quoted phrase" is present, every phrase must match (and
 * plain terms no longer widen the result); `-term` excludes notes containing
 * it, and negations alone match nothing.
 */
export const toFtsQuery = (search: string): string | null => {
  const phrases: string[] = [];
  const withoutPhrases = search.replace(/"([^"]*)"/g, (_match, phrase: string) => {
    if (phrase.trim()) {
      phrases.push(phrase.trim());
    }
    return ' ';
  });

  const terms: string[] = [];
  const negations: string[] = [];
  for (const token of withoutPhrases.split(/\s+/).filter(Boolean)) {
    if (token.startsWith('-') && token.length > 1) {
      negations.push(token.slice(1));
    }
    else if (!STOP_WORDS.has(token.toLowerCase())) {
      terms.push(token);
    }
  }

  const positive = phrases.length
    ? phrases.map(ftsString).join(' AND ')
    : terms.map(ftsString).join(' OR ');
  if (!positive) {
    return null;
  }
  return [`(${positive})`, ...negations.map((term) => `NOT ${ftsString(term)}`)].join(' ');
};

/**
 * SQL predicate over a `passage_note_passages` row matching the query's
 * passage filter: `inclusive` means the passage intersects the filter range;
 * `exclusive` means it is contained by it. Shared by the filter and the passage
 * sort key so the two cannot drift apart.
 */
const passageMatchCondition = (query: PassageNoteSearchQuery): SQL => {
  if (query.filterPassageMatching === 'exclusive') {
    return and(
      gte(passageNotePassages.startVerseId, query.filterPassageStartVerseId),
      lte(passageNotePassages.endVerseId, query.filterPassageEndVerseId),
    )!;
  }
  return and(
    lte(passageNotePassages.startVerseId, query.filterPassageEndVerseId),
    gte(passageNotePassages.endVerseId, query.filterPassageStartVerseId),
  )!;
};

const hasPassageFilter = (query: PassageNoteSearchQuery): boolean =>
  Boolean(query.filterPassageStartVerseId && query.filterPassageEndVerseId);

/**
 * The note's earliest matching passage, as the verse id to sort on. Verse ids
 * are monotonic across the whole Bible, so the smallest `startVerseId` is the
 * passage that comes first in scripture order. With no passage filter every
 * passage matches, which degrades to the note's earliest passage overall.
 */
const passageSortKey = (query: PassageNoteSearchQuery): SQL => {
  const matches = hasPassageFilter(query) ? sql` AND ${passageMatchCondition(query)}` : sql``;
  return sql`coalesce((
    SELECT min(${passageNotePassages.startVerseId}) FROM ${passageNotePassages}
    WHERE ${passageNotePassages.noteId} = ${passageNotes.id}${matches}
  ), ${NO_PASSAGE_SORT_KEY})`;
};

const buildSearchFilter = (ownerId: string, query: PassageNoteSearchQuery): SQL => {
  const conditions: SQL[] = [eq(passageNotes.ownerId, ownerId)];

  const filterTags = query.filterTags;
  if (query.filterTagMatching === 'any' && filterTags.length) {
    conditions.push(sql`EXISTS (
      SELECT 1 FROM ${passageNoteTagLinks}
      WHERE ${passageNoteTagLinks.noteId} = ${passageNotes.id} AND ${inArray(passageNoteTagLinks.tagId, filterTags)}
    )`);
  }
  else if (query.filterTagMatching === 'all' && filterTags.length) {
    conditions.push(sql`(
      SELECT count(DISTINCT ${passageNoteTagLinks.tagId}) FROM ${passageNoteTagLinks}
      WHERE ${passageNoteTagLinks.noteId} = ${passageNotes.id} AND ${inArray(passageNoteTagLinks.tagId, filterTags)}
    ) = ${new Set(filterTags).size}`);
  }
  else if (query.filterTagMatching === 'exact') {
    // Mongo compares the whole `tags` array, so order matters: compare the
    // note's tag ids in position order against the filter list.
    conditions.push(sql`coalesce((
      SELECT group_concat(tag_id, ',') FROM (
        SELECT ${passageNoteTagLinks.tagId} AS tag_id FROM ${passageNoteTagLinks}
        WHERE ${passageNoteTagLinks.noteId} = ${passageNotes.id}
        ORDER BY ${passageNoteTagLinks.position}
      )
    ), '') = ${filterTags.join(',')}`);
  }

  if (hasPassageFilter(query)) {
    conditions.push(sql`EXISTS (
      SELECT 1 FROM ${passageNotePassages}
      WHERE ${passageNotePassages.noteId} = ${passageNotes.id} AND ${passageMatchCondition(query)}
    )`);
  }

  if (query.searchText) {
    const ftsQuery = toFtsQuery(query.searchText);
    conditions.push(ftsQuery === null
      ? sql`0`
      : sql`${passageNotes.id} IN (SELECT note_id FROM passage_notes_fts WHERE passage_notes_fts MATCH ${ftsQuery})`);
  }

  return and(...conditions)!;
};

const toPassageRecord = (row: PassageRow): PassageRecord => ({
  _id: row.id,
  startVerseId: row.startVerseId,
  endVerseId: row.endVerseId,
});

export const createSqlitePassageNoteRepository = (db: SqliteDb): PassageNoteRepository => {
  /** Loads the passages and tag ids of the given notes, each in stored order. */
  const loadChildren = async (noteIds: string[]) => {
    const passagesByNote = new Map<string, PassageRecord[]>();
    const tagsByNote = new Map<string, string[]>();
    for (const id of noteIds) {
      passagesByNote.set(id, []);
      tagsByNote.set(id, []);
    }
    if (noteIds.length) {
      const [passageRows, tagRows] = await Promise.all([
        db.select().from(passageNotePassages)
          .where(inArray(passageNotePassages.noteId, noteIds))
          .orderBy(asc(passageNotePassages.position)),
        db.select().from(passageNoteTagLinks)
          .where(inArray(passageNoteTagLinks.noteId, noteIds))
          .orderBy(asc(passageNoteTagLinks.position)),
      ]);
      for (const row of passageRows) {
        passagesByNote.get(row.noteId)!.push(toPassageRecord(row));
      }
      for (const row of tagRows) {
        tagsByNote.get(row.noteId)!.push(row.tagId);
      }
    }
    return { passagesByNote, tagsByNote };
  };

  const toRecords = async (rows: PassageNoteRow[]): Promise<PassageNoteRecord[]> => {
    const { passagesByNote, tagsByNote } = await loadChildren(rows.map((row) => row.id));
    return rows.map((row) => ({
      id: row.id,
      ownerId: row.ownerId,
      content: row.content,
      passages: passagesByNote.get(row.id)!,
      tags: tagsByNote.get(row.id)!,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  };

  /** Statements inserting a note's passages and tag links, each with a fresh passage id. */
  const childInserts = (noteId: string, passages: PassageInput[], tags: string[]) => {
    const passageRows: PassageRow[] = passages.map((passage, position) => ({
      id: generateId(),
      noteId,
      position,
      startVerseId: passage.startVerseId,
      endVerseId: passage.endVerseId,
    }));
    const statements: BatchItem<'sqlite'>[] = [];
    if (passageRows.length) {
      statements.push(db.insert(passageNotePassages).values(passageRows));
    }
    if (tags.length) {
      statements.push(db.insert(passageNoteTagLinks).values(tags.map((tagId, position) => ({ noteId, tagId, position }))));
    }
    return { statements, passages: passageRows.map(toPassageRecord) };
  };

  const findByIdForOwner = async (ownerId: string, id: string): Promise<PassageNoteRecord | null> => {
    const row = await db.select().from(passageNotes)
      .where(and(eq(passageNotes.ownerId, ownerId), eq(passageNotes.id, id)))
      .get();
    return row ? (await toRecords([row]))[0]! : null;
  };

  // Runs statements atomically in one batch.
  const runBatch = async (statements: BatchItem<'sqlite'>[]): Promise<void> => {
    await db.batch(statements as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);
  };

  return {
    async search(ownerId: string, query: PassageNoteSearchQuery): Promise<{ results: PassageNoteSearchResultItem[]; total: number }> {
      const where = buildSearchFilter(ownerId, query);
      const direction = query.sortDirection === 1 ? asc : desc;

      const orderBy = query.sortOn === 'passage'
        // createdAt/id break ties so paging stays stable across requests
        ? [direction(passageSortKey(query)), desc(passageNotes.createdAt), asc(passageNotes.id)]
        : [direction(passageNotes.createdAt), asc(passageNotes.id)];

      const [rows, totalRow] = await Promise.all([
        db.select().from(passageNotes).where(where)
          .orderBy(...orderBy)
          .limit(query.limit)
          .offset(query.offset),
        db.select({ value: count() }).from(passageNotes).where(where).get(),
      ]);

      const records = await toRecords(rows);
      const results: PassageNoteSearchResultItem[] = records.map(({ ownerId: _ownerId, ...item }) => item);
      return { results, total: totalRow?.value ?? 0 };
    },

    findByIdForOwner,

    async create(ownerId: string, input: PassageNoteInput): Promise<PassageNoteRecord> {
      const content = (input.content ?? '').trim();
      const inputPassages = input.passages ?? [];
      const tags = input.tags ?? [];
      assertValidPassageNote(inputPassages, content);

      const now = new Date();
      const row: PassageNoteRow = { id: generateId(), ownerId, content, createdAt: now, updatedAt: now };
      const children = childInserts(row.id, inputPassages, tags);
      await runBatch([db.insert(passageNotes).values(row), ...children.statements]);

      return { ...row, passages: children.passages, tags: [...tags] };
    },

    async update(ownerId: string, id: string, patch: PassageNoteInput): Promise<PassageNoteRecord | null> {
      const existing = await findByIdForOwner(ownerId, id);
      if (!existing) {
        return null;
      }

      const content = typeof patch.content === 'string' ? patch.content.trim() : existing.content;
      const passages: PassageInput[] = patch.passages ?? existing.passages;
      const tags = patch.tags ?? existing.tags;
      assertValidPassageNote(passages, content);

      const updatedAt = new Date();
      const statements: BatchItem<'sqlite'>[] = [
        db.update(passageNotes).set({ content, updatedAt }).where(eq(passageNotes.id, id)),
      ];
      let passageRecords = existing.passages;
      if (patch.passages) {
        // Replaced passages get new ids, as Mongo subdocuments did.
        statements.push(db.delete(passageNotePassages).where(eq(passageNotePassages.noteId, id)));
      }
      if (patch.tags) {
        statements.push(db.delete(passageNoteTagLinks).where(eq(passageNoteTagLinks.noteId, id)));
      }
      const children = childInserts(id, patch.passages ?? [], patch.tags ?? []);
      if (patch.passages) {
        passageRecords = children.passages;
      }
      await runBatch([...statements, ...children.statements]);

      return { ...existing, content, passages: passageRecords, tags: [...tags], updatedAt };
    },

    async deleteByIdForOwner(ownerId: string, id: string): Promise<number> {
      const deleted = await db.delete(passageNotes)
        .where(and(eq(passageNotes.ownerId, ownerId), eq(passageNotes.id, id)))
        .returning({ id: passageNotes.id });
      return deleted.length;
    },

    async deleteAllByOwner(ownerId: string): Promise<void> {
      await db.delete(passageNotes).where(eq(passageNotes.ownerId, ownerId));
    },

    /**
     * Counts the user's notes per Bible book, returning an object keyed by each
     * book's bibleOrder value (every book present). A note counts toward a book
     * when one of its passages lies entirely within that book.
     */
    async countByBook(ownerId: string): Promise<Record<string, number>> {
      const rows = await db.select({
        noteId: passageNotePassages.noteId,
        startVerseId: passageNotePassages.startVerseId,
        endVerseId: passageNotePassages.endVerseId,
      })
        .from(passageNotePassages)
        .innerJoin(passageNotes, eq(passageNotes.id, passageNotePassages.noteId))
        .where(eq(passageNotes.ownerId, ownerId));

      const counts: Record<string, number> = {};
      for (const { bibleOrder } of Bible.getBooks()) {
        const firstVerseId = Bible.getFirstBookVerseId(bibleOrder);
        const lastVerseId = Bible.getLastBookVerseId(bibleOrder);
        const notes = new Set(rows
          .filter((row) => row.startVerseId >= firstVerseId && row.endVerseId <= lastVerseId)
          .map((row) => row.noteId));
        counts[bibleOrder] = notes.size;
      }
      return counts;
    },

    async countByTag(tagId: string): Promise<number> {
      const result = await db.select({ value: countDistinct(passageNoteTagLinks.noteId) })
        .from(passageNoteTagLinks)
        .where(eq(passageNoteTagLinks.tagId, tagId))
        .get();
      return result?.value ?? 0;
    },

    /**
     * Counts, in a single query, how many notes reference each of the given
     * tags. Tags with no notes are present with a count of 0.
     */
    async countByTags(tagIds: string[]): Promise<Record<string, number>> {
      const counts: Record<string, number> = {};
      for (const tagId of tagIds) {
        counts[tagId] = 0;
      }
      if (tagIds.length === 0) {
        return counts;
      }

      const rows = await db.select({ tagId: passageNoteTagLinks.tagId, value: countDistinct(passageNoteTagLinks.noteId) })
        .from(passageNoteTagLinks)
        .where(inArray(passageNoteTagLinks.tagId, tagIds))
        .groupBy(passageNoteTagLinks.tagId);
      for (const row of rows) {
        counts[row.tagId] = row.value;
      }
      return counts;
    },

    async countByOwner(ownerId: string): Promise<number> {
      const result = await db.select({ value: count() }).from(passageNotes).where(eq(passageNotes.ownerId, ownerId)).get();
      return result?.value ?? 0;
    },

    async findLatestCreatedAt(ownerId: string): Promise<Date | null> {
      const row = await db.select({ createdAt: passageNotes.createdAt }).from(passageNotes)
        .where(eq(passageNotes.ownerId, ownerId))
        .orderBy(desc(passageNotes.createdAt))
        .limit(1)
        .get();
      return row?.createdAt ?? null;
    },

    async countDistinctOwnersCreatedBetween(start: Date, end: Date): Promise<number> {
      const result = await db.select({ value: countDistinct(passageNotes.ownerId) }).from(passageNotes)
        .where(and(gte(passageNotes.createdAt, start), lte(passageNotes.createdAt, end)))
        .get();
      return result?.value ?? 0;
    },
  };
};
