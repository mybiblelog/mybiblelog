import { expect, test } from 'vitest';
import Bible from './index';

/**
 * Deeply freezes an object, making it immutable.
 * Used to ensure that tests do not mutate the objects they are given.
 */
const deepFreeze = <T>(object: T): T => {
  if (typeof object !== 'object' || object === null) {
    return object;
  }
  Object.freeze(object);
  Object.keys(object).forEach((key) => {
    deepFreeze(object[key]);
  });
  return object;
};

test('loads Bible book data', () => {
  const bibleBooks = Bible.getBooks();
  expect(bibleBooks.length).toBe(66);
});

test('loads chapter verse data', () => {
  const chapterVerses = Bible.getChapterVerses();
  expect(typeof chapterVerses).toBe('object');
});

test('can count book chapters', () => {
  const genesisChapters = Bible.getBookChapterCount(1);
  expect(genesisChapters).toBe(50);
});

test('can count chapter verses', () => {
  const genesis1Verses = Bible.getChapterVerseCount(1, 1);
  expect(genesis1Verses).toBe(31);
});

test('can get book names', () => {
  const genesisName = Bible.getBookName(1);
  const revelationName = Bible.getBookName(66);
  expect(genesisName).toBe('Genesis');
  expect(revelationName).toBe('Revelation');
});

test('should get empty string for nonexistant book names', () => {
  const bookName0 = Bible.getBookName(0);
  const bookName67 = Bible.getBookName(67);

  expect(bookName0).toBe('');
  expect(bookName67).toBe('');
});

test('can get book index from book name', () => {
  const genesisIndex = Bible.getBookIndex('Genesis');
  const revelationIndex = Bible.getBookIndex('Revelation');

  expect(genesisIndex).toBe(1);
  expect(revelationIndex).toBe(66);
});

test('can get book index from book abbreviation', () => {
  const genesisIndex = Bible.getBookIndex('Gn');
  const revelationIndex = Bible.getBookIndex('Rev');

  expect(genesisIndex).toBe(1);
  expect(revelationIndex).toBe(66);
});

test('can get book index without case sensitivity', () => {
  const genesisIndex = Bible.getBookIndex('gEnESiS');
  const revelationIndex = Bible.getBookIndex('reV');

  expect(genesisIndex).toBe(1);
  expect(revelationIndex).toBe(66);
});

test('should fail verse validation if book invalid', () => {
  const valid = Bible.verseExists(167001001);
  expect(valid).toBe(false);
});

test('should fail verse validation if chapter invalid', () => {
  const valid = Bible.verseExists(166099001);
  expect(valid).toBe(false);
});

test('should fail verse validation if verse invalid', () => {
  const valid = Bible.verseExists(166001099);
  expect(valid).toBe(false);
});

test('should pass validation for valid verse ID', () => {
  const valid = Bible.verseExists(166001001);
  expect(valid).toBe(true);
});

test('should fail validation for backwards verse range', () => {
  const valid = Bible.validateRange(101001002, 101001001);
  expect(valid).toBe(false);
});

test('should fail validation for verse range outside single book', () => {
  const valid = Bible.validateRange(101001001, 201001001);
  expect(valid).toBe(false);
});

test('should pass validation for sequential verse range', () => {
  const valid = Bible.validateRange(101001001, 101001002);
  expect(valid).toBe(true);
});

test('should pass validation for verse range with single verse', () => {
  const valid = Bible.validateRange(101001002, 101001002);
  expect(valid).toBe(true);
});

test('should get book chapter counts', () => {
  const genesisChapterCount = Bible.getBookChapterCount(1);
  const judeChapterCount = Bible.getBookChapterCount(65);

  expect(genesisChapterCount).toBe(50);
  expect(judeChapterCount).toBe(1);
});

test('should get zero for nonexistant book chapter counts', () => {
  const bookChapterCount0 = Bible.getBookChapterCount(0);
  const bookChapterCount67 = Bible.getBookChapterCount(67);

  expect(bookChapterCount0).toBe(0);
  expect(bookChapterCount67).toBe(0);
});

test('should get chapter verse counts', () => {
  const genesis1Verses = Bible.getChapterVerseCount(1, 1);
  const revelationVerses = Bible.getChapterVerseCount(66, 22);
  expect(genesis1Verses).toBe(31);
  expect(revelationVerses).toBe(21);
});

test('should get zero for nonexistant chapter verse counts', () => {
  // book < count
  const nonChapterVerses1 = Bible.getChapterVerseCount(0, 1);

  // chapter < count
  const nonChapterVerses2 = Bible.getChapterVerseCount(1, 0);

  // book > count
  const nonChapterVerses3 = Bible.getChapterVerseCount(67, 1);

  // chapter > count
  const nonChapterVerses4 = Bible.getChapterVerseCount(66, 23);

  expect(nonChapterVerses1).toBe(0);
  expect(nonChapterVerses2).toBe(0);
  expect(nonChapterVerses3).toBe(0);
  expect(nonChapterVerses4).toBe(0);
});

