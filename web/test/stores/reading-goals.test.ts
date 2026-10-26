import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import * as Vue from 'vue';
import { Bible, bookToPassage } from '@mybiblelog/shared';
import { useReadingGoalsStore, type ReadingGoal } from '~/stores/reading-goals';
import { useLogEntriesStore } from '~/stores/log-entries';
import { useAchievementsStore, ACHIEVEMENT } from '~/stores/achievements';

const JUDE = 65;

beforeEach(() => {
  setActivePinia(createPinia());
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-01-03T12:00:00'));
});
afterEach(() => vi.useRealTimers());

function stubHttp(overrides: Record<string, unknown> = {}) {
  const http = {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn().mockResolvedValue({ data: 1 }),
    ...overrides,
  };
  vi.stubGlobal('useNuxtApp', () => ({
    $http: http,
    $terr: (error: unknown) => String(error),
    $i18n: { locale: Vue.ref('en'), t: (key: string) => key },
  }));
  return http;
}

const makeGoal = (overrides: Partial<ReadingGoal> = {}): ReadingGoal => ({
  id: 'g1',
  title: 'Jude',
  passages: [bookToPassage(JUDE)],
  startDate: '2026-01-01',
  endDate: '2026-01-05',
  active: true,
  ...overrides,
});

const judeEntry = (id: string, date: string, from: number, to: number) => ({
  id,
  date,
  startVerseId: Bible.makeVerseId(JUDE, 1, from),
  endVerseId: Bible.makeVerseId(JUDE, 1, to),
});

describe('reading-goals store', () => {
  it('splits goals into active and inactive', () => {
    const store = useReadingGoalsStore();
    store.goals = [makeGoal(), makeGoal({ id: 'g2', active: false })];
    expect(store.activeGoals.map(g => g.id)).toEqual(['g1']);
    expect(store.inactiveGoals.map(g => g.id)).toEqual(['g2']);
  });

  it('todayGoals hides goals not yet started or inactive, and sorts by end date', () => {
    const store = useReadingGoalsStore();
    store.goals = [
      makeGoal({ id: 'late', endDate: '2026-02-01' }),
      makeGoal({ id: 'future', startDate: '2026-01-04' }),
      makeGoal({ id: 'inactive', active: false }),
      makeGoal({ id: 'soon', endDate: '2026-01-04' }),
    ];
    expect(store.todayGoals.map(({ goal }) => goal.id)).toEqual(['soon', 'late']);
  });

  it('counts log entries from before the reading-tracker reset date', () => {
    const store = useReadingGoalsStore();
    store.goals = [makeGoal()];
    useLogEntriesStore().logEntries = [judeEntry('e1', '2026-01-01', 1, 10)];
    expect(store.todayGoals[0]!.progress.versesRead).toBe(10);
  });

  it('updateGoal replaces the goal in place', async () => {
    const updated = makeGoal({ title: 'Renamed' });
    const http = stubHttp({ patch: vi.fn().mockResolvedValue({ data: updated }) });
    const store = useReadingGoalsStore();
    store.goals = [makeGoal()];
    const { id: _id, ...input } = updated;
    await store.updateGoal('g1', input);
    expect(http.patch).toHaveBeenCalledWith('/api/reading-goals/g1', input);
    expect(store.goals).toEqual([updated]);
  });

  it('deleteGoal removes the goal', async () => {
    stubHttp();
    const store = useReadingGoalsStore();
    store.goals = [makeGoal()];
    expect(await store.deleteGoal('g1')).toBe(true);
    expect(store.goals).toEqual([]);
  });
});

describe('goal completion achievement', () => {
  it('shows the goal modal (over the book modal) when a new entry completes a goal', async () => {
    stubHttp({ post: vi.fn().mockResolvedValue({ data: judeEntry('e2', '2026-01-03', 11, 25) }) });
    useReadingGoalsStore().goals = [makeGoal()];
    const logEntries = useLogEntriesStore();
    logEntries.logEntries = [judeEntry('e1', '2026-01-01', 1, 10)];

    await logEntries.createLogEntry({
      date: '2026-01-03',
      startVerseId: Bible.makeVerseId(JUDE, 1, 11),
      endVerseId: Bible.makeVerseId(JUDE, 1, 25),
    });

    const achievements = useAchievementsStore();
    expect(achievements.achievementType).toBe(ACHIEVEMENT.GOAL_COMPLETE);
    expect(achievements.achievementData).toBe('Jude');
  });

  it('falls back to the book modal when no goal completes', async () => {
    stubHttp({ post: vi.fn().mockResolvedValue({ data: judeEntry('e2', '2026-01-03', 11, 25) }) });
    useReadingGoalsStore().goals = [makeGoal({ active: false })];
    const logEntries = useLogEntriesStore();
    logEntries.logEntries = [judeEntry('e1', '2026-01-01', 1, 10)];

    await logEntries.createLogEntry({
      date: '2026-01-03',
      startVerseId: Bible.makeVerseId(JUDE, 1, 11),
      endVerseId: Bible.makeVerseId(JUDE, 1, 25),
    });

    expect(useAchievementsStore().achievementType).toBe(ACHIEVEMENT.BOOK_COMPLETE);
  });
});
