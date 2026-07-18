import { defineStore } from 'pinia';
import { createEditorStore, clone } from '~/helpers/create-editor-store';
import type { EditorErrors } from '~/helpers/create-editor-store';
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
};

export type PassageNoteEditorErrors = EditorErrors;

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

const editor = createEditorStore<PassageNoteModel, PassageNoteListItem, PassageNoteEditorOpenPayload>({
  empty: () => clone(newPassageNote),
  build: (payload) => {
    if (payload && typeof payload === 'object' && !('empty' in payload)) {
      return clone({ ...newPassageNote, ...payload });
    }
    return clone(newPassageNote);
  },
  save: async (model) => {
    const passageNotesStore = usePassageNotesStore();
    return model.id
      ? await passageNotesStore.updatePassageNote({ ...model, id: model.id })
      : await passageNotesStore.createPassageNote(model);
  },
});

// Exported on a separate line (not `export const`) so Nuxt's auto-import
// scanner doesn't misread the spread inside `actions` as a named export.
const usePassageNoteEditorStore = defineStore('passage-note-editor', {
  state: editor.state,
  getters: {
    passageNote: (state): PassageNoteModel => state.model,
  },
  actions: {
    ...editor.actions,

    updatePassageNote(passageNote: PassageNoteModel): void {
      this.updateModel(passageNote);
    },

    savePassageNote(): Promise<PassageNoteListItem | null> {
      return this.save();
    },
  },
});

export { usePassageNoteEditorStore };
