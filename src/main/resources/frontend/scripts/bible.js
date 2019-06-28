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

Bible.getBookCount = () => Bible.getBooks().length;

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

/**
 * A function for use with `Array.prototype.sort` that
 * orders ranges based on book and chapter indices.
 */
Bible.compareRanges = (range1, range2) => {
  const startVerse1 = Bible.parseVerseId(range1.startVerseId);
  const startVerse2 = Bible.parseVerseId(range2.startVerseId);
  if (startVerse1.book < startVerse2.book) return -1;
  if (startVerse1.book > startVerse2.book) return 1;
  if (startVerse1.chapter < startVerse2.chapter) return -1;
  if (startVerse1.chapter > startVerse2.chapter) return 1;
  if (startVerse1.verse < startVerse2.verse) return -1;
  if (startVerse1.verse > startVerse2.verse) return 1;
  return 0;
};

Bible.checkRangeOverlap = (range1, range2) => {
  // Sort ranges according to bible order
  const [firstRange, secondRange] = [range1, range2].sort(Bible.compareRanges);
  return firstRange.endVerseId >= secondRange.startVerseId;
};

/**
 * Counts the total number of verses in an array of ranges,
 * never counting the same verse more than once.
 */
Bible.countUniqueRangeVerses = ranges => {
  ranges = ranges.sort(Bible.compareRanges);
  let totalVerses = 0;
  let lastRange = null;
  for (let range of ranges) {
    if (!lastRange) {
      lastRange = range;
    }
    else if (range.startVerseId <= lastRange.endVerseId) {
      if (range.endVerseId > lastRange.endVerseId) {
        lastRange.endVerseId = range.endVerseId;
      }
    }
    else {
      totalVerses += Bible.countRangeVerses(lastRange.startVerseId, lastRange.endVerseId);
      lastRange = range;
    }
  }
  if (lastRange) {
    totalVerses += Bible.countRangeVerses(lastRange.startVerseId, lastRange.endVerseId);
  }
  return totalVerses;
};

Bible.countUniqueBookRangeVerses = (bookIndex, ranges) => {
  ranges = Bible.filterRangesByBook(bookIndex, ranges);
  return Bible.countUniqueRangeVerses(ranges);
};

/**
 * Returns a new array comprised only of ranges in the given book.
 */
Bible.filterRangesByBook = (bookIndex, ranges) => {
  return ranges.filter(r => {
    const startVerse = Bible.parseVerseId(r.startVerseId);
    return startVerse.book === bookIndex;
  });
};

/**
 * Filters out all ranges that do not overlap the given book chapter,
 * returning the new resulting array.
 */
Bible.filterRangesByBookChapter = (bookIndex, chapterIndex, ranges) => {
  return  ranges.filter(r => {
    const startVerse = Bible.parseVerseId(r.startVerseId);
    const endVerse = Bible.parseVerseId(r.endVerseId);
    return (
      startVerse.book === bookIndex &&
      startVerse.chapter <= chapterIndex &&
      endVerse.chapter >= chapterIndex
    );
  });
};

/**
 * Crops a range's start and end verse IDs to the first and last verse IDs
 * for a given book chapter.
 */
Bible.cropRangeToBookChapter = (bookIndex, chapterIndex, range) => {
  const startVerse = Bible.parseVerseId(range.startVerseId);
  const endVerse = Bible.parseVerseId(range.endVerseId);
  if (startVerse.chapter < chapterIndex) {
    startVerse.chapter = chapterIndex;
    startVerse.verse = 1;
  }
  if (endVerse.chapter > chapterIndex) {
    endVerse.chapter = chapterIndex;
    endVerse.verse = Bible.getChapterVerseCount(bookIndex, chapterIndex);
  }
  const startVerseId = Bible.makeVerseId(startVerse.book, startVerse.chapter, startVerse.verse);
  const endVerseId = Bible.makeVerseId(endVerse.book, endVerse.chapter, endVerse.verse);
  return Object.assign({}, range, { startVerseId, endVerseId });
};

Bible.countUniqueBookChapterRangeVerses = (bookIndex, chapterIndex, ranges) => {
  // Include only ranges that overlap into the given chapter of the given book
  const filteredRanges = Bible.filterRangesByBookChapter(bookIndex, chapterIndex, ranges);

  // Crop out all verses that are beyond the given chapter
  const croppedRanges = filteredRanges.map(range => {
    return Bible.cropRangeToBookChapter(bookIndex, chapterIndex, range);
  });

  return Bible.countUniqueRangeVerses(croppedRanges);
};

Bible.consolidateRanges = ranges => {
  ranges = ranges.sort(Bible.compareRanges);
  const result = [];
  let lastRange = null;
  for (let range of ranges) {
    if (!lastRange) {
      lastRange = range;
    }
    else if (range.startVerseId <= lastRange.endVerseId) {
      if (range.endVerseId > lastRange.endVerseId) {
        lastRange.endVerseId = range.endVerseId;
      }
    }
    else {
      result.push(lastRange);
      lastRange = range;
    }
  }
  if (lastRange) {
    result.push(lastRange);
  }
  return result;
};

module.exports = Bible;
