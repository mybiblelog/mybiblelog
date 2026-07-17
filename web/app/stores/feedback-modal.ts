import { defineStore } from 'pinia';
import { createModalStore } from '~/helpers/create-modal-store';

const modal = createModalStore<Record<string, never>>({});

// Exported on a separate line (not `export const`) so Nuxt's auto-import
// scanner doesn't misread the spread inside `actions` as a named export.
const useFeedbackModalStore = defineStore('feedback-modal', {
  state: modal.state,
  actions: {
    ...modal.actions,
  },
});

export { useFeedbackModalStore };
