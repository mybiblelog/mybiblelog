import bibleBooks, { type BibleBook } from '../static/bible-books';
import commonChapterVerses from '../static/chapter-verses/nasb';
import deuterocanonicalChapterVerses from '../static/chapter-verses/deuterocanonical';
import { makeVerseId } from './encoding';

/**
 * Chapter verse counts for every supported book. The 66-book common canon comes from
 * the NASB structure; the deuterocanonical books are merged in on top. Their
 * book indices (67-77) never collide with the 1-66 keys, so the merge is safe.
 */
const chapterVerses: { [key: number]: number } = {
  ...commonChapterVerses,
  ...deuterocanonicalChapterVerses,
};

/** Books of the 66-book common canon, in canonical (bibleOrder) order. */
const commonBooks = bibleBooks
  .filter((book) => !book.deuterocanonical)
  .sort((a, b) => a.bibleOrder - b.bibleOrder);

/**
 * The default book list is the 66-book common canon. Deuterocanonical books are
 * opt-in via `getBooksForCanon`, so every existing caller (and the core
 * traversal helpers that walk `1..getBookCount()`) keeps its 66-book behaviour.
 */
export const getBooks = (): BibleBook[] => commonBooks;

/** Every supported book, including deuterocanonical ones, in bibleOrder. */
export const getAllBooks = (): BibleBook[] =>
  [...bibleBooks].sort((a, b) => a.bibleOrder - b.bibleOrder);

/**
 * The books that make up a reader's selected canon, sorted into display order.
 * When deuterocanonical books are included they are interleaved between the
 * common books following the NRSVUE full-canon order (via `dcBookOrder`);
 * otherwise this is exactly the 66-book common canon.
 */
export const getBooksForCanon = (includeDeuterocanonical = false): BibleBook[] => {
  const books = includeDeuterocanonical ? bibleBooks : commonBooks;
  return [...books].sort((a, b) => a.dcBookOrder - b.dcBookOrder);
};

export const getChapterVerses = () => chapterVerses;

export const getBookCount = (): number => getBooks().length;

// Built once at module scope: testament membership is static, and the book-list
// filters that ask this question ask it for every book on every render.
const newTestamentIndices = new Set(
  bibleBooks.filter((b) => b.newTestament).map((b) => b.bibleOrder),
);

export const isNewTestament = (bookIndex: number): boolean => newTestamentIndices.has(bookIndex);

export const getBookChapterCount = (bookIndex: number): number => {
  const targetBook = bibleBooks.find((b) => b.bibleOrder === bookIndex);
  if (!targetBook) { return 0; }
  return targetBook.chapterCount;
};

export const getChapterVerseCount = (bookIndex: number, chapterIndex: number): number => {
  const chapterId = makeVerseId(bookIndex, chapterIndex);
  const result = chapterVerses[chapterId];
  return result || 0;
};

export const getBookName = (bookIndex: number, lang: string = 'en'): string => {
  const targetBook = bibleBooks.find((b) => b.bibleOrder === bookIndex);
  if (!targetBook) { return ''; }
  const localeData = targetBook.locales[lang] ?? targetBook.locales.en;
  return localeData.name;
};

export const getBookIndex = (bookName: string, lang: string = 'en'): number => {
  const caseInsensitive = bookName.toLocaleLowerCase();
  const targetBook = bibleBooks.find((b) => {
    const localeData = b.locales[lang] ?? b.locales.en;
    if (localeData.name.toLocaleLowerCase() === caseInsensitive) { return true; }
    const insensitiveAbbreviations = localeData.abbreviations.map((a) => a.toLocaleLowerCase());
    if (insensitiveAbbreviations.includes(caseInsensitive)) { return true; }
    return false;
  });
  if (!targetBook) { return -1; }
  return targetBook.bibleOrder;
};

/**
 * Returns the Paratext/USFM-style book code used by YouVersion and Bible.com
 * (e.g. "GEN", "1SA"), or an empty string for an invalid book index.
 */
export const getBookUsfmCode = (bookIndex: number): string => {
  const targetBook = bibleBooks.find((b) => b.bibleOrder === bookIndex);
  if (!targetBook) { return ''; }
  return targetBook.usfmCode;
};

/** Inverse of getBookUsfmCode (case-insensitive); returns -1 for an unknown code. */
export const getBookIndexByUsfmCode = (usfmCode: string): number => {
  const upper = usfmCode.toUpperCase();
  const targetBook = bibleBooks.find((b) => b.usfmCode === upper);
  return targetBook ? targetBook.bibleOrder : -1;
};

/**
 * Returns the Blue Letter Bible URL book code (e.g. "Gen", "1Sa"),
 * or an empty string for an invalid book index.
 */
export const getBookBlbCode = (bookIndex: number): string => {
  const targetBook = bibleBooks.find((b) => b.bibleOrder === bookIndex);
  if (!targetBook) { return ''; }
  return targetBook.blbCode;
};

/**
 * Returns a URL slug built from the English book name (e.g. "1 Samuel" →
 * "1-samuel", "Song of Songs" → "song-of-songs"), or an empty string for an
 * invalid book index. Used by the public book guide pages and the sitemap.
 */
export const getBookSlug = (bookIndex: number): string =>
  getBookName(bookIndex, 'en').toLowerCase().replace(/[^a-z0-9]+/g, '-');

/** Inverse of getBookSlug; returns -1 when no book has this slug. */
export const getBookIndexBySlug = (slug: string): number => {
  const targetBook = bibleBooks.find((b) => getBookSlug(b.bibleOrder) === slug);
  return targetBook ? targetBook.bibleOrder : -1;
};

export const getBookVerseCount = (bookIndex: number): number => {
  const bookChapterCount = getBookChapterCount(bookIndex);
  let totalVerses = 0;
  for (let c = 1, l = bookChapterCount; c <= l; c++) {
    totalVerses += getChapterVerseCount(bookIndex, c);
  }
  return totalVerses;
};

/**
 * Total verse count for a reader's canon. Defaults to the 66-book common canon so
 * existing callers are unaffected; pass `true` to include the deuterocanonical
 * books when computing progress against the full canon.
 */
export const getTotalVerseCount = (includeDeuterocanonical = false): number => {
  const books = getBooksForCanon(includeDeuterocanonical);
  let totalVerses = 0;
  for (const book of books) {
    totalVerses += getBookVerseCount(book.bibleOrder);
  }
  return totalVerses;
};
