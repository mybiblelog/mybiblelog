import { create } from "zustand";
import {
  type CreateLogEntryInput,
  deleteLogEntryRequest,
  fetchLogEntries,
  isBibleComplete as isBibleCompleteShared,
  postLogEntry,
  putLogEntry,
} from "@mybiblelog/shared";
import type { LogEntry } from "@/src/types/log-entry";
import { httpClient } from "@/src/api/httpClient";
import { parseApiLogEntries, parseApiLogEntry } from "@/src/api/logEntryMapper";
import {
  type PendingLogEntryMutation,
  type StoredLogEntry,
  loadLogEntries,
  loadPendingLogEntryMutations,
  saveLogEntries,
  savePendingLogEntryMutations,
} from "@/src/storage/logEntries";
import {
  coalesceCreate,
  coalesceDelete,
  coalesceUpdate,
  makeClientId,
  removeLocal,
  toStored,
  upsertLocal,
} from "@/src/log-entries/sync";
import { useAuthStore } from "@/src/stores/auth";
import { getIsOnline, useConnectivityStore } from "@/src/stores/connectivity";

/**
 * Log-entries store (Zustand).
 *
 * Replaces `LogEntriesProvider`. The online path mirrors `nuxt/stores/log-entries`
 * (uses the shared `fetchLogEntries`/`postLogEntry`/… over an injected
 * `HttpClient`), while the offline-first mutation queue — which has no web
 * equivalent — is preserved verbatim from the former provider. `useLogEntries()`
 * keeps the previous provider contract so consumers only change imports.
 */

export type LogEntriesState =
  | { status: "loading" }
  | { status: "ready"; entries: StoredLogEntry[]; isSyncing: boolean };

type LogEntriesStore = {
  state: LogEntriesState;
  reloadFromApi: () => Promise<void>;
  syncNow: () => Promise<void>;
  createEntry: (entry: LogEntry) => Promise<void>;
  updateEntry: (clientId: string, entry: LogEntry) => Promise<void>;
  deleteEntry: (clientId: string) => Promise<void>;
};

function isAuthenticated(): boolean {
  return useAuthStore.getState().state.status === "authenticated";
}

let syncInFlight: Promise<void> | null = null;

