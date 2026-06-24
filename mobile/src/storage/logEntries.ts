import AsyncStorage from "@react-native-async-storage/async-storage";
import type { LogEntry } from "@/src/types/log-entry";

const STORAGE_KEY = "logEntries.v1";
const MUTATIONS_KEY = "logEntries.mutations.v1";

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

function makeClientId(): string {
  // Stable enough for client-side IDs without extra deps.
  return `le_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function ensureClientIds(entries: LogEntry[]): StoredLogEntry[] {
  return entries.map((e) => ({
    ...e,
    clientId: e.clientId ?? e.id ?? makeClientId(),
  }));
}

export async function loadLogEntries(): Promise<StoredLogEntry[] | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    const entries = parsed.filter(isLogEntry);
    const withClientIds = ensureClientIds(entries);

    // If we had to migrate any entries, persist immediately.
    const changed = withClientIds.some((e, i) => e.clientId !== (entries[i] as any)?.clientId);
    if (changed) {
      void saveLogEntries(withClientIds);
    }
    return withClientIds;
  } catch (err) {
    console.warn("Failed to load log entries", err);
    return null;
  }
}

export async function saveLogEntries(entries: StoredLogEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.warn("Failed to save log entries", err);
  }
}

export type PendingLogEntryMutation =
  | { type: "create"; clientId: string; entry: Pick<LogEntry, "date" | "startVerseId" | "endVerseId">; ts: number }
  | { type: "update"; clientId: string; id?: string; entry: Pick<LogEntry, "date" | "startVerseId" | "endVerseId">; ts: number }
  | { type: "delete"; clientId: string; id?: string; ts: number };

function isPendingMutation(value: unknown): value is PendingLogEntryMutation {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (v.type !== "create" && v.type !== "update" && v.type !== "delete") return false;
  if (typeof v.clientId !== "string") return false;
  if (typeof v.ts !== "number") return false;
  if (v.type === "delete") return true;
  const entry = v.entry as any;
  return (
    entry &&
    typeof entry.date === "string" &&
    typeof entry.startVerseId === "number" &&
    typeof entry.endVerseId === "number"
  );
}

export async function loadPendingLogEntryMutations(): Promise<PendingLogEntryMutation[]> {
  try {
    const raw = await AsyncStorage.getItem(MUTATIONS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isPendingMutation);
  } catch (err) {
    console.warn("Failed to load log entry mutations", err);
    return [];
  }
}export async function savePendingLogEntryMutations(
  mutations: PendingLogEntryMutation[]
): Promise<void> {
  try {
    await AsyncStorage.setItem(MUTATIONS_KEY, JSON.stringify(mutations));
  } catch (err) {
    console.warn("Failed to save log entry mutations", err);
  }
}
