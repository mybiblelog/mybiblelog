import { defineStore } from 'pinia';

export const useFeedbackModalStore = defineStore('feedback-modal', {
  state: () => ({
    open: false,
  }),
  actions: {
    openModal() { this.open = true; },
    closeModal() { this.open = false; },
  },
});
