import { expect, test } from 'vitest';
import Bible from './index';
import { computeBibleProgress } from './progress';
import type { VerseRange } from './core/encoding';

const range = (
  startBook: number,
  startChapter: number,
  startVerse: number,
  endBook: number,
  endChapter: number,
  endVerse: number,
): VerseRange => ({
  startVerseId: Bible.makeVerseId(startBook, startChapter, startVerse),
  endVerseId: Bible.makeVerseId(endBook, endChapter, endVerse),
});

/**
 * Asserts that `computeBibleProgress` produces, for every book and chapter, the
 * same figures the screens previously derived from the per-book/per-chapter
 * `Bible.*` helpers. This proves the single-consolidation refactor is equivalent.
 */
function expectMatchesLegacy(ranges: VerseRange[]) {
  const progress = computeBibleProgress(ranges);

  // Bible-level totals.
  expect(progress.totalVerses).toBe(Bible.getTotalVerseCount());
  expect(progress.versesRead).toBe(Bible.countUniqueRangeVerses(ranges));
  expect(progress.segments).toEqual(Bible.generateBibleSegments(ranges));

  expect(progress.books).toHaveLength(Bible.getBookCount());

  for (const book of progress.books) {
    const { bookIndex } = book;
    expect(book.totalVerses).toBe(Bible.getBookVerseCount(bookIndex));
    expect(book.versesRead).toBe(Bible.countUniqueBookRangeVerses(bookIndex, ranges));
    expect(book.totalChapters).toBe(Bible.getBookChapterCount(bookIndex));
    expect(book.segments).toEqual(Bible.generateBookSegments(bookIndex, ranges));

    let expectedChaptersRead = 0;
    expect(book.chapters).toHaveLength(book.totalChapters);
    for (const chapter of book.chapters) {
      const { chapterIndex } = chapter;
      const total = Bible.getChapterVerseCount(bookIndex, chapterIndex);
      const read = Bible.countUniqueBookChapterRangeVerses(bookIndex, chapterIndex, ranges);
      expect(chapter.totalVerses).toBe(total);
      expect(chapter.versesRead).toBe(read);
      expect(chapter.complete).toBe(total > 0 && read === total);
      expect(chapter.segments).toEqual(
        Bible.generateBookChapterSegments(bookIndex, chapterIndex, ranges),
      );
      expect(chapter.startVerseId).toBe(Bible.makeVerseId(bookIndex, chapterIndex, 1));
      expect(chapter.endVerseId).toBe(Bible.makeVerseId(bookIndex, chapterIndex, total || 1));
      if (chapter.complete) expectedChaptersRead++;
    }
    expect(book.chaptersRead).toBe(expectedChaptersRead);
  }
}

test('matches legacy helpers for an empty reading history', () => {
  expectMatchesLegacy([]);
});

test('matches legacy helpers for a partially-read chapter', () => {
  // Genesis 1:1–1:10 only.
  expectMatchesLegacy([range(1, 1, 1, 1, 1, 10)]);
});

test('matches legacy helpers for several single-book multi-chapter spans', () => {
  // Log entries are always within one book (see `validateRange`), so fixtures
  // use single-book ranges across several books and partial chapters.
  expectMatchesLegacy([
    range(1, 1, 1, 1, 3, 24), // Genesis 1–3 (Gen 3 has 24 verses)
    range(19, 1, 1, 19, 1, 6), // Psalm 1 complete (6 verses)
    range(40, 5, 1, 40, 7, 12), // Matthew 5–7 (partial chapter 7)
    range(43, 3, 16, 43, 3, 16), // John 3:16 (single verse)
  ]);
});

test('marks a fully-read book complete', () => {
  // Read the entirety of Jude (book 65, 1 chapter, 25 verses).
  const lastChapter = Bible.getBookChapterCount(65);
  const lastVerse = Bible.getChapterVerseCount(65, lastChapter);
  const progress = computeBibleProgress([range(65, 1, 1, 65, lastChapter, lastVerse)]);
  const jude = progress.books.find((b) => b.bookIndex === 65)!;
  expect(jude.complete).toBe(true);
  expect(jude.percentage).toBe(100);
  expect(jude.chaptersRead).toBe(jude.totalChapters);
  expect(jude.chapters.every((c) => c.complete)).toBe(true);
});

test('reports 100% when the whole Bible is read', () => {
  // One full-book range per book (entries never span books).
  const ranges: VerseRange[] = [];
  for (let bookIndex = 1; bookIndex <= Bible.getBookCount(); bookIndex++) {
    const lastChapter = Bible.getBookChapterCount(bookIndex);
    const lastVerse = Bible.getChapterVerseCount(bookIndex, lastChapter);
    ranges.push(range(bookIndex, 1, 1, bookIndex, lastChapter, lastVerse));
  }
  const progress = computeBibleProgress(ranges);
  expect(progress.percentage).toBe(100);
  expect(progress.versesRead).toBe(progress.totalVerses);
  expect(progress.books.every((b) => b.complete)).toBe(true);
});
