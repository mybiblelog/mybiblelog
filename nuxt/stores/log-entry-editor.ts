import dayjs from 'dayjs';
import { defineStore } from 'pinia';
import { Bible } from '@mybiblelog/shared';
import mapFormErrors from '~/helpers/map-form-errors';
import { useDialogStore } from '~/stores/dialog';
import { ApiError } from '~/helpers/api-error';
import { useLogEntriesStore } from '~/stores/log-entries';

export type LogEntryEditorModel = {
  id: number | string | null;
  date: string | null;
  book: number | null;
  startVerseId: number | null;
  endVerseId: number | null;
};

export type LogEntryEditorOpenPayload =
  | (Partial<LogEntryEditorModel> & { empty?: false })
  | ({ empty: true; date?: string | null } & Partial<LogEntryEditorModel>)
  | null
  | undefined;

export type LogEntryEditorErrors = Record<string, unknown>;

export type LogEntryEditorState = {
  open: boolean;
  cleanFormValue: string | null;
  logEntry: LogEntryEditorModel;
  errors: LogEntryEditorErrors;
  isValid: boolean;
};

const newLogEntry: LogEntryEditorModel = {
  id: null,
  date: null,
  book: null,
  startVerseId: null,
  endVerseId: null,
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isEmptyOpenPayload(payload: LogEntryEditorOpenPayload): payload is { empty: true; date?: string | null } {
  return Boolean(
    payload &&
      typeof payload === 'object' &&
      'empty' in payload &&
      (payload as { empty?: unknown }).empty === true,
  );
}

export const useLogEntryEditorStore = defineStore('log-entry-editor', {
  state: (): LogEntryEditorState => ({
    open: false,
    cleanFormValue: null,
    logEntry: clone(newLogEntry),
    errors: {},
    isValid: false,
  }),
  actions: {
    openEditor(payload: LogEntryEditorOpenPayload = null): void {
      if (payload && !isEmptyOpenPayload(payload)) {
        this.logEntry = clone({ ...newLogEntry, ...payload });

        if (!this.logEntry.book && this.logEntry.startVerseId) {
          const start = Bible.parseVerseId(this.logEntry.startVerseId);
          this.logEntry.book = start.book;
        }
      }
      else {
        this.logEntry = clone(newLogEntry);
        if (isEmptyOpenPayload(payload) && payload.date) {
          this.logEntry.date = String(payload.date);
        }
        else {
          this.logEntry.date = dayjs().format('YYYY-MM-DD');
        }
      }

      this.cleanFormValue = JSON.stringify(this.logEntry);
      this.errors = {};
      this.isValid = Boolean(this.logEntry.endVerseId && this.logEntry.date);
      this.open = true;
    },

    async closeEditor(options: { force?: boolean; confirmMessage?: string } = {}): Promise<boolean> {
      const { force = false, confirmMessage } = options;
      if (!force && this.cleanFormValue) {
        const currentValue = JSON.stringify(this.logEntry);
        const isDirty = currentValue !== this.cleanFormValue;
        if (isDirty) {
          const message = confirmMessage || 'Are you sure you want to close without saving?';
          const confirmed = await useDialogStore().confirm({ message });
          if (!confirmed) {
            return false;
          }
        }
      }

      this.$reset();
      return true;
    },

    updateLogEntry(logEntry: LogEntryEditorModel): void {
      this.logEntry = clone(logEntry);
      this.isValid = Boolean(this.logEntry.endVerseId && this.logEntry.date);
    },

    setErrors(errors: LogEntryEditorErrors): void {
      this.errors = errors || {};
    },

    setValid(isValid: boolean): void {
      this.isValid = Boolean(isValid);
    },

    selectBook(bookIndex: number): void {
      const updated = clone(this.logEntry);
      updated.book = bookIndex;
      updated.startVerseId = null;
      updated.endVerseId = null;
      this.updateLogEntry(updated);

      const chapterCount = Bible.getBookChapterCount(bookIndex);
      if (chapterCount === 1) {
        this.selectStartChapter(1);
      }
    },

    selectStartChapter(chapterIndex: number): void {
      const bookIndex = this.logEntry.book;
      if (!bookIndex || bookIndex === 0) { return; }

      const updated = clone(this.logEntry);
      updated.startVerseId = Bible.makeVerseId(bookIndex, chapterIndex, 1);
      this.updateLogEntry(updated);

      const chapterVerseCount = Bible.getChapterVerseCount(bookIndex, chapterIndex);
      const finalLogEntry = clone(updated);
      finalLogEntry.endVerseId = Bible.makeVerseId(bookIndex, chapterIndex, chapterVerseCount);
      this.updateLogEntry(finalLogEntry);
    },

    selectStartVerse(verseIndex: number): void {
      const bookIndex = this.logEntry.book;
      const startChapter = this.logEntry.startVerseId
        ? Bible.parseVerseId(this.logEntry.startVerseId).chapter
        : 0;

      if (!bookIndex || bookIndex === 0 || !startChapter || startChapter === 0) { return; }

      const updated = clone(this.logEntry);
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

      this.updateLogEntry(updated);
    },

    selectEndChapter(chapterIndex: number): void {
      const bookIndex = this.logEntry.book;
      if (!bookIndex || bookIndex === 0) { return; }

      const chapterVerseCount = Bible.getChapterVerseCount(bookIndex, chapterIndex);
      const updated = clone(this.logEntry);
      updated.endVerseId = Bible.makeVerseId(bookIndex, chapterIndex, chapterVerseCount);
      this.updateLogEntry(updated);
    },

    selectEndVerse(verseIndex: number): void {
      const bookIndex = this.logEntry.book;
      const endChapter = this.logEntry.endVerseId
        ? Bible.parseVerseId(this.logEntry.endVerseId).chapter
        : 0;

      if (!bookIndex || bookIndex === 0 || !endChapter || endChapter === 0) { return; }

      const updated = clone(this.logEntry);
      updated.endVerseId = Bible.makeVerseId(bookIndex, endChapter, verseIndex);
      this.updateLogEntry(updated);
    },

    updateDate(date: string): void {
      if (!date) { return; }
      const updated = clone(this.logEntry);
      updated.date = date;
      this.updateLogEntry(updated);
    },

    async saveLogEntry(): Promise<unknown | null> {
      try {
        let savedLogEntry: unknown;
        if (this.logEntry.id) {
          savedLogEntry = await useLogEntriesStore().updateLogEntry({
            id: this.logEntry.id,
            date: String(this.logEntry.date),
            startVerseId: Number(this.logEntry.startVerseId),
            endVerseId: Number(this.logEntry.endVerseId),
          });
        }
        else {
          savedLogEntry = await useLogEntriesStore().createLogEntry({
            date: String(this.logEntry.date),
            startVerseId: Number(this.logEntry.startVerseId),
            endVerseId: Number(this.logEntry.endVerseId),
          });
        }

        if (savedLogEntry) {
          this.$reset();
          return savedLogEntry;
        }

        return null;
      }
      catch (err: unknown) {
        const unknownError = { _form: 'An unknown error occurred' };
        if (err instanceof ApiError) {
          this.errors = mapFormErrors(err) || unknownError;
        }
        else {
          this.errors = unknownError;
        }
        throw err;
      }
    },
  },
});
