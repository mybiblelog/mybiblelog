const bibleBooks = require('./static/bible-books.js');
const chapterVerses = require('./static/chapter-verses.js');

const Bible = {};

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

Bible.countRangeVerses = (startVerseId, endVerseId) => {
  const startVerse = Bible.parseVerseId(startVerseId);
  const endVerse = Bible.parseVerseId(endVerseId);
  if (startVerse.chapter === endVerse.chapter) {
    return endVerse.verse - startVerse.verse + 1;
  }
  const { book } = startVerse;
  let verseCount = 0;
  for (let i = startVerse.chapter; i <= endVerse.chapter; i++) {
    const chapterVerses = Bible.getChapterVerseCount(book, i);
    if (i === startVerse.chapter) {
      const unreadVerses = (startVerse.verse - 1);
      verseCount += (chapterVerses - unreadVerses);
    }
    else if (i === endVerse.chapter) {
      verseCount += endVerse.verse;
    }
    else {
      verseCount += chapterVerses;
    }
  }
  return verseCount;
};

Bible.getBookVerseCount = bookIndex => {
  const bookChapterCount = Bible.getBookChapterCount(bookIndex);
  let totalVerses = 0;
  for (let c = 1, l = bookChapterCount; c <= l; c++) {
    totalVerses += Bible.getChapterVerseCount(bookIndex, c);
  }
  return totalVerses;
};

Bible.getTotalVerseCount = () => {
  const books = Bible.getBooks();
  let totalVerses = 0;
  for (let b = 1, l = books.length; b <= l; b++) {
    totalVerses += Bible.getBookVerseCount(b);
  }
  return totalVerses;
};

module.exports = Bible;
