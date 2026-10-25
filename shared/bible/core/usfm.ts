import { makeVerseId, parseVerseId, type VerseId, type VerseRange } from './encoding';
import { getBookChapterCount, getBookIndexByUsfmCode, getBookUsfmCode, getChapterVerseCount } from './metadata';
import {
  getFirstBookChapterVerseId,
  getFirstBookVerseId,
  getLastBookChapterVerseId,
  getLastBookVerseId,
} from './navigation';
import { validateRange } from './validation';

/**
 * USFM-style passage references in the dot notation YouVersion and Bible.com
 * use (e.g. "JHN.3.16"). A reference names a single book, then optionally a
 * chapter and verse, and may end in a range whose end omits the book:
 *
 *   GEN            whole book
 *   GEN.1          whole chapter
 *   GEN.1-3        chapters 1–3
 *   GEN.1.1        one verse
 *   GEN.1.1-5      verses 1–5 of chapter 1
 *   GEN.1.1-2.3    Genesis 1:1 through 2:3
 *
 * Passages never cross book boundaries, so the range end never names a book.
 */

// book, then optional chapter[.verse], then optional -end (chapter, verse, or chapter.verse)
const USFM_REFERENCE = /^([1-4]?[A-Z]{2,3})(?:\.(\d+)(?:\.(\d+))?)?(?:-(\d+)(?:\.(\d+))?)?$/i;

/** Parses a USFM reference into a verse range, or returns null if it is not a valid single-book passage. */
export const parseUsfmReference = (reference: string): VerseRange | null => {
  const match = USFM_REFERENCE.exec(reference.trim());
  if (!match) { return null; }
  const [, bookCode, startChapterStr, startVerseStr, endFirstStr, endSecondStr] = match;

  const book = getBookIndexByUsfmCode(bookCode);
  if (book === -1) { return null; }

  const startChapter = startChapterStr === undefined ? undefined : Number(startChapterStr);
  const startVerse = startVerseStr === undefined ? undefined : Number(startVerseStr);
  const endFirst = endFirstStr === undefined ? undefined : Number(endFirstStr);
  const endSecond = endSecondStr === undefined ? undefined : Number(endSecondStr);

  const chapterExists = (chapter: number) => chapter >= 1 && chapter <= getBookChapterCount(book);
  const verseExists = (chapter: number, verse: number) => verse >= 1 && verse <= getChapterVerseCount(book, chapter);

  let startVerseId: VerseId;
  let endVerseId: VerseId;

  if (startChapter === undefined) {
    // Whole book; a book-only reference cannot carry a range end.
    if (endFirst !== undefined) { return null; }
    startVerseId = getFirstBookVerseId(book);
    endVerseId = getLastBookVerseId(book);
  }
  else if (startVerse === undefined) {
    // Chapter (range): the end may only be a chapter number.
    if (endSecond !== undefined) { return null; }
    const endChapter = endFirst ?? startChapter;
    if (!chapterExists(startChapter) || !chapterExists(endChapter)) { return null; }
    startVerseId = getFirstBookChapterVerseId(book, startChapter);
    endVerseId = getLastBookChapterVerseId(book, endChapter);
  }
  else {
    // Verse (range): the end is a verse in the same chapter, or chapter.verse.
    const endChapter = endSecond === undefined ? startChapter : endFirst!;
    const endVerse = endSecond ?? endFirst ?? startVerse;
    if (!chapterExists(startChapter) || !verseExists(startChapter, startVerse)) { return null; }
    if (!chapterExists(endChapter) || !verseExists(endChapter, endVerse)) { return null; }
    startVerseId = makeVerseId(book, startChapter, startVerse);
    endVerseId = makeVerseId(book, endChapter, endVerse);
  }

  if (!validateRange(startVerseId, endVerseId)) { return null; }
  return { startVerseId, endVerseId };
};

/**
 * Formats a single-book verse range as the shortest USFM reference that
 * denotes it (inverse of parseUsfmReference). Returns an empty string for an
 * invalid range.
 */
export const formatUsfmReference = (startVerseId: VerseId, endVerseId: VerseId): string => {
  if (!validateRange(startVerseId, endVerseId)) { return ''; }
  const start = parseVerseId(startVerseId);
  const end = parseVerseId(endVerseId);
  const code = getBookUsfmCode(start.book);

  if (startVerseId === getFirstBookVerseId(start.book) && endVerseId === getLastBookVerseId(start.book)) {
    return code;
  }

  const wholeChapters = start.verse === 1 && end.verse === getChapterVerseCount(end.book, end.chapter);
  if (wholeChapters) {
    return start.chapter === end.chapter
      ? `${code}.${start.chapter}`
      : `${code}.${start.chapter}-${end.chapter}`;
  }

  const startRef = `${code}.${start.chapter}.${start.verse}`;
  if (startVerseId === endVerseId) { return startRef; }
  if (start.chapter === end.chapter) { return `${startRef}-${end.verse}`; }
  return `${startRef}-${end.chapter}.${end.verse}`;
};
