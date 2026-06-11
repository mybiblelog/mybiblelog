import { makeVerseId, parseVerseId, type VerseRange } from './encoding';
import { getBookChapterCount, getBookIndex, getBookName, getChapterVerseCount } from './metadata';
import { validateRange } from './validation';

export const displayVerseRange = (startVerseId: number, endVerseId: number, lang: string = 'en'): string => {
  const start = parseVerseId(startVerseId);
  const end = parseVerseId(endVerseId);
  let range = '';
  if (!start.book) { return range; }

  const bookName = getBookName(start.book, lang);
  range += bookName;
  if (!start.chapter) { return range; }
  const chapterCount = getBookChapterCount(start.book);

  // If the range covers the whole book, return only book name
  if (start.chapter === 1 && start.verse && start.verse === 1) {
    if (end.chapter && end.chapter === chapterCount) {
      const endChapterVerseCount = getChapterVerseCount(start.book, end.chapter);
      if (end.verse === endChapterVerseCount) {
        return range;
      }
    }
  }

  range += ' ';
  if (start.chapter === end.chapter) {
    const startChapterVerseCount = getChapterVerseCount(start.book, start.chapter);
    if (start.verse === 1 && end.verse === startChapterVerseCount) {
      range += start.chapter;
      return range;
    }
    else {
      range += start.chapter + ':';
      range += start.verse;
      if (start.verse !== end.verse) {
        range += '-' + end.verse;
      }
      return range;
    }
  }
  else {
    const endChapterVerseCount = getChapterVerseCount(end.book, end.chapter);
    if (start.verse === 1 && end.verse === endChapterVerseCount) {
      range += start.chapter + '-' + end.chapter;
      return range;
    }
    else {
      range += start.chapter + ':' + start.verse + '-';
      range += end.chapter + ':' + end.verse;
      return range;
    }
  }
};

const RegEx = {
  BookChapterVerseToChapterVerse: /((?:\d+\s*)?[\p{L}\p{M}\p{N}\s'-]+)\.?\s+(\d+)\s*:\s*(\d+)\s*[-–—]+\s*(\d+)\s*:\s*(\d+)/iu,
  BookChapterVerseToVerse: /((?:\d+\s*)?[\p{L}\p{M}\p{N}\s'-]+)\.?\s+(\d+)\s*:\s*(\d+)\s*[-–—]+\s*(\d+)/iu,
  BookChapterToChapter: /((?:\d+\s*)?[\p{L}\p{M}\p{N}\s'-]+)\.?\s+(\d+)\s*[-–—]+\s*(\d+)/iu,
  BookChapterVerse: /((?:\d+\s*)?[\p{L}\p{M}\p{N}\s'-]+)\.?\s+(\d+)\s*:\s*(\d+)/iu,
  BookChapter: /((?:\d+\s*)?[\p{L}\p{M}\p{N}\s'-]+)\.?\s+(\d+)/iu,
  Book: /((?:\d+\s*)?[\p{L}\p{M}\p{N}\s'-]+)/iu,
};

export const parseVerseRange = (verseRangeString: string, lang: string = 'en'): VerseRange | null => {
  const start: {
    book?: string | number,
    chapter?: string | number,
    verse?: string | number,
  } = {};
  const end: {
    book?: string | number,
    chapter?: string | number,
    verse?: string | number,
  } = {};

  /* eslint-disable */
  let match
  if (match = RegEx.BookChapterVerseToChapterVerse.exec(verseRangeString), match) {
    [, start.book, start.chapter, start.verse, end.chapter, end.verse] = match
  } else if (match = RegEx.BookChapterVerseToVerse.exec(verseRangeString), match) {
    [, start.book, start.chapter, start.verse, end.verse] = match
    end.chapter = start.chapter
  } else if (match = RegEx.BookChapterToChapter.exec(verseRangeString), match) {
    [, start.book, start.chapter, end.chapter] = match
    start.verse = 1
    end.verse = getChapterVerseCount(getBookIndex(String(start.book), lang), +end.chapter)
  } else if (match = RegEx.BookChapterVerse.exec(verseRangeString), match) {
    [, start.book, start.chapter, start.verse] = match
    end.chapter = start.chapter
    end.verse = start.verse
  } else if (match = RegEx.BookChapter.exec(verseRangeString), match) {
    [, start.book, start.chapter] = match
    start.verse = 1
    end.chapter = start.chapter
    end.verse = getChapterVerseCount(getBookIndex(String(start.book), lang), +start.chapter)
  } else if (match = RegEx.Book.exec(verseRangeString), match) {
    [, start.book] = match
    start.chapter = 1
    start.verse = 1
    end.chapter = getBookChapterCount(getBookIndex(String(start.book), lang))
    end.verse = getChapterVerseCount(getBookIndex(String(start.book), lang), end.chapter)
  }
  else {
    return null;
  }
  /* eslint-enable */

  start.book = getBookIndex(String(start.book), lang);
  if (start.book === -1) { throw new Error('Invalid book name'); }
  end.book = start.book;

  const startVerseId = makeVerseId(start.book, +start.chapter, +start.verse);
  const endVerseId = makeVerseId(end.book, +end.chapter, +end.verse);

  if (!validateRange(startVerseId, endVerseId)) {
    throw new Error('Invalid verse range');
  }

  return { startVerseId, endVerseId };
};
