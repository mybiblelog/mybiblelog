import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAchievementsStore, ACHIEVEMENT } from '~/stores/achievements';

beforeEach(() => setActivePinia(createPinia()));

describe('achievements store', () => {
  it('shows a book-complete achievement with the book index', () => {
    const store = useAchievementsStore();
    store.showBookCompleteAchievement(5);
    expect(store.open).toBe(true);
    expect(store.achievementType).toBe(ACHIEVEMENT.BOOK_COMPLETE);
    expect(store.achievementData).toBe(5);
  });

  it('shows a bible-complete achievement with no data', () => {
    const store = useAchievementsStore();
    store.showBibleCompleteAchievement();
    expect(store.open).toBe(true);
    expect(store.achievementType).toBe(ACHIEVEMENT.BIBLE_COMPLETE);
    expect(store.achievementData).toBeNull();
  });

  it('closeAchievement resets state', () => {
    const store = useAchievementsStore();
    store.showBookCompleteAchievement(1);
    store.closeAchievement();
    expect(store.open).toBe(false);
    expect(store.achievementType).toBeNull();
    expect(store.achievementData).toBeNull();
  });
});
