import bibleBooks, { type BibleBook } from '../static/bible-books';
import chapterVerses from '../static/chapter-verses/nasb';
import { makeVerseId } from './encoding';

export const getBooks = (): BibleBook[] => bibleBooks;

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
  return targetBook.locales[lang].name;
};

export const getBookIndex = (bookName: string, lang: string = 'en'): number => {
  const caseInsensitive = bookName.toLocaleLowerCase();
  const targetBook = bibleBooks.find((b) => {
    if (b.locales[lang].name.toLocaleLowerCase() === caseInsensitive) { return true; }
    const insensitiveAbbreviations = b.locales[lang].abbreviations.map((a) => a.toLocaleLowerCase());
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

export const getTotalVerseCount = (): number => {
  const books = getBooks();
  let totalVerses = 0;
  for (let b = 1, l = books.length; b <= l; b++) {
    totalVerses += getBookVerseCount(b);
  }
  return totalVerses;
};
