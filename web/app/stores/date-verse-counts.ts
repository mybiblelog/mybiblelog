import { defineStore } from 'pinia';
import dayjs from 'dayjs';
import { BrowserCache, computeDateVerseCounts } from '@mybiblelog/shared';
import { useLogEntriesStore } from '~/stores/log-entries';
import { useUserSettingsStore } from '~/stores/user-settings';

export type DateVerseCounts = { total: number; unique: number };
export type DateVerseCountsMap = Record<string, DateVerseCounts>;

const DATE_VERSE_COUNTS_CACHE_KEY = 'dateVerseCounts';
const DATE_VERSE_COUNTS_CACHE_MINUTES = 60 * 24;
const emptyCounts: DateVerseCounts = { total: 0, unique: 0 };

function parseCachedDateVerseCounts(value: unknown): DateVerseCountsMap | null {
  if (!value) { return null; }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      return (parsed && typeof parsed === 'object') ? parsed as DateVerseCountsMap : null;
    }
    catch { return null; }
  }
  return typeof value === 'object' ? value as DateVerseCountsMap : null;
}

export const useDateVerseCountsStore = defineStore('date-verse-counts', {
  state: () => ({
    jobs: 0,
    dateVerseCounts: {} as DateVerseCountsMap,
  }),
  getters: {
    busy: state => state.jobs > 0,
    getDateVerseCounts: state => (date: string): DateVerseCounts => {
      return state.dateVerseCounts[date] || emptyCounts;
    },
    getAllDateVerseCounts: state => state.dateVerseCounts,
  },
  actions: {
    // Forget the in-memory and session-cached counts, e.g. when the active user changes.
    clear(): void {
      this.$reset();
      try { BrowserCache.delete(DATE_VERSE_COUNTS_CACHE_KEY); }
      catch { /* BrowserCache can fail in non-browser contexts */ }
    },

    cacheDateVerseCounts(): void {
      this.jobs += 1;
      try {
        const logEntriesStore = useLogEntriesStore();

        // Until the log is loaded, show the last computed counts (if this tab
        // has any) rather than an empty calendar.
        if (!logEntriesStore.isLoaded) {
          try {
            const cached = parseCachedDateVerseCounts(BrowserCache.get(DATE_VERSE_COUNTS_CACHE_KEY) as unknown);
            if (cached && Object.keys(cached).length) {
              this.dateVerseCounts = cached;
            }
          }
          catch { /* BrowserCache can fail in non-browser contexts */ }
          return;
        }

        const logEntries = logEntriesStore.logEntries;
        let startDate: string | undefined;
        for (const entry of logEntries) {
          if (startDate === undefined || entry.date < startDate) { startDate = entry.date; }
        }

        // Replace the map rather than merging into it: a merge kept counts for
        // dates the log no longer covers (deleted entries, or a previous user's
        // log after signing in as someone else).
        const trackerStartDate = useUserSettingsStore().settings.lookBackDate;
        this.dateVerseCounts = startDate
          ? computeDateVerseCounts(logEntries, startDate, dayjs().format('YYYY-MM-DD'), trackerStartDate)
          : {};

        try {
          BrowserCache.set(DATE_VERSE_COUNTS_CACHE_KEY, JSON.stringify(this.dateVerseCounts), DATE_VERSE_COUNTS_CACHE_MINUTES);
        }
        catch { /* ignore cache write failures */ }
      }
      finally {
        this.jobs -= 1;
      }
    },
  },
});
