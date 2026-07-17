import { defineStore } from 'pinia';
import {
  deletePlanTrackerRequest,
  fetchPlanTrackers,
  postPlanTracker,
  patchPlanTracker,
  type CreatePlanTrackerInput,
  type HttpClient,
  type PlanTracker,
} from '@mybiblelog/shared';

export type { PlanTracker, CreatePlanTrackerInput };

/**
 * Plan trackers store. A tracker is an active attempt at following a reading
 * plan; `activeTrackers` (those without a completed date) drive the Today-page
 * suggestions. Completion is detected in the `log-entries` store when a logged
 * reading finishes a plan.
 */
export const usePlanTrackersStore = defineStore('plan-trackers', {
  state: () => ({
    trackers: [] as PlanTracker[],
    isLoaded: false,
  }),
  getters: {
    activeTrackers(state): PlanTracker[] {
      return state.trackers.filter(tracker => !tracker.completedDate);
    },
    activeTrackerForPlan() {
      return (planId: number | string): PlanTracker | undefined =>
        this.activeTrackers.find(tracker => `${tracker.planId}` === `${planId}`);
    },
  },
  actions: {
    async loadPlanTrackers(): Promise<PlanTracker[]> {
      const http = useNuxtApp().$http as unknown as HttpClient;
      this.trackers = await fetchPlanTrackers(http);
      this.isLoaded = true;
      return this.trackers;
    },

    async createPlanTracker(input: CreatePlanTrackerInput): Promise<PlanTracker> {
      const http = useNuxtApp().$http as unknown as HttpClient;
      const created = await postPlanTracker(http, input);
      this.trackers.push(created);
      return created;
    },

    /** Marks a tracker complete on the given date (the log entry that finished it). */
    async completePlanTracker(trackerId: number | string, completedDate: string): Promise<PlanTracker> {
      const http = useNuxtApp().$http as unknown as HttpClient;
      const updated = await patchPlanTracker(http, { id: trackerId, completedDate });
      const existing = this.trackers.find(tracker => tracker.id === updated.id);
      if (existing) {
        Object.assign(existing, updated);
      }
      return updated;
    },

    async deletePlanTracker(trackerId: number | string): Promise<boolean> {
      const http = useNuxtApp().$http as unknown as HttpClient;
      const deleted = await deletePlanTrackerRequest(http, trackerId);
      if (!deleted) {
        return false;
      }
      this.trackers = this.trackers.filter(tracker => tracker.id !== trackerId);
      return true;
    },
  },
});
