import { makeVerseId, parseVerseId, type VerseId } from './encoding';
import { getBookChapterCount, getBookCount, getChapterVerseCount } from './metadata';

/**
 * Returns the next verseId. Especially used to jump from
 * the end of a chapter to the beginning of the next chapter
 * without landing on a nonexistent verse.
 *
 * Works between books if `crossBooks` is `true`.
 * Returns `0` when given the last verse of a book if `crossBooks` is false.
 * Returns `0` when given the last verse of the Bible if `crossBooks` is true.
 */
export const getNextVerseId = (verseId: number, crossBooks = false): VerseId => {
  let { book, chapter, verse } = parseVerseId(verseId);
  const bookCount = getBookCount();
  const bookChapterCount = getBookChapterCount(book);
  const chapterVerseCount = getChapterVerseCount(book, chapter);
  if (verse < chapterVerseCount) {
    verse++;
  }
  else if (chapter < bookChapterCount) {
    chapter++;
    verse = 1;
  }
  else if (crossBooks && book < bookCount) {
    book++;
    chapter = 1;
    verse = 1;
  }
  else {
    return 0;
  }
  return makeVerseId(book, chapter, verse);
};

/**
 * Returns the previous verseId. Especially used to jump from
 * the beginning of a chapter back to the end of the previous chapter
 * without landing on a nonexistent verse.
 *
 * Works between books if `crossBooks` is `true`.
 * Returns `0` when given the first verse of a book if `crossBooks` is false.
 * Returns `0` when given the first verse of the Bible if `crossBooks` is true.
 */
export const getPreviousVerseId = (verseId: number, crossBooks = false): VerseId => {
  let { book, chapter, verse } = parseVerseId(verseId);
  if (verse > 1) {
    verse--;
  }
  else if (chapter > 1) {
    chapter--;
    verse = getChapterVerseCount(book, chapter);
  }
  else if (crossBooks && book > 1) {
    book--;
    chapter = getBookChapterCount(book);
    verse = getChapterVerseCount(book, chapter);
  }
  else {
    return 0;
  }
  return makeVerseId(book, chapter, verse);
};

export const getFirstBookChapterVerseId = (bookIndex: number, chapterIndex: number): VerseId => {
  return makeVerseId(bookIndex, chapterIndex, 1);
};

export const getFirstBookVerseId = (bookIndex: number): VerseId => {
  return makeVerseId(bookIndex, 1, 1);
};

export const getLastBookChapterVerseId = (bookIndex: number, chapterIndex: number): VerseId => {
  const lastChapterVerseCount = getChapterVerseCount(bookIndex, chapterIndex);
  return makeVerseId(bookIndex, chapterIndex, lastChapterVerseCount);
};

export const getLastBookVerseId = (bookIndex: number): VerseId => {
  const chapterIndex = getBookChapterCount(bookIndex);
  return getLastBookChapterVerseId(bookIndex, chapterIndex);
};
