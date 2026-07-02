import { getApiBaseUrl } from '@/src/api/apiBase';

export type ServerUserSettings = {
  dailyVerseCountGoal?: number;
  lookBackDate?: string;
  preferredBibleVersion?: string;
  startPage?: string;
  locale?: string;
};

type ApiResponse<T> = { data?: T };

async function apiFetch(token: string, path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
}

function toNumber(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  return undefined;
}

export function parseServerUserSettings(value: unknown): ServerUserSettings | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  return {
    dailyVerseCountGoal: toNumber(v.dailyVerseCountGoal),
    lookBackDate: typeof v.lookBackDate === 'string' ? v.lookBackDate : undefined,
    preferredBibleVersion:
      typeof v.preferredBibleVersion === 'string' ? v.preferredBibleVersion : undefined,
    startPage: typeof v.startPage === 'string' ? v.startPage : undefined,
    locale: typeof v.locale === 'string' ? v.locale : undefined,
  };
}

export async function getSettings(token: string): Promise<ServerUserSettings> {
  const res = await apiFetch(token, '/settings', { method: 'GET' });
  if (!res.ok) throw new Error(`GET /settings failed: ${res.status}`);
  const json = (await res.json()) as ApiResponse<unknown>;
  const parsed = parseServerUserSettings(json.data);
  if (!parsed) throw new Error('GET /settings returned unexpected payload');
  return parsed;
}

export async function updateSettings(
  token: string,
  settings: Partial<ServerUserSettings>,
): Promise<ServerUserSettings> {
  const res = await apiFetch(token, '/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ settings }),
  });
  if (!res.ok) throw new Error(`PUT /settings failed: ${res.status}`);
  const json = (await res.json()) as ApiResponse<unknown>;
  const parsed = parseServerUserSettings(json.data);
  if (!parsed) throw new Error('PUT /settings returned unexpected payload');
  return parsed;
}

/**
 * Permanently delete the authenticated user's account and all associated data
 * (log entries, notes, tags, reminders). Mirrors the web app's
 * `PUT /settings/delete-account` flow. The caller is responsible for clearing
 * the local session afterward (the server also clears the auth cookie).
 */
export async function deleteAccount(token: string): Promise<void> {
  const res = await apiFetch(token, '/settings/delete-account', { method: 'PUT' });
  if (!res.ok) throw new Error(`PUT /settings/delete-account failed: ${res.status}`);
}

