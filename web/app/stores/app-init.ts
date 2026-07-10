import { defineStore } from 'pinia';
import { useLogEntriesStore } from '~/stores/log-entries';
import { useUserSettingsStore } from '~/stores/user-settings';
import { usePassageNoteTagsStore } from '~/stores/passage-note-tags';

export const useAppInitStore = defineStore('app-init', {
  actions: {
    async loadUserData(): Promise<void> {
      const logEntriesStore = useLogEntriesStore();
      const userSettingsStore = useUserSettingsStore();
      const passageNoteTagsStore = usePassageNoteTagsStore();
      await logEntriesStore.loadLogEntries();
      await userSettingsStore.loadSettings();
      await passageNoteTagsStore.loadPassageNoteTags();
    },
  },
});
