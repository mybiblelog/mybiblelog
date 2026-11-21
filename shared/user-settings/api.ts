import type { HttpClient } from '../platform/http-client.js';

export type ServerUserSettings = {
  dailyVerseCountGoal?: number;
  lookBackDate?: string;
  preferredBibleVersion?: string;
  startPage?: string;
  locale?: string;
  passageNoteTagSortOrder?: string;
  includeDeuterocanonical?: boolean;
};

const toNumber = (v: unknown): number | undefined => {
  if (typeof v === 'number' && Number.isFinite(v)) { return v; }
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) { return Number(v); }
  return undefined;
};

const toString = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);

export function parseServerUserSettings(value: unknown): ServerUserSettings | null {
  if (!value || typeof value !== 'object') { return null; }
  const v = value as Record<string, unknown>;
  return {
    dailyVerseCountGoal: toNumber(v.dailyVerseCountGoal),
    lookBackDate: toString(v.lookBackDate),
    preferredBibleVersion: toString(v.preferredBibleVersion),
    startPage: toString(v.startPage),
    locale: toString(v.locale),
    passageNoteTagSortOrder: toString(v.passageNoteTagSortOrder),
    includeDeuterocanonical: typeof v.includeDeuterocanonical === 'boolean' ? v.includeDeuterocanonical : undefined,
  };
}

const requireSettings = (value: unknown, request: string): ServerUserSettings => {
  const parsed = parseServerUserSettings(value);
  if (!parsed) { throw new Error(`${request} returned unexpected payload`); }
  return parsed;
};

export const fetchUserSettings = async (http: HttpClient): Promise<ServerUserSettings> => {
  const { data } = await http.get<unknown>('/api/settings');
  return requireSettings(data, 'GET /settings');
};

export const patchUserSettings = async (
  http: HttpClient,
  settings: Partial<ServerUserSettings>,
): Promise<ServerUserSettings> => {
  const { data } = await http.patch<unknown>('/api/settings', { settings });
  return requireSettings(data, 'PATCH /settings');
};

/** Permanently deletes the authenticated user's account and all associated data. */
export const deleteUserAccount = async (http: HttpClient): Promise<void> => {
  await http.delete('/api/settings/account');
};
