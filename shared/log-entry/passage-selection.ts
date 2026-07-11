import Bible from '../bible';
import type { VerseRange } from '../bible';

/**
 * Framework-agnostic passage-selection state machines.
 *
 * The same book → chapter → verse cascade is needed by the multi-verse
 * `PassageSelector`, the single-verse picker inside `VerseInput`, and the
 * `log-entry-editor` store. This module owns that domain logic once so it can
 * be driven from a React `useReducer`, a Pinia store, or a plain component.
 *
 * Every transition is pure: it takes the current state plus an input and
 * returns the next state. Derived data (the option lists shown in each step
 * and the resulting verse range) is computed from state, never stored.
 */

// ---------------------------------------------------------------------------
// Multi-verse range selection
// ---------------------------------------------------------------------------

export type PassageSelectionState = {
  book: number;
  startChapter: number;
  startVerse: number;
  endChapter: number;
  endVerse: number;
};

export type PassageSelectionOptions = {
  startChapters: number[];
  startVerses: number[];
  endChapters: number[];
  endVerses: number[];
};

export const emptyPassageSelection = (): PassageSelectionState => ({
  book: 0,
  startChapter: 0,
  startVerse: 0,
  endChapter: 0,
  endVerse: 0,
});

const sequence = (from: number, to: number): number[] => {
  const out: number[] = [];
  for (let i = from; i <= to; i++) {
    out.push(i);
  }
  return out;
};

/**
 * Computes the verse range implied by the current selection, filling unset
 * fields with sensible defaults (whole book / whole chapters). Returns null
 * when no book has been chosen yet.
 */
export const computePassageRange = (state: PassageSelectionState): VerseRange | null => {
  if (!state.book) {
    return null;
  }
  const startChapter = state.startChapter || 1;
  const endChapter = state.endChapter || Bible.getBookChapterCount(state.book);
  const startVerse = state.startVerse || 1;
  const endVerse = state.endVerse || Bible.getChapterVerseCount(state.book, endChapter);
  return {
    startVerseId: Bible.makeVerseId(state.book, startChapter, startVerse),
    endVerseId: Bible.makeVerseId(state.book, endChapter, endVerse),
  };
};

/**
 * Derives the option lists for each selection step from the current state.
 * `endVerses` respects that, when the start and end chapters are the same, the
 * end verse may not precede the start verse.
 */
export const buildPassageOptions = (state: PassageSelectionState): PassageSelectionOptions => {
  const { book, startChapter, startVerse, endChapter } = state;

  const startChapters = book ? sequence(1, Bible.getBookChapterCount(book)) : [];
  const startVerses = book && startChapter
    ? sequence(1, Bible.getChapterVerseCount(book, startChapter))
    : [];
  const endChapters = book && startChapter
    ? sequence(startChapter, Bible.getBookChapterCount(book))
    : [];

  let endVerses: number[] = [];
  if (book && endChapter) {
    const count = Bible.getChapterVerseCount(book, endChapter);
    const initialVerse = startChapter === endChapter ? (startVerse || 1) : 1;
    endVerses = sequence(initialVerse, count);
  }

  return { startChapters, startVerses, endChapters, endVerses };
};

export type PassageSelectionResult = {
  state: PassageSelectionState;
  options: PassageSelectionOptions;
  range: VerseRange | null;
};

const result = (state: PassageSelectionState): PassageSelectionResult => ({
  state,
  options: buildPassageOptions(state),
  range: computePassageRange(state),
});

/**
 * Selects a book, resetting all downstream selections. Books with a single
 * chapter auto-select that chapter so the user can skip a redundant step.
 */
export const selectBook = (book: number): PassageSelectionResult => {
  const state: PassageSelectionState = { ...emptyPassageSelection(), book };
  if (Bible.getBookChapterCount(book) === 1) {
    return selectChapters(state, { from: 1, to: 1 });
  }
  return result(state);
};

export const selectChapters = (
  state: PassageSelectionState,
  { from, to }: { from: number; to: number },
): PassageSelectionResult =>
  result({ ...state, startChapter: from, endChapter: to, startVerse: 0, endVerse: 0 });

export const selectEndChapter = (
  state: PassageSelectionState,
  endChapter: number,
): PassageSelectionResult =>
  result({ ...state, endChapter, endVerse: 0 });

export const selectVerses = (
  state: PassageSelectionState,
  { from, to }: { from: number; to: number },
): PassageSelectionResult =>
  result({ ...state, startVerse: from, endVerse: to });

export const selectStartVerse = (
  state: PassageSelectionState,
  startVerse: number,
): PassageSelectionResult =>
  result({ ...state, startVerse });

export const selectEndVerse = (
  state: PassageSelectionState,
  endVerse: number,
): PassageSelectionResult =>
  result({ ...state, endVerse });

/**
 * Rebuilds selection state from an existing verse range, e.g. when opening an
 * editor pre-populated with a saved passage.
 */
export const passageSelectionFromRange = (range: VerseRange): PassageSelectionResult => {
  const start = Bible.parseVerseId(range.startVerseId);
  const end = Bible.parseVerseId(range.endVerseId);
  return result({
    book: start.book,
    startChapter: start.chapter,
    startVerse: start.verse,
    endChapter: end.chapter,
    endVerse: end.verse,
  });
};

// ---------------------------------------------------------------------------
// Single-verse selection
// ---------------------------------------------------------------------------

export type SingleVerseSelection = {
  book: number;
  chapter: number;
  verse: number;
};

/** Which step a single-verse picker should show next. */
export type SingleSelectionStep = 'book' | 'chapter' | 'verse' | 'done';

export type SingleSelectionResult = {
  selection: SingleVerseSelection;
  /** The next step to present; 'done' once a full verse is resolved. */
  step: SingleSelectionStep;
  /** The resolved verse id when `step === 'done'`, otherwise null. */
  verseId: number | null;
};

export const emptySingleVerseSelection = (): SingleVerseSelection => ({
  book: 0,
  chapter: 0,
  verse: 0,
});

const singleResult = (
  selection: SingleVerseSelection,
  step: SingleSelectionStep,
): SingleSelectionResult => ({
  selection,
  step,
  verseId: step === 'done'
    ? Bible.makeVerseId(selection.book, selection.chapter, selection.verse)
    : null,
});

/**
 * Selects a book in the single-verse picker. Auto-advances through chapters
 * and/or verses that have only one option.
 */
export const singleSelectBook = (book: number): SingleSelectionResult => {
  const selection: SingleVerseSelection = { book, chapter: 0, verse: 0 };
  if (Bible.getBookChapterCount(book) === 1) {
    return singleSelectChapter(selection, 1);
  }
  return singleResult(selection, 'chapter');
};

export const singleSelectChapter = (
  state: SingleVerseSelection,
  chapter: number,
): SingleSelectionResult => {
  const selection: SingleVerseSelection = { ...state, chapter, verse: 0 };
  if (Bible.getChapterVerseCount(selection.book, chapter) === 1) {
    return singleSelectVerse(selection, 1);
  }
  return singleResult(selection, 'verse');
};

export const singleSelectVerse = (
  state: SingleVerseSelection,
  verse: number,
): SingleSelectionResult =>
  singleResult({ ...state, verse }, 'done');

/** Builds a single-verse selection from an existing verse id. */
export const singleSelectionFromVerseId = (verseId: number): SingleVerseSelection => {
  const parsed = Bible.parseVerseId(verseId);
  return { book: parsed.book, chapter: parsed.chapter, verse: parsed.verse };
};
