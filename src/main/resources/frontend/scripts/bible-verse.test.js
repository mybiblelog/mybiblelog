const BibleVerse = require('./bible-verse.js');

const genesis_1_1 = 101001001;

test('should make bible verse', () => {
  const bibleVerse = new BibleVerse(genesis_1_1);
  expect(bibleVerse.id).toBe(genesis_1_1);
});

test('should parse bible verse', () => {
  const bibleVerse = new BibleVerse(genesis_1_1);
  expect(bibleVerse.bookIndex).toBe(1);
  expect(bibleVerse.chapterIndex).toBe(1);
  expect(bibleVerse.verseIndex).toBe(1);
});

test('should make verse ID', () => {
  const revelationIndex = 66;
  const revelation_7_22_id = BibleVerse.makeId(revelationIndex, 7, 22);
  const bibleVerse = new BibleVerse(revelation_7_22_id);
  expect(bibleVerse.bookIndex).toBe(revelationIndex);
  expect(bibleVerse.chapterIndex).toBe(7);
  expect(bibleVerse.verseIndex).toBe(22);
});
