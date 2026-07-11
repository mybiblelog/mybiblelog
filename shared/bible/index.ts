import { makeVerseId, parseVerseId } from './core/encoding';
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
} from './core/metadata';
import {
  getFirstBookChapterVerseId,
  getFirstBookVerseId,
  getLastBookChapterVerseId,
  getLastBookVerseId,
  getNextVerseId,
  getPreviousVerseId,
} from './core/navigation';
import { validateRange, verseExists } from './core/validation';
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
} from './core/ranges';
import {
  generateBibleSegments,
  generateBookChapterSegments,
  generateBookSegments,
  generateSegments,
} from './core/segments';
import { displayVerseRange, parseVerseRange } from './core/display';

export type { ParsedVerseId, Segment, VerseId, VerseRange } from './core/encoding';

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
