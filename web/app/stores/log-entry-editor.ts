import dayjs from 'dayjs';
import { defineStore } from 'pinia';
import { LogEntryEditorMachine, type LogEntryEditorModel } from '@mybiblelog/shared';
import { createEditorStore } from '~/helpers/create-editor-store';
import type { EditorErrors } from '~/helpers/create-editor-store';
import { useLogEntriesStore } from '~/stores/log-entries';
import type { LogEntry } from '~/stores/log-entries';

export type { LogEntryEditorModel };

export type LogEntryEditorOpenPayload =
  | (Partial<LogEntryEditorModel> & { empty?: false })
  | ({ empty: true; date?: string | null } & Partial<LogEntryEditorModel>)
  | null
  | undefined;

export type LogEntryEditorErrors = EditorErrors;

function isEmptyOpenPayload(payload: LogEntryEditorOpenPayload): payload is { empty: true; date?: string | null } {
  return Boolean(
    payload &&
      typeof payload === 'object' &&
      'empty' in payload &&
      (payload as { empty?: unknown }).empty === true,
  );
}

const editor = createEditorStore<LogEntryEditorModel, LogEntry, LogEntryEditorOpenPayload>({
  empty: () => LogEntryEditorMachine.emptyLogEntryEditorModel(),
  build: (payload) => {
    if (payload && !isEmptyOpenPayload(payload)) {
      return LogEntryEditorMachine.initLogEntryEditorModel(payload);
    }

    const model = LogEntryEditorMachine.emptyLogEntryEditorModel();
    model.date = isEmptyOpenPayload(payload) && payload.date
      ? String(payload.date)
      : dayjs().format('YYYY-MM-DD');
    return model;
  },
  validate: model => LogEntryEditorMachine.isLogEntryEditorValid(model),
  save: (model) => {
    const logEntriesStore = useLogEntriesStore();
    if (model.id) {
      return logEntriesStore.updateLogEntry({
        id: model.id,
        date: String(model.date),
        startVerseId: Number(model.startVerseId),
        endVerseId: Number(model.endVerseId),
      });
    }
    return logEntriesStore.createLogEntry({
      date: String(model.date),
      startVerseId: Number(model.startVerseId),
      endVerseId: Number(model.endVerseId),
    });
  },
});

// Exported on a separate line (not `export const`) so Nuxt's auto-import
// scanner doesn't misread the spread inside `actions` as a named export.
const useLogEntryEditorStore = defineStore('log-entry-editor', {
  state: editor.state,
  getters: {
    logEntry: (state): LogEntryEditorModel => state.model,
  },
  actions: {
    ...editor.actions,

    updateLogEntry(logEntry: LogEntryEditorModel): void {
      this.updateModel(logEntry);
    },

    saveLogEntry(): Promise<LogEntry | null> {
      return this.save();
    },

    selectBook(bookIndex: number): void {
      this.updateModel(LogEntryEditorMachine.selectBook(this.model, bookIndex));
    },

    selectStartChapter(chapterIndex: number): void {
      this.updateModel(LogEntryEditorMachine.selectStartChapter(this.model, chapterIndex));
    },

    selectStartVerse(verseIndex: number): void {
      this.updateModel(LogEntryEditorMachine.selectStartVerse(this.model, verseIndex));
    },

    selectEndChapter(chapterIndex: number): void {
      this.updateModel(LogEntryEditorMachine.selectEndChapter(this.model, chapterIndex));
    },

    selectEndVerse(verseIndex: number): void {
      this.updateModel(LogEntryEditorMachine.selectEndVerse(this.model, verseIndex));
    },

    updateDate(date: string): void {
      this.updateModel(LogEntryEditorMachine.updateDate(this.model, date));
    },
  },
});

export { useLogEntryEditorStore };
