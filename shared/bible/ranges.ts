import { makeVerseId, parseVerseId, type VerseId, type VerseRange } from './encoding';
import { getBookChapterCount, getBookCount, getBookVerseCount, getChapterVerseCount } from './metadata';
import { getFirstBookVerseId, getLastBookVerseId, getNextVerseId, getPreviousVerseId } from './navigation';

/**
 * Creates a sorted array of indices for an array,
 * enabling efficient iteration over the array in sorted order
 * without mutating the original array or needing to clone it.
 */
function createSortedIndices<T>(array: ReadonlyArray<Readonly<T>>, compareFn: (a: T, b: T) => number): number[] {
  return Array.from(array.keys()).sort((a, b) =>
    compareFn(array[a], array[b]),
  );
}

/**
 * A function for use with `Array.prototype.sort` that
 * orders ranges based on book and chapter indices.
 * This comparison only takes `startVerseId` into account.
 */
export const compareRanges = (range1: VerseRange, range2: VerseRange): number => {
  const startVerse1 = parseVerseId(range1.startVerseId);
  const startVerse2 = parseVerseId(range2.startVerseId);
  if (startVerse1.book < startVerse2.book) { return -1; }
  if (startVerse1.book > startVerse2.book) { return 1; }
  if (startVerse1.chapter < startVerse2.chapter) { return -1; }
  if (startVerse1.chapter > startVerse2.chapter) { return 1; }
  if (startVerse1.verse < startVerse2.verse) { return -1; }
  if (startVerse1.verse > startVerse2.verse) { return 1; }
  return 0;
};

export const checkRangeOverlap = (range1: VerseRange, range2: VerseRange): boolean => {
  // Sort ranges according to Bible order
  const [firstRange, secondRange] = [range1, range2].sort(compareRanges);
  return firstRange.endVerseId >= secondRange.startVerseId;
};

