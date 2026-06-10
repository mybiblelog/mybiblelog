/**
 * API-based data seeding for e2e tests.
 *
 * All functions take an authenticated APIRequestContext (the `api` fixture)
 * and depend only on the public HTTP contract:
 *   - POST /api/log-entries        { date, startVerseId, endVerseId }
 *   - POST /api/passage-note-tags  { label, color, description? }
 *   - POST /api/passage-notes      { content, passages: [{ startVerseId, endVerseId }], tags?: [tagId] }
 *   - PUT  /api/settings           { settings: { ...partial } }
 */
import type { APIRequestContext, APIResponse } from '@playwright/test';

export interface SeedLogEntry {
  date: string; // YYYY-MM-DD
  startVerseId: number;
  endVerseId: number;
}

export interface SeedTag {
  label: string;
  color: string; // hex, e.g. '#ff0000'
  description?: string;
}

export interface SeedNote {
  content: string;
  passages: { startVerseId: number; endVerseId: number }[];
  tags?: string[]; // tag ids
}

export interface UserSettingsPatch {
  dailyVerseCountGoal?: number;
  lookBackDate?: string;
  preferredBibleVersion?: string;
  startPage?: string;
  passageNoteTagSortOrder?: string;
  locale?: string;
}

const ensureOk = async (response: APIResponse, label: string): Promise<APIResponse> => {
  if (!response.ok()) {
    throw new Error(`${label} failed: ${response.status()} ${await response.text()}`);
  }
  return response;
};

const dataOf = async (response: APIResponse) => (await response.json()).data;

export async function seedLogEntries(api: APIRequestContext, entries: SeedLogEntry[]) {
  const created = [];
  for (const entry of entries) {
    const response = await ensureOk(await api.post('/api/log-entries', { data: entry }), 'seed log entry');
    created.push(await dataOf(response));
  }
  return created;
}

export async function seedTag(api: APIRequestContext, tag: SeedTag) {
  const response = await ensureOk(await api.post('/api/passage-note-tags', { data: tag }), 'seed tag');
  return dataOf(response);
}

export async function seedNote(api: APIRequestContext, note: SeedNote) {
  const response = await ensureOk(await api.post('/api/passage-notes', { data: note }), 'seed note');
  return dataOf(response);
}

export async function setSettings(api: APIRequestContext, settings: UserSettingsPatch) {
  const response = await ensureOk(await api.put('/api/settings', { data: { settings } }), 'update settings');
  return dataOf(response);
}

export async function getLogEntries(api: APIRequestContext) {
  const response = await ensureOk(await api.get('/api/log-entries'), 'get log entries');
  return dataOf(response);
}