test('can count verse range of single verse', () => {
  const verseId = Bible.makeVerseId(1, 1, 1);
  const verseCount = Bible.countRangeVerses(verseId, verseId);
  expect(verseCount).toBe(1);
});

test('can count verse range with multiple verses', () => {
  const startVerseId = Bible.makeVerseId(1, 1, 1);
  const endVerseId = Bible.makeVerseId(1, 1, 4);
  const verseCount = Bible.countRangeVerses(startVerseId, endVerseId);
  expect(verseCount).toBe(4);
});

test('can count verse range across chapters', () => {
  const startVerseId = Bible.makeVerseId(1, 1, 15); // 31 verses
  const endVerseId = Bible.makeVerseId(1, 2, 10); // 25 verses
  const verseCount = Bible.countRangeVerses(startVerseId, endVerseId);
  expect(verseCount).toBe(27);
});

test('can count verse range across books', () => {
  const startVerseId = Bible.makeVerseId(1, 50, 1); // 26 verses
  const endVerseId = Bible.makeVerseId(2, 1, 10); // 10 verses
  const verseCount = Bible.countRangeVerses(startVerseId, endVerseId);
  expect(verseCount).toBe(36);
});

test('can count verse range across multiple', () => {
  const startVerseId = Bible.makeVerseId(1, 50, 1); // 26 verses
  // 1213 verses in chapter 2
  const endVerseId = Bible.makeVerseId(3, 1, 10); // 10 verses
  const verseCount = Bible.countRangeVerses(startVerseId, endVerseId);
  expect(verseCount).toBe(1249);
});

test('can count number of verses in book', () => {
  const genesisVerseCount = Bible.getBookVerseCount(1);
  const judeVerseCount = Bible.getBookVerseCount(65);
  const revelationVerseCount = Bible.getBookVerseCount(66);
  expect(genesisVerseCount).toBe(1533);
  expect(judeVerseCount).toBe(25);
  expect(revelationVerseCount).toBe(404);
});

test('can count number of verses in whole Bible', () => {
  const bibleVerseCount = Bible.getTotalVerseCount();
  expect(bibleVerseCount).toBe(31102);
});

test('can compare ranges of verses in different books', () => {
  const genesisRange = {
    startVerseId: Bible.makeVerseId(1, 1, 2),
    endVerseId: Bible.makeVerseId(1, 2, 5),
  };
  const exodusRange = {
    startVerseId: Bible.makeVerseId(2, 2, 1),
    endVerseId: Bible.makeVerseId(2, 3, 15),
  };
  const smallerFirst = Bible.compareRanges(genesisRange, exodusRange);
  const largerFirst = Bible.compareRanges(exodusRange, genesisRange);
  expect(smallerFirst).toBe(-1);
  expect(largerFirst).toBe(1);
});

test('can compare ranges of verses in same book', () => {
  const genesis1Range = {
    startVerseId: Bible.makeVerseId(1, 1, 2),
    endVerseId: Bible.makeVerseId(1, 2, 5),
  };
  const genesis2Range = {
    startVerseId: Bible.makeVerseId(1, 2, 1),
    endVerseId: Bible.makeVerseId(1, 3, 15),
  };
  const smallerFirst = Bible.compareRanges(genesis1Range, genesis2Range);
  const largerFirst = Bible.compareRanges(genesis2Range, genesis1Range);
  expect(smallerFirst).toBe(-1);
  expect(largerFirst).toBe(1);
});

test('can compare ranges of verses in same chapter', () => {
  const genesisRange1 = {
    startVerseId: Bible.makeVerseId(1, 1, 1),
    endVerseId: Bible.makeVerseId(1, 1, 15),
  };
  const genesisRange2 = {
    startVerseId: Bible.makeVerseId(1, 1, 10),
    endVerseId: Bible.makeVerseId(1, 1, 25),
  };
  const smallerFirst = Bible.compareRanges(genesisRange1, genesisRange2);
  const largerFirst = Bible.compareRanges(genesisRange2, genesisRange1);
  expect(smallerFirst).toBe(-1);
  expect(largerFirst).toBe(1);
});

test('can determine that ranges from different books do not overlap', () => {
  const genesisRange = {
    startVerseId: Bible.makeVerseId(1, 1, 1),
    endVerseId: Bible.makeVerseId(1, 1, 15),
  };
  const exodusRange = {
    startVerseId: Bible.makeVerseId(2, 1, 10),
    endVerseId: Bible.makeVerseId(2, 3, 25),
  };
  const result = Bible.checkRangeOverlap(genesisRange, exodusRange);
  expect(result).toBe(false);
});

