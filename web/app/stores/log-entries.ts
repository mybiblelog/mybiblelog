import { defineStore } from 'pinia';
import {
  deleteLogEntryRequest,
  evaluateAchievement,
  evaluateGoalCompletions,
  fetchLogEntries,
  getBookIndexFromVerseId,
  isBibleComplete,
  postLogEntry,
  patchLogEntry,
  type CreateLogEntryInput,
  type LogEntry,
  type UpdateLogEntryInput,
} from '@mybiblelog/shared';
import { useAchievementsStore } from '~/stores/achievements';
import { useUserSettingsStore } from '~/stores/user-settings';
import dayjs from 'dayjs';

export type { CreateLogEntryInput, LogEntry, UpdateLogEntryInput };

const refreshDateVerseCounts = async (): Promise<void> => {
  const { useDateVerseCountsStore } = await import('~/stores/date-verse-counts');
  useDateVerseCountsStore().cacheDateVerseCounts();
};

const refreshReadingSuggestions = async (): Promise<void> => {
  const { useReadingSuggestionsStore } = await import('~/stores/reading-suggestions');
  useReadingSuggestionsStore().refreshReadingSuggestions();
};

const applyAchievement = async (
  bookIndex: number,
  before: { all: LogEntry[]; current: LogEntry[] },
  after: { all: LogEntry[]; current: LogEntry[] },
): Promise<void> => {
  // Only one modal shows at a time; a completed reading goal wins over a
  // completed book or Bible. Goals count every entry (they have their own
  // start date), while book/Bible completion honors the tracker reset date.
  const { useReadingGoalsStore } = await import('~/stores/reading-goals');
  const completedGoals = evaluateGoalCompletions(
    useReadingGoalsStore().goals,
    before.all,
    after.all,
    dayjs().format('YYYY-MM-DD'),
  );
  if (completedGoals.length) {
    useAchievementsStore().showGoalCompleteAchievement(completedGoals[0]!.title);
    return;
  }

  const achievement = evaluateAchievement(bookIndex, before.current, after.current);
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
      const today = dayjs().format('YYYY-MM-DD');
      return state.logEntries.some(entry => entry.date === today);
    },
  },
  actions: {
    async loadLogEntries(): Promise<LogEntry[]> {
      if (this.isLoaded) { return this.logEntries; }
      const http = useHttp();
      this.logEntries = await fetchLogEntries(http);
      this.isLoaded = true;
      return this.logEntries;
    },

    async createLogEntry(input: CreateLogEntryInput): Promise<LogEntry> {
      const http = useHttp();
      // Copies: without a tracker reset date `currentLogEntries` is the live array.
      const before = { all: [...this.logEntries], current: [...this.currentLogEntries] };
      const bookIndex = getBookIndexFromVerseId(input.startVerseId);

      const created = await postLogEntry(http, input);
      this.logEntries.push(created);

      await applyAchievement(bookIndex, before, { all: this.logEntries, current: this.currentLogEntries });

      await refreshReadingSuggestions();
      refreshDateVerseCounts();

      return created;
    },

    async updateLogEntry(input: UpdateLogEntryInput): Promise<LogEntry> {
      const http = useHttp();
      // Snapshot copies: the update below mutates the entry in place.
      const before = {
        all: this.logEntries.map(le => ({ ...le })),
        current: this.currentLogEntries.map(le => ({ ...le })),
      };
      const bookIndex = getBookIndexFromVerseId(input.startVerseId);

      const updated = await patchLogEntry(http, input);

      const existing = this.logEntries.find(le => le.id === updated.id);
      if (existing) {
        Object.assign(existing, updated);
      }
      else {
        this.logEntries.push(updated);
      }

      await applyAchievement(bookIndex, before, { all: this.logEntries, current: this.currentLogEntries });

      await refreshReadingSuggestions();
      refreshDateVerseCounts();

      return updated;
    },

    async deleteLogEntry(logEntryId: number | string): Promise<boolean> {
      const http = useHttp();
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
