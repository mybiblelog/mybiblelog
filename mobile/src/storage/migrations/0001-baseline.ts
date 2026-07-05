import AsyncStorage from "@react-native-async-storage/async-storage";
import { makeClientId } from "@/src/log-entries/sync";

/**
 * Migration 0001 — backfill `clientId` on persisted log entries.
 *
 * Formalizes the implicit backfill that has lived inline in
 * `loadLogEntries` (`src/storage/logEntries.ts`): every stored entry must have a
 * stable `clientId` for offline-first edit/delete. Legacy entries persisted
 * before `clientId` existed derive it from their server `id`, or get a freshly
 * generated one.
 *
 * Frozen in time: this operates on the raw `logEntries.v1` JSON, never through
 * the typed `loadLogEntries`/`LogEntry` (which will drift). Idempotent — entries
 * that already have a `clientId` are left untouched, and an absent/empty key is
 * a no-op.
 */

const LOG_ENTRIES_KEY = "logEntries.v1";

export async function up(): Promise<void> {
  const raw = await AsyncStorage.getItem(LOG_ENTRIES_KEY);
  if (!raw) return;

  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) return;

  let changed = false;
  const next = parsed.map((entry) => {
    if (!entry || typeof entry !== "object") return entry;
    const record = entry as Record<string, unknown>;
    if (typeof record.clientId === "string" && record.clientId.length > 0) {
      return entry;
    }
    changed = true;
    const derived =
      typeof record.id === "string" && record.id.length > 0 ? record.id : makeClientId();
    return { ...record, clientId: derived };
  });

  if (changed) {
    await AsyncStorage.setItem(LOG_ENTRIES_KEY, JSON.stringify(next));
  }
}