test('can determine when ranges do overlap', () => {
  const genesisRange1 = {
    startVerseId: Bible.makeVerseId(1, 1, 1),
    endVerseId: Bible.makeVerseId(1, 2, 15),
  };
  const genesisRange2 = {
    startVerseId: Bible.makeVerseId(1, 1, 10),
    endVerseId: Bible.makeVerseId(1, 2, 25),
  };
  const result = Bible.checkRangeOverlap(genesisRange1, genesisRange2);
  expect(result).toBe(true);
});

test('can count total number of verses in non-overlapping ranges', () => {
  const genesisRange1 = {
    startVerseId: Bible.makeVerseId(1, 1, 1),
    endVerseId: Bible.makeVerseId(1, 1, 15),
  };
  const genesisRange2 = {
    startVerseId: Bible.makeVerseId(1, 2, 10),
    endVerseId: Bible.makeVerseId(1, 2, 25),
  };
  const ranges = deepFreeze([genesisRange1, genesisRange2]);
  const result = Bible.countUniqueRangeVerses(ranges);
  expect(result).toBe(31);
});

test('can count total number of verses in overlapping ranges', () => {
  const genesisRange1 = {
    startVerseId: Bible.makeVerseId(1, 1, 1),
    endVerseId: Bible.makeVerseId(1, 2, 15),
  };
  const genesisRange2 = {
    startVerseId: Bible.makeVerseId(1, 2, 1),
    endVerseId: Bible.makeVerseId(1, 2, 25),
  };
  const ranges = deepFreeze([genesisRange1, genesisRange2]);
  const result = Bible.countUniqueRangeVerses(ranges);
  expect(result).toBe(56);
});

test('can count only verses from ranges in given book', () => {
  const genesisRange1 = {
    startVerseId: Bible.makeVerseId(1, 1, 1),
    endVerseId: Bible.makeVerseId(1, 2, 15),
  };
  const genesisRange2 = {
    startVerseId: Bible.makeVerseId(1, 2, 1),
    endVerseId: Bible.makeVerseId(1, 2, 25),
  };
  const exodusRange = {
    startVerseId: Bible.makeVerseId(2, 1, 1),
    endVerseId: Bible.makeVerseId(2, 1, 17),
  };
  const ranges = deepFreeze([genesisRange1, exodusRange, genesisRange2]);
  const genesisResult = Bible.countUniqueBookRangeVerses(1, ranges);
  const exodusResult = Bible.countUniqueBookRangeVerses(2, ranges);
  expect(genesisResult).toBe(56);
  expect(exodusResult).toBe(17);
});

test('can count only range verses from given chapter', () => {
  // Genesis chapter verse counts: 1=31, 2=25, 3=24
  const overlapPreviousChapter = {
    startVerseId: Bible.makeVerseId(1, 1, 16), // 15 verses in ch 1
    endVerseId: Bible.makeVerseId(1, 2, 20), // 20 verses in ch 2
  };
  const overlapNextChapter = {
    startVerseId: Bible.makeVerseId(1, 2, 21), // 5 verses in ch 2
    endVerseId: Bible.makeVerseId(1, 3, 10), // 10 verses in ch 3
  };
  const overlapSurroundingChapters = {
    startVerseId: Bible.makeVerseId(1, 1, 16), // 15 verses in ch 1
    endVerseId: Bible.makeVerseId(1, 3, 10), // 10 verses in ch 3
  };
  const entirelyPreviousChapter = {
    startVerseId: Bible.makeVerseId(1, 1, 10),
    endVerseId: Bible.makeVerseId(1, 1, 20), // 11 verses in ch 1
  };
  const entirelyNextChapter = {
    startVerseId: Bible.makeVerseId(1, 3, 5),
    endVerseId: Bible.makeVerseId(1, 3, 20), // 16 verses in ch 3
  };
  const entirelyThisChapter = {
    startVerseId: Bible.makeVerseId(1, 2, 1),
    endVerseId: Bible.makeVerseId(1, 2, 17), // 17 verses in ch 2
  };

  const overlapPreviousResult = Bible.countUniqueBookChapterRangeVerses(1, 2, deepFreeze([overlapPreviousChapter]));
  const overlapNextResult = Bible.countUniqueBookChapterRangeVerses(1, 2, deepFreeze([overlapNextChapter]));
  const overlapSurroundingResult = Bible.countUniqueBookChapterRangeVerses(1, 2, deepFreeze([overlapSurroundingChapters]));
  const entirelyPreviousResult = Bible.countUniqueBookChapterRangeVerses(1, 2, deepFreeze([entirelyPreviousChapter]));
  const entirelyNextResult = Bible.countUniqueBookChapterRangeVerses(1, 2, deepFreeze([entirelyNextChapter]));
  const entirelyThisResult = Bible.countUniqueBookChapterRangeVerses(1, 2, deepFreeze([entirelyThisChapter]));

  expect(overlapPreviousResult).toBe(20);
  expect(overlapNextResult).toBe(5);
  expect(overlapSurroundingResult).toBe(25);
  expect(entirelyPreviousResult).toBe(0);
  expect(entirelyNextResult).toBe(0);
  expect(entirelyThisResult).toBe(17);
});

