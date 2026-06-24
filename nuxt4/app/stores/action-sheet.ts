import { defineStore } from 'pinia';

export type ActionSheetItem = {
  label: string;
  callback?: () => void;
} & Record<string, unknown>;

export const useActionSheetStore = defineStore('action-sheet', {
  state: () => ({
    open: false,
    title: null as string | null,
    actions: [] as ActionSheetItem[],
  }),
  actions: {
    openSheet(payload: { title?: string | null; actions?: ActionSheetItem[] }): void {
      this.title = payload?.title || null;
      this.actions = Array.isArray(payload?.actions) ? payload.actions : [];
      this.open = true;
    },
    closeSheet(): void {
      this.$reset();
    },
  },
});
