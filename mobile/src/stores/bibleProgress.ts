import { create } from 'zustand';
import { type BibleProgress, computeBibleProgress } from '@mybiblelog/shared';
import { getCache, setCache } from '@/src/storage/dateVerseCountsCache';
import { subscribeDerivedRecompute } from '@/src/stores/derivedRecompute';
import { useLogEntriesStore } from '@/src/stores/logEntries';
import { useUserSettingsStore } from '@/src/stores/userSettings';

/**
 * Bible-progress store (Zustand).
 *
 * Precomputes the whole-Bible reading-progress snapshot (overall + per-book +
 * per-chapter percentages, completion and segment bars) via shared
 * `computeBibleProgress`, so the `/bible`, `/bible/[book]` and `/checklist`
 * screens read ready-made data instead of recomputing it on every render. Built
 * the same way as `dateVerseCounts`: hydrate from an AsyncStorage cache for an
 * instant first paint, then recompute whenever log entries or the look-back date
 * change. Entries are filtered by `lookBackDate` (tracker-reset) so all three
 * screens share one consistent snapshot.
 */

const BIBLE_PROGRESS_CACHE_KEY = 'bibleProgress';
const BIBLE_PROGRESS_CACHE_MINUTES = 60 * 24;

type BibleProgressStore = {
  jobs: number;
  progress: BibleProgress | null;
  cacheBibleProgress: () => Promise<void>;
};

export const useBibleProgressStore = create<BibleProgressStore>((set, get) => ({
  jobs: 0,
  progress: null,

  async cacheBibleProgress() {
    set({ jobs: get().jobs + 1 });
    try {
      // Hydrate from cache first for an immediate visual response.
      if (!get().progress) {
        const cached = await getCache<BibleProgress>(BIBLE_PROGRESS_CACHE_KEY);
        if (cached) set({ progress: cached });
      }

      const logState = useLogEntriesStore.getState().state;
      if (logState.status !== 'ready') return;

      const settingsState = useUserSettingsStore.getState().state;
      const lookBackDate =
        settingsState.status === 'ready' ? settingsState.settings.lookBackDate : '0000-00-00';

      const ranges = logState.entries.filter((e) => e.date >= lookBackDate);
      const computed = computeBibleProgress(ranges);

      set({ progress: computed });
      await setCache(BIBLE_PROGRESS_CACHE_KEY, computed, BIBLE_PROGRESS_CACHE_MINUTES);
    }
    finally {
      set({ jobs: get().jobs - 1 });
    }
  },
}));

/** Hook returning the full precomputed snapshot (null until first compute). */
export function useBibleProgress(): BibleProgress | null {
  return useBibleProgressStore((s) => s.progress);
}

/** Hook returning a single book's progress (null while loading or out of range). */
export function useBookProgress(bookIndex: number) {
  return useBibleProgressStore((s) =>
    s.progress?.books.find((b) => b.bookIndex === bookIndex) ?? null,
  );
}

let initialized = false;

/** Recompute when log entries or the look-back date change. */
export function initBibleProgress(): void {
  if (initialized) return;
  initialized = true;
  subscribeDerivedRecompute(() => void useBibleProgressStore.getState().cacheBibleProgress());
}