test('can filter ranges by book', () => {
  const bookIndex = 3;
  const inBook1 = {
    startVerseId: Bible.makeVerseId(3, 1, 16),
    endVerseId: Bible.makeVerseId(3, 2, 20),
  };
  const outOfBook1 = {
    startVerseId: Bible.makeVerseId(2, 1, 5),
    endVerseId: Bible.makeVerseId(2, 3, 10),
  };
  const inBook2 = {
    startVerseId: Bible.makeVerseId(3, 2, 5),
    endVerseId: Bible.makeVerseId(3, 3, 1),
  };
  const outOfBook2 = {
    startVerseId: Bible.makeVerseId(4, 1, 16),
    endVerseId: Bible.makeVerseId(4, 3, 10),
  };
  const ranges = deepFreeze([inBook1, outOfBook1, inBook2, outOfBook2]);
  const result = Bible.filterRangesByBook(bookIndex, ranges);
  expect(result.length).toBe(2);
});

test('can filter ranges by book and chapter', () => {
  const bookIndex = 5;
  const chapterIndex = 4;
  const leadsOutOfChapter = {
    startVerseId: Bible.makeVerseId(5, 4, 16),
    endVerseId: Bible.makeVerseId(5, 5, 20),
  };
  const isOutOfChapter = {
    startVerseId: Bible.makeVerseId(2, 1, 5),
    endVerseId: Bible.makeVerseId(2, 3, 10),
  };
  const leadsIntoChapter = {
    startVerseId: Bible.makeVerseId(5, 3, 5),
    endVerseId: Bible.makeVerseId(5, 4, 1),
  };
  const isInChapter = {
    startVerseId: Bible.makeVerseId(5, 4, 10),
    endVerseId: Bible.makeVerseId(5, 4, 12),
  };
  const ranges = deepFreeze([leadsOutOfChapter, isOutOfChapter, leadsIntoChapter, isInChapter]);
  const result = Bible.filterRangesByBookChapter(bookIndex, chapterIndex, ranges);
  expect(result.length).toBe(3);
});

test('can crop ranges to include only verses in given chapter', () => {
  const bookIndex = 5;
  const chapterIndex = 4;

  const leadsOutOfChapter = deepFreeze({
    startVerseId: Bible.makeVerseId(5, 4, 16),
    endVerseId: Bible.makeVerseId(5, 5, 20),
  });
  const leadsIntoChapter = deepFreeze({
    startVerseId: Bible.makeVerseId(5, 3, 5),
    endVerseId: Bible.makeVerseId(5, 4, 1),
  });
  const isInChapter = deepFreeze({
    startVerseId: Bible.makeVerseId(5, 4, 10),
    endVerseId: Bible.makeVerseId(5, 4, 12),
  });
  const leadsInAndOutOfChapter = deepFreeze({
    startVerseId: Bible.makeVerseId(5, 3, 10),
    endVerseId: Bible.makeVerseId(5, 5, 12),
  });

  const leadsOutOfChapterResult =
    Bible.cropRangeToBookChapter(bookIndex, chapterIndex, leadsOutOfChapter);
  const leadsIntoChapterResult =
    Bible.cropRangeToBookChapter(bookIndex, chapterIndex, leadsIntoChapter);
  const isInChapterResult =
    Bible.cropRangeToBookChapter(bookIndex, chapterIndex, isInChapter);
  const leadsInAndOutOfChapterResult =
    Bible.cropRangeToBookChapter(bookIndex, chapterIndex, leadsInAndOutOfChapter);

  const chapterVerseCount = Bible.getChapterVerseCount(bookIndex, chapterIndex);
  const chapterFirstVerseId = Bible.makeVerseId(bookIndex, chapterIndex, 1);
  const chapterFinalVerseId = Bible.makeVerseId(bookIndex, chapterIndex, chapterVerseCount);

  expect(leadsOutOfChapterResult.endVerseId).toBe(chapterFinalVerseId);
  expect(leadsIntoChapterResult.startVerseId).toBe(chapterFirstVerseId);
  expect(isInChapterResult.startVerseId).toBe(isInChapter.startVerseId);
  expect(isInChapterResult.endVerseId).toBe(isInChapter.endVerseId);
  expect(leadsInAndOutOfChapterResult.endVerseId).toBe(chapterFinalVerseId);
  expect(leadsInAndOutOfChapterResult.startVerseId).toBe(chapterFirstVerseId);

  // should return NEW object cloned from original
  expect(leadsOutOfChapterResult.endVerseId).not.toBe(leadsOutOfChapter.endVerseId);
  expect(leadsIntoChapterResult.startVerseId).not.toBe(leadsIntoChapter.startVerseId);
});

