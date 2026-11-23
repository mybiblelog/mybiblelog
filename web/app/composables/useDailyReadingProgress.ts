import dayjs from 'dayjs';
import { Bible } from '@mybiblelog/shared';
import { useDateVerseCountsStore } from '~/stores/date-verse-counts';
import { useLogEntriesStore } from '~/stores/log-entries';
import { useReadingSuggestionsStore } from '~/stores/reading-suggestions';
import { useUserSettingsStore } from '~/stores/user-settings';

type VerseRange = { startVerseId: number; endVerseId: number };

function percentOfGoal(verses: number, goal: number): number {
  if (!goal) { return 0; }
  return Number((verses / goal * 100).toFixed(0));
}

/**
 * Today's reading against the daily goal, plus how many verses each of
 * today's entries and each reading suggestion adds to the tracker's unique
 * verse count.
 */
export function useDailyReadingProgress() {
  const logEntriesStore = useLogEntriesStore();
  const dateVerseCountsStore = useDateVerseCountsStore();
  const readingSuggestionsStore = useReadingSuggestionsStore();
  const userSettingsStore = useUserSettingsStore();

  const today = () => dayjs().format('YYYY-MM-DD');
  const dailyGoal = computed(() => userSettingsStore.settings.dailyVerseCountGoal);

  function withNewVerseCount<P extends VerseRange>(priorEntries: VerseRange[], passage: P) {
    const before = Bible.countUniqueRangeVerses(priorEntries);
    const newVerseCount = Bible.countUniqueRangeVerses([...priorEntries, passage]) - before;
    return { ...passage, newVerseCount };
  }

  const logEntriesForToday = computed(() => {
    const date = today();
    const entries = logEntriesStore.currentLogEntries;
    const throughYesterday = entries.filter(e => e.date < date);
    return entries
      .filter(e => e.date === date)
      .map(e => withNewVerseCount(throughYesterday, e));
  });

  const readingSuggestionsWithNewVerseCounts = computed(() => {
    const date = today();
    const throughToday = logEntriesStore.currentLogEntries.filter(e => e.date <= date);
    return readingSuggestionsStore.passages.map(p => withNewVerseCount(throughToday, p));
  });

  const versesReadToday = computed(() => Bible.countUniqueRangeVerses(logEntriesForToday.value));
  const newVersesReadToday = computed(() => dateVerseCountsStore.getDateVerseCounts(today()).unique);

  const dailyGoalPercentComplete = computed(() => percentOfGoal(versesReadToday.value, dailyGoal.value));
  const dailyGoalPercentCompleteNew = computed(() => percentOfGoal(newVersesReadToday.value, dailyGoal.value));

  return {
    logEntriesForToday,
    readingSuggestionsWithNewVerseCounts,
    newVersesReadToday,
    dailyGoalPercentComplete,
    dailyGoalPercentCompleteNew,
  };
}
