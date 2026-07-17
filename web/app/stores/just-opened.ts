import { defineStore } from 'pinia';

export type JustOpenedState = {
  open: boolean;
  startVerseId: number | null;
  endVerseId: number | null;
};

export const useJustOpenedStore = defineStore('just-opened', {
  state: (): JustOpenedState => ({
    open: false,
    startVerseId: null,
    endVerseId: null,
  }),
  actions: {
    openPrompt(startVerseId: number, endVerseId: number): void {
      this.startVerseId = startVerseId;
      this.endVerseId = endVerseId;
      this.open = true;
    },

    dismiss(): void {
      this.$reset();
    },
  },
});
