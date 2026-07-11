import { makeVerseId, type Segment, type VerseId, type VerseRange } from './core/encoding';
import {
  getBookChapterCount,
  getBookCount,
  getBookVerseCount,
  getChapterVerseCount,
  getTotalVerseCount,
} from './core/metadata';
import {
  consolidateRanges,
  cropRangeToBookChapter,
  filterRangesByBookChapter,
} from './core/ranges';
import { generateSegments } from './core/segments';
import { parseVerseId } from './core/encoding';

/**
 * Precomputed reading-progress snapshot for the whole Bible.
 *
 * The mobile `/bible`, `/bible/[book]` and `/checklist` screens each used to
 * derive their numbers by calling `Bible.countUnique*` / `Bible.generate*Segments`
 * once per book (66x) or per chapter (up to 150x) — every call re-filtering and
 * re-`consolidateRanges`-ing the entire log-entries array. `computeBibleProgress`
 * does a single consolidation and derives every per-book and per-chapter figure
 * from it, so a screen only needs to read ready-made data.
 *
 * It mirrors the efficient bucket-by-book walk in `generateBibleSegments`
 * (see `bible/segments.ts`). Output is intentionally locale-independent (no book
 * names) so a cached snapshot stays valid across language changes; callers resolve
 * names via `Bible.getBookName(bookIndex, locale)`.
 */

export type ChapterProgress = {
  chapterIndex: number;
  totalVerses: number;
  versesRead: number;
  percentage: number;
  complete: boolean;
  startVerseId: VerseId;
  endVerseId: VerseId;
  segments: Segment[];
};

export type BookProgress = {
  bookIndex: number;
  totalVerses: number;
  versesRead: number;
  percentage: number;
  complete: boolean;
  totalChapters: number;
  chaptersRead: number;
  segments: Segment[];
  chapters: ChapterProgress[];
};

export type BibleProgress = {
  totalVerses: number;
  versesRead: number;
  percentage: number;
  segments: Segment[];
  books: BookProgress[];
};

function calcPercent(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return Math.floor((numerator / denominator) * 100);
}

/** Sum the verse counts of the READ segments — equal to the unique read verses,
 * because `generateSegments` emits disjoint, consolidated read segments. */
function countReadVerses(segments: ReadonlyArray<Readonly<Segment>>): number {
  let total = 0;
  for (const segment of segments) {
    if (segment.read) total += segment.verseCount;
  }
  return total;
}

export const computeBibleProgress = (ranges: ReadonlyArray<Readonly<VerseRange>>): BibleProgress => {
  // One consolidation for the whole input; ranges never span books, and the
  // result is sorted in Bible order so we can walk it with a single pointer.
  const consolidatedRanges = consolidateRanges(ranges);

  const bookCount = getBookCount();
  const books: BookProgress[] = [];
  let rangeIndex = 0;

  for (let bookIndex = 1; bookIndex <= bookCount; bookIndex++) {
    const totalChapters = getBookChapterCount(bookIndex);
    const lastChapterVerseCount = getChapterVerseCount(bookIndex, totalChapters);
    const bookFirstVerseId = makeVerseId(bookIndex, 1, 1);
    const bookFinalVerseId = makeVerseId(bookIndex, totalChapters, lastChapterVerseCount);

    // Collect just this book's consolidated ranges by advancing the pointer.
    const bookRanges: VerseRange[] = [];
    while (
      rangeIndex < consolidatedRanges.length &&
      parseVerseId(consolidatedRanges[rangeIndex]!.startVerseId).book === bookIndex
    ) {
      bookRanges.push(consolidatedRanges[rangeIndex]!);
      rangeIndex++;
    }

    const bookSegments = generateSegments(bookFirstVerseId, bookFinalVerseId, bookRanges);
    const bookTotalVerses = getBookVerseCount(bookIndex);
    const bookVersesRead = countReadVerses(bookSegments);

    const chapters: ChapterProgress[] = [];
    let chaptersRead = 0;
    for (let chapterIndex = 1; chapterIndex <= totalChapters; chapterIndex++) {
      const chapterTotalVerses = getChapterVerseCount(bookIndex, chapterIndex);
      const startVerseId = makeVerseId(bookIndex, chapterIndex, 1);
      const endVerseId = makeVerseId(bookIndex, chapterIndex, chapterTotalVerses || 1);

      // Derive the chapter from the small per-book range set, not the full input.
      const chapterRanges = filterRangesByBookChapter(bookIndex, chapterIndex, bookRanges).map(
        (range) => cropRangeToBookChapter(bookIndex, chapterIndex, range),
      );
      const chapterSegments = generateSegments(startVerseId, endVerseId, chapterRanges);
      const chapterVersesRead = countReadVerses(chapterSegments);
      const complete = chapterTotalVerses > 0 && chapterVersesRead === chapterTotalVerses;
      if (complete) chaptersRead++;

      chapters.push({
        chapterIndex,
        totalVerses: chapterTotalVerses,
        versesRead: chapterVersesRead,
        percentage: calcPercent(chapterVersesRead, chapterTotalVerses),
        complete,
        startVerseId,
        endVerseId,
        segments: chapterSegments,
      });
    }

    books.push({
      bookIndex,
      totalVerses: bookTotalVerses,
      versesRead: bookVersesRead,
      percentage: calcPercent(bookVersesRead, bookTotalVerses),
      complete: bookTotalVerses > 0 && bookVersesRead === bookTotalVerses,
      totalChapters,
      chaptersRead,
      segments: bookSegments,
      chapters,
    });
  }

  const totalVerses = getTotalVerseCount();
  const versesRead = books.reduce((sum, book) => sum + book.versesRead, 0);
  const segments = books.flatMap((book) => book.segments);

  return {
    totalVerses,
    versesRead,
    percentage: calcPercent(versesRead, totalVerses),
    segments,
    books,
  };
};
