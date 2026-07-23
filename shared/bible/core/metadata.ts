import bibleBooks, { type BibleBook } from '../static/bible-books';
import protestantChapterVerses from '../static/chapter-verses/nasb';
import deuterocanonicalChapterVerses from '../static/chapter-verses/deuterocanonical';
import { makeVerseId } from './encoding';

/**
 * Chapter verse counts for every supported book. The Protestant canon comes from
 * the NASB structure; the deuterocanonical books are merged in on top. Their
 * book indices (67-77) never collide with the 1-66 keys, so the merge is safe.
 */
const chapterVerses: { [key: number]: number } = {
  ...protestantChapterVerses,
  ...deuterocanonicalChapterVerses,
};

/** Books of the 66-book Protestant canon, in canonical (bibleOrder) order. */
const protestantBooks = bibleBooks
  .filter((book) => !book.deuterocanonical)
  .sort((a, b) => a.bibleOrder - b.bibleOrder);

/**
 * The default book list is the Protestant canon. Deuterocanonical books are
 * opt-in via `getBooksForCanon`, so every existing caller (and the core
 * traversal helpers that walk `1..getBookCount()`) keeps its 66-book behaviour.
 */
export const getBooks = (): BibleBook[] => protestantBooks;

/** Every supported book, including deuterocanonical ones, in bibleOrder. */
export const getAllBooks = (): BibleBook[] =>
  [...bibleBooks].sort((a, b) => a.bibleOrder - b.bibleOrder);

/**
 * The books that make up a reader's selected canon, sorted into display order.
 * When deuterocanonical books are included they are interleaved between the
 * Protestant books following the NRSVUE full-canon order (via `dcBookOrder`);
 * otherwise this is exactly the 66-book Protestant canon.
 */
export const getBooksForCanon = (includeDeuterocanonical = false): BibleBook[] => {
  const books = includeDeuterocanonical ? bibleBooks : protestantBooks;
  return [...books].sort((a, b) => a.dcBookOrder - b.dcBookOrder);
};

export const getChapterVerses = () => chapterVerses;

export const getBookCount = (): number => getBooks().length;

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
  return targetBook.locales[lang]!.name;
};

export const getBookIndex = (bookName: string, lang: string = 'en'): number => {
  const caseInsensitive = bookName.toLocaleLowerCase();
  const targetBook = bibleBooks.find((b) => {
    if (b.locales[lang]!.name.toLocaleLowerCase() === caseInsensitive) { return true; }
    const insensitiveAbbreviations = b.locales[lang]!.abbreviations.map((a) => a.toLocaleLowerCase());
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

/**
 * Returns the Blue Letter Bible URL book code (e.g. "Gen", "1Sa"),
 * or an empty string for an invalid book index.
 */
export const getBookBlbCode = (bookIndex: number): string => {
  const targetBook = bibleBooks.find((b) => b.bibleOrder === bookIndex);
  if (!targetBook) { return ''; }
  return targetBook.blbCode;
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
 * Total verse count for a reader's canon. Defaults to the Protestant canon so
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
