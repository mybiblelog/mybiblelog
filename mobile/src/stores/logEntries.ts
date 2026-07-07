import { create } from "zustand";
import {
  type CreateLogEntryInput,
  deleteLogEntryRequest,
  fetchLogEntries,
  getBookIndexFromVerseId,
  isBibleComplete as isBibleCompleteShared,
  postLogEntry,
  patchLogEntry,
} from "@mybiblelog/shared";
import type { LogEntry } from "@/src/types/log-entry";
import { httpClient } from "@/src/api/httpClient";
import { parseApiLogEntries, parseApiLogEntry } from "@/src/api/logEntryMapper";
import { reportHandledError } from "@/src/observability/sentry";
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
  isPermanentMutationError,
  makeClientId,
  removeLocal,
  sortEntries,
  toStored,
  upsertLocal,
} from "@/src/log-entries/sync";
import { achievementActions } from "@/src/stores/achievements";
import { useAuthStore } from "@/src/stores/auth";
import { getIsOnline, useConnectivityStore } from "@/src/stores/connectivity";
import { useUserSettingsStore } from "@/src/stores/userSettings";

/**
 * Log-entries store (Zustand).
 *
 * The online path mirrors `nuxt/stores/log-entries` (uses the shared
 * `fetchLogEntries`/`postLogEntry`/… over an injected `HttpClient`), while the
 * offline-first mutation queue — which has no web equivalent — is mobile-only.
 * Successful online mutations apply the API's response locally instead of
 * refetching the whole collection; full reloads are reserved for queue drains.
 *
 * Components subscribe through the fine-grained hooks at the bottom of this
 * file (`useLogEntryList`, `useIsSyncing`) so a background `isSyncing` flip
 * doesn't re-render every screen; actions are reached via the stable
 * `logEntryActions` object.
 */

export type LogEntriesState =
  { status: "loading" } | { status: "ready"; entries: StoredLogEntry[]; isSyncing: boolean };

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

function canReachApi(): boolean {
  return isAuthenticated() && getIsOnline() === true;
}

/** Web `currentLogEntries`: entries within the look-back (tracker-reset) window. */
function currentEntries(entries: StoredLogEntry[]): StoredLogEntry[] {
  const settings = useUserSettingsStore.getState().state;
  const lookBackDate = settings.status === "ready" ? settings.settings.lookBackDate : "0000-00-00";
  if (!lookBackDate) return entries;
  return entries.filter((e) => e.date >= lookBackDate);
}

let syncInFlight: Promise<void> | null = null;

