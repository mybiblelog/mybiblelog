import { defineStore } from 'pinia';
import { ApiError, UnknownApiError } from '~/helpers/api-error';
import type { ApiErrorDetail } from '~/helpers/api-error';
import mapFormErrors from '~/helpers/map-form-errors';
import { useDialogStore } from '~/stores/dialog';
import { usePassageNotesStore } from '~/stores/passage-notes';
import type { PassageNoteListItem } from '~/stores/passage-notes';

export type PassageRange = {
  startVerseId: number;
  endVerseId: number;
};

export type PassageNoteModel = {
  id: number | string | null;
  passages: Array<PassageRange | { empty: true }>;
  content: string;
  tags: Array<number | string>;
  [key: string]: unknown;
};

export type PassageNoteEditorErrors = Record<string, ApiErrorDetail>;

export type PassageNoteEditorState = {
  open: boolean;
  cleanFormValue: string | null;
  passageNote: PassageNoteModel;
  errors: PassageNoteEditorErrors;
  isValid: boolean;
  submitting: boolean;
};

export type PassageNoteEditorOpenPayload =
  | (Partial<PassageNoteModel> & { empty?: false })
  | ({ empty: true } & Partial<PassageNoteModel>)
  | null
  | undefined;

const newPassageNote: PassageNoteModel = {
  id: null,
  passages: [],
  content: '',
  tags: [],
};

export const usePassageNoteEditorStore = defineStore('passage-note-editor', {
  state: (): PassageNoteEditorState => ({
    open: false,
    cleanFormValue: null,
    passageNote: structuredClone(newPassageNote),
    errors: {},
    isValid: false,
    submitting: false,
  }),
  actions: {
    openEditor(passageNote: PassageNoteEditorOpenPayload = null): void {
      if (passageNote && typeof passageNote === 'object' && !('empty' in passageNote)) {
        this.passageNote = structuredClone({ ...newPassageNote, ...passageNote });
      }
      else {
        this.passageNote = structuredClone(newPassageNote);
      }
      this.cleanFormValue = JSON.stringify(this.passageNote);
      this.errors = {};
      this.isValid = false;
      this.open = true;
    },

    async closeEditor(options: { force?: boolean; confirmMessage?: string } = {}): Promise<boolean> {
      const { force = false, confirmMessage } = options;
      if (!force && this.cleanFormValue) {
        const currentValue = JSON.stringify(this.passageNote);
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

    updatePassageNote(passageNote: PassageNoteModel): void {
      this.passageNote = structuredClone(passageNote);
    },

    setErrors(errors: PassageNoteEditorErrors): void {
      this.errors = errors || {};
    },

    setValid(isValid: boolean): void {
      this.isValid = Boolean(isValid);
    },

    async savePassageNote(): Promise<PassageNoteListItem | null> {
      if (this.submitting) {
        return null;
      }
      this.submitting = true;
      try {
        const passageNotesStore = usePassageNotesStore();

        let savedPassageNote: PassageNoteListItem | null;
        if (this.passageNote.id) {
          savedPassageNote = await passageNotesStore.updatePassageNote({ ...this.passageNote, id: this.passageNote.id });
        }
        else {
          savedPassageNote = await passageNotesStore.createPassageNote(this.passageNote);
        }

        if (savedPassageNote) {
          this.$reset();
          if (passageNotesStore.hasLoadedOnce) {
            await passageNotesStore.loadPassageNotesPage();
          }
          return savedPassageNote;
        }

        return null;
      }
      catch (err: unknown) {
        if (err instanceof ApiError) {
          this.errors = mapFormErrors(err) || {};
        }
        else {
          this.errors = mapFormErrors(new UnknownApiError()) || {};
        }
        return null;
      }
      finally {
        this.submitting = false;
      }
    },
  },
});
