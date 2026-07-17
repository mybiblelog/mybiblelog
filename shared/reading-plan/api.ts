import type { HttpClient } from '../platform/http-client';

/**
 * Data-access functions for reading plans and plan trackers, expressed as
 * `(http, input) => Promise<…>` — the same network-boundary style as
 * `log-entries-api.ts`. State orchestration (achievements, tracker completion)
 * lives in the caller's state layer; these are only the HTTP calls.
 */

export type ReadingPlanPassage = {
  startVerseId: number;
  endVerseId: number;
  id?: string;
};

/** A plan day carries no stored number — day N is simply position N (1-based). */
export type ReadingPlanDay = {
  passages: ReadingPlanPassage[];
  id?: string;
};

export type ReadingPlan = {
  id: number | string;
  name: string;
  days: ReadingPlanDay[];
  [key: string]: unknown;
};

export type CreateReadingPlanInput = {
  name: string;
  days: { passages: { startVerseId: number; endVerseId: number }[] }[];
};

export type UpdateReadingPlanInput = CreateReadingPlanInput & {
  id: number | string;
};

export type PlanTracker = {
  id: number | string;
  planId: number | string;
  startDate: string; // YYYY-MM-DD
  completedDate: string | null; // YYYY-MM-DD once complete
  [key: string]: unknown;
};

export type CreatePlanTrackerInput = {
  planId: number | string;
  startDate: string;
};

export type UpdatePlanTrackerInput = {
  id: number | string;
  completedDate: string | null;
};

// --- Reading plans ---

export const fetchReadingPlans = async (http: HttpClient): Promise<ReadingPlan[]> => {
  const { data } = await http.get<ReadingPlan[]>('/api/reading-plans');
  return Array.isArray(data) ? data : [];
};

export const postReadingPlan = async (
  http: HttpClient,
  input: CreateReadingPlanInput,
): Promise<ReadingPlan> => {
  const { data } = await http.post<ReadingPlan>('/api/reading-plans', input);
  return data;
};

export const patchReadingPlan = async (
  http: HttpClient,
  { id, ...input }: UpdateReadingPlanInput,
): Promise<ReadingPlan> => {
  const { data } = await http.patch<ReadingPlan>(`/api/reading-plans/${id}`, input);
  return data;
};

export const deleteReadingPlanRequest = async (
  http: HttpClient,
  planId: number | string,
): Promise<boolean> => {
  const { data } = await http.delete<unknown>(`/api/reading-plans/${planId}`);
  return Boolean(data);
};

// --- Plan trackers ---

export const fetchPlanTrackers = async (http: HttpClient): Promise<PlanTracker[]> => {
  const { data } = await http.get<PlanTracker[]>('/api/plan-trackers');
  return Array.isArray(data) ? data : [];
};

export const postPlanTracker = async (
  http: HttpClient,
  input: CreatePlanTrackerInput,
): Promise<PlanTracker> => {
  const { data } = await http.post<PlanTracker>('/api/plan-trackers', input);
  return data;
};

export const patchPlanTracker = async (
  http: HttpClient,
  { id, ...input }: UpdatePlanTrackerInput,
): Promise<PlanTracker> => {
  const { data } = await http.patch<PlanTracker>(`/api/plan-trackers/${id}`, input);
  return data;
};

export const deletePlanTrackerRequest = async (
  http: HttpClient,
  trackerId: number | string,
): Promise<boolean> => {
  const { data } = await http.delete<unknown>(`/api/plan-trackers/${trackerId}`);
  return Boolean(data);
};
