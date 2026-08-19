import type { LogEntry } from "@/src/types/log-entry";
import { makeClientId } from "@/src/log-entries/sync";
import { appStorage } from "@/src/storage/keys";
import type { ReadResult } from "@/src/storage/typedStorage";

function isLogEntry(value: unknown): value is LogEntry {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    (v.id === undefined || typeof v.id === "string") &&
    (v.clientId === undefined || typeof v.clientId === "string") &&
    typeof v.startVerseId === "number" &&
    Number.isFinite(v.startVerseId) &&
    typeof v.endVerseId === "number" &&
    Number.isFinite(v.endVerseId) &&
    typeof v.date === "string"
  );
}

export type StoredLogEntry = LogEntry & { clientId: string };

function ensureClientIds(entries: LogEntry[]): StoredLogEntry[] {
  return entries.map((e) => ({
    ...e,
    clientId: e.clientId ?? e.id ?? makeClientId(),
  }));
}

async function parseStoredLogEntries(): Promise<
  ReadResult<{ entries: StoredLogEntry[]; migrated: boolean }>
> {
  const stored = await appStorage.read("logEntries");
  if (stored.status === "unreadable") return { status: "unreadable" };
  if (stored.status === "corrupt") return { status: "corrupt" };
  if (stored.status === "absent" || !Array.isArray(stored.value)) return { status: "absent" };

  const entries = stored.value.filter(isLogEntry);
  const withClientIds = ensureClientIds(entries);
  const migrated = withClientIds.some((e, i) => e.clientId !== entries[i]?.clientId);
  return { status: "ok", value: { entries: withClientIds, migrated } };
}

/**
 * Read the stored entries, reporting *why* an empty result is empty.
 *
 * `loadLogEntries` collapses every failure to `null`, which the hydrating store
 * turns into an empty list — indistinguishable, to the user, from having lost
 * their whole reading log. The rehydrator in `stores/logEntries.ts` needs the
 * difference so it only merges when the disk actually answered.
 *
 * Unlike `loadLogEntries` this never writes: the caller persists the value it
 * derives, and a backfill write racing that one could land last and win.
 */
export async function readLogEntries(): Promise<ReadResult<StoredLogEntry[]>> {
  const result = await parseStoredLogEntries();
  return result.status === "ok" ? { status: "ok", value: result.value.entries } : result;
}

export async function loadLogEntries(): Promise<StoredLogEntry[] | null> {
  const result = await parseStoredLogEntries();
  if (result.status !== "ok") return null;

  // If we had to migrate any entries, persist immediately.
  if (result.value.migrated) void saveLogEntries(result.value.entries);
  return result.value.entries;
}

export async function saveLogEntries(entries: StoredLogEntry[]): Promise<void> {
  await appStorage.setDerived("logEntries", entries);
}

/**
 * Persist a list that came from the API rather than from local storage.
 *
 * Server truth doesn't depend on what we managed to read locally, so this is an
 * authoritative write: it goes through even after a failed hydrate read, and
 * clears that key's quarantine so ordinary persistence resumes mid-session
 * instead of waiting for a relaunch.
 */
export async function saveLogEntriesFromServer(entries: StoredLogEntry[]): Promise<void> {
  await appStorage.set("logEntries", entries);
}

export type PendingLogEntryMutation =
  | {
      type: "create";
      clientId: string;
      entry: Pick<LogEntry, "date" | "startVerseId" | "endVerseId">;
      ts: number;
    }
  | {
      type: "update";
      clientId: string;
      id?: string;
      entry: Pick<LogEntry, "date" | "startVerseId" | "endVerseId">;
      ts: number;
    }
  | { type: "delete"; clientId: string; id?: string; ts: number };

function isPendingMutation(value: unknown): value is PendingLogEntryMutation {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (v.type !== "create" && v.type !== "update" && v.type !== "delete") return false;
  if (typeof v.clientId !== "string") return false;
  if (typeof v.ts !== "number") return false;
  if (v.type === "delete") return true;
  if (!v.entry || typeof v.entry !== "object") return false;
  const entry = v.entry as Record<string, unknown>;
  return (
    typeof entry.date === "string" &&
    typeof entry.startVerseId === "number" &&
    typeof entry.endVerseId === "number"
  );
}

export async function loadPendingLogEntryMutations(): Promise<PendingLogEntryMutation[]> {
  const stored = await appStorage.get("logEntryMutations");
  if (!Array.isArray(stored)) return [];
  return stored.filter(isPendingMutation);
}

export async function savePendingLogEntryMutations(
  mutations: PendingLogEntryMutation[]
): Promise<void> {
  await appStorage.setDerived("logEntryMutations", mutations);
}