export const useLogEntriesStore = create<LogEntriesStore>((set, get) => ({
  state: { status: "loading" },

  async reloadFromApi() {
    if (!isAuthenticated()) return;
    if (getIsOnline() !== true) return;
    if (get().state.status !== "ready") return;
    try {
      const remote = parseApiLogEntries(await fetchLogEntries(httpClient));
      const stored = remote
        .map((e) => toStored(e, e.id ?? undefined))
        // Prefer newest first (matches existing UI add-to-front behavior)
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
      const current = get().state;
      if (current.status === "ready") {
        set({ state: { ...current, entries: stored } });
        await saveLogEntries(stored);
      }
    } catch {
      // Network or API error: keep current local state, fail gracefully
    }
  },

  async syncNow() {
    if (syncInFlight) return syncInFlight;
    if (!isAuthenticated()) return;
    if (getIsOnline() !== true) return;
    if (get().state.status !== "ready") return;

    syncInFlight = (async () => {
      const ready = get().state;
      if (ready.status === "ready") set({ state: { ...ready, isSyncing: true } });

      try {
        const currentEntries = get().state.status === "ready"
          ? (get().state as { entries: StoredLogEntry[] }).entries
          : [];
        let mutations = await loadPendingLogEntryMutations();

        const deletedClientIds = new Set(
          mutations.filter((m) => m.type === "delete").map((m) => m.clientId),
        );

        // Ensure legacy unsynced entries (no id) are represented as creates.
        for (const e of currentEntries) {
          if (e.id) continue;
          if (deletedClientIds.has(e.clientId)) continue;
          const alreadyQueued = mutations.some(
            (m) => m.clientId === e.clientId && (m.type === "create" || m.type === "update"),
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

        // Apply mutations to API via the shared data-access functions.
        const remaining: PendingLogEntryMutation[] = [];
        for (const m of mutations) {
          try {
            if (m.type === "create") {
              await postLogEntry(httpClient, m.entry);
              continue;
            }
            if (m.type === "update") {
              if (!m.id) {
                // No server ID yet: treat as create.
                await postLogEntry(httpClient, m.entry);
                continue;
              }
              await putLogEntry(httpClient, { id: m.id, ...m.entry });
              continue;
            }
            if (m.type === "delete") {
              if (!m.id) {
                // Local-only entry was deleted before sync; nothing to do.
                continue;
              }
              await deleteLogEntryRequest(httpClient, m.id);
              continue;
            }
          } catch {
            remaining.push(m);
          }
        }

        await savePendingLogEntryMutations(remaining);

        // Only reload if we drained the queue; otherwise keep current offline-local state.
        if (remaining.length === 0) {
          await get().reloadFromApi();
        }
      } catch {
        // Network or API error: keep local state, fail gracefully
      } finally {
        const after = get().state;
        if (after.status === "ready") set({ state: { ...after, isSyncing: false } });
        syncInFlight = null;
      }
    })();

    return syncInFlight;
  },

  async createEntry(entry) {
    const input: CreateLogEntryInput = {
      date: entry.date,
      startVerseId: entry.startVerseId,
      endVerseId: entry.endVerseId,
    };
    if (isAuthenticated() && getIsOnline() === true) {
      try {
        parseApiLogEntry(await postLogEntry(httpClient, input));
        await get().reloadFromApi();
        return;
      } catch {
        // fall back to offline queue
      }
    }

    const current = get().state;
    if (current.status !== "ready") return;

    const clientId = makeClientId();
    const stored = toStored(entry, clientId);
    set({ state: { ...current, entries: [stored, ...current.entries] } });

    let mutations = await loadPendingLogEntryMutations();
    mutations = coalesceCreate(mutations, clientId, input);
    await savePendingLogEntryMutations(mutations);

    if (isAuthenticated() && getIsOnline() === true) void get().syncNow();
  },

  async updateEntry(clientId, entry) {
    const input: CreateLogEntryInput = {
      date: entry.date,
      startVerseId: entry.startVerseId,
      endVerseId: entry.endVerseId,
    };
    const current = get().state;
    const existing =
      current.status === "ready" ? current.entries.find((e) => e.clientId === clientId) : undefined;
    const id = existing?.id ?? entry.id;

    if (isAuthenticated() && getIsOnline() === true) {
      try {
        if (id) {
          await putLogEntry(httpClient, { id, ...input });
        } else {
          await postLogEntry(httpClient, input);
        }
        await get().reloadFromApi();
        return;
      } catch {
        // fall back to offline queue
      }
    }

    if (current.status !== "ready") return;
    const next = toStored({ ...entry, id }, clientId);
    set({ state: { ...current, entries: upsertLocal(current.entries, next) } });

    let mutations = await loadPendingLogEntryMutations();
    mutations = coalesceUpdate(mutations, clientId, id, input);
    await savePendingLogEntryMutations(mutations);

    if (isAuthenticated() && getIsOnline() === true) void get().syncNow();
  },

  async deleteEntry(clientId) {
    const current = get().state;
    const existing =
      current.status === "ready" ? current.entries.find((e) => e.clientId === clientId) : undefined;
    const id = existing?.id;

    if (isAuthenticated() && getIsOnline() === true) {
      try {
        if (id) {
          await deleteLogEntryRequest(httpClient, id);
          await get().reloadFromApi();
          return;
        }
        // No server ID => local-only; fall through to local delete.
      } catch {
        // fall back to offline queue
      }
    }

    if (current.status !== "ready") return;
    set({ state: { ...current, entries: removeLocal(current.entries, clientId) } });

    let mutations = await loadPendingLogEntryMutations();
    mutations = coalesceDelete(mutations, clientId, id);
    await savePendingLogEntryMutations(mutations);

    if (isAuthenticated() && getIsOnline() === true) void get().syncNow();
  },
}));

/** Selector helper mirroring the Nuxt `isBibleComplete` getter. */
export function selectIsBibleComplete(state: LogEntriesState): boolean {
  if (state.status !== "ready") return false;
  return isBibleCompleteShared(state.entries);
}

let initialized = false;

/** Hydrate entries from storage, persist on change, and background-sync. */
export function initLogEntries(): void {
  if (initialized) return;
  initialized = true;

  void (async () => {
    const stored = await loadLogEntries();
    useLogEntriesStore.setState({
      state: { status: "ready", entries: stored ?? [], isSyncing: false },
    });
    // Kick a sync if we are already online + authenticated.
    void useLogEntriesStore.getState().syncNow();
  })();

  // Persist entries whenever they change (mirrors the provider's save effect).
  let prevEntries: StoredLogEntry[] | null = null;
  useLogEntriesStore.subscribe((store) => {
    if (store.state.status !== "ready") return;
    if (store.state.entries === prevEntries) return;
    prevEntries = store.state.entries;
    void saveLogEntries(store.state.entries);
  });

  // Background sync when we become online while authenticated.
  let wasOnline = getIsOnline();
  const trySync = () => {
    if (isAuthenticated() && getIsOnline() === true && useLogEntriesStore.getState().state.status === "ready") {
      void useLogEntriesStore.getState().syncNow();
    }
  };
  useConnectivityStore.subscribe((s) => {
    if (s.isOnline === true && wasOnline !== true) trySync();
    wasOnline = s.isOnline;
  });
  useAuthStore.subscribe(() => trySync());
}

/** Compatibility hook preserving the previous `useLogEntries()` provider contract. */
export function useLogEntries(): LogEntriesStore {
  return useLogEntriesStore();
}
