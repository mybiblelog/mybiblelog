import type { LogEntry } from "@/src/types/log-entry";
import { getApiBaseUrl } from "@/src/api/apiBase";

type ApiListResponse = { data?: unknown };

type ApiCreateUpdateResponse = { data?: unknown };

function extractId(value: any): string | null {
  if (!value || typeof value !== "object") return null;
  if (typeof value.id === "string") return value.id;
  if (typeof value._id === "string") return value._id;
  return null;
}

function toNumber(v: any): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
}

export function parseApiLogEntry(value: unknown): LogEntry | null {
  const v = value as any;
  if (!v || typeof v !== "object") return null;
  const id = extractId(v);
  const date = typeof v.date === "string" ? v.date : null;
  const startVerseId = toNumber(v.startVerseId);
  const endVerseId = toNumber(v.endVerseId);
  if (!date || startVerseId === null || endVerseId === null) return null;
  return { id: id ?? undefined, date, startVerseId, endVerseId };
}

async function apiFetch(
  token: string,
  path: string,
  init?: RequestInit
): Promise<Response> {
  return fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
}

export async function getLogEntries(token: string): Promise<LogEntry[]> {
  const res = await apiFetch(token, "/log-entries", { method: "GET" });
  if (!res.ok) throw new Error(`GET /log-entries failed: ${res.status}`);
  const json = (await res.json()) as ApiListResponse;
  const raw = (json as any)?.data;
  if (!Array.isArray(raw)) return [];
  return raw.map(parseApiLogEntry).filter(Boolean) as LogEntry[];
}

export async function createLogEntry(
  token: string,
  entry: Pick<LogEntry, "date" | "startVerseId" | "endVerseId">
): Promise<LogEntry> {
  const res = await apiFetch(token, "/log-entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  if (!res.ok) throw new Error(`POST /log-entries failed: ${res.status}`);
  const json = (await res.json()) as ApiCreateUpdateResponse;
  const parsed = parseApiLogEntry((json as any)?.data);
  if (!parsed) throw new Error("POST /log-entries returned unexpected payload");
  return parsed;
}

export async function updateLogEntry(
  token: string,
  id: string,
  entry: Pick<LogEntry, "date" | "startVerseId" | "endVerseId">
): Promise<LogEntry> {
  const res = await apiFetch(token, `/log-entries/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  if (!res.ok) throw new Error(`PUT /log-entries/${id} failed: ${res.status}`);
  const json = (await res.json()) as ApiCreateUpdateResponse;
  const parsed = parseApiLogEntry((json as any)?.data);
  if (!parsed) throw new Error("PUT /log-entries returned unexpected payload");
  return parsed;
}

export async function deleteLogEntry(token: string, id: string): Promise<void> {
  const res = await apiFetch(token, `/log-entries/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`DELETE /log-entries/${id} failed: ${res.status}`);
}

