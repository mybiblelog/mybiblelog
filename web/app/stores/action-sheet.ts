import { defineStore } from 'pinia';
import { createModalStore } from '~/helpers/create-modal-store';

export type ActionSheetItem = {
  label: string;
  callback?: () => void;
};

export type ActionSheetPayload = {
  title: string | null;
  actions: ActionSheetItem[];
};

const modal = createModalStore<ActionSheetPayload>({ title: null, actions: [] });

// Exported on a separate line (not `export const`) so Nuxt's auto-import
// scanner doesn't misread the spread inside `actions` as a named export.
const useActionSheetStore = defineStore('action-sheet', {
  state: modal.state,
  actions: {
    ...modal.actions,

    openSheet(payload: { title?: string | null; actions?: ActionSheetItem[] }): void {
      this.openModal({
        title: payload?.title || null,
        actions: Array.isArray(payload?.actions) ? payload.actions : [],
      });
    },

    closeSheet(): void {
      this.closeModal();
    },
  },
});

export { useActionSheetStore };
