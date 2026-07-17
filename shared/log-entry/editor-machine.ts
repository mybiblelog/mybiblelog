import Bible from '../bible';
import type { VerseRange } from '../bible';

/**
 * Pure state machine for the log-entry editor form.
 *
 * This is the framework-agnostic core of the `log-entry-editor` Pinia store:
 * every selection transition is a pure `(model, input) => model` function, and
 * validity/dirtiness are derived. Side effects (saving, confirm dialogs) stay
 * in the state layer, so this maps cleanly onto a React `useReducer`, a Pinia
 * store, or a mobile equivalent.
 */

export type LogEntryEditorModel = {
  id: number | string | null;
  date: string | null;
  book: number | null;
  startVerseId: number | null;
  endVerseId: number | null;
};

export const emptyLogEntryEditorModel = (): LogEntryEditorModel => ({
  id: null,
  date: null,
  book: null,
  startVerseId: null,
  endVerseId: null,
});

const clone = (model: LogEntryEditorModel): LogEntryEditorModel => ({ ...model });

/** A model is valid once it has both an end verse and a date. */
export const isLogEntryEditorValid = (model: LogEntryEditorModel): boolean =>
  Boolean(model.endVerseId && model.date);

/**
 * Normalizes an open payload into a complete model, deriving `book` from the
 * start verse id when it is not supplied explicitly.
 */
export const initLogEntryEditorModel = (
  payload: Partial<LogEntryEditorModel> = {},
): LogEntryEditorModel => {
  const model: LogEntryEditorModel = { ...emptyLogEntryEditorModel(), ...payload };
  if (!model.book && model.startVerseId) {
    model.book = Bible.parseVerseId(model.startVerseId).book;
  }
  return model;
};

/** Selects a book, clearing any previous verse selection. Single-chapter books
 * auto-select their only chapter. */
export const selectBook = (model: LogEntryEditorModel, bookIndex: number): LogEntryEditorModel => {
  const updated = clone(model);
  updated.book = bookIndex;
  updated.startVerseId = null;
  updated.endVerseId = null;

  if (Bible.getBookChapterCount(bookIndex) === 1) {
    return selectStartChapter(updated, 1);
  }
  return updated;
};

/** Selects a start chapter, defaulting the range to that whole chapter. */
export const selectStartChapter = (
  model: LogEntryEditorModel,
  chapterIndex: number,
): LogEntryEditorModel => {
  const bookIndex = model.book;
  if (!bookIndex) {
    return model;
  }
  const updated = clone(model);
  updated.startVerseId = Bible.makeVerseId(bookIndex, chapterIndex, 1);
  const chapterVerseCount = Bible.getChapterVerseCount(bookIndex, chapterIndex);
  updated.endVerseId = Bible.makeVerseId(bookIndex, chapterIndex, chapterVerseCount);
  return updated;
};

export const selectStartVerse = (
  model: LogEntryEditorModel,
  verseIndex: number,
): LogEntryEditorModel => {
  const bookIndex = model.book;
  const startChapter = model.startVerseId ? Bible.parseVerseId(model.startVerseId).chapter : 0;
  if (!bookIndex || !startChapter) {
    return model;
  }

  const updated = clone(model);
  updated.startVerseId = Bible.makeVerseId(bookIndex, startChapter, verseIndex);

  if (!updated.endVerseId) {
    const chapterVerseCount = Bible.getChapterVerseCount(bookIndex, startChapter);
    updated.endVerseId = Bible.makeVerseId(bookIndex, startChapter, chapterVerseCount);
  }
  else {
    const end = Bible.parseVerseId(updated.endVerseId);
    if (end.chapter === startChapter && end.verse < verseIndex) {
      const chapterVerseCount = Bible.getChapterVerseCount(bookIndex, startChapter);
      updated.endVerseId = Bible.makeVerseId(bookIndex, startChapter, chapterVerseCount);
    }
  }

  return updated;
};

export const selectEndChapter = (
  model: LogEntryEditorModel,
  chapterIndex: number,
): LogEntryEditorModel => {
  const bookIndex = model.book;
  if (!bookIndex) {
    return model;
  }
  const updated = clone(model);
  const chapterVerseCount = Bible.getChapterVerseCount(bookIndex, chapterIndex);
  updated.endVerseId = Bible.makeVerseId(bookIndex, chapterIndex, chapterVerseCount);
  return updated;
};

export const selectEndVerse = (
  model: LogEntryEditorModel,
  verseIndex: number,
): LogEntryEditorModel => {
  const bookIndex = model.book;
  const endChapter = model.endVerseId ? Bible.parseVerseId(model.endVerseId).chapter : 0;
  if (!bookIndex || !endChapter) {
    return model;
  }
  const updated = clone(model);
  updated.endVerseId = Bible.makeVerseId(bookIndex, endChapter, verseIndex);
  return updated;
};

/**
 * Sets or clears the passage as a whole range, deriving `book` from the start
 * verse id. This is the transition for editors whose passage field is a single
 * range-valued input rather than a cascade of book/chapter/verse selections.
 */
export const setVerseRange = (
  model: LogEntryEditorModel,
  range: VerseRange | null,
): LogEntryEditorModel => {
  const updated = clone(model);
  if (!range) {
    updated.book = null;
    updated.startVerseId = null;
    updated.endVerseId = null;
    return updated;
  }
  updated.book = Bible.parseVerseId(range.startVerseId).book;
  updated.startVerseId = range.startVerseId;
  updated.endVerseId = range.endVerseId;
  return updated;
};

export const updateDate = (model: LogEntryEditorModel, date: string): LogEntryEditorModel => {
  if (!date) {
    return model;
  }
  return { ...model, date };
};
