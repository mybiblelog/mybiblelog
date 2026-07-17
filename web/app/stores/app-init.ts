import { defineStore } from 'pinia';
import { useLogEntriesStore } from '~/stores/log-entries';
import { useUserSettingsStore } from '~/stores/user-settings';
import { usePassageNoteTagsStore } from '~/stores/passage-note-tags';
import { useReadingPlansStore } from '~/stores/reading-plans';
import { usePlanTrackersStore } from '~/stores/plan-trackers';

export const useAppInitStore = defineStore('app-init', {
  actions: {
    async loadUserData(): Promise<void> {
      const logEntriesStore = useLogEntriesStore();
      const userSettingsStore = useUserSettingsStore();
      const passageNoteTagsStore = usePassageNoteTagsStore();
      const readingPlansStore = useReadingPlansStore();
      const planTrackersStore = usePlanTrackersStore();
      await logEntriesStore.loadLogEntries();
      await userSettingsStore.loadSettings();
      await passageNoteTagsStore.loadPassageNoteTags();
      // Plans/trackers power the Today-page tracker suggestions and completion
      // detection; a failure here must not break core data loading, so swallow it.
      await Promise.all([
        readingPlansStore.loadReadingPlans().catch(() => {}),
        planTrackersStore.loadPlanTrackers().catch(() => {}),
      ]);
    },

    // Clear cached user data so the next loadUserData() pulls fresh from the API.
    // Call this whenever the active user changes (login / logout).
    resetUserData(): void {
      useLogEntriesStore().$reset();
      useUserSettingsStore().$reset();
      usePassageNoteTagsStore().$reset();
      useReadingPlansStore().$reset();
      usePlanTrackersStore().$reset();
    },
  },
});
