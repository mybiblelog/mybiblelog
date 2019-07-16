const Bible = require('./bible.js');

test('loads bible book data', () => {
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
  const startVerseId = Bible.makeVerseId(1, 1, 15); //31 verses
  const endVerseId = Bible.makeVerseId(1, 2, 10); //25 verses
  const verseCount = Bible.countRangeVerses(startVerseId, endVerseId);
  expect(verseCount).toBe(27);
});

test('can count verse range across books', () => {
  const startVerseId = Bible.makeVerseId(1, 50, 1); //26 verses
  const endVerseId = Bible.makeVerseId(2, 1, 10); //10 verses
  const verseCount = Bible.countRangeVerses(startVerseId, endVerseId);
  expect(verseCount).toBe(36);
});

test('can count verse range across multiple', () => {
  const startVerseId = Bible.makeVerseId(1, 50, 1); //26 verses
  // 1213 verses in chapter 2
  const endVerseId = Bible.makeVerseId(3, 1, 10); //10 verses
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

test('can count number of verses in whole bible', () => {
  const bibleVerseCount = Bible.getTotalVerseCount();
  expect(bibleVerseCount).toBe(31102);
});

test('can compare ranges of verses in different books', () => {
  const genesisRange = {
    startVerseId: Bible.makeVerseId(1, 1, 2),
    endVerseId:   Bible.makeVerseId(1, 2, 5),
  };
  const exodusRange = {
    startVerseId: Bible.makeVerseId(2, 2, 1),
    endVerseId:   Bible.makeVerseId(2, 3, 15),
  };
  const smallerFirst = Bible.compareRanges(genesisRange, exodusRange);
  const largerFirst = Bible.compareRanges(exodusRange, genesisRange);
  expect(smallerFirst).toBe(-1);
  expect(largerFirst).toBe(1);
});

test('can compare ranges of verses in same book', () => {
  const genesis1Range = {
    startVerseId: Bible.makeVerseId(1, 1, 2),
    endVerseId:   Bible.makeVerseId(1, 2, 5),
  };
  const genesis2Range = {
    startVerseId: Bible.makeVerseId(1, 2, 1),
    endVerseId:   Bible.makeVerseId(1, 3, 15),
  };
  const smallerFirst = Bible.compareRanges(genesis1Range, genesis2Range);
  const largerFirst = Bible.compareRanges(genesis2Range, genesis1Range);
  expect(smallerFirst).toBe(-1);
  expect(largerFirst).toBe(1);
});

test('can compare ranges of verses in same chapter', () => {
  const genesisRange1 = {
    startVerseId: Bible.makeVerseId(1, 1, 1),
    endVerseId:   Bible.makeVerseId(1, 1, 15),
  };
  const genesisRange2 = {
    startVerseId: Bible.makeVerseId(1, 1, 10),
    endVerseId:   Bible.makeVerseId(1, 1, 25),
  };
  const smallerFirst = Bible.compareRanges(genesisRange1, genesisRange2);
  const largerFirst = Bible.compareRanges(genesisRange2, genesisRange1);
  expect(smallerFirst).toBe(-1);
  expect(largerFirst).toBe(1);
});

test('can determine that ranges from different books do not overlap', () => {
  const genesisRange = {
    startVerseId: Bible.makeVerseId(1, 1, 1),
    endVerseId:   Bible.makeVerseId(1, 1, 15),
  };
  const exodusRange = {
    startVerseId: Bible.makeVerseId(2, 1, 10),
    endVerseId:   Bible.makeVerseId(2, 3, 25),
  };
  const result = Bible.checkRangeOverlap(genesisRange, exodusRange);
  expect(result).toBe(false);
});

test('can determine when ranges do overlap', () => {
  const genesisRange1 = {
    startVerseId: Bible.makeVerseId(1, 1, 1),
    endVerseId:   Bible.makeVerseId(1, 2, 15),
  };
  const genesisRange2 = {
    startVerseId: Bible.makeVerseId(1, 1, 10),
    endVerseId:   Bible.makeVerseId(1, 2, 25),
  };
  const result = Bible.checkRangeOverlap(genesisRange1, genesisRange2);
  expect(result).toBe(true);
});

test('can count total number of verses in non-overlapping ranges', () => {
  const genesisRange1 = {
    startVerseId: Bible.makeVerseId(1, 1, 1),
    endVerseId:   Bible.makeVerseId(1, 1, 15),
  };
  const genesisRange2 = {
    startVerseId: Bible.makeVerseId(1, 2, 10),
    endVerseId:   Bible.makeVerseId(1, 2, 25),
  };
  const result = Bible.countUniqueRangeVerses([genesisRange1, genesisRange2]);
  expect(result).toBe(31);
});

test('can count total number of verses in overlapping ranges', () => {
  const genesisRange1 = {
    startVerseId: Bible.makeVerseId(1, 1, 1),
    endVerseId:   Bible.makeVerseId(1, 2, 15),
  };
  const genesisRange2 = {
    startVerseId: Bible.makeVerseId(1, 2, 1),
    endVerseId:   Bible.makeVerseId(1, 2, 25),
  };
  const result = Bible.countUniqueRangeVerses([genesisRange1, genesisRange2]);
  expect(result).toBe(56);
});

test('can count only verses from ranges in given book', () => {
  const genesisRange1 = {
    startVerseId: Bible.makeVerseId(1, 1, 1),
    endVerseId:   Bible.makeVerseId(1, 2, 15),
  };
  const genesisRange2 = {
    startVerseId: Bible.makeVerseId(1, 2, 1),
    endVerseId:   Bible.makeVerseId(1, 2, 25),
  };
  const exodusRange = {
    startVerseId: Bible.makeVerseId(2, 1, 1),
    endVerseId:   Bible.makeVerseId(2, 1, 17),
  };
  const ranges = [genesisRange1, exodusRange, genesisRange2];
  const genesisResult = Bible.countUniqueBookRangeVerses(1, ranges);
  const exodusResult = Bible.countUniqueBookRangeVerses(2, ranges);
  expect(genesisResult).toBe(56);
  expect(exodusResult).toBe(17);
});

test('can count only range verses from given chapter', () => {
  // Genesis chapter verse counts: 1=31, 2=25, 3=24
  const overlapPreviousChapter = {
    startVerseId: Bible.makeVerseId(1, 1, 16), // 15 verses in ch 1
    endVerseId:   Bible.makeVerseId(1, 2, 20), // 20 verses in ch 2
  };
  const overlapNextChapter = {
    startVerseId: Bible.makeVerseId(1, 2, 21), // 5 verses in ch 2
    endVerseId:   Bible.makeVerseId(1, 3, 10), // 10 verses in ch 3
  };
  const overlapSurroundingChapters = {
    startVerseId: Bible.makeVerseId(1, 1, 16), // 15 verses in ch 1
    endVerseId:   Bible.makeVerseId(1, 3, 10), // 10 verses in ch 3
  };
  const entirelyPreviousChapter = {
    startVerseId: Bible.makeVerseId(1, 1, 10),
    endVerseId:   Bible.makeVerseId(1, 1, 20), // 11 verses in ch 1
  };
  const entirelyNextChapter = {
    startVerseId: Bible.makeVerseId(1, 3, 5),
    endVerseId:   Bible.makeVerseId(1, 3, 20), // 16 verses in ch 3
  };
  const entirelyThisChapter = {
    startVerseId: Bible.makeVerseId(1, 2, 1),
    endVerseId:   Bible.makeVerseId(1, 2, 17), // 17 verses in ch 2
  };

  const overlapPreviousResult     = Bible.countUniqueBookChapterRangeVerses(1, 2, [overlapPreviousChapter]);
  const overlapNextResult         = Bible.countUniqueBookChapterRangeVerses(1, 2, [overlapNextChapter]);
  const overlapSurroundingResult  = Bible.countUniqueBookChapterRangeVerses(1, 2, [overlapSurroundingChapters]);
  const entirelyPreviousResult    = Bible.countUniqueBookChapterRangeVerses(1, 2, [entirelyPreviousChapter]);
  const entirelyNextResult        = Bible.countUniqueBookChapterRangeVerses(1, 2, [entirelyNextChapter]);
  const entirelyThisResult        = Bible.countUniqueBookChapterRangeVerses(1, 2, [entirelyThisChapter]);

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
    endVerseId:   Bible.makeVerseId(3, 2, 20),
  };
  const outOfBook1 = {
    startVerseId: Bible.makeVerseId(2, 1, 5),
    endVerseId:   Bible.makeVerseId(2, 3, 10),
  };
  const inBook2 = {
    startVerseId: Bible.makeVerseId(3, 2, 5),
    endVerseId:   Bible.makeVerseId(3, 3, 1),
  };
  const outOfBook2 = {
    startVerseId: Bible.makeVerseId(4, 1, 16),
    endVerseId:   Bible.makeVerseId(4, 3, 10),
  };
  const ranges = [inBook1, outOfBook1, inBook2, outOfBook2];
  const result = Bible.filterRangesByBook(bookIndex, ranges);
  expect(result.length).toBe(2);
});

test('can filter ranges by book and chapter', () => {
  const bookIndex = 5;
  const chapterIndex = 4;
  const leadsOutOfChapter = {
    startVerseId: Bible.makeVerseId(5, 4, 16),
    endVerseId:   Bible.makeVerseId(5, 5, 20),
  };
  const isOutOfChapter = {
    startVerseId: Bible.makeVerseId(2, 1, 5),
    endVerseId:   Bible.makeVerseId(2, 3, 10),
  };
  const leadsIntoChapter = {
    startVerseId: Bible.makeVerseId(5, 3, 5),
    endVerseId:   Bible.makeVerseId(5, 4, 1),
  };
  const isInChapter = {
    startVerseId: Bible.makeVerseId(5, 4, 10),
    endVerseId:   Bible.makeVerseId(5, 4, 12),
  };
  const ranges = [leadsOutOfChapter, isOutOfChapter, leadsIntoChapter, isInChapter];
  const result = Bible.filterRangesByBookChapter(bookIndex, chapterIndex, ranges);
  expect(result.length).toBe(3);
});

test('can crop ranges to include only verses in given chapter', () => {
  const bookIndex = 5;
  const chapterIndex = 4;

  const leadsOutOfChapter = {
    startVerseId: Bible.makeVerseId(5, 4, 16),
    endVerseId:   Bible.makeVerseId(5, 5, 20),
  };
  const leadsIntoChapter = {
    startVerseId: Bible.makeVerseId(5, 3, 5),
    endVerseId:   Bible.makeVerseId(5, 4, 1),
  };
  const isInChapter = {
    startVerseId: Bible.makeVerseId(5, 4, 10),
    endVerseId:   Bible.makeVerseId(5, 4, 12),
  };
  const leadsInAndOutOfChapter = {
    startVerseId: Bible.makeVerseId(5, 3, 10),
    endVerseId:   Bible.makeVerseId(5, 5, 12),
  };

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
    endVerseId:   Bible.makeVerseId(1, 2, 25),
  };
  const overlap2 = {
    startVerseId: Bible.makeVerseId(1, 2, 20),
    endVerseId:   Bible.makeVerseId(1, 3, 10),
  };
  const result = Bible.consolidateRanges([overlap1, overlap2]);
  expect(result.length).toBe(1);
  expect(result[0].startVerseId).toBe(overlap1.startVerseId);
  expect(result[0].endVerseId).toBe(overlap2.endVerseId);
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

test('can get previous versId', () => {
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

test('can generate read/unread segments from ranges in a given book', () => {
  const bookIndex = 1;
  const ranges = [{
    startVerseId: Bible.makeVerseId(1, 2, 20),
    endVerseId:   Bible.makeVerseId(1, 3, 10),
  }, {
    startVerseId: Bible.makeVerseId(1, 5, 1),
    endVerseId:   Bible.makeVerseId(1, 10, 5),
  }];
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
  const ranges = [{
    startVerseId: Bible.makeVerseId(1, 2, 10),
    endVerseId:   Bible.makeVerseId(1, 2, 15),
  }];
  const result = Bible.generateBookChapterSegments(bookIndex, chapterIndex, ranges);
  expect(result.length).toBe(3); // before, [range 0], after
  expect(result[0].verseCount).toBe(9);
  expect(result[0].read).toBe(false);
  expect(result[1].verseCount).toBe(6);
  expect(result[1].read).toBe(true);
  expect(result[2].verseCount).toBe(10);
  expect(result[2].read).toBe(false);
});

// TODO: test creating chapter segments when some ranges are from other books
// TODO: test creating chapter segments when some ranges cross into the chapter
// TODO: test creating chapter segments when some ranges cross out of the chapter
// TODO: test creating chapter segments when some ranges cross into and out of the chapter

test('can output human readable verse range', () => {
  const startVerseId = Bible.makeVerseId(5, 1, 13);
  const endVerseId = Bible.makeVerseId(5, 4, 18);
  const result = Bible.displayVerseRange(startVerseId, endVerseId);
  expect(result).toBe('Deuteronomy 1:13-4:18');
});

test('can parse human readable verse range (passage)', () => {
  const passage1 = 'Deuteronomy 1:13-4:18';
  const passage2 = 'Genesis 1:1-1:10';

  const range1 = Bible.parseVerseRange(passage1);
  const range2 = Bible.parseVerseRange(passage2);

  expect(range1.startVerseId).toBe(Bible.makeVerseId(5, 1, 13));
  expect(range1.endVerseId).toBe(Bible.makeVerseId(5, 4, 18));
  expect(range2.startVerseId).toBe(Bible.makeVerseId(1, 1, 1));
  expect(range2.endVerseId).toBe(Bible.makeVerseId(1, 1, 10));
});

test('can parse verse range consisting only of single chapter', () => {
  const passage = '2 Peter 3';
  const range = Bible.parseVerseRange(passage);
  expect(range.startVerseId).toBe(Bible.makeVerseId(61, 3, 1));
  expect(range.endVerseId).toBe(Bible.makeVerseId(61, 3, 18));
});

test('can parse verse range consisting of entire book', () => {
  const passage = 'Jude';
  const range = Bible.parseVerseRange(passage);
  expect(range.startVerseId).toBe(Bible.makeVerseId(65, 1, 1));
  expect(range.endVerseId).toBe(Bible.makeVerseId(65, 1, 25));
});

test('can parse verse range consisting of single verse', () => {
  const passage = 'John 3:16';
  const range = Bible.parseVerseRange(passage);
  expect(range.startVerseId).toBe(Bible.makeVerseId(43, 3, 16));
  expect(range.endVerseId).toBe(range.startVerseId);
});

test('can parse verse range consisting of whole chapters', () => {
  const passage = 'Acts 2 - 4';
  const range = Bible.parseVerseRange(passage);
  expect(range.startVerseId).toBe(Bible.makeVerseId(44, 2, 1));
  expect(range.endVerseId).toBe(Bible.makeVerseId(44, 4, 37));
});

test('can parse verse range within a single chapters', () => {
  const passage = 'Acts 2:14 - 36';
  const range = Bible.parseVerseRange(passage);
  expect(range.startVerseId).toBe(Bible.makeVerseId(44, 2, 14));
  expect(range.endVerseId).toBe(Bible.makeVerseId(44, 2, 36));
});

test('can parse verse range with book abbreviation', () => {
  const passage = '2 Jn';
  const range = Bible.parseVerseRange(passage);
  expect(range.startVerseId).toBe(Bible.makeVerseId(63, 1, 1));
  expect(range.endVerseId).toBe(Bible.makeVerseId(63, 1, 13));
});
