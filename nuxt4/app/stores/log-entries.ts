import { defineStore } from 'pinia';
import {
  deleteLogEntryRequest,
  evaluateAchievement,
  fetchLogEntries,
  getBookIndexFromVerseId,
  isBibleComplete,
  postLogEntry,
  putLogEntry,
  type CreateLogEntryInput,
  type HttpClient,
  type LogEntry,
  type UpdateLogEntryInput,
} from '@mybiblelog/shared';
import { useAchievementsStore } from '~/stores/achievements';
import { useUserSettingsStore } from '~/stores/user-settings';

export type { CreateLogEntryInput, LogEntry, UpdateLogEntryInput };

const refreshDateVerseCounts = async (): Promise<void> => {
  const { useDateVerseCountsStore } = await import('~/stores/date-verse-counts');
  useDateVerseCountsStore().cacheDateVerseCounts();
};

const refreshReadingSuggestions = async (): Promise<void> => {
  const { useReadingSuggestionsStore } = await import('~/stores/reading-suggestions');
  useReadingSuggestionsStore().refreshReadingSuggestions();
};

const applyAchievement = (
  bookIndex: number,
  before: LogEntry[],
  after: LogEntry[],
): void => {
  const achievement = evaluateAchievement(bookIndex, before, after);
  if (achievement?.type === 'bible') {
    useAchievementsStore().showBibleCompleteAchievement();
  }
  else if (achievement?.type === 'book') {
    useAchievementsStore().showBookCompleteAchievement(achievement.bookIndex);
  }
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
      const http = useNuxtApp().$http as unknown as HttpClient;
      this.logEntries = await fetchLogEntries(http);
      this.isLoaded = true;
      return this.logEntries;
    },

    async createLogEntry(input: CreateLogEntryInput): Promise<LogEntry> {
      const http = useNuxtApp().$http as unknown as HttpClient;
      const before = this.currentLogEntries;
      const bookIndex = getBookIndexFromVerseId(input.startVerseId);

      const created = await postLogEntry(http, input);
      this.logEntries.push(created);

      applyAchievement(bookIndex, before, this.currentLogEntries);

      await refreshReadingSuggestions();
      refreshDateVerseCounts();

      return created;
    },

    async updateLogEntry(input: UpdateLogEntryInput): Promise<LogEntry> {
      const http = useNuxtApp().$http as unknown as HttpClient;
      const before = this.currentLogEntries;
      const bookIndex = getBookIndexFromVerseId(input.startVerseId);

      const updated = await putLogEntry(http, input);

      const existing = this.logEntries.find(le => le.id === updated.id);
      if (existing) {
        Object.assign(existing, updated);
      }
      else {
        this.logEntries.push(updated);
      }

      applyAchievement(bookIndex, before, this.currentLogEntries);

      await refreshReadingSuggestions();
      refreshDateVerseCounts();

      return updated;
    },

    async deleteLogEntry(logEntryId: number | string): Promise<boolean> {
      const http = useNuxtApp().$http as unknown as HttpClient;
      const logEntry = this.logEntries.find(le => le.id === logEntryId);
      const date = logEntry?.date;

      const deleted = await deleteLogEntryRequest(http, logEntryId);
      if (!deleted) {
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
