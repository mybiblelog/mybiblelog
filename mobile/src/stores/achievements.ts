import { create } from "zustand";
import {
  type AchievementEvent,
  type CompletionLogEntry,
  evaluateAchievement,
} from "@mybiblelog/shared";
import { countCompletedBooks, maybeRequestReview } from "@/src/review/reviewPrompt";

/**
 * Achievements store (Zustand).
 *
 * Mirrors `web/app/stores/achievements.ts`: holds the achievement currently
 * being celebrated (book or whole-Bible completion), shown by the
 * `AchievementModal` rendered at the root layout. Achievements are ephemeral —
 * they fire when a log-entry mutation transitions a book/Bible from incomplete
 * to complete (shared `evaluateAchievement`) and are not persisted.
 */

export type AchievementDisplay = { type: "book"; bookIndex: number } | { type: "bible" };

type AchievementsStore = {
  current: AchievementDisplay | null;
  show: (achievement: AchievementDisplay) => void;
  close: () => void;
};

export const useAchievementsStore = create<AchievementsStore>((set) => ({
  current: null,
  show: (achievement) => set({ current: achievement }),
  close: () => set({ current: null }),
}));

export function useCurrentAchievement(): AchievementDisplay | null {
  return useAchievementsStore((s) => s.current);
}

/** Delay after the celebration closes, so the review card doesn't land on its exit animation. */
export const REVIEW_REQUEST_DELAY_MS = 400;

/**
 * Entries as of the latest celebrated completion. The review request waits for
 * the celebration to close so Google's card never appears on top of it.
 */
let pendingReviewEntries: readonly CompletionLogEntry[] | null = null;

/**
 * Store actions, stable for the lifetime of the app — safe to use directly in
 * event handlers without subscribing the component to any store state.
 */
export const achievementActions = {
  show: (achievement: AchievementDisplay) => useAchievementsStore.getState().show(achievement),
  close: () => {
    useAchievementsStore.getState().close();
    const entries = pendingReviewEntries;
    pendingReviewEntries = null;
    if (entries) {
      setTimeout(() => {
        void maybeRequestReview(countCompletedBooks(entries));
      }, REVIEW_REQUEST_DELAY_MS);
    }
  },
  /** Evaluate a mutation's before/after entries and celebrate any completion. */
  evaluate: (
    bookIndex: number,
    before: readonly CompletionLogEntry[],
    after: readonly CompletionLogEntry[]
  ): void => {
    const event: AchievementEvent = evaluateAchievement(bookIndex, before, after);
    if (event) {
      pendingReviewEntries = after;
      useAchievementsStore.getState().show(event);
    }
  },
};
