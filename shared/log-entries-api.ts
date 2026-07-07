import type { HttpClient } from './http-client';

/**
 * Data-access functions for log entries, expressed as
 * `(http, input) => Promise<…>` rather than reaching for an ambient client.
 *
 * The Nuxt Pinia store passes its injected `$http`; a React Query mutation or
 * Zustand action could pass any `HttpClient` implementation and reuse these
 * verbatim. Achievement/side-effect orchestration stays in the state layer —
 * these functions are just the network boundary.
 */

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

export const fetchLogEntries = async (http: HttpClient): Promise<LogEntry[]> => {
  const { data } = await http.get<LogEntry[]>('/api/log-entries');
  return Array.isArray(data) ? data : [];
};

export const postLogEntry = async (
  http: HttpClient,
  input: CreateLogEntryInput,
): Promise<LogEntry> => {
  const { data } = await http.post<LogEntry>('/api/log-entries', input);
  return data;
};

export const patchLogEntry = async (
  http: HttpClient,
  { id, ...input }: UpdateLogEntryInput,
): Promise<LogEntry> => {
  const { data } = await http.patch<LogEntry>(`/api/log-entries/${id}`, input);
  return data;
};

export const deleteLogEntryRequest = async (
  http: HttpClient,
  logEntryId: number | string,
): Promise<boolean> => {
  const { data } = await http.delete<unknown>(`/api/log-entries/${logEntryId}`);
  return Boolean(data);
};
