import { defineStore } from 'pinia';
import { createEditorStore, clone } from '~/helpers/create-editor-store';
import type { EditorErrors } from '~/helpers/create-editor-store';
import { usePassageNoteTagsStore } from '~/stores/passage-note-tags';
import type { PassageNoteTag } from '~/stores/passage-note-tags';

export type PassageNoteTagModel = {
  id: number | string | null;
  label: string;
  color: string;
  description: string;
  [key: string]: unknown;
};

export type PassageNoteTagEditorErrors = EditorErrors;

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

const editor = createEditorStore<PassageNoteTagModel, PassageNoteTag, PassageNoteTagEditorOpenPayload>({
  empty: () => clone(newPassageNoteTag),
  build: (payload) => {
    if (payload && typeof payload === 'object' && !('empty' in payload)) {
      return clone({ ...newPassageNoteTag, ...payload });
    }
    return clone(newPassageNoteTag);
  },
  save: async (model) => {
    const passageNoteTagsStore = usePassageNoteTagsStore();
    let saved: PassageNoteTag | null;
    if (model.id) {
      saved = await passageNoteTagsStore.updatePassageNoteTag({
        id: model.id,
        label: model.label,
        color: model.color,
        description: model.description,
      });
    }
    else {
      saved = await passageNoteTagsStore.createPassageNoteTag({
        label: model.label,
        color: model.color,
        description: model.description,
      });
    }

    if (saved) {
      await passageNoteTagsStore.loadPassageNoteTags({ force: true });
    }
    return saved;
  },
});

// Exported on a separate line (not `export const`) so Nuxt's auto-import
// scanner doesn't misread the spread inside `actions` as a named export.
const usePassageNoteTagEditorStore = defineStore('passage-note-tag-editor', {
  state: editor.state,
  getters: {
    passageNoteTag: (state): PassageNoteTagModel => state.model,
  },
  actions: {
    ...editor.actions,

    updatePassageNoteTag(passageNoteTag: PassageNoteTagModel): void {
      this.updateModel(passageNoteTag);
    },

    savePassageNoteTag(): Promise<PassageNoteTag | null> {
      return this.save();
    },
  },
});

export { usePassageNoteTagEditorStore };
