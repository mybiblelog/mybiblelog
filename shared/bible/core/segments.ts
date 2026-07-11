import { makeVerseId, parseVerseId, type Segment, type VerseId, type VerseRange } from './encoding';
import { getBookChapterCount, getBookCount, getChapterVerseCount } from './metadata';
import { getNextVerseId, getPreviousVerseId } from './navigation';
import {
  consolidateRanges,
  countRangeVerses,
  cropRangeToBookChapter,
  filterRangesByBook,
  filterRangesByBookChapter,
  getRangesBetweenVerseIds,
} from './ranges';

/**
 * Generates an array of segments, each indicating a read/unread range of verses.
 *
 * Input `ranges` that do not fall within `firstVerseId` and `finalVerseId` will be filtered out.
 * Input `ranges` that overlap `firstVerseId` or `finalVerseId` will be cropped.
 */
export const generateSegments = (firstVerseId: VerseId, finalVerseId: VerseId, ranges: ReadonlyArray<Readonly<VerseRange>>): Segment[] => {
  if (firstVerseId > finalVerseId) {
    throw new Error('firstVerseId must be before finalVerseId');
  }

  const segments: Segment[] = [];

  // If there are no ranges, return one giant UNREAD segment
  if (!ranges.length) {
    return [{
      startVerseId: firstVerseId,
      endVerseId: finalVerseId,
      read: false,
      verseCount: countRangeVerses(firstVerseId, finalVerseId),
    }];
  }

  // Filter out ranges that do not overlap firstVerseId and finalVerseId
  ranges = ranges.filter((range) => {
    return range.endVerseId >= firstVerseId && range.startVerseId <= finalVerseId;
  });

  // Sort and consolidate ranges
  const consolidatedRanges = consolidateRanges(ranges);

  // Crop ranges to firstVerseId and finalVerseId
  for (const range of consolidatedRanges) {
    if (range.startVerseId < firstVerseId) {
      range.startVerseId = firstVerseId;
    }
    if (range.endVerseId > finalVerseId) {
      range.endVerseId = finalVerseId;
    }
  }

  let lastReadVerseId;
  for (let rangeIndex = 0, rangeCount = consolidatedRanges.length; rangeIndex < rangeCount; rangeIndex++) {
    const range = consolidatedRanges[rangeIndex]!;

    // Create initial UNREAD segment before first range if needed
    if (rangeIndex === 0) {
      const { startVerseId, endVerseId } = range; // eslint-disable-line
      if (firstVerseId !== startVerseId) {
        const unreadEndVerseId = getPreviousVerseId(startVerseId);
        segments.push({
          startVerseId: firstVerseId,
          endVerseId: unreadEndVerseId,
          read: false,
          verseCount: countRangeVerses(firstVerseId, unreadEndVerseId),
        });
      }
    }
    // If this is NOT the first range, and the next range doesn't start immediately,
    // create an UNREAD segment between the two ranges for each book that was crossed.
    else {
      if (!lastReadVerseId) {
        throw new Error('lastReadVerseId is undefined');
      }
      const unreadStartVerseId = getNextVerseId(lastReadVerseId, true);
      if (range.startVerseId !== unreadStartVerseId) {
        const unreadRanges = getRangesBetweenVerseIds(lastReadVerseId, range.startVerseId);
        const unreadSegments = unreadRanges.map((range) => ({
          startVerseId: range.startVerseId,
          endVerseId: range.endVerseId,
          read: false,
          verseCount: countRangeVerses(range.startVerseId, range.endVerseId),
        }));
        segments.push(...unreadSegments);
      }
    }
    // add the range as a READ segment
    const { startVerseId, endVerseId } = range;
    segments.push({
      startVerseId,
      endVerseId,
      read: true,
      verseCount: countRangeVerses(startVerseId, endVerseId),
    });
    lastReadVerseId = endVerseId;

    // Create trailing UNREAD segment if needed
    if (rangeIndex === rangeCount - 1) {
      if (range.endVerseId !== finalVerseId) {
        const startVerseId = getNextVerseId(lastReadVerseId);
        segments.push({
          startVerseId,
          endVerseId: finalVerseId,
          read: false,
          verseCount: countRangeVerses(startVerseId, finalVerseId),
        });
      }
    }
  }

  return segments;
};

/**
 * Given an array of `ranges` that have been read, generates an array of `segments`
 * representing all read and unread portions of the Bible.
 *
 * Each segment has: `startVerseId`, `endVerseId`, `read`, and `verseCount`.
 */
export const generateBibleSegments = (ranges: ReadonlyArray<Readonly<VerseRange>>): Segment[] => {
  const segments: Segment[] = [];
  const bookCount = getBookCount();
  const consolidatedRanges = consolidateRanges(ranges);
  let rangeIndex = 0;
  for (let bookIndex = 1; bookIndex <= bookCount; bookIndex++) {
    const lastChapterIndex = getBookChapterCount(bookIndex);
    const lastChapterVerseCount = getChapterVerseCount(bookIndex, lastChapterIndex);
    const firstVerseId = makeVerseId(bookIndex, 1, 1);
    const finalVerseId = makeVerseId(bookIndex, lastChapterIndex, lastChapterVerseCount);
    const bookRanges: VerseRange[] = [];
    while (rangeIndex < consolidatedRanges.length && parseVerseId(consolidatedRanges[rangeIndex]!.startVerseId).book === bookIndex) {
      bookRanges.push(consolidatedRanges[rangeIndex]!);
      rangeIndex++;
    }
    segments.push(...generateSegments(firstVerseId, finalVerseId, bookRanges));
  }
  return segments;
};

export const generateBookSegments = (bookIndex: number, ranges: ReadonlyArray<Readonly<VerseRange>>): Segment[] => {
  const lastChapterIndex = getBookChapterCount(bookIndex);
  const lastChapterVerseCount = getChapterVerseCount(bookIndex, lastChapterIndex);

  const firstVerseId = makeVerseId(bookIndex, 1, 1);
  const finalVerseId = makeVerseId(bookIndex, lastChapterIndex, lastChapterVerseCount);

  const filteredRanges = filterRangesByBook(bookIndex, ranges);

  return generateSegments(firstVerseId, finalVerseId, filteredRanges);
};

export const generateBookChapterSegments = (bookIndex: number, chapterIndex: number, ranges: ReadonlyArray<Readonly<VerseRange>>): Segment[] => {
  const chapterVerseCount = getChapterVerseCount(bookIndex, chapterIndex);

  const firstVerseId = makeVerseId(bookIndex, chapterIndex, 1);
  const finalVerseId = makeVerseId(bookIndex, chapterIndex, chapterVerseCount);

  const filteredRanges = filterRangesByBookChapter(bookIndex, chapterIndex, ranges);
  const croppedRanges = filteredRanges.map((range) => {
    return cropRangeToBookChapter(bookIndex, chapterIndex, range);
  });

  return generateSegments(firstVerseId, finalVerseId, croppedRanges);
};
