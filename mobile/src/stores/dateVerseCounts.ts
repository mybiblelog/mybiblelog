import dayjs from "dayjs";
import { create } from "zustand";
import {
  type DateVerseCounts,
  type DateVerseCountsMap,
  computeDateVerseCounts,
} from "@mybiblelog/shared";
import { getCache, setCache } from "@/src/storage/dateVerseCountsCache";
import { subscribeDerivedRecompute } from "@/src/stores/derivedRecompute";
import { useLogEntriesStore } from "@/src/stores/logEntries";
import { useUserSettingsStore } from "@/src/stores/userSettings";

/**
 * Date-verse-counts store (Zustand).
 *
 * Direct port of `nuxt/stores/date-verse-counts.ts`: computes the per-date
 * verse-count map (via shared `computeDateVerseCounts`) from the earliest log
 * entry through today, using the user's `lookBackDate` as the tracker start.
 * The Nuxt store caches into `BrowserCache`; here we cache into AsyncStorage
 * (see `storage/dateVerseCountsCache`). Recomputed whenever entries or
 * `lookBackDate` change.
 */

const DATE_VERSE_COUNTS_CACHE_KEY = "dateVerseCounts";
const DATE_VERSE_COUNTS_CACHE_MINUTES = 60 * 24;

const emptyCounts: DateVerseCounts = { total: 0, unique: 0 };

type DateVerseCountsStore = {
  jobs: number;
  dateVerseCounts: DateVerseCountsMap;
  cacheDateVerseCounts: () => Promise<void>;
};

export const useDateVerseCountsStore = create<DateVerseCountsStore>((set, get) => ({
  jobs: 0,
  dateVerseCounts: {},

  async cacheDateVerseCounts() {
    set({ jobs: get().jobs + 1 });
    try {
      // Hydrate from cache first for an immediate visual response.
      const cached = await getCache<DateVerseCountsMap>(DATE_VERSE_COUNTS_CACHE_KEY);
      if (cached && Object.keys(cached).length) {
        set({ dateVerseCounts: cached });
      }

      const logState = useLogEntriesStore.getState().state;
      if (logState.status !== "ready") return;
      const logEntries = logState.entries;

      let startDate: string | undefined;
      for (const entry of logEntries) {
        if (startDate === undefined || entry.date < startDate) {
          startDate = entry.date;
        }
      }
      if (!startDate) {
        // No entries at all: clear any stale cached counts.
        set({ dateVerseCounts: {} });
        await setCache(DATE_VERSE_COUNTS_CACHE_KEY, {}, DATE_VERSE_COUNTS_CACHE_MINUTES);
        return;
      }

      const settingsState = useUserSettingsStore.getState().state;
      const trackerStartDate =
        settingsState.status === "ready" ? settingsState.settings.lookBackDate : undefined;

      const computed = computeDateVerseCounts(
        logEntries,
        startDate,
        dayjs().format("YYYY-MM-DD"),
        trackerStartDate
      );

      // Replace (don't merge over) the previous map: merging would keep stale
      // counts for dates whose entries were deleted or excluded by a tracker
      // reset, and then re-persist them into the cache.
      set({ dateVerseCounts: computed });
      await setCache(DATE_VERSE_COUNTS_CACHE_KEY, computed, DATE_VERSE_COUNTS_CACHE_MINUTES);
    } finally {
      set({ jobs: get().jobs - 1 });
    }
  },
}));

/** Selector helper mirroring the Nuxt `getDateVerseCounts` getter. */
export function selectDateVerseCounts(map: DateVerseCountsMap, date: string): DateVerseCounts {
  return map[date] || emptyCounts;
}

/** Hook returning the full computed map (calendar reads it by date). */
export function useDateVerseCounts(): DateVerseCountsMap {
  return useDateVerseCountsStore((s) => s.dateVerseCounts);
}

let initialized = false;

/** Recompute when log entries or the look-back date change. */
export function initDateVerseCounts(): void {
  if (initialized) return;
  initialized = true;
  subscribeDerivedRecompute(() => void useDateVerseCountsStore.getState().cacheDateVerseCounts());
}
