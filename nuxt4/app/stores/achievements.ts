import { defineStore } from 'pinia';

export const ACHIEVEMENT = {
  BOOK_COMPLETE: 'BOOK_COMPLETE',
  BIBLE_COMPLETE: 'BIBLE_COMPLETE',
} as const;

export type AchievementType = (typeof ACHIEVEMENT)[keyof typeof ACHIEVEMENT];

export type AchievementsState = {
  open: boolean;
  achievementType: AchievementType | null;
  achievementData: unknown;
};

const emptyState: AchievementsState = {
  open: false,
  achievementType: null,
  achievementData: null,
};

export const useAchievementsStore = defineStore('achievements', {
  state: (): AchievementsState => ({ ...emptyState }),
  actions: {
    showBookCompleteAchievement(bookIndex: number): void {
      this.achievementType = ACHIEVEMENT.BOOK_COMPLETE;
      this.achievementData = bookIndex;
      this.open = true;
    },
    showBibleCompleteAchievement(): void {
      this.achievementType = ACHIEVEMENT.BIBLE_COMPLETE;
      this.achievementData = null;
      this.open = true;
    },
    closeAchievement(): void {
      this.$reset();
    },
  },
});
