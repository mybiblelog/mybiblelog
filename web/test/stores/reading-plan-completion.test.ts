import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { Bible } from '@mybiblelog/shared';
import { useLogEntriesStore } from '~/stores/log-entries';
import { useReadingPlansStore } from '~/stores/reading-plans';
import { usePlanTrackersStore } from '~/stores/plan-trackers';
import { useAchievementsStore } from '~/stores/achievements';
import { ACHIEVEMENT } from '~/stores/achievements';

beforeEach(() => setActivePinia(createPinia()));

// John 3:16-18.
const JOHN_3_16 = Bible.makeVerseId(43, 3, 16);
const JOHN_3_18 = Bible.makeVerseId(43, 3, 18);

describe('log-entries store — plan completion wiring', () => {
  it('completes an active tracker and fires a PLAN_COMPLETE achievement when a log finishes the plan', async () => {
    const plansStore = useReadingPlansStore();
    plansStore.plans = [{ id: 'p1', name: 'John 3', days: [{ passages: [{ startVerseId: JOHN_3_16, endVerseId: JOHN_3_18 }] }] }];

    const trackersStore = usePlanTrackersStore();
    trackersStore.trackers = [{ id: 't1', planId: 'p1', startDate: '2024-01-01', completedDate: null }];

    const created = { id: 'e1', date: '2024-01-05', startVerseId: JOHN_3_16, endVerseId: JOHN_3_18 };
    const completedTracker = { id: 't1', planId: 'p1', startDate: '2024-01-01', completedDate: '2024-01-05' };
    const patch = vi.fn().mockResolvedValue({ data: completedTracker });
    vi.stubGlobal('useNuxtApp', () => ({
      $http: {
        get: vi.fn().mockResolvedValue({ data: {} }),
        post: vi.fn().mockResolvedValue({ data: created }),
        patch,
        delete: vi.fn().mockResolvedValue({ data: 1 }),
      },
    }));

    const logEntriesStore = useLogEntriesStore();
    await logEntriesStore.createLogEntry({ date: '2024-01-05', startVerseId: JOHN_3_16, endVerseId: JOHN_3_18 });

    // Tracker was marked complete on the finishing entry's date.
    expect(patch).toHaveBeenCalledWith('/api/plan-trackers/t1', { completedDate: '2024-01-05' });
    expect(trackersStore.trackers[0]!.completedDate).toBe('2024-01-05');

    // The plan-complete celebration was shown with the plan's name.
    const achievements = useAchievementsStore();
    expect(achievements.open).toBe(true);
    expect(achievements.achievementType).toBe(ACHIEVEMENT.PLAN_COMPLETE);
    expect(achievements.achievementData).toEqual({ name: 'John 3' });
  });

  it('does not fire when the plan is not fully read', async () => {
    const plansStore = useReadingPlansStore();
    // Plan needs John 3:16-20 but the entry only covers 16-18.
    plansStore.plans = [{ id: 'p1', name: 'John 3', days: [{ passages: [{ startVerseId: JOHN_3_16, endVerseId: Bible.makeVerseId(43, 3, 20) }] }] }];

    const trackersStore = usePlanTrackersStore();
    trackersStore.trackers = [{ id: 't1', planId: 'p1', startDate: '2024-01-01', completedDate: null }];

    const created = { id: 'e1', date: '2024-01-05', startVerseId: JOHN_3_16, endVerseId: JOHN_3_18 };
    const patch = vi.fn();
    vi.stubGlobal('useNuxtApp', () => ({
      $http: {
        get: vi.fn().mockResolvedValue({ data: {} }),
        post: vi.fn().mockResolvedValue({ data: created }),
        patch,
        delete: vi.fn().mockResolvedValue({ data: 1 }),
      },
    }));

    const logEntriesStore = useLogEntriesStore();
    await logEntriesStore.createLogEntry({ date: '2024-01-05', startVerseId: JOHN_3_16, endVerseId: JOHN_3_18 });

    expect(patch).not.toHaveBeenCalled();
    expect(useAchievementsStore().open).toBe(false);
  });
});