export const countRangeVerses = (startVerseId: number, endVerseId: number): number => {
  const startVerse = parseVerseId(startVerseId);
  const endVerse = parseVerseId(endVerseId);

  // If we are counting the unread verses between segments that have been read,
  // those unread spans could jump between books
  if (startVerse.book !== endVerse.book) {
    let sum = 0;

    const tailStartVerseId = startVerseId;
    const lastChapter = getBookChapterCount(startVerse.book);
    const lastVerse = getChapterVerseCount(startVerse.book, lastChapter);
    const tailEndVerseId = makeVerseId(startVerse.book, lastChapter, lastVerse);
    const tailVerseCount = countRangeVerses(tailStartVerseId, tailEndVerseId);
    sum += tailVerseCount;

    for (let i = startVerse.book + 1, l = endVerse.book; i < l; i++) {
      const bookVerseCount = getBookVerseCount(i);
      sum += bookVerseCount;
    }

    const headStartVerseId = makeVerseId(endVerse.book, 1, 1);
    const headEndVerseId = endVerseId;
    const headVerseCount = countRangeVerses(headStartVerseId, headEndVerseId);
    sum += headVerseCount;

    return sum;
  }

  if (startVerse.chapter === endVerse.chapter) {
    return endVerse.verse - startVerse.verse + 1;
  }
  const { book } = startVerse;
  let verseCount = 0;
  for (let i = startVerse.chapter; i <= endVerse.chapter; i++) {
    const chapterVerses = getChapterVerseCount(book, i);
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

/**
 * Counts the total number of verses in an array of ranges,
 * never counting the same verse more than once.
 */
export const countUniqueRangeVerses = (ranges: ReadonlyArray<Readonly<VerseRange>>): number => {
  const sortedIndices = createSortedIndices(ranges, compareRanges);

  let totalVerses = 0;
  let lastRange: Readonly<VerseRange> | null = null;
  for (const index of sortedIndices) {
    const range = ranges[index];
    if (!lastRange) {
      lastRange = range;
    }
    else if (range.startVerseId <= lastRange.endVerseId) {
      if (range.endVerseId > lastRange.endVerseId) {
        lastRange = { ...lastRange, endVerseId: range.endVerseId };
      }
    }
    else {
      totalVerses += countRangeVerses(lastRange.startVerseId, lastRange.endVerseId);
      lastRange = range;
    }
  }
  if (lastRange) {
    totalVerses += countRangeVerses(lastRange.startVerseId, lastRange.endVerseId);
  }
  return totalVerses;
};

/**
 * Finds the number of unique verses that exist among `ranges` for the given `book`.
 */
export const countUniqueBookRangeVerses = (bookIndex: number, ranges: ReadonlyArray<Readonly<VerseRange>>): number => {
  ranges = filterRangesByBook(bookIndex, ranges);
  return countUniqueRangeVerses(ranges);
};

/**
 * Returns a new array comprised only of ranges in the given book.
 */
export const filterRangesByBook = (bookIndex: number, ranges: ReadonlyArray<Readonly<VerseRange>>): VerseRange[] => {
  return ranges.filter((r) => {
    const startVerse = parseVerseId(r.startVerseId);
    return startVerse.book === bookIndex;
  });
};

/**
 * Filters out all ranges that do not overlap the given book chapter,
 * returning the new resulting array.
 */
export const filterRangesByBookChapter = (bookIndex: number, chapterIndex: number, ranges: ReadonlyArray<Readonly<VerseRange>>): VerseRange[] => {
  return ranges.filter((r) => {
    const startVerse = parseVerseId(r.startVerseId);
    const endVerse = parseVerseId(r.endVerseId);
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
export const cropRangeToBookChapter = (bookIndex: number, chapterIndex: number, range: Readonly<VerseRange>): VerseRange => {
  const startVerse = parseVerseId(range.startVerseId);
  const endVerse = parseVerseId(range.endVerseId);
  if (startVerse.chapter < chapterIndex) {
    startVerse.chapter = chapterIndex;
    startVerse.verse = 1;
  }
  if (endVerse.chapter > chapterIndex) {
    endVerse.chapter = chapterIndex;
    endVerse.verse = getChapterVerseCount(bookIndex, chapterIndex);
  }
  const startVerseId = makeVerseId(startVerse.book, startVerse.chapter, startVerse.verse);
  const endVerseId = makeVerseId(endVerse.book, endVerse.chapter, endVerse.verse);
  return Object.assign({}, range, { startVerseId, endVerseId });
};

export const countUniqueBookChapterRangeVerses = (bookIndex: number, chapterIndex: number, ranges: ReadonlyArray<Readonly<VerseRange>>): number => {
  // Include only ranges that overlap into the given chapter of the given book
  const filteredRanges = filterRangesByBookChapter(bookIndex, chapterIndex, ranges);

  // Crop out all verses that are beyond the given chapter
  const croppedRanges = filteredRanges.map((range) => {
    return cropRangeToBookChapter(bookIndex, chapterIndex, range);
  });

  return countUniqueRangeVerses(croppedRanges);
};

/**
 * Merges any input `ranges` that overlap.
 *
 * This function works across books, but will not create ranges that span multiple books.
 */
export const consolidateRanges = (ranges: ReadonlyArray<Readonly<VerseRange>>): VerseRange[] => {
  const sortedIndices = createSortedIndices(ranges, compareRanges);
  const result: VerseRange[] = [];

  // Sort ranges into constituent books
  const allBookRanges: { [index: number]: VerseRange[] } = {};
  for (let i = 1, l = getBookCount(); i <= l; i++) {
    allBookRanges[i] = [];
  }
  for (const index of sortedIndices) {
    const range = ranges[index];
    const { book } = parseVerseId(range.startVerseId);
    allBookRanges[book].push({ ...range });
  }
  for (let bookIndex = 1, l = getBookCount(); bookIndex <= l; bookIndex++) {
    const bookRanges = allBookRanges[bookIndex];
    const consolidatedBookRanges: VerseRange[] = [];
    let holdingRange: VerseRange | null = null;
    for (const range of bookRanges) {
      if (!holdingRange) {
        holdingRange = range;
        continue;
      }
      const nextVerseId = getNextVerseId(holdingRange.endVerseId);
      if (!nextVerseId) { // If we reached the end of the book, there's nothing else to consolidate
        break;
      }
      if (range.startVerseId <= nextVerseId) {
        if (range.endVerseId > holdingRange.endVerseId) {
          holdingRange.endVerseId = range.endVerseId;
        }
      }
      else {
        consolidatedBookRanges.push(holdingRange);
        holdingRange = range;
      }
    }
    if (holdingRange) {
      consolidatedBookRanges.push(holdingRange);
    }
    result.push(...consolidatedBookRanges);
  }

  return result;
};

/**
 * Generates an array of ranges between `startVerseId` and `endVerseId`,
 * excluding the original verses.
 */
export const getRangesBetweenVerseIds = (startVerseId: VerseId, endVerseId: VerseId): VerseRange[] => {
  if (startVerseId > endVerseId) {
    throw new Error('startVerseId must be before endVerseId');
  }

  // If the verses are consecutive, there are no ranges between them
  if (getNextVerseId(startVerseId) === endVerseId) {
    return [];
  }

  // We want the output of this function to omit the original verses
  // and only include the verses that are between them
  startVerseId = getNextVerseId(startVerseId);
  endVerseId = getPreviousVerseId(endVerseId);

  const { book: startBook } = parseVerseId(startVerseId);
  const { book: endBook } = parseVerseId(endVerseId);

  // If verses are in the same book, return a single range
  // from `startVerseId` to `endVerseId`.
  if (startBook === endBook) {
    return [{
      startVerseId,
      endVerseId,
    }];
  }

  // When `startVerseId` and `endVerseId` are from separate books,
  // create a separate range for each book that is crossed.
  const ranges: VerseRange[] = [];

  // Create a range from `startVerseId` to the end of that book.
  ranges.push({
    startVerseId,
    endVerseId: getLastBookVerseId(startBook),
  });

  // For each book between (if any), create range covering book
  for (let bookIndex = startBook + 1; bookIndex < endBook; bookIndex++) {
    ranges.push({
      startVerseId: getFirstBookVerseId(bookIndex),
      endVerseId: getLastBookVerseId(bookIndex),
    });
  }

  // Create range from start of end book to endId
  ranges.push({
    startVerseId: getFirstBookVerseId(startBook),
    endVerseId,
  });

  return ranges;
};
