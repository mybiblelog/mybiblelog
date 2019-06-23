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
  expect(bibleVerseCount).toBe(31103);
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