test('can consolidate overlapping ranges', () => {
  const overlap1 = {
    startVerseId: Bible.makeVerseId(1, 1, 16),
    endVerseId: Bible.makeVerseId(1, 2, 25),
  };
  const overlap2 = {
    startVerseId: Bible.makeVerseId(1, 2, 20),
    endVerseId: Bible.makeVerseId(1, 3, 10),
  };
  const overlappingRanges = deepFreeze([overlap1, overlap2]);
  const result = Bible.consolidateRanges(overlappingRanges);
  expect(result.length).toBe(1);
  expect(result[0].startVerseId).toBe(overlap1.startVerseId);
  expect(result[0].endVerseId).toBe(overlap2.endVerseId);
});

test('will not consolidate disconnected ranges', () => {
  const disconnected1 = {
    startVerseId: Bible.makeVerseId(1, 1, 10),
    endVerseId: Bible.makeVerseId(1, 1, 16),
  };
  const disconnected2 = {
    startVerseId: Bible.makeVerseId(1, 1, 18),
    endVerseId: Bible.makeVerseId(1, 1, 25),
  };
  const disconnectedRanges = deepFreeze([disconnected1, disconnected2]);
  const result = Bible.consolidateRanges(disconnectedRanges);
  expect(result.length).toBe(2);
  expect(result[0].endVerseId).toBe(disconnected1.endVerseId);
  expect(result[1].startVerseId).toBe(disconnected2.startVerseId);
});

test('can consolidate consecutive ranges', () => {
  const connected1 = {
    startVerseId: Bible.makeVerseId(1, 1, 10),
    endVerseId: Bible.makeVerseId(1, 1, 16),
  };
  const connected2 = {
    startVerseId: Bible.makeVerseId(1, 1, 17),
    endVerseId: Bible.makeVerseId(1, 1, 25),
  };
  const connectedRanges = deepFreeze([connected1, connected2]);
  const result = Bible.consolidateRanges(connectedRanges);
  expect(result.length).toBe(1);
  expect(result[0].startVerseId).toBe(connected1.startVerseId);
  expect(result[0].endVerseId).toBe(connected2.endVerseId);
});

test('can consolidate ranges across chapters', () => {
  const connected1 = {
    startVerseId: Bible.makeVerseId(1, 1, 1),
    endVerseId: Bible.makeVerseId(1, 1, 31),
  };
  const connected2 = {
    startVerseId: Bible.makeVerseId(1, 2, 1),
    endVerseId: Bible.makeVerseId(1, 2, 25),
  };
  const connectedRanges = deepFreeze([connected1, connected2]);
  const result = Bible.consolidateRanges(connectedRanges);
  expect(result.length).toBe(1);
  expect(result[0].startVerseId).toBe(connected1.startVerseId);
  expect(result[0].endVerseId).toBe(connected2.endVerseId);
});

test('will not consolidate ranges across books', () => {
  const disconnected1 = {
    startVerseId: Bible.makeVerseId(1, 50, 1),
    endVerseId: Bible.makeVerseId(1, 50, 26),
  };
  const disconnected2 = {
    startVerseId: Bible.makeVerseId(2, 1, 1),
    endVerseId: Bible.makeVerseId(2, 1, 22),
  };
  const disconnectedRanges = deepFreeze([disconnected1, disconnected2]);
  const result = Bible.consolidateRanges(disconnectedRanges);
  expect(result.length).toBe(2);
  expect(result[0].endVerseId).toBe(disconnected1.endVerseId);
  expect(result[1].startVerseId).toBe(disconnected2.startVerseId);
});

test('can consolidate identical ranges', () => {
  const identical1 = {
    startVerseId: Bible.makeVerseId(1, 1, 10),
    endVerseId: Bible.makeVerseId(1, 1, 16),
  };
  const identical2 = {
    startVerseId: Bible.makeVerseId(1, 1, 10),
    endVerseId: Bible.makeVerseId(1, 1, 16),
  };
  const identicalRanges = deepFreeze([identical1, identical2]);
  const result = Bible.consolidateRanges(identicalRanges);
  expect(result.length).toBe(1);
  expect(result[0].startVerseId).toBe(identical1.startVerseId);
  expect(result[0].endVerseId).toBe(identical1.endVerseId);
});

