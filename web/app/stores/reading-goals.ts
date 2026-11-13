import { defineStore } from 'pinia';
import dayjs from 'dayjs';
import {
  computeGoalProgress,
  isGoalVisibleToday,
  type GoalPassage,
  type ReadingGoal,
  type ReadingGoalProgress,
} from '@mybiblelog/shared';
import { useLogEntriesStore } from '~/stores/log-entries';

export type { GoalPassage, ReadingGoal, ReadingGoalProgress };

export type ReadingGoalInput = Omit<ReadingGoal, 'id'>;

export type ReadingGoalWithProgress = {
  goal: ReadingGoal;
  progress: ReadingGoalProgress;
};

export type ReadingGoalSection = 'current' | 'upcoming' | 'completed' | 'archived';

const today = (): string => dayjs().format('YYYY-MM-DD');

export const useReadingGoalsStore = defineStore('reading-goals', {
  state: () => ({
    goals: [] as ReadingGoal[],
    isLoaded: false,
  }),

  getters: {
    activeGoals: (state): ReadingGoal[] => state.goals.filter(goal => goal.active),
    inactiveGoals: (state): ReadingGoal[] => state.goals.filter(goal => !goal.active),

    getGoal: state => (id: string): ReadingGoal | undefined => state.goals.find(goal => goal.id === id),

    /**
     * Progress counts every log entry (not `currentLogEntries`): a goal's own
     * start date bounds its reading, so the reading-tracker reset date doesn't apply.
     * Computed once per goal here so every view of a goal shares the result.
     */
    progressById(state): Record<string, ReadingGoalProgress> {
      const logEntries = useLogEntriesStore().logEntries;
      const date = today();
      return Object.fromEntries(state.goals.map(goal => [goal.id, computeGoalProgress(goal, logEntries, date)]));
    },

    getProgress() {
      return (goal: ReadingGoal): ReadingGoalProgress =>
        this.progressById[goal.id] ?? computeGoalProgress(goal, useLogEntriesStore().logEntries, today());
    },

    todayGoals(state): ReadingGoalWithProgress[] {
      const date = today();
      return state.goals
        .map(goal => ({ goal, progress: this.getProgress(goal) }))
        .filter(({ goal, progress }) => isGoalVisibleToday(goal, progress, date))
        .sort((a, b) => a.goal.endDate.localeCompare(b.goal.endDate));
    },

    /**
     * Every goal in exactly one group for the goals page. Finished goals are
     * `completed` whether or not they're archived; `archived` holds the
     * unfinished goals the reader has hidden from Today.
     */
    sections(state): Record<ReadingGoalSection, ReadingGoalWithProgress[]> {
      const sections: Record<ReadingGoalSection, ReadingGoalWithProgress[]> = {
        current: [],
        upcoming: [],
        completed: [],
        archived: [],
      };
      for (const goal of state.goals) {
        const progress = this.getProgress(goal);
        let section: ReadingGoalSection = 'current';
        if (progress.isComplete) { section = 'completed'; }
        else if (!goal.active) { section = 'archived'; }
        else if (progress.status === 'upcoming') { section = 'upcoming'; }
        sections[section].push({ goal, progress });
      }
      sections.current.sort((a, b) => a.goal.endDate.localeCompare(b.goal.endDate));
      sections.upcoming.sort((a, b) => a.goal.startDate.localeCompare(b.goal.startDate));
      sections.completed.sort((a, b) => b.progress.completedDate!.localeCompare(a.progress.completedDate!));
      return sections;
    },
  },

  actions: {
    async loadReadingGoals({ force = false }: { force?: boolean } = {}): Promise<void> {
      if (this.isLoaded && !force) { return; }
      const http = useHttp();
      const { data } = await http.get<ReadingGoal[]>('/api/reading-goals');
      this.goals = data;
      this.isLoaded = true;
    },

    async createGoal(input: ReadingGoalInput): Promise<ReadingGoal> {
      const http = useHttp();
      const { data } = await http.post<ReadingGoal>('/api/reading-goals', input);
      this.goals.push(data);
      return data;
    },

    async updateGoal(id: string, input: ReadingGoalInput): Promise<ReadingGoal> {
      const http = useHttp();
      const { data } = await http.patch<ReadingGoal>(`/api/reading-goals/${id}`, input);
      const index = this.goals.findIndex(goal => goal.id === id);
      if (index === -1) { this.goals.push(data); }
      else { this.goals.splice(index, 1, data); }
      return data;
    },

    setGoalActive(goal: ReadingGoal, active: boolean): Promise<ReadingGoal> {
      const { id: _id, ...input } = goal;
      return this.updateGoal(goal.id, { ...input, active });
    },

    async deleteGoal(id: string): Promise<boolean> {
      const http = useHttp();
      const { data } = await http.delete<number>(`/api/reading-goals/${id}`);
      if (!data) { return false; }
      this.goals = this.goals.filter(goal => goal.id !== id);
      return true;
    },
  },
});
