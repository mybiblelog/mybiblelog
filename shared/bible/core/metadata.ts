import bibleBooks, { type BibleBook } from '../static/bible-books';
import chapterVerses from '../static/chapter-verses/nasb';
import { makeVerseId } from './encoding';

export const getBooks = (): BibleBook[] => bibleBooks;

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

export const getTotalVerseCount = (): number => {
  const books = getBooks();
  let totalVerses = 0;
  for (let b = 1, l = books.length; b <= l; b++) {
    totalVerses += getBookVerseCount(b);
  }
  return totalVerses;
};
