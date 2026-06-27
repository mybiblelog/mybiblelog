import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNetInfo } from "@react-native-community/netinfo";
import type { LogEntry } from "@/src/types/log-entry";
import { useAuth } from "@/src/auth/AuthProvider";
import {
  type PendingLogEntryMutation,
  type StoredLogEntry,
  loadLogEntries,
  loadPendingLogEntryMutations,
  saveLogEntries,
  savePendingLogEntryMutations,
} from "@/src/storage/logEntries";
import {
  createLogEntry,
  deleteLogEntry,
  getLogEntries,
  updateLogEntry,
} from "@/src/api/logEntriesApi";

type LogEntriesState =
  | { status: "loading" }
  | { status: "ready"; entries: StoredLogEntry[]; isSyncing: boolean };

type LogEntriesContextValue = {
  state: LogEntriesState;
  reloadFromApi: () => Promise<void>;
  syncNow: () => Promise<void>;
  createEntry: (entry: LogEntry) => Promise<void>;
  updateEntry: (clientId: string, entry: LogEntry) => Promise<void>;
  deleteEntry: (clientId: string) => Promise<void>;
};

const LogEntriesContext = createContext<LogEntriesContextValue | null>(null);

function now() {
  return Date.now();
}

function makeClientId(): string {
  return `le_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function toStored(entry: LogEntry, fallbackClientId?: string): StoredLogEntry {
  return {
    ...entry,
    clientId: entry.clientId ?? fallbackClientId ?? entry.id ?? makeClientId(),
  };
}

function upsertLocal(entries: StoredLogEntry[], next: StoredLogEntry): StoredLogEntry[] {
  const idx = entries.findIndex((e) => e.clientId === next.clientId);
  if (idx === -1) return [next, ...entries];
  return entries.map((e) => (e.clientId === next.clientId ? next : e));
}

function removeLocal(entries: StoredLogEntry[], clientId: string): StoredLogEntry[] {
  return entries.filter((e) => e.clientId !== clientId);
}

function normalizeMutationQueue(
  mutations: PendingLogEntryMutation[]
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

function coalesceCreate(
  mutations: PendingLogEntryMutation[],
  clientId: string,
  entry: Pick<LogEntry, "date" | "startVerseId" | "endVerseId">
): PendingLogEntryMutation[] {
  // If there's a delete for this entry, keep delete (user wants it gone).
  const hasDelete = mutations.some((m) => m.clientId === clientId && m.type === "delete");
  if (hasDelete) return mutations;

  // Replace any existing create/update with the new create payload.
  const filtered = mutations.filter(
    (m) => m.clientId !== clientId || m.type === "delete"
  );
  return normalizeMutationQueue([
    ...filtered,
    { type: "create", clientId, entry, ts: now() },
  ]);
}

function coalesceUpdate(
  mutations: PendingLogEntryMutation[],
  clientId: string,
  id: string | undefined,
  entry: Pick<LogEntry, "date" | "startVerseId" | "endVerseId">
): PendingLogEntryMutation[] {
  // If there's a delete, ignore further updates.
  const hasDelete = mutations.some((m) => m.clientId === clientId && m.type === "delete");
  if (hasDelete) return mutations;

  // If there's a create, fold the update into the create payload.
  const existingCreate = mutations.find((m) => m.clientId === clientId && m.type === "create");
  if (existingCreate && existingCreate.type === "create") {
    return coalesceCreate(mutations, clientId, entry);
  }

  const filtered = mutations.filter((m) => !(m.clientId === clientId && m.type === "update"));
  return normalizeMutationQueue([
    ...filtered,
    { type: "update", clientId, id, entry, ts: now() },
  ]);
}

function coalesceDelete(
  mutations: PendingLogEntryMutation[],
  clientId: string,
  id: string | undefined
): PendingLogEntryMutation[] {
  // If it was created offline and never synced, drop the create (and any update) and don't enqueue delete.
  const hasCreate = mutations.some((m) => m.clientId === clientId && m.type === "create");
  if (hasCreate) {
    return mutations.filter((m) => m.clientId !== clientId);
  }

  const filtered = mutations.filter((m) => !(m.clientId === clientId && m.type === "update"));
  // Replace existing delete (keep latest timestamp)
  const withoutDelete = filtered.filter((m) => !(m.clientId === clientId && m.type === "delete"));
  return normalizeMutationQueue([
    ...withoutDelete,
    { type: "delete", clientId, id, ts: now() },
  ]);
}

function computeIsOnline(netInfo: ReturnType<typeof useNetInfo>): boolean | null {
  return netInfo.isInternetReachable === null ? netInfo.isConnected : netInfo.isInternetReachable;
}

export function LogEntriesProvider({ children }: { children: ReactNode }) {
  const { state: authState } = useAuth();
  const netInfo = useNetInfo();
  const isOnline = computeIsOnline(netInfo);

  const [state, setState] = useState<LogEntriesState>({ status: "loading" });
  const syncInFlightRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const stored = await loadLogEntries();
      if (!isMounted) return;
      setState({ status: "ready", entries: stored ?? [], isSyncing: false });
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (state.status !== "ready") return;
    void saveLogEntries(state.entries);
  }, [state]);

  async function withReady<T>(fn: (s: { entries: StoredLogEntry[]; isSyncing: boolean }) => Promise<T>): Promise<T> {
    if (state.status !== "ready") throw new Error("Log entries not loaded");
    return fn(state);
  }

  async function reloadFromApi(): Promise<void> {
    if (authState.status !== "authenticated") return;
    if (isOnline !== true) return;
    try {
      await withReady(async () => {
        const remote = await getLogEntries(authState.session.token);
        const stored = remote
          .map((e) => toStored(e, e.id ?? undefined))
          // Prefer newest first (matches existing UI add-to-front behavior)
          .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
        setState((prev) =>
          prev.status === "ready"
            ? { ...prev, entries: stored }
            : prev
        );
        await saveLogEntries(stored);
      });
    } catch {
      // Network or API error: keep current local state, fail gracefully
    }
  }

  async function syncNow(): Promise<void> {
    if (syncInFlightRef.current) return syncInFlightRef.current;
    if (authState.status !== "authenticated") return;
    if (isOnline !== true) return;
    if (state.status !== "ready") return;

    syncInFlightRef.current = (async () => {
      setState((prev) => (prev.status === "ready" ? { ...prev, isSyncing: true } : prev));

      try {
        // Ensure legacy unsynced entries (no id) are represented as creates.
        const currentEntries = state.status === "ready" ? state.entries : [];
        let mutations = await loadPendingLogEntryMutations();

        const deletedClientIds = new Set(
          mutations.filter((m) => m.type === "delete").map((m) => m.clientId)
        );

        for (const e of currentEntries) {
          if (e.id) continue;
          if (deletedClientIds.has(e.clientId)) continue;
          const alreadyQueued = mutations.some(
            (m) => m.clientId === e.clientId && (m.type === "create" || m.type === "update")
          );
          if (alreadyQueued) continue;
          mutations = coalesceCreate(mutations, e.clientId, {
            date: e.date,
            startVerseId: e.startVerseId,
            endVerseId: e.endVerseId,
          });
        }

        mutations = mutations.sort((a, b) => a.ts - b.ts);
        await savePendingLogEntryMutations(mutations);

        // Apply mutations to API.
        const token = authState.session.token;
        const remaining: PendingLogEntryMutation[] = [];

        for (const m of mutations) {
          try {
            if (m.type === "create") {
              await createLogEntry(token, m.entry);
              continue;
            }
            if (m.type === "update") {
              const id = m.id;
              if (!id) {
                // No server ID yet: treat as create.
                await createLogEntry(token, m.entry);
                continue;
              }
              await updateLogEntry(token, id, m.entry);
              continue;
            }
            if (m.type === "delete") {
              const id = m.id;
              if (!id) {
                // Local-only entry was deleted before sync; nothing to do.
                continue;
              }
              await deleteLogEntry(token, id);
              continue;
            }
          } catch {
            remaining.push(m);
          }
        }

        await savePendingLogEntryMutations(remaining);

        // Only reload if we drained the queue; otherwise keep current offline-local state.
        if (remaining.length === 0) {
          await reloadFromApi();
        }
      } catch {
        // Network or API error: keep local state, fail gracefully
      } finally {
        setState((prev) => (prev.status === "ready" ? { ...prev, isSyncing: false } : prev));
        syncInFlightRef.current = null;
      }
    })();

    return syncInFlightRef.current;
  }

  // Background sync when we become online+authenticated.
  useEffect(() => {
    if (state.status !== "ready") return;
    if (authState.status !== "authenticated") return;
    if (isOnline !== true) return;
    void syncNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState.status, isOnline, state.status]);

  async function createEntry(entry: LogEntry): Promise<void> {
    const input = { date: entry.date, startVerseId: entry.startVerseId, endVerseId: entry.endVerseId };
    if (authState.status === "authenticated" && isOnline === true) {
      try {
        await createLogEntry(authState.session.token, input);
        await reloadFromApi();
        return;
      } catch {
        // fall back to offline queue
      }
    }

    await withReady(async ({ entries }) => {
      const clientId = makeClientId();
      const stored = toStored(entry, clientId);
      const nextEntries = [stored, ...entries];
      setState((prev) => (prev.status === "ready" ? { ...prev, entries: nextEntries } : prev));

      let mutations = await loadPendingLogEntryMutations();
      mutations = coalesceCreate(mutations, clientId, input);
      await savePendingLogEntryMutations(mutations);

      if (authState.status === "authenticated" && isOnline === true) {
        void syncNow();
      }
    });
  }

  async function updateEntry(clientId: string, entry: LogEntry): Promise<void> {
    const input = { date: entry.date, startVerseId: entry.startVerseId, endVerseId: entry.endVerseId };
    const current = state.status === "ready" ? state.entries.find((e) => e.clientId === clientId) : undefined;
    const id = current?.id ?? entry.id;

    if (authState.status === "authenticated" && isOnline === true) {
      try {
        if (id) {
          await updateLogEntry(authState.session.token, id, input);
        } else {
          await createLogEntry(authState.session.token, input);
        }
        await reloadFromApi();
        return;
      } catch {
        // fall back to offline queue
      }
    }

    await withReady(async ({ entries }) => {
      const next = toStored({ ...entry, id }, clientId);
      const nextEntries = upsertLocal(entries, next);
      setState((prev) => (prev.status === "ready" ? { ...prev, entries: nextEntries } : prev));

      let mutations = await loadPendingLogEntryMutations();
      mutations = coalesceUpdate(mutations, clientId, id, input);
      await savePendingLogEntryMutations(mutations);

      if (authState.status === "authenticated" && isOnline === true) {
        void syncNow();
      }
    });
  }

  async function deleteEntry(clientId: string): Promise<void> {
    const current = state.status === "ready" ? state.entries.find((e) => e.clientId === clientId) : undefined;
    const id = current?.id;

    if (authState.status === "authenticated" && isOnline === true) {
      try {
        if (id) {
          await deleteLogEntry(authState.session.token, id);
          await reloadFromApi();
          return;
        }
        // No server ID => local-only; fall through to local delete.
      } catch {
        // fall back to offline queue
      }
    }

    await withReady(async ({ entries }) => {
      const nextEntries = removeLocal(entries, clientId);
      setState((prev) => (prev.status === "ready" ? { ...prev, entries: nextEntries } : prev));

      let mutations = await loadPendingLogEntryMutations();
      mutations = coalesceDelete(mutations, clientId, id);
      await savePendingLogEntryMutations(mutations);

      if (authState.status === "authenticated" && isOnline === true) {
        void syncNow();
      }
    });
  }

  const value = useMemo<LogEntriesContextValue>(
    () => ({
      state,
      reloadFromApi,
      syncNow,
      createEntry,
      updateEntry,
      deleteEntry,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, authState.status, isOnline]
  );

  return <LogEntriesContext.Provider value={value}>{children}</LogEntriesContext.Provider>;
}

export function useLogEntries() {
  const ctx = useContext(LogEntriesContext);
  if (!ctx) throw new Error("useLogEntries must be used within LogEntriesProvider");
  return ctx;
}

