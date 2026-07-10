import dayjs from 'dayjs';
import { defineStore } from 'pinia';
import { LogEntryEditorMachine, type LogEntryEditorModel } from '@mybiblelog/shared';
import mapFormErrors from '~/helpers/map-form-errors';
import { useDialogStore } from '~/stores/dialog';
import { ApiError } from '~/helpers/api-error';
import type { ApiErrorDetail } from '~/helpers/api-error';
import { useLogEntriesStore } from '~/stores/log-entries';
import type { LogEntry } from '~/stores/log-entries';

export type { LogEntryEditorModel };

export type LogEntryEditorOpenPayload =
  | (Partial<LogEntryEditorModel> & { empty?: false })
  | ({ empty: true; date?: string | null } & Partial<LogEntryEditorModel>)
  | null
  | undefined;

export type LogEntryEditorErrors = Record<string, ApiErrorDetail>;

export type LogEntryEditorState = {
  open: boolean;
  cleanFormValue: string | null;
  logEntry: LogEntryEditorModel;
  errors: LogEntryEditorErrors;
  isValid: boolean;
  submitting: boolean;
};

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
    logEntry: LogEntryEditorMachine.emptyLogEntryEditorModel(),
    errors: {},
    isValid: false,
    submitting: false,
  }),
  actions: {
    openEditor(payload: LogEntryEditorOpenPayload = null): void {
      if (payload && !isEmptyOpenPayload(payload)) {
        this.logEntry = LogEntryEditorMachine.initLogEntryEditorModel(payload);
      }
      else {
        this.logEntry = LogEntryEditorMachine.emptyLogEntryEditorModel();
        if (isEmptyOpenPayload(payload) && payload.date) {
          this.logEntry.date = String(payload.date);
        }
        else {
          this.logEntry.date = dayjs().format('YYYY-MM-DD');
        }
      }

      this.cleanFormValue = JSON.stringify(this.logEntry);
      this.errors = {};
      this.isValid = LogEntryEditorMachine.isLogEntryEditorValid(this.logEntry);
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
      this.logEntry = { ...logEntry };
      this.isValid = LogEntryEditorMachine.isLogEntryEditorValid(this.logEntry);
    },

    setErrors(errors: LogEntryEditorErrors): void {
      this.errors = errors || {};
    },

    setValid(isValid: boolean): void {
      this.isValid = Boolean(isValid);
    },

    selectBook(bookIndex: number): void {
      this.updateLogEntry(LogEntryEditorMachine.selectBook(this.logEntry, bookIndex));
    },

    selectStartChapter(chapterIndex: number): void {
      this.updateLogEntry(LogEntryEditorMachine.selectStartChapter(this.logEntry, chapterIndex));
    },

    selectStartVerse(verseIndex: number): void {
      this.updateLogEntry(LogEntryEditorMachine.selectStartVerse(this.logEntry, verseIndex));
    },

    selectEndChapter(chapterIndex: number): void {
      this.updateLogEntry(LogEntryEditorMachine.selectEndChapter(this.logEntry, chapterIndex));
    },

    selectEndVerse(verseIndex: number): void {
      this.updateLogEntry(LogEntryEditorMachine.selectEndVerse(this.logEntry, verseIndex));
    },

    updateDate(date: string): void {
      this.updateLogEntry(LogEntryEditorMachine.updateDate(this.logEntry, date));
    },

    async saveLogEntry(): Promise<LogEntry | null> {
      if (this.submitting) {
        return null;
      }
      this.submitting = true;
      try {
        let savedLogEntry: LogEntry;
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
        const unknownError: LogEntryEditorErrors = { _form: { field: null, code: 'unknown_error' } };
        if (err instanceof ApiError) {
          this.errors = mapFormErrors(err) || unknownError;
        }
        else {
          this.errors = unknownError;
        }
        throw err;
      }
      finally {
        this.submitting = false;
      }
    },
  },
});
