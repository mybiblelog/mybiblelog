import { describe, expect, it } from 'vitest';
import Bible from '../bible';
import {
  buildPassageOptions,
  computePassageRange,
  emptyPassageSelection,
  passageSelectionFromRange,
  selectBook,
  selectChapters,
  selectEndChapter,
  selectEndVerse,
  selectStartVerse,
  singleSelectBook,
  singleSelectChapter,
  singleSelectVerse,
  singleSelectionFromVerseId,
} from './passage-selection';

const GENESIS = 1; // 50 chapters
const JOHN = 43;
const OBADIAH = 31; // single chapter, 21 verses

describe('multi-verse passage selection', () => {
  it('computes no range until a book is chosen', () => {
    expect(computePassageRange(emptyPassageSelection())).toBeNull();
  });

  it('selecting a book offers all its chapters as start chapters', () => {
    const { options, range } = selectBook(GENESIS);
    expect(options.startChapters).toHaveLength(Bible.getBookChapterCount(GENESIS));
    // Defaults to the whole book until chapters are picked.
    expect(range).toEqual({
      startVerseId: Bible.makeVerseId(GENESIS, 1, 1),
      endVerseId: Bible.makeVerseId(GENESIS, 50, Bible.getChapterVerseCount(GENESIS, 50)),
    });
  });

  it('auto-selects the only chapter of a single-chapter book', () => {
    const { state, range } = selectBook(OBADIAH);
    expect(state.startChapter).toBe(1);
    expect(state.endChapter).toBe(1);
    expect(range).toEqual({
      startVerseId: Bible.makeVerseId(OBADIAH, 1, 1),
      endVerseId: Bible.makeVerseId(OBADIAH, 1, 21),
    });
  });

  it('walks a book → chapters → verses selection to a precise range', () => {
    let { state } = selectBook(JOHN);
    ({ state } = selectChapters(state, { from: 3, to: 3 }));
    ({ state } = selectStartVerse(state, 16));
    const { range, options } = selectEndVerse(state, 18);
    expect(range).toEqual({
      startVerseId: Bible.makeVerseId(JOHN, 3, 16),
      endVerseId: Bible.makeVerseId(JOHN, 3, 18),
    });
    // End verses cannot precede the start verse within the same chapter.
    expect(options.endVerses[0]).toBe(16);
  });

  it('end chapters never precede the start chapter', () => {
    let { state } = selectBook(GENESIS);
    ({ state } = selectChapters(state, { from: 10, to: 10 }));
    const { options } = selectEndChapter(state, 12);
    expect(options.endChapters[0]).toBe(10);
  });

  it('rebuilds state from an existing range', () => {
    const range = {
      startVerseId: Bible.makeVerseId(JOHN, 3, 16),
      endVerseId: Bible.makeVerseId(JOHN, 4, 2),
    };
    const { state, range: recomputed } = passageSelectionFromRange(range);
    expect(state).toEqual({ book: JOHN, startChapter: 3, startVerse: 16, endChapter: 4, endVerse: 2 });
    expect(recomputed).toEqual(range);
  });

  it('buildPassageOptions is a pure function of state', () => {
    const state = { book: JOHN, startChapter: 3, startVerse: 16, endChapter: 3, endVerse: 0 };
    expect(buildPassageOptions(state)).toEqual(buildPassageOptions({ ...state }));
  });
});

describe('single-verse selection', () => {
  it('advances book → chapter → verse', () => {
    const afterBook = singleSelectBook(JOHN);
    expect(afterBook.step).toBe('chapter');
    const afterChapter = singleSelectChapter(afterBook.selection, 3);
    expect(afterChapter.step).toBe('verse');
    const afterVerse = singleSelectVerse(afterChapter.selection, 16);
    expect(afterVerse.step).toBe('done');
    expect(afterVerse.verseId).toBe(Bible.makeVerseId(JOHN, 3, 16));
  });

  it('auto-completes single-chapter, single-verse paths', () => {
    const afterBook = singleSelectBook(OBADIAH);
    // Obadiah has one chapter (auto-selected) but many verses → stop at verse.
    expect(afterBook.step).toBe('verse');
    expect(afterBook.selection.chapter).toBe(1);
  });

  it('rebuilds a single selection from a verse id', () => {
    expect(singleSelectionFromVerseId(Bible.makeVerseId(JOHN, 3, 16)))
      .toEqual({ book: JOHN, chapter: 3, verse: 16 });
  });
});
