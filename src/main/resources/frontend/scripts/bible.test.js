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
