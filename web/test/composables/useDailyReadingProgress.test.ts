import { beforeEach, describe, it, expect } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import dayjs from 'dayjs';
import { Bible } from '@mybiblelog/shared';
import { useDailyReadingProgress } from '~/composables/useDailyReadingProgress';
import { useLogEntriesStore } from '~/stores/log-entries';
import { useReadingSuggestionsStore } from '~/stores/reading-suggestions';
import { useUserSettingsStore } from '~/stores/user-settings';

const today = dayjs().format('YYYY-MM-DD');
const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
const range = (start: number, end: number) => ({
  startVerseId: Bible.makeVerseId(1, 1, start),
  endVerseId: Bible.makeVerseId(1, 1, end),
});

describe('useDailyReadingProgress', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    useUserSettingsStore().settings.lookBackDate = '';
    useLogEntriesStore().logEntries = [
      { id: 1, date: yesterday, ...range(1, 10) },
      { id: 2, date: today, ...range(6, 15) },
    ] as never;
  });

  it("counts only verses not read before today as new for today's entries", () => {
    const { logEntriesForToday } = useDailyReadingProgress();
    expect(logEntriesForToday.value).toHaveLength(1);
    expect(logEntriesForToday.value[0]!.newVerseCount).toBe(5);
  });

  it('counts suggestion verses not read through today as new', () => {
    useReadingSuggestionsStore().passages = [range(11, 20)] as never;
    const { readingSuggestionsWithNewVerseCounts } = useDailyReadingProgress();
    expect(readingSuggestionsWithNewVerseCounts.value[0]!.newVerseCount).toBe(5);
  });

  it("reports today's verses as a rounded percentage of the daily goal", () => {
    useUserSettingsStore().settings.dailyVerseCountGoal = 30;
    const { dailyGoalPercentComplete } = useDailyReadingProgress();
    expect(dailyGoalPercentComplete.value).toBe(33);
  });

  it('reports 0% when no daily goal is set', () => {
    useUserSettingsStore().settings.dailyVerseCountGoal = 0;
    expect(useDailyReadingProgress().dailyGoalPercentComplete.value).toBe(0);
  });
});
