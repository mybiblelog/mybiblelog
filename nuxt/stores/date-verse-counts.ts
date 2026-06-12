import { defineStore } from 'pinia';
import { set as vueSet } from 'vue';
import dayjs from 'dayjs';
import { BrowserCache, computeDateVerseCounts } from '@mybiblelog/shared';
import { useLogEntriesStore } from '~/stores/log-entries';
import { useUserSettingsStore } from '~/stores/user-settings';

export type DateVerseCounts = {
  total: number;
  unique: number;
};

export type DateVerseCountsMap = Record<string, DateVerseCounts>;

const DATE_VERSE_COUNTS_CACHE_KEY = 'dateVerseCounts';
const DATE_VERSE_COUNTS_CACHE_MINUTES = 60 * 24;

const emptyCounts: DateVerseCounts = { total: 0, unique: 0 };

const parseCachedDateVerseCounts = (value: unknown): DateVerseCountsMap | null => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === 'object') {
        return parsed as DateVerseCountsMap;
      }
      return null;
    }
    catch {
      return null;
    }
  }

  if (typeof value === 'object') {
    return value as DateVerseCountsMap;
  }

  return null;
};

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
    cacheDateVerseCounts(): void {
      this.jobs += 1;
      try {
        // Check for cached data to give an immediate visual response
        try {
          const cachedRaw = BrowserCache.get(DATE_VERSE_COUNTS_CACHE_KEY) as unknown;
          const cached = parseCachedDateVerseCounts(cachedRaw);
          if (cached && Object.keys(cached).length) {
            this.dateVerseCounts = cached;
          }
        }
        catch {
          // BrowserCache can fail in non-browser contexts; ignore.
        }

        const logEntries = useLogEntriesStore().logEntries;
        let startDate: string | undefined;
        for (const entry of logEntries) {
          if (startDate === undefined || entry.date < startDate) {
            startDate = entry.date;
          }
        }

        if (!startDate) {
          return;
        }

        const trackerStartDate = useUserSettingsStore().settings.lookBackDate;
        const dateVerseCounts = computeDateVerseCounts(
          logEntries,
          startDate,
          dayjs().format('YYYY-MM-DD'),
          trackerStartDate,
        );

        Object.keys(dateVerseCounts).forEach((date) => {
          vueSet(this.dateVerseCounts, date, dateVerseCounts[date]);
        });

        // Cache the data for future use for 1 day
        try {
          BrowserCache.set(
            DATE_VERSE_COUNTS_CACHE_KEY,
            JSON.stringify(this.dateVerseCounts),
            DATE_VERSE_COUNTS_CACHE_MINUTES,
          );
        }
        catch {
          // ignore cache write failures
        }
      }
      finally {
        this.jobs -= 1;
      }
    },
  },
});
