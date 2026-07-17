import { describe, expect, it } from 'vitest';
import Bible from '../bible';
import {
  initLogEntryEditorModel,
  isLogEntryEditorValid,
  selectBook,
  selectEndChapter,
  selectEndVerse,
  selectStartChapter,
  selectStartVerse,
  setVerseRange,
  updateDate,
} from './editor-machine';

const GENESIS = 1;
const JOHN = 43;
const OBADIAH = 31; // single chapter

describe('initLogEntryEditorModel', () => {
  it('derives the book from a start verse id', () => {
    const model = initLogEntryEditorModel({ startVerseId: Bible.makeVerseId(JOHN, 3, 16) });
    expect(model.book).toBe(JOHN);
  });
});

describe('isLogEntryEditorValid', () => {
  it('requires both an end verse and a date', () => {
    expect(isLogEntryEditorValid(initLogEntryEditorModel())).toBe(false);
    expect(isLogEntryEditorValid(initLogEntryEditorModel({
      endVerseId: Bible.makeVerseId(JOHN, 3, 16),
      date: '2024-06-01',
    }))).toBe(true);
  });
});

describe('selectBook', () => {
  it('clears the previous verse selection', () => {
    const model = selectBook(initLogEntryEditorModel({
      startVerseId: Bible.makeVerseId(JOHN, 3, 16),
      endVerseId: Bible.makeVerseId(JOHN, 3, 18),
    }), GENESIS);
    expect(model.book).toBe(GENESIS);
    expect(model.startVerseId).toBeNull();
    expect(model.endVerseId).toBeNull();
  });

  it('auto-selects the whole chapter for single-chapter books', () => {
    const model = selectBook(initLogEntryEditorModel(), OBADIAH);
    expect(model.startVerseId).toBe(Bible.makeVerseId(OBADIAH, 1, 1));
    expect(model.endVerseId).toBe(Bible.makeVerseId(OBADIAH, 1, Bible.getChapterVerseCount(OBADIAH, 1)));
  });
});

describe('chapter and verse selection', () => {
  it('defaults a chosen start chapter to the whole chapter', () => {
    let model = selectBook(initLogEntryEditorModel(), JOHN);
    model = selectStartChapter(model, 3);
    expect(model.startVerseId).toBe(Bible.makeVerseId(JOHN, 3, 1));
    expect(model.endVerseId).toBe(Bible.makeVerseId(JOHN, 3, Bible.getChapterVerseCount(JOHN, 3)));
  });

  it('extends the end verse when the start verse passes it in the same chapter', () => {
    let model = selectBook(initLogEntryEditorModel(), JOHN);
    model = selectStartChapter(model, 3);
    model = selectEndVerse(model, 5); // end now verse 5
    model = selectStartVerse(model, 20); // start past end → end resets to chapter end
    expect(Bible.parseVerseId(model.endVerseId as number).verse)
      .toBe(Bible.getChapterVerseCount(JOHN, 3));
  });

  it('selects a multi-chapter range', () => {
    let model = selectBook(initLogEntryEditorModel(), GENESIS);
    model = selectStartChapter(model, 1);
    model = selectStartVerse(model, 1);
    model = selectEndChapter(model, 3);
    model = selectEndVerse(model, 5);
    expect(model.startVerseId).toBe(Bible.makeVerseId(GENESIS, 1, 1));
    expect(model.endVerseId).toBe(Bible.makeVerseId(GENESIS, 3, 5));
  });

  it('ignores selections before a book is chosen', () => {
    const model = initLogEntryEditorModel();
    expect(selectStartChapter(model, 3)).toBe(model);
    expect(selectStartVerse(model, 3)).toBe(model);
  });
});

describe('setVerseRange', () => {
  it('sets the range and derives the book from the start verse', () => {
    const model = setVerseRange(initLogEntryEditorModel({ date: '2024-06-01' }), {
      startVerseId: Bible.makeVerseId(JOHN, 3, 16),
      endVerseId: Bible.makeVerseId(JOHN, 4, 2),
    });
    expect(model.book).toBe(JOHN);
    expect(model.startVerseId).toBe(Bible.makeVerseId(JOHN, 3, 16));
    expect(model.endVerseId).toBe(Bible.makeVerseId(JOHN, 4, 2));
    expect(model.date).toBe('2024-06-01');
  });

  it('clears the passage when given null', () => {
    let model = initLogEntryEditorModel({ id: 7, date: '2024-06-01' });
    model = setVerseRange(model, {
      startVerseId: Bible.makeVerseId(GENESIS, 1, 1),
      endVerseId: Bible.makeVerseId(GENESIS, 1, 10),
    });
    model = setVerseRange(model, null);
    expect(model.book).toBeNull();
    expect(model.startVerseId).toBeNull();
    expect(model.endVerseId).toBeNull();
    expect(model.id).toBe(7);
    expect(model.date).toBe('2024-06-01');
  });
});

describe('updateDate', () => {
  it('sets a date and ignores empty input', () => {
    const model = initLogEntryEditorModel();
    expect(updateDate(model, '2024-06-01').date).toBe('2024-06-01');
    expect(updateDate(model, '')).toBe(model);
  });
});
