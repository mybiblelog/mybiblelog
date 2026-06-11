import { makeVerseId, parseVerseId } from './encoding';
import {
  getBookBlbCode,
  getBookChapterCount,
  getBookCount,
  getBookIndex,
  getBookName,
  getBookUsfmCode,
  getBookVerseCount,
  getBooks,
  getChapterVerseCount,
  getChapterVerses,
  getTotalVerseCount,
} from './metadata';
import {
  getFirstBookChapterVerseId,
  getFirstBookVerseId,
  getLastBookChapterVerseId,
  getLastBookVerseId,
  getNextVerseId,
  getPreviousVerseId,
} from './navigation';
import { validateRange, verseExists } from './validation';
import {
  checkRangeOverlap,
  compareRanges,
  consolidateRanges,
  countRangeVerses,
  countUniqueBookChapterRangeVerses,
  countUniqueBookRangeVerses,
  countUniqueRangeVerses,
  cropRangeToBookChapter,
  filterRangesByBook,
  filterRangesByBookChapter,
  getRangesBetweenVerseIds,
} from './ranges';
import {
  generateBibleSegments,
  generateBookChapterSegments,
  generateBookSegments,
  generateSegments,
} from './segments';
import { displayVerseRange, parseVerseRange } from './display';

export type { ParsedVerseId, Segment, VerseId, VerseRange } from './encoding';

const Bible = {
  makeVerseId,
  parseVerseId,
  getBooks,
  getChapterVerses,
  getBookCount,
  getBookChapterCount,
  getChapterVerseCount,
  getBookName,
  getBookIndex,
  getBookUsfmCode,
  getBookBlbCode,
  verseExists,
  validateRange,
  countRangeVerses,
  getBookVerseCount,
  getTotalVerseCount,
  getNextVerseId,
  getPreviousVerseId,
  getFirstBookChapterVerseId,
  getFirstBookVerseId,
  getLastBookChapterVerseId,
  getLastBookVerseId,
  compareRanges,
  checkRangeOverlap,
  countUniqueRangeVerses,
  countUniqueBookRangeVerses,
  filterRangesByBook,
  filterRangesByBookChapter,
  cropRangeToBookChapter,
  countUniqueBookChapterRangeVerses,
  consolidateRanges,
  getRangesBetweenVerseIds,
  generateSegments,
  generateBibleSegments,
  generateBookSegments,
  generateBookChapterSegments,
  displayVerseRange,
  parseVerseRange,
};

export default Bible;
