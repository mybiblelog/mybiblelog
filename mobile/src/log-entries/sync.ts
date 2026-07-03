import { ApiError } from '@/src/api/apiError';
import type { LogEntry } from '@/src/types/log-entry';
import type { PendingLogEntryMutation, StoredLogEntry } from '@/src/storage/logEntries';

/**
 * Pure offline-first helpers for the log-entries store.
 *
 * Extracted from the former `LogEntriesProvider` so they can be unit tested and
 * reused by the Zustand store. None of this has a web equivalent — it is the
 * mobile offline mutation queue and stays mobile-only. The network boundary
 * (create/update/delete) now goes through `shared/log-entries-api`; this module
 * only manages local state + the pending-mutation queue.
 */

export type LogEntryInput = Pick<LogEntry, 'date' | 'startVerseId' | 'endVerseId'>;

export function makeClientId(): string {
  return `le_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Canonical list order: newest date first, with a deterministic verse-range
 * tie-break for same-date entries. Applied both after API reloads and after
 * local mutations so the two paths can never disagree about ordering.
 */
export function compareEntriesNewestFirst(a: LogEntryInput, b: LogEntryInput): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  if (a.startVerseId !== b.startVerseId) return a.startVerseId - b.startVerseId;
  return a.endVerseId - b.endVerseId;
}

export function sortEntries(entries: StoredLogEntry[]): StoredLogEntry[] {
  return entries.slice().sort(compareEntriesNewestFirst);
}

/**
 * True when retrying a queued mutation can never succeed (a 4xx the server
 * will keep rejecting, e.g. validation failure or update/delete of an entry
 * that no longer exists). Auth (401/403), timeout (408) and rate-limit (429)
 * responses are transient — the token refresh / backoff path should retry
 * them — as are network errors, which don't produce an `ApiError` at all.
 */
export function isPermanentMutationError(err: unknown): boolean {
  if (!(err instanceof ApiError)) return false;
  const { status } = err;
  if (status === undefined) return false;
  if (status === 401 || status === 403 || status === 408 || status === 429) return false;
  return status >= 400 && status < 500;
}

export function toStored(entry: LogEntry, fallbackClientId?: string): StoredLogEntry {
  return {
    ...entry,
    clientId: entry.clientId ?? fallbackClientId ?? entry.id ?? makeClientId(),
  };
}

export function upsertLocal(entries: StoredLogEntry[], next: StoredLogEntry): StoredLogEntry[] {
  const idx = entries.findIndex((e) => e.clientId === next.clientId);
  if (idx === -1) return [next, ...entries];
  return entries.map((e) => (e.clientId === next.clientId ? next : e));
}

export function removeLocal(entries: StoredLogEntry[], clientId: string): StoredLogEntry[] {
  return entries.filter((e) => e.clientId !== clientId);
}

export function normalizeMutationQueue(
  mutations: PendingLogEntryMutation[],
): PendingLogEntryMutation[] {
  // Keep stable order, but ensure no invalid duplicates for same clientId+type.
  const seen = new Set<string>();
  const out: PendingLogEntryMutation[] = [];
  for (const m of mutations) {
    const key = `${m.clientId}:${m.type}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(m);
  }
  return out;
}

export function coalesceCreate(
  mutations: PendingLogEntryMutation[],
  clientId: string,
  entry: LogEntryInput,
): PendingLogEntryMutation[] {
  // If there's a delete for this entry, keep delete (user wants it gone).
  const hasDelete = mutations.some((m) => m.clientId === clientId && m.type === 'delete');
  if (hasDelete) return mutations;

  // Replace any existing create/update with the new create payload.
  const filtered = mutations.filter((m) => m.clientId !== clientId || m.type === 'delete');
  return normalizeMutationQueue([...filtered, { type: 'create', clientId, entry, ts: Date.now() }]);
}

export function coalesceUpdate(
  mutations: PendingLogEntryMutation[],
  clientId: string,
  id: string | undefined,
  entry: LogEntryInput,
): PendingLogEntryMutation[] {
  // If there's a delete, ignore further updates.
  const hasDelete = mutations.some((m) => m.clientId === clientId && m.type === 'delete');
  if (hasDelete) return mutations;

  // If there's a create, fold the update into the create payload.
  const existingCreate = mutations.find((m) => m.clientId === clientId && m.type === 'create');
  if (existingCreate && existingCreate.type === 'create') {
    return coalesceCreate(mutations, clientId, entry);
  }

  const filtered = mutations.filter((m) => !(m.clientId === clientId && m.type === 'update'));
  return normalizeMutationQueue([...filtered, { type: 'update', clientId, id, entry, ts: Date.now() }]);
}

export function coalesceDelete(
  mutations: PendingLogEntryMutation[],
  clientId: string,
  id: string | undefined,
): PendingLogEntryMutation[] {
  // If it was created offline and never synced, drop the create (and any update) and don't enqueue delete.
  const hasCreate = mutations.some((m) => m.clientId === clientId && m.type === 'create');
  if (hasCreate) {
    return mutations.filter((m) => m.clientId !== clientId);
  }

  const filtered = mutations.filter((m) => !(m.clientId === clientId && m.type === 'update'));
  // Replace existing delete (keep latest timestamp)
  const withoutDelete = filtered.filter((m) => !(m.clientId === clientId && m.type === 'delete'));
  return normalizeMutationQueue([...withoutDelete, { type: 'delete', clientId, id, ts: Date.now() }]);
}
