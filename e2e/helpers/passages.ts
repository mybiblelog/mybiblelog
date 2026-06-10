/**
 * Verse ID helpers for e2e tests.
 *
 * Thin wrapper over @mybiblelog/shared so the shared library is a single seam:
 * if its API changes during the migration, only this file needs updating.
 *
 * Verse IDs are numeric composites: 100000000 + book * 1e6 + chapter * 1e3 + verse,
 * with books 1-indexed in Bible order (Genesis = 1).
 */
import { Bible } from '@mybiblelog/shared';

export const verseId = (book: number, chapter: number, verse: number): number =>
  Bible.makeVerseId(book, chapter, verse);

export const countVerses = (startVerseId: number, endVerseId: number): number =>
  Bible.countRangeVerses(startVerseId, endVerseId);

export const chapterVerseCount = (book: number, chapter: number): number =>
  Bible.getChapterVerseCount(book, chapter);

export const bookChapterCount = (book: number): number =>
  Bible.getBookChapterCount(book);

/** Display string for a verse range, e.g. "Genesis 1:1-31" (matches export CSV format). */
export const displayVerseRange = (startVerseId: number, endVerseId: number, locale = 'en'): string =>
  Bible.displayVerseRange(startVerseId, endVerseId, locale);

/** Total verses in a book (sum of all chapter verse counts). */
export const bookVerseCount = (book: number): number => {
  let total = 0;
  for (let chapter = 1; chapter <= bookChapterCount(book); chapter++) {
    total += chapterVerseCount(book, chapter);
  }
  return total;
};

/** Full-chapter range, e.g. chapterRange(BOOK.GENESIS, 1) covers Genesis 1:1-31. */
export const chapterRange = (book: number, chapter: number): { startVerseId: number; endVerseId: number } => ({
  startVerseId: verseId(book, chapter, 1),
  endVerseId: verseId(book, chapter, chapterVerseCount(book, chapter)),
});

/** 1-indexed Bible-order book numbers used in verse IDs. */
export const BOOK = {
  GENESIS: 1,
  EXODUS: 2,
  PSALMS: 19,
  MATTHEW: 40,
  MARK: 41,
  LUKE: 42,
  JOHN: 43,
  JUDE: 65,
  REVELATION: 66,
} as const;