test('can consolidate nested ranges', () => {
  const outerRange = {
    startVerseId: Bible.makeVerseId(1, 1, 10),
    endVerseId: Bible.makeVerseId(1, 1, 16),
  };
  const innerRange = {
    startVerseId: Bible.makeVerseId(1, 1, 12),
    endVerseId: Bible.makeVerseId(1, 1, 14),
  };
  const nestedRanges = deepFreeze([outerRange, innerRange]);
  const result = Bible.consolidateRanges(nestedRanges);
  expect(result.length).toBe(1);
  expect(result[0].startVerseId).toBe(outerRange.startVerseId);
  expect(result[0].endVerseId).toBe(outerRange.endVerseId);
});

test('can safely consolidate ranges at the beginning of a book', () => {
  const endNoConsolidate = {
    startVerseId: Bible.makeVerseId(1, 50, 1),
    endVerseId: Bible.makeVerseId(1, 50, 26),
  };
  const startConsolidate1 = {
    startVerseId: Bible.makeVerseId(2, 1, 1),
    endVerseId: Bible.makeVerseId(2, 1, 22),
  };
  const startConsolidate2 = {
    startVerseId: Bible.makeVerseId(2, 2, 1),
    endVerseId: Bible.makeVerseId(2, 2, 25),
  };
  const ranges = deepFreeze([endNoConsolidate, startConsolidate1, startConsolidate2]);
  const result = Bible.consolidateRanges(ranges);
  expect(result.length).toBe(2);
  expect(result[0].startVerseId).toBe(endNoConsolidate.startVerseId);
  expect(result[0].endVerseId).toBe(endNoConsolidate.endVerseId);
  expect(result[1].startVerseId).toBe(startConsolidate1.startVerseId);
  expect(result[1].endVerseId).toBe(startConsolidate2.endVerseId);
});

test('can safely consolidate ranges at the end of a book', () => {
  const endConsolidate1 = {
    startVerseId: Bible.makeVerseId(1, 49, 1),
    endVerseId: Bible.makeVerseId(1, 49, 33),
  };
  const endConsolidate2 = {
    startVerseId: Bible.makeVerseId(1, 50, 1),
    endVerseId: Bible.makeVerseId(1, 50, 26),
  };
  const startNoConsolidate = {
    startVerseId: Bible.makeVerseId(2, 1, 1),
    endVerseId: Bible.makeVerseId(2, 1, 22),
  };
  const ranges = deepFreeze([endConsolidate1, endConsolidate2, startNoConsolidate]);
  const result = Bible.consolidateRanges(ranges);
  expect(result.length).toBe(2);
  expect(result[0].startVerseId).toBe(endConsolidate1.startVerseId);
  expect(result[0].endVerseId).toBe(endConsolidate2.endVerseId);
  expect(result[1].startVerseId).toBe(startNoConsolidate.startVerseId);
  expect(result[1].endVerseId).toBe(startNoConsolidate.endVerseId);
});

test('can get next verseId', () => {
  const verseId = Bible.makeVerseId(1, 1, 1);
  const nextVerseId = Bible.getNextVerseId(verseId);
  const { book, chapter, verse } = Bible.parseVerseId(nextVerseId);
  expect(book).toBe(1);
  expect(chapter).toBe(1);
  expect(verse).toBe(2);
});

test('can go to next chapter to get next verseId', () => {
  const verseId = Bible.makeVerseId(1, 1, 31);
  const nextVerseId = Bible.getNextVerseId(verseId);
  const { book, chapter, verse } = Bible.parseVerseId(nextVerseId);
  expect(book).toBe(1);
  expect(chapter).toBe(2);
  expect(verse).toBe(1);
});

test('can get next verseId through entire Bible', () => {
  let verseId = Bible.makeVerseId(1, 1, 1);
  let verseCount = 1;
  while (verseId) {
    verseId = Bible.getNextVerseId(verseId, true);
    if (verseId) {
      verseCount++;
    }
  }
  expect(verseCount).toBe(Bible.getTotalVerseCount());
});

test('can get previous verseId', () => {
  const verseId = Bible.makeVerseId(1, 1, 2);
  const previousVerseId = Bible.getPreviousVerseId(verseId);
  const { book, chapter, verse } = Bible.parseVerseId(previousVerseId);
  expect(book).toBe(1);
  expect(chapter).toBe(1);
  expect(verse).toBe(1);
});

test('can go to previous chapter to get previous verseId', () => {
  const verseId = Bible.makeVerseId(1, 2, 1);
  const previousVerseId = Bible.getPreviousVerseId(verseId);
  const { book, chapter, verse } = Bible.parseVerseId(previousVerseId);
  expect(book).toBe(1);
  expect(chapter).toBe(1);
  expect(verse).toBe(31);
});

