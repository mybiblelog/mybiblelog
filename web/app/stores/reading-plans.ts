import { defineStore } from 'pinia';
import {
  MAX_READING_PLANS_PER_USER,
  deleteReadingPlanRequest,
  fetchReadingPlans,
  postReadingPlan,
  patchReadingPlan,
  type CreateReadingPlanInput,
  type HttpClient,
  type ReadingPlan,
  type UpdateReadingPlanInput,
} from '@mybiblelog/shared';

export type { ReadingPlan, CreateReadingPlanInput, UpdateReadingPlanInput };

/**
 * Reading plans store. Mirrors the `log-entries` store: it delegates the
 * network boundary to the shared `reading-plans-api` functions and keeps the
 * loaded plans in memory. The per-user plan limit is enforced by the API; the
 * `atPlanLimit` getter lets the UI disable "New Plan" and show a message before
 * the user hits it.
 */
export const useReadingPlansStore = defineStore('reading-plans', {
  state: () => ({
    plans: [] as ReadingPlan[],
    isLoaded: false,
  }),
  getters: {
    planLimit: () => MAX_READING_PLANS_PER_USER,
    atPlanLimit(state): boolean {
      return state.plans.length >= MAX_READING_PLANS_PER_USER;
    },
    getPlanById(state) {
      return (id: number | string): ReadingPlan | undefined =>
        state.plans.find(plan => `${plan.id}` === `${id}`);
    },
  },
  actions: {
    async loadReadingPlans(): Promise<ReadingPlan[]> {
      const http = useNuxtApp().$http as unknown as HttpClient;
      this.plans = await fetchReadingPlans(http);
      this.isLoaded = true;
      return this.plans;
    },

    async createReadingPlan(input: CreateReadingPlanInput): Promise<ReadingPlan> {
      const http = useNuxtApp().$http as unknown as HttpClient;
      const created = await postReadingPlan(http, input);
      this.plans.push(created);
      return created;
    },

    async updateReadingPlan(input: UpdateReadingPlanInput): Promise<ReadingPlan> {
      const http = useNuxtApp().$http as unknown as HttpClient;
      const updated = await patchReadingPlan(http, input);
      const existing = this.plans.find(plan => plan.id === updated.id);
      if (existing) {
        Object.assign(existing, updated);
      }
      else {
        this.plans.push(updated);
      }
      return updated;
    },

    async deleteReadingPlan(planId: number | string): Promise<boolean> {
      const http = useNuxtApp().$http as unknown as HttpClient;
      const deleted = await deleteReadingPlanRequest(http, planId);
      if (!deleted) {
        return false;
      }
      this.plans = this.plans.filter(plan => plan.id !== planId);
      return true;
    },
  },
});