export const useLogEntriesStore = create<LogEntriesStore>((set, get) => {
  /** Replace the entries array (canonical order) and persist. */
  function setEntries(entries: StoredLogEntry[]): void {
    const current = get().state;
    if (current.status !== "ready") return;
    set({ state: { ...current, entries: sortEntries(entries) } });
  }

  /** Celebrate any completion the mutation just caused (web `applyAchievement`). */
  function applyAchievement(bookIndex: number, before: StoredLogEntry[]): void {
    const after = get().state;
    if (after.status !== "ready") return;
    achievementActions.evaluate(bookIndex, before, currentEntries(after.entries));
  }

  return {
    state: { status: "loading" },

    async reloadFromApi() {
      if (!canReachApi()) return;
      if (get().state.status !== "ready") return;
      try {
        const remote = parseApiLogEntries(await fetchLogEntries(httpClient));
        setEntries(remote.map((e) => toStored(e, e.id ?? undefined)));
        const after = get().state;
        if (after.status === "ready") await saveLogEntries(after.entries);
      } catch (err) {
        // Network or API error: keep current local state, fail gracefully.
        reportHandledError(err, { op: "logEntries.reloadFromApi" });
      }
    },

    async syncNow() {
      if (syncInFlight) return syncInFlight;
      if (!canReachApi()) return;
      if (get().state.status !== "ready") return;

      syncInFlight = (async () => {
        const ready = get().state;
        if (ready.status === "ready") set({ state: { ...ready, isSyncing: true } });

        try {
          const currentEntries =
            get().state.status === "ready"
              ? (get().state as { entries: StoredLogEntry[] }).entries
              : [];
          let mutations = await loadPendingLogEntryMutations();

          const deletedClientIds = new Set(
            mutations.filter((m) => m.type === "delete").map((m) => m.clientId)
          );

          // Ensure legacy unsynced entries (no id) are represented as creates.
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

          // Apply mutations to the API. Transient failures (network, 5xx,
          // auth) stay queued for the next sync; permanent 4xx failures are
          // dropped so one bad mutation can't stall the queue forever.
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
                await patchLogEntry(httpClient, { id: m.id, ...m.entry });
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
            } catch (err) {
              if (isPermanentMutationError(err)) {
                reportHandledError(err, { op: "logEntries.sync.dropMutation", type: m.type });
                continue;
              }
              remaining.push(m);
            }
          }

          await savePendingLogEntryMutations(remaining);

          // Only reload if we drained the queue; otherwise keep current offline-local state.
          if (remaining.length === 0) {
            await get().reloadFromApi();
          }
        } catch (err) {
          // Network or API error: keep local state, fail gracefully.
          reportHandledError(err, { op: "logEntries.syncNow" });
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
      const beforeState = get().state;
      const before = beforeState.status === "ready" ? currentEntries(beforeState.entries) : [];
      const bookIndex = getBookIndexFromVerseId(entry.startVerseId);

      if (canReachApi()) {
        try {
          const created = parseApiLogEntry(await postLogEntry(httpClient, input));
          const current = get().state;
          if (created && current.status === "ready") {
            setEntries(upsertLocal(current.entries, toStored(created, created.id ?? undefined)));
            const after = get().state;
            if (after.status === "ready") await saveLogEntries(after.entries);
          } else if (!created) {
            // Unexpected payload: the create succeeded but we can't apply it
            // locally — reconcile with a full reload instead.
            await get().reloadFromApi();
          }
          applyAchievement(bookIndex, before);
          return;
        } catch (err) {
          // Fall back to the offline queue.
          reportHandledError(err, { op: "logEntries.createEntry" });
        }
      }

      const current = get().state;
      if (current.status !== "ready") return;

      const clientId = makeClientId();
      const stored = toStored(entry, clientId);
      setEntries([stored, ...current.entries]);
      applyAchievement(bookIndex, before);

      let mutations = await loadPendingLogEntryMutations();
      mutations = coalesceCreate(mutations, clientId, input);
      await savePendingLogEntryMutations(mutations);

      if (canReachApi()) void get().syncNow();
    },

    async updateEntry(clientId, entry) {
      const input: CreateLogEntryInput = {
        date: entry.date,
        startVerseId: entry.startVerseId,
        endVerseId: entry.endVerseId,
      };
      const current = get().state;
      const existing =
        current.status === "ready"
          ? current.entries.find((e) => e.clientId === clientId)
          : undefined;
      const id = existing?.id ?? entry.id;
      const before = current.status === "ready" ? currentEntries(current.entries) : [];
      // Like the web store, only the updated entry's (new) book is evaluated.
      const bookIndex = getBookIndexFromVerseId(entry.startVerseId);

      if (canReachApi()) {
        try {
          const saved = parseApiLogEntry(
            id
              ? await patchLogEntry(httpClient, { id, ...input })
              : await postLogEntry(httpClient, input)
          );
          const beforeApply = get().state;
          if (saved && beforeApply.status === "ready") {
            setEntries(upsertLocal(beforeApply.entries, toStored(saved, clientId)));
            const after = get().state;
            if (after.status === "ready") await saveLogEntries(after.entries);
          } else if (!saved) {
            // Unexpected payload: reconcile with a full reload instead.
            await get().reloadFromApi();
          }
          applyAchievement(bookIndex, before);
          return;
        } catch (err) {
          // Fall back to the offline queue.
          reportHandledError(err, { op: "logEntries.updateEntry" });
        }
      }

      if (current.status !== "ready") return;
      const next = toStored({ ...entry, id }, clientId);
      setEntries(upsertLocal(current.entries, next));
      applyAchievement(bookIndex, before);

      let mutations = await loadPendingLogEntryMutations();
      mutations = coalesceUpdate(mutations, clientId, id, input);
      await savePendingLogEntryMutations(mutations);

      if (canReachApi()) void get().syncNow();
    },

    async deleteEntry(clientId) {
      const current = get().state;
      const existing =
        current.status === "ready"
          ? current.entries.find((e) => e.clientId === clientId)
          : undefined;
      const id = existing?.id;

      if (canReachApi()) {
        try {
          if (id) {
            await deleteLogEntryRequest(httpClient, id);
            const before = get().state;
            if (before.status === "ready") {
              setEntries(removeLocal(before.entries, clientId));
              const after = get().state;
              if (after.status === "ready") await saveLogEntries(after.entries);
            }
            return;
          }
          // No server ID => local-only; fall through to local delete.
        } catch (err) {
          // Fall back to the offline queue.
          reportHandledError(err, { op: "logEntries.deleteEntry" });
        }
      }

      if (current.status !== "ready") return;
      setEntries(removeLocal(current.entries, clientId));

      let mutations = await loadPendingLogEntryMutations();
      mutations = coalesceDelete(mutations, clientId, id);
      await savePendingLogEntryMutations(mutations);

      if (canReachApi()) void get().syncNow();
    },
  };
});

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
      state: { status: "ready", entries: sortEntries(stored ?? []), isSyncing: false },
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
    if (canReachApi() && useLogEntriesStore.getState().state.status === "ready") {
      void useLogEntriesStore.getState().syncNow();
    }
  };
  useConnectivityStore.subscribe((s) => {
    if (s.isOnline === true && wasOnline !== true) trySync();
    wasOnline = s.isOnline;
  });
  useAuthStore.subscribe(() => trySync());
}

/**
 * Fine-grained subscriptions. The entries array reference only changes on
 * actual data changes, so consumers of `useLogEntryList` don't re-render when
 * `isSyncing` toggles during background syncs.
 */

/** The entry list, or `null` while hydrating from storage. */
export function useLogEntryList(): StoredLogEntry[] | null {
  return useLogEntriesStore((s) => (s.state.status === "ready" ? s.state.entries : null));
}

/** Whether a background sync is currently running. */
export function useIsSyncing(): boolean {
  return useLogEntriesStore((s) => s.state.status === "ready" && s.state.isSyncing);
}

/**
 * Store actions, stable for the lifetime of the app — safe to use directly in
 * event handlers without subscribing the component to any store state.
 */
export const logEntryActions = {
  createEntry: (entry: LogEntry) => useLogEntriesStore.getState().createEntry(entry),
  updateEntry: (clientId: string, entry: LogEntry) =>
    useLogEntriesStore.getState().updateEntry(clientId, entry),
  deleteEntry: (clientId: string) => useLogEntriesStore.getState().deleteEntry(clientId),
  syncNow: () => useLogEntriesStore.getState().syncNow(),
  reloadFromApi: () => useLogEntriesStore.getState().reloadFromApi(),
};
