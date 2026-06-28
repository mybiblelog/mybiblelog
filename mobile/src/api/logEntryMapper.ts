import type { LogEntry } from "@/src/types/log-entry";

/**
 * Coerces a raw API log entry into the mobile `LogEntry` shape.
 *
 * The shared `log-entries-api` functions return the payload verbatim, whereas
 * the mobile app needs the tolerant coercion the old `logEntriesApi.ts` did:
 * accept `_id` or `id`, normalize the id to a string, and coerce numeric verse
 * ids that may arrive as strings. Returns `null` for unusable rows.
 */

function extractId(value: Record<string, unknown>): string | null {
  if (typeof value.id === "string") return value.id;
  if (typeof value.id === "number") return String(value.id);
  if (typeof value._id === "string") return value._id;
  return null;
}

function toNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
}

export function parseApiLogEntry(value: unknown): LogEntry | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const id = extractId(v);
  const date = typeof v.date === "string" ? v.date : null;
  const startVerseId = toNumber(v.startVerseId);
  const endVerseId = toNumber(v.endVerseId);
  if (!date || startVerseId === null || endVerseId === null) return null;
  return { id: id ?? undefined, date, startVerseId, endVerseId };
}

export function parseApiLogEntries(value: unknown): LogEntry[] {
  if (!Array.isArray(value)) return [];
  return value.map(parseApiLogEntry).filter((e): e is LogEntry => e !== null);
}
