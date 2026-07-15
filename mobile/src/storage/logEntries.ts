import type { LogEntry } from "@/src/types/log-entry";
import { makeClientId } from "@/src/log-entries/sync";
import { appStorage } from "@/src/storage/keys";

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

export async function loadLogEntries(): Promise<StoredLogEntry[] | null> {
  const stored = await appStorage.get("logEntries");
  if (!Array.isArray(stored)) return null;

  const entries = stored.filter(isLogEntry);
  const withClientIds = ensureClientIds(entries);

  // If we had to migrate any entries, persist immediately.
  const changed = withClientIds.some((e, i) => e.clientId !== entries[i]?.clientId);
  if (changed) {
    void saveLogEntries(withClientIds);
  }
  return withClientIds;
}

export async function saveLogEntries(entries: StoredLogEntry[]): Promise<void> {
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
  await appStorage.set("logEntryMutations", mutations);
}
