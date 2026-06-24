import { defineStore } from 'pinia';
import { Bible } from '@mybiblelog/shared';
import { useUserSettingsStore } from '~/stores/user-settings';

const refreshDateVerseCounts = async (): Promise<void> => {
  const { useDateVerseCountsStore } = await import('~/stores/date-verse-counts');
  useDateVerseCountsStore().cacheDateVerseCounts();
};

const refreshReadingSuggestions = async (): Promise<void> => {
  const { useReadingSuggestionsStore } = await import('~/stores/reading-suggestions');
  useReadingSuggestionsStore().refreshReadingSuggestions();
};

export type LogEntry = {
  id: number | string;
  date: string; // YYYY-MM-DD
  startVerseId: number;
  endVerseId: number;
  [key: string]: unknown;
};

export type CreateLogEntryInput = {
  date: string;
  startVerseId: number;
  endVerseId: number;
};

export type UpdateLogEntryInput = CreateLogEntryInput & {
  id: number | string;
};

const isBookComplete = (bookIndex: number, logEntries: LogEntry[]): boolean => {
  const totalVerses = Bible.getBookVerseCount(bookIndex);
  const versesRead = Bible.countUniqueBookRangeVerses(bookIndex, logEntries);
  return versesRead === totalVerses;
};

const isBibleComplete = (logEntries: LogEntry[]): boolean => {
  const totalBooks = Bible.getBookCount();
  for (let i = 1; i <= totalBooks; i++) {
    if (!isBookComplete(i, logEntries)) {
      return false;
    }
  }
  return true;
};

const getBookIndexFromVerseId = (verseId: number): number => {
  const parsed = Bible.parseVerseId(verseId);
  return parsed.book;
};

type Http = {
  get: <T>(path: string) => Promise<{ data: T }>;
  post: <T>(path: string, body?: unknown) => Promise<{ data: T }>;
  put: <T>(path: string, body?: unknown) => Promise<{ data: T }>;
  delete: <T>(path: string) => Promise<{ data: T }>;
};

export const useLogEntriesStore = defineStore('log-entries', {
  state: () => ({
    logEntries: [] as LogEntry[],
    isLoaded: false,
  }),
  getters: {
    currentLogEntries(state): LogEntry[] {
      const lookBackDate = useUserSettingsStore().settings.lookBackDate;
      if (!lookBackDate) {
        return state.logEntries;
      }
      return state.logEntries.filter(logEntry => logEntry.date >= lookBackDate);
    },
    isBibleComplete(): boolean {
      return isBibleComplete(this.currentLogEntries);
    },
    hasLogEntriesForToday(state): boolean {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      return state.logEntries.some(entry => entry.date === today);
    },
  },
  actions: {
    async loadLogEntries(): Promise<LogEntry[]> {
      const { $http } = useNuxtApp() as { $http: Http };
      const { data } = await $http.get<LogEntry[]>('/api/log-entries');
      this.logEntries = Array.isArray(data) ? data : [];
      this.isLoaded = true;
      return this.logEntries;
    },

    async createLogEntry(input: CreateLogEntryInput): Promise<LogEntry> {
      const { $http } = useNuxtApp() as { $http: Http };
      const { date, startVerseId, endVerseId } = input;

      const currentLogEntries = this.currentLogEntries;
      const bookIndex = getBookIndexFromVerseId(startVerseId);

      const wasBookComplete = isBookComplete(bookIndex, currentLogEntries);
      const wasBibleComplete = isBibleComplete(currentLogEntries);

      const { data } = await $http.post<LogEntry>('/api/log-entries', {
        date,
        startVerseId,
        endVerseId,
      });

      this.logEntries.push(data);

      const updatedLogEntries = this.currentLogEntries;
      const isBookNowComplete = isBookComplete(bookIndex, updatedLogEntries);
      const isBibleNowComplete = isBibleComplete(updatedLogEntries);

      if (!wasBibleComplete && isBibleNowComplete) {
        const { useAchievementsStore } = await import('~/stores/achievements');
        useAchievementsStore().showBibleCompleteAchievement();
      }
      else if (!wasBookComplete && isBookNowComplete) {
        const { useAchievementsStore } = await import('~/stores/achievements');
        useAchievementsStore().showBookCompleteAchievement(bookIndex);
      }

      await refreshReadingSuggestions();
      refreshDateVerseCounts();

      return data;
    },

    async updateLogEntry(input: UpdateLogEntryInput): Promise<LogEntry> {
      const { $http } = useNuxtApp() as { $http: Http };
      const { id, date, startVerseId, endVerseId } = input;

      const currentLogEntries = this.currentLogEntries;
      const bookIndex = getBookIndexFromVerseId(startVerseId);

      const wasBookComplete = isBookComplete(bookIndex, currentLogEntries);
      const wasBibleComplete = isBibleComplete(currentLogEntries);

      const { data: updated } = await $http.put<LogEntry>(`/api/log-entries/${id}`, {
        date,
        startVerseId,
        endVerseId,
      });

      const existing = this.logEntries.find(le => le.id === updated.id);
      if (existing) {
        Object.assign(existing, updated);
      }
      else {
        this.logEntries.push(updated);
      }

      const updatedLogEntries = this.currentLogEntries;
      const isBookNowComplete = isBookComplete(bookIndex, updatedLogEntries);
      const isBibleNowComplete = isBibleComplete(updatedLogEntries);

      if (!wasBibleComplete && isBibleNowComplete) {
        const { useAchievementsStore } = await import('~/stores/achievements');
        useAchievementsStore().showBibleCompleteAchievement();
      }
      else if (!wasBookComplete && isBookNowComplete) {
        const { useAchievementsStore } = await import('~/stores/achievements');
        useAchievementsStore().showBookCompleteAchievement(bookIndex);
      }

      await refreshReadingSuggestions();
      refreshDateVerseCounts();

      return updated;
    },

    async deleteLogEntry(logEntryId: number | string): Promise<boolean> {
      const { $http } = useNuxtApp() as { $http: Http };
      const logEntry = this.logEntries.find(le => le.id === logEntryId);
      const date = logEntry?.date;

      const { data } = await $http.delete<unknown>(`/api/log-entries/${logEntryId}`);
      if (!data) {
        return false;
      }

      this.logEntries = this.logEntries.filter(le => le.id !== logEntryId);

      await refreshReadingSuggestions();
      if (date) {
        refreshDateVerseCounts();
      }

      return true;
    },
  },
});