test('can get previous verseId through entire Bible', () => {
  const lastBookIndex = Bible.getBookCount();
  const lastChapterIndex = Bible.getBookChapterCount(lastBookIndex);
  const lastVerseIndex = Bible.getChapterVerseCount(lastBookIndex, lastChapterIndex);
  let verseId = Bible.makeVerseId(lastBookIndex, lastChapterIndex, lastVerseIndex);
  let verseCount = 1;
  while (verseId) {
    verseId = Bible.getPreviousVerseId(verseId, true);
    if (verseId) {
      verseCount++;
    }
  }
  expect(verseCount).toBe(Bible.getTotalVerseCount());
});

test('can generate read/unread segments from ranges in a given book', () => {
  const bookIndex = 1;
  const ranges = deepFreeze([{
    startVerseId: Bible.makeVerseId(1, 2, 20),
    endVerseId: Bible.makeVerseId(1, 3, 10),
  }, {
    startVerseId: Bible.makeVerseId(1, 5, 1),
    endVerseId: Bible.makeVerseId(1, 10, 5),
  }]);
  const result = Bible.generateBookSegments(bookIndex, ranges);
  expect(result.length).toBe(5); // before, [range 0], between, [range 1], after
  expect(result[0].verseCount).toBe(50);
  expect(result[0].read).toBe(false);
  expect(result[1].verseCount).toBe(16);
  expect(result[1].read).toBe(true);
  expect(result[2].verseCount).toBe(40);
  expect(result[2].read).toBe(false);
  expect(result[3].verseCount).toBe(134);
  expect(result[3].read).toBe(true);
  expect(result[4].verseCount).toBe(1293);
  expect(result[4].read).toBe(false);
});

test('can generate read/unread segments from ranges in a given chapter', () => {
  const bookIndex = 1;
  const chapterIndex = 2;
  const ranges = deepFreeze([{
    startVerseId: Bible.makeVerseId(1, 2, 10),
    endVerseId: Bible.makeVerseId(1, 2, 15),
  }]);
  const result = Bible.generateBookChapterSegments(bookIndex, chapterIndex, ranges);
  expect(result.length).toBe(3); // before, [range 0], after
  expect(result[0].verseCount).toBe(9);
  expect(result[0].read).toBe(false);
  expect(result[1].verseCount).toBe(6);
  expect(result[1].read).toBe(true);
  expect(result[2].verseCount).toBe(10);
  expect(result[2].read).toBe(false);
});

test('can generate read/unread segments from ranges across the whole Bible', () => {
  const range1Peter = {
    startVerseId: Bible.makeVerseId(60, 2, 20),
    endVerseId: Bible.makeVerseId(60, 3, 10),
  };
  const range2Peter = {
    startVerseId: Bible.makeVerseId(61, 1, 13),
    endVerseId: Bible.makeVerseId(61, 1, 17),
  };
  const ranges = deepFreeze([range1Peter, range2Peter]);
  const result = Bible.generateBibleSegments(ranges);
  expect(result.length).toBe(70); // 66 books + 2 extra ranges per split book

  // 1 Peter 1:1-2:19
  expect(result[59].startVerseId).toBe(Bible.makeVerseId(60, 1, 1));
  expect(result[59].endVerseId).toBe(Bible.makeVerseId(60, 2, 19));
  // 1 Peter 2:20-3:10
  expect(result[60].startVerseId).toBe(range1Peter.startVerseId);
  expect(result[60].endVerseId).toBe(range1Peter.endVerseId);
  // 1 Peter 3:11-5:14 (end)
  expect(result[61].startVerseId).toBe(Bible.makeVerseId(60, 3, 11));
  expect(result[61].endVerseId).toBe(Bible.makeVerseId(60, 5, 14));

  // 2 Peter 1:1-1:12
  expect(result[62].startVerseId).toBe(Bible.makeVerseId(61, 1, 1));
  expect(result[62].endVerseId).toBe(Bible.makeVerseId(61, 1, 12));
  // 2 Peter 1:13-1:17
  expect(result[63].startVerseId).toBe(range2Peter.startVerseId);
  expect(result[63].endVerseId).toBe(range2Peter.endVerseId);
  // 1 Peter 1:18-3:18
  expect(result[64].startVerseId).toBe(Bible.makeVerseId(61, 1, 18));
  expect(result[64].endVerseId).toBe(Bible.makeVerseId(61, 3, 18));
});

test('can output human readable verse range', () => {
  const startVerseId = Bible.makeVerseId(5, 1, 13);
  const endVerseId = Bible.makeVerseId(5, 4, 18);
  const result = Bible.displayVerseRange(startVerseId, endVerseId);
  expect(result).toBe('Deuteronomy 1:13-4:18');
});

test('can display verse range covering entire chapter', () => {
  const startVerseId = Bible.makeVerseId(1, 3, 1);
  const endVerseId = Bible.makeVerseId(1, 3, 24);
  const result = Bible.displayVerseRange(startVerseId, endVerseId);
  expect(result).toBe('Genesis 3');
});

