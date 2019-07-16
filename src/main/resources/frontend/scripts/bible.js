const bibleBooks = require('./static/bible-books.js');
const chapterVerses = require('./static/chapter-verses.js');

const Bible = {};

/**
 * Create a new `Object` with the same nested properties as the input.
 * Used to manipulate data without mutating the original input.
 * @param {Object} data
 */
const cloneData = data => JSON.parse(JSON.stringify(data));

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

Bible.getBookIndex = bookName => {
  const caseInsensitive = bookName.toLocaleLowerCase();
  const targetBook = bibleBooks.find(b => {
    if (b.name.toLocaleLowerCase() === caseInsensitive) return true;
    const insensitiveAbbreviations = b.abbreviations.map(a => a.toLocaleLowerCase());
    if (insensitiveAbbreviations.includes(caseInsensitive)) return true;
  });
  if (!targetBook) return -1;
  return targetBook.bibleOrder;
};

Bible.countRangeVerses = (startVerseId, endVerseId) => {
  const startVerse = Bible.parseVerseId(startVerseId);
  const endVerse = Bible.parseVerseId(endVerseId);

  // If we are counting the unread verses between segments that have been read,
  // those unread spans could jump between books
  if (startVerse.book !== endVerse.book) {
    let sum = 0;

    const tailStartVerseId = startVerseId;
    const lastChapter = Bible.getBookChapterCount(startVerse.book);
    const lastVerse = Bible.getChapterVerseCount(startVerse.book, lastChapter);
    const tailEndVerseId = Bible.makeVerseId(startVerse.book, lastChapter, lastVerse);
    const tailVerseCount = Bible.countRangeVerses(tailStartVerseId, tailEndVerseId);
    sum += tailVerseCount;

    for (let i = startVerse.book + 1, l = endVerse.book; i < l; i++) {
      const bookVerseCount = Bible.getBookVerseCount(i);
      sum += bookVerseCount;
    }

    const headStartVerseId = Bible.makeVerseId(endVerse.book, 1, 1);
    const headEndVerseId = endVerseId;
    const headVerseCount = Bible.countRangeVerses(headStartVerseId, headEndVerseId);
    sum += headVerseCount;

    return sum;
  }

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
 * Returns the next verseId. Especially used to jump from
 * the end of a chapter to the beginning of the next chapter
 * without landing on a nonexistent verse.
 *
 * There is no expected behavior for a verse before the first book or after the last.
 */
Bible.getNextVerseId = verseId => {
  let { book, chapter, verse } = Bible.parseVerseId(verseId);
  const chapterVerseCount = Bible.getChapterVerseCount(book, chapter);
  if (verse < chapterVerseCount) {
    verse++;
  }
  else {
    chapter++;
    verse = 1;
  }
  return Bible.makeVerseId(book, chapter, verse);
};

/**
 * Returns the previous verseId. Especially used to jump from
 * the beginning of a chapter back to the end of the previous chapter
 * without landing on a nonexistent verse.
 *
 * There is no expected behavior for a verse before the first book or after the last.
 */
Bible.getPreviousVerseId = verseId => {
  let { book, chapter, verse } = Bible.parseVerseId(verseId);
  if (verse > 1) {
    verse--;
  }
  else {
    chapter--;
    verse = Bible.getChapterVerseCount(book, chapter);
  }
  return Bible.makeVerseId(book, chapter, verse);
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
  ranges = cloneData(ranges);
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
  ranges = cloneData(ranges);
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
  ranges = cloneData(ranges);
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
  ranges = cloneData(ranges);
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

/**
 * Generates an array of segments, each indicating a read/unread range of verses.
 */
Bible.generateSegments = (firstVerseId, finalVerseId, ranges) => {
  const segments = [];

  // If there are no ranges, return one giant UNREAD segment
  if (!ranges.length) {
    return [{
      startVerseId: firstVerseId,
      endVerseId:   finalVerseId,
      read:         false,
      verseCount:   Bible.countRangeVerses(firstVerseId, finalVerseId),
    }];
  }

  // Sort and consolidate ranges
  ranges = Bible.consolidateRanges(ranges);

  let lastReadVerseId;
  for (let i = 0, l = ranges.length; i < l; i++) {
    const range = ranges[i];

    // Create initial UNREAD segment before first range if needed
    if (i === 0) {
      const { startVerseId, endVerseId } = range;
      if (firstVerseId !== startVerseId) {
        const unreadEndVerseId = Bible.getPreviousVerseId(startVerseId);
        segments.push({
          startVerseId: firstVerseId,
          endVerseId:   unreadEndVerseId,
          read:         false,
          verseCount:   Bible.countRangeVerses(firstVerseId, unreadEndVerseId),
        });
      }
    }
    // if this is NOT the first range, create an UNREAD segment before it
    else {
      const unreadStartVerseId = Bible.getNextVerseId(lastReadVerseId);
      const unreadEndVerseId = Bible.getPreviousVerseId(range.startVerseId);
      segments.push({
        startVerseId: unreadStartVerseId,
        endVerseId:   unreadEndVerseId,
        read:         false,
        verseCount:   Bible.countRangeVerses(unreadStartVerseId, unreadEndVerseId),
      });
    }
    // add the range as a READ segment
    const { startVerseId, endVerseId } = range;
    segments.push({
      startVerseId,
      endVerseId,
      read:       true,
      verseCount: Bible.countRangeVerses(startVerseId, endVerseId),
    });
    lastReadVerseId = endVerseId;

    // Create trailing UNREAD segment if needed
    if (i === l - 1) {
      if (range.endVerseId !== finalVerseId) {
        const startVerseId = Bible.getNextVerseId(lastReadVerseId);
        segments.push({
          startVerseId,
          endVerseId: finalVerseId,
          read:       false,
          verseCount: Bible.countRangeVerses(startVerseId, finalVerseId),
        });
      }
    }
  }

  return segments;
};

Bible.generateBibleSegments = ranges => {
  const lastChapterIndex = Bible.getBookChapterCount(66);
  const lastChapterVerseCount = Bible.getChapterVerseCount(66, lastChapterIndex);

  const firstVerseId = Bible.makeVerseId(1, 1, 1);
  const finalVerseId = Bible.makeVerseId(66, lastChapterIndex, lastChapterVerseCount);

  return Bible.generateSegments(firstVerseId, finalVerseId, ranges);
};

Bible.generateBookSegments = (bookIndex, ranges) => {
  const lastChapterIndex = Bible.getBookChapterCount(bookIndex);
  const lastChapterVerseCount = Bible.getChapterVerseCount(bookIndex, lastChapterIndex);

  const firstVerseId = Bible.makeVerseId(bookIndex, 1, 1);
  const finalVerseId = Bible.makeVerseId(bookIndex, lastChapterIndex, lastChapterVerseCount);

  ranges = Bible.filterRangesByBook(bookIndex, ranges);

  return Bible.generateSegments(firstVerseId, finalVerseId, ranges);
};

Bible.generateBookChapterSegments = (bookIndex, chapterIndex, ranges) => {
  const chapterVerseCount = Bible.getChapterVerseCount(bookIndex, chapterIndex);

  const firstVerseId = Bible.makeVerseId(bookIndex, chapterIndex, 1);
  const finalVerseId = Bible.makeVerseId(bookIndex, chapterIndex, chapterVerseCount);

  ranges = Bible.filterRangesByBookChapter(bookIndex, chapterIndex, ranges);
  ranges = ranges.map(range => {
    return Bible.cropRangeToBookChapter(bookIndex, chapterIndex, range);
  });

  return Bible.generateSegments(firstVerseId, finalVerseId, ranges);
};

Bible.displayVerseRange = (startVerseId, endVerseId) => {
  const start = Bible.parseVerseId(startVerseId);
  const end = Bible.parseVerseId(endVerseId);

  const bookName = Bible.getBookName(start.book);
  let range = bookName + ' ';
  if (start.chapter === end.chapter) {
    range += start.chapter + ':';
    range += start.verse + '-' + end.verse;
    return range;
  }
  else {
    range += start.chapter + ':' + start.verse + '-';
    range += end.chapter + ':' + end.verse;
    return range;
  }
};

const RegEx = {
  BookChapterVerseToChapterVerse: /((?:\d\s)?\w+)\s+(\d+)\s*:\s*(\d+)\s*[-–—]+\s*(\d+)\s*:\s*(\d+)/i,
  BookChapterVerseToVerse:        /((?:\d\s)?\w+)\s+(\d+)\s*:\s*(\d+)\s*[-–—]+\s*(\d+)/i,
  BookChapterToChapter:           /((?:\d\s)?\w+)\s+(\d+)\s*[-–—]+\s*(\d+)/i,
  BookChapterVerse:               /((?:\d\s)?\w+)\s+(\d+)\s*:\s*(\d+)/i,
  BookChapter:                    /((?:\d\s)?\w+)\s+(\d+)/i,
  Book:                           /((?:\d\s)?\w+)/i,
};
Bible.parseVerseRange = verseRangeString => {
  const start = {
    book:    null,
    chapter: null,
    verse:   null,
  };
  const end = {
    chapter: null,
    verse:   null,
  };

  let match;
  if (match = RegEx.BookChapterVerseToChapterVerse.exec(verseRangeString), match) {
    [, start.book, start.chapter, start.verse, end.chapter, end.verse] = match;
  }
  else if (match = RegEx.BookChapterVerseToVerse.exec(verseRangeString), match) {
    [, start.book, start.chapter, start.verse, end.verse] = match;
    end.chapter = start.chapter;
  }
  else if (match = RegEx.BookChapterToChapter.exec(verseRangeString), match) {
    [, start.book, start.chapter, end.chapter] = match;
    start.verse = 1;
    end.verse = Bible.getChapterVerseCount(Bible.getBookIndex(start.book), end.chapter);
  }
  else if (match = RegEx.BookChapterVerse.exec(verseRangeString), match) {
    [, start.book, start.chapter, start.verse] = match;
    end.chapter = start.chapter;
    end.verse = start.verse;
  }
  else if (match = RegEx.BookChapter.exec(verseRangeString), match) {
    [, start.book, start.chapter] = match;
    start.verse = 1;
    end.chapter = start.chapter;
    end.verse = Bible.getChapterVerseCount(Bible.getBookIndex(start.book), start.chapter);
  }
  else if (match = RegEx.Book.exec(verseRangeString), match) {
    [, start.book] = match;
    start.chapter = 1;
    start.verse = 1;
    end.chapter = Bible.getBookChapterCount(Bible.getBookIndex(start.book));
    end.verse = Bible.getChapterVerseCount(Bible.getBookIndex(start.book), end.chapter);
  }

  start.book = Bible.getBookIndex(start.book);
  end.book = start.book;

  const startVerseId = Bible.makeVerseId(start.book, +start.chapter, +start.verse);
  const endVerseId = Bible.makeVerseId(end.book, +end.chapter, +end.verse);

  return { startVerseId, endVerseId };
};

module.exports = Bible;
