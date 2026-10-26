import { defineStore } from 'pinia';
import { useLogEntriesStore } from '~/stores/log-entries';
import { useUserSettingsStore } from '~/stores/user-settings';
import { usePassageNoteTagsStore } from '~/stores/passage-note-tags';
import { useReadingGoalsStore } from '~/stores/reading-goals';

export const useAppInitStore = defineStore('app-init', {
  actions: {
    async loadUserData(): Promise<void> {
      const logEntriesStore = useLogEntriesStore();
      const userSettingsStore = useUserSettingsStore();
      const passageNoteTagsStore = usePassageNoteTagsStore();
      await userSettingsStore.loadSettings();
      await Promise.all([
        logEntriesStore.loadLogEntries(),
        passageNoteTagsStore.loadPassageNoteTags(),
        useReadingGoalsStore().loadReadingGoals(),
      ]);
    },

    // Clear cached user data so the next loadUserData() pulls fresh from the API.
    // Call this whenever the active user changes (login / logout).
    resetUserData(): void {
      useLogEntriesStore().$reset();
      useUserSettingsStore().$reset();
      usePassageNoteTagsStore().$reset();
      useReadingGoalsStore().$reset();
    },
  },
});
