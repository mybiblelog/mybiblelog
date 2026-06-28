import { defineStore } from 'pinia';
import { ApiError, UnknownApiError } from '@/helpers/api-error';
import mapFormErrors from '@/helpers/map-form-errors';
import { useDialogStore } from '~/stores/dialog';
import { usePassageNoteTagsStore } from '~/stores/passage-note-tags';

export type PassageNoteTagModel = {
  id: number | string | null;
  label: string;
  color: string;
  description: string;
  [key: string]: unknown;
};

export type PassageNoteTagEditorErrors = Record<string, unknown>;

export type PassageNoteTagEditorState = {
  open: boolean;
  cleanFormValue: string | null;
  passageNoteTag: PassageNoteTagModel;
  errors: PassageNoteTagEditorErrors;
  isValid: boolean;
  submitting: boolean;
};

export type PassageNoteTagEditorOpenPayload =
  | (Partial<PassageNoteTagModel> & { empty?: false })
  | ({ empty: true } & Partial<PassageNoteTagModel>)
  | null
  | undefined;

const newPassageNoteTag: PassageNoteTagModel = {
  id: null,
  label: '',
  color: '#000000',
  description: '',
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export const usePassageNoteTagEditorStore = defineStore('passage-note-tag-editor', {
  state: (): PassageNoteTagEditorState => ({
    open: false,
    cleanFormValue: null,
    passageNoteTag: clone(newPassageNoteTag),
    errors: {},
    isValid: false,
    submitting: false,
  }),
  actions: {
    openEditor(passageNoteTag: PassageNoteTagEditorOpenPayload = null): void {
      if (passageNoteTag && typeof passageNoteTag === 'object' && !('empty' in passageNoteTag)) {
        this.passageNoteTag = clone({ ...newPassageNoteTag, ...passageNoteTag });
      }
      else {
        this.passageNoteTag = clone(newPassageNoteTag);
      }

      this.cleanFormValue = JSON.stringify(this.passageNoteTag);
      this.errors = {};
      this.isValid = false;
      this.open = true;
    },

    async closeEditor(options: { force?: boolean; confirmMessage?: string } = {}): Promise<boolean> {
      const { force = false, confirmMessage } = options;
      if (!force && this.cleanFormValue) {
        const currentValue = JSON.stringify(this.passageNoteTag);
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

    updatePassageNoteTag(passageNoteTag: PassageNoteTagModel): void {
      this.passageNoteTag = clone(passageNoteTag);
    },

    setErrors(errors: PassageNoteTagEditorErrors): void {
      this.errors = errors || {};
    },

    setValid(isValid: boolean): void {
      this.isValid = Boolean(isValid);
    },

    async savePassageNoteTag(): Promise<unknown | null> {
      if (this.submitting) {
        return null;
      }
      this.submitting = true;
      try {
        const passageNoteTagsStore = usePassageNoteTagsStore();

        let savedPassageNoteTag: unknown;
        if (this.passageNoteTag.id) {
          savedPassageNoteTag = await passageNoteTagsStore.updatePassageNoteTag({
            id: this.passageNoteTag.id,
            label: this.passageNoteTag.label,
            color: this.passageNoteTag.color,
            description: this.passageNoteTag.description,
          });
        }
        else {
          savedPassageNoteTag = await passageNoteTagsStore.createPassageNoteTag({
            label: this.passageNoteTag.label,
            color: this.passageNoteTag.color,
            description: this.passageNoteTag.description,
          });
        }

        if (savedPassageNoteTag) {
          this.$reset();
          await passageNoteTagsStore.loadPassageNoteTags();
          return savedPassageNoteTag;
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
