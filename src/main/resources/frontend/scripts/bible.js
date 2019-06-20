const bibleBooks = require('./static/bible-books.js');
const chapterVerses = require('./static/chapter-verses.js');
const BibleVerse = require('./bible-verse.js');
const LogEntry = require('./log-entry.js');

const Bible = {};

Bible.Verse = BibleVerse;
Bible.LogEntry = LogEntry;

Bible.makeVerseId = (book = 0, chapter = 0, verse = 0) => {
  let verseId = 100000000 + book * 1000000 + chapter * 1000 + verse;
  return verseId;
};

Bible.parseVerseId = verseId => {
  verseId -= 100000000;
  let book = Math.floor(verseId / 1000000);
  verseId -= book * 1000000;
  let chapter = Math.floor(verseId / 1000);
  verseId -= chapter * 1000;
  let verse = verseId;
  return { book, chapter, verse };
};

Bible.getBooks = () => bibleBooks;

Bible.getChapterVerses = () => chapterVerses;

Bible.getBookChapterCount = bookIndex => {
  const targetBook = bibleBooks.find(b => b.bibleOrder === bookIndex);
  if (!targetBook) return 0;
  return targetBook.chapterCount;
};

Bible.getChapterVerseCount = (bookIndex, chapterIndex) => {
  const chapterId = Bible.makeVerseId(bookIndex, chapterIndex);
  const result = chapterVerses.find(c => c.chapterId === chapterId);
  return result ? result.verseCount : 0;
};

Bible.getBookName = bookIndex => {
  const targetBook = bibleBooks.find(b => b.bibleOrder === bookIndex);
  if (!targetBook) return '';
  return targetBook.name;
};

module.exports = Bible;
