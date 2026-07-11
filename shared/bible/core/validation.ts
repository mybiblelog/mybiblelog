import { parseVerseId } from './encoding';
import { getBookChapterCount, getChapterVerseCount } from './metadata';

export const verseExists = (verseId: number): boolean => {
  const { book, chapter, verse } = parseVerseId(verseId);
  const chapterCount = getBookChapterCount(book);
  if (!chapterCount) {
    return false;
  }
  const verseCount = getChapterVerseCount(book, chapter);
  if (!verseCount || verse > verseCount) {
    return false;
  }
  return true;
};

export const validateRange = (startVerseId: number, endVerseId: number): boolean => {
  if (!verseExists(startVerseId)) {
    return false;
  }
  if (!verseExists(endVerseId)) {
    return false;
  }
  if (startVerseId > endVerseId) {
    return false;
  }
  const startVerse = parseVerseId(startVerseId);
  const endVerse = parseVerseId(endVerseId);
  if (startVerse.book !== endVerse.book) {
    return false;
  }
  return true;
};
