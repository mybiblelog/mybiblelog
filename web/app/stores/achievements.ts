import { defineStore } from 'pinia';
import { createModalStore } from '~/helpers/create-modal-store';

export const ACHIEVEMENT = {
  BOOK_COMPLETE: 'BOOK_COMPLETE',
  BIBLE_COMPLETE: 'BIBLE_COMPLETE',
} as const;

export type AchievementType = (typeof ACHIEVEMENT)[keyof typeof ACHIEVEMENT];

export type AchievementsPayload = {
  achievementType: AchievementType | null;
  achievementData: number | null;
};

const modal = createModalStore<AchievementsPayload>({
  achievementType: null,
  achievementData: null,
});

// Exported on a separate line (not `export const`) so Nuxt's auto-import
// scanner doesn't misread the spread inside `actions` as a named export.
const useAchievementsStore = defineStore('achievements', {
  state: modal.state,
  actions: {
    ...modal.actions,

    showBookCompleteAchievement(bookIndex: number): void {
      this.openModal({ achievementType: ACHIEVEMENT.BOOK_COMPLETE, achievementData: bookIndex });
    },

    showBibleCompleteAchievement(): void {
      this.openModal({ achievementType: ACHIEVEMENT.BIBLE_COMPLETE, achievementData: null });
    },

    closeAchievement(): void {
      this.closeModal();
    },
  },
});

export { useAchievementsStore };