test('can correctly display verse range covering entire book', () => {
  const startVerseId = Bible.makeVerseId(1, 1, 1);
  const endVerseId = Bible.makeVerseId(1, 50, 26);
  const result = Bible.displayVerseRange(startVerseId, endVerseId);
  expect(result).toBe('Genesis');
});

test('can display verse range covering entire book with only one chapter', () => {
  const startVerseId = Bible.makeVerseId(65, 1, 1);
  const endVerseId = Bible.makeVerseId(65, 1, 25);
  const result = Bible.displayVerseRange(startVerseId, endVerseId);
  expect(result).toBe('Jude');
});

test('can display verse range within a single-chapter book', () => {
  const startVerseId = Bible.makeVerseId(65, 1, 3);
  const endVerseId = Bible.makeVerseId(65, 1, 8);
  const result = Bible.displayVerseRange(startVerseId, endVerseId);
  expect(result).toBe('Jude 1:3-8');
});

test('can parse human readable verse range (passage)', () => {
  const passage1 = 'Deuteronomy 1:13-4:18';
  const passage2 = 'Genesis 1:1-1:10';
  const passage3 = 'Song of Songs 1-8';

  const range1 = Bible.parseVerseRange(passage1);
  const range2 = Bible.parseVerseRange(passage2);
  const range3 = Bible.parseVerseRange(passage3);

  expect(range1?.startVerseId).toBe(Bible.makeVerseId(5, 1, 13));
  expect(range1?.endVerseId).toBe(Bible.makeVerseId(5, 4, 18));
  expect(range2?.startVerseId).toBe(Bible.makeVerseId(1, 1, 1));
  expect(range2?.endVerseId).toBe(Bible.makeVerseId(1, 1, 10));
  expect(range3?.startVerseId).toBe(Bible.makeVerseId(22, 1, 1));
  expect(range3?.endVerseId).toBe(Bible.makeVerseId(22, 8, 14));
});

test('can parse verse range consisting only of single chapter', () => {
  const passage = '2 Peter 3';
  const range = Bible.parseVerseRange(passage);
  expect(range?.startVerseId).toBe(Bible.makeVerseId(61, 3, 1));
  expect(range?.endVerseId).toBe(Bible.makeVerseId(61, 3, 18));
});

test('can parse verse range consisting of entire book', () => {
  const passage = 'Jude';
  const range = Bible.parseVerseRange(passage);
  expect(range?.startVerseId).toBe(Bible.makeVerseId(65, 1, 1));
  expect(range?.endVerseId).toBe(Bible.makeVerseId(65, 1, 25));
});

test('can parse verse range consisting of single verse', () => {
  const passage = 'John 3:16';
  const range = Bible.parseVerseRange(passage);
  expect(range?.startVerseId).toBe(Bible.makeVerseId(43, 3, 16));
  expect(range?.endVerseId).toBe(range?.startVerseId);
});

test('can parse verse range consisting of whole chapters', () => {
  const passage = 'Acts 2 - 4';
  const range = Bible.parseVerseRange(passage);
  expect(range?.startVerseId).toBe(Bible.makeVerseId(44, 2, 1));
  expect(range?.endVerseId).toBe(Bible.makeVerseId(44, 4, 37));
});

test('can parse verse range within a single chapters', () => {
  const passage = 'Acts 2:14 - 36';
  const range = Bible.parseVerseRange(passage);
  expect(range?.startVerseId).toBe(Bible.makeVerseId(44, 2, 14));
  expect(range?.endVerseId).toBe(Bible.makeVerseId(44, 2, 36));
});

test('can parse verse range with book abbreviation', () => {
  const passage = '2 Jn';
  const range = Bible.parseVerseRange(passage);
  expect(range?.startVerseId).toBe(Bible.makeVerseId(63, 1, 1));
  expect(range?.endVerseId).toBe(Bible.makeVerseId(63, 1, 13));
});

test('can parse verse range with period after book abbreviation', () => {
  const passage = '1 Cor. 2:3';
  const range = Bible.parseVerseRange(passage);
  expect(range?.startVerseId).toBe(Bible.makeVerseId(46, 2, 3));
  expect(range?.endVerseId).toBe(range?.startVerseId);
});

test('will throw when parsing an invalid verse range', () => {
  const passage1 = 'Nope 1:13-4:18';
  const passage2 = 'Incorrect Pattern';
  const passage3 = 'Jude 2';

  expect(() => Bible.parseVerseRange(passage1)).toThrow();
  expect(() => Bible.parseVerseRange(passage2)).toThrow();
  expect(() => Bible.parseVerseRange(passage3)).toThrow();
});
