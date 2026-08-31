import { AppState } from "react-native";
import { create } from "zustand";

/**
 * Storage health: which persistent keys are currently failing, and how to get
 * them back.
 *
 * `typedStorage` quarantines a key whose read threw and refuses `setDerived` for
 * it, which protects the bytes on disk but leaves two problems this module
 * solves. First, the quarantine only lifts if something happens to re-read or
 * authoritatively rewrite that key — incidental for `logEntries`, and never for
 * `userSettings` or `passageNotes`, so those stayed write-protected until
 * relaunch. Second, the refusal was invisible: the store kept the change in
 * memory, the UI implied success, and the user found out on the next launch.
 *
 * The model is deliberately parallel to `stores/connectivity.ts` — a tiny store
 * with a synchronous accessor for store code and a selector hook for components,
 * which never calls `setState` when nothing changed.
 *
 * Registration is the opt-in. Only keys passed to `registerManagedKey` can mark
 * the app degraded, because a read failure on a key whose every write is an
 * authoritative `set` (`themeMode`, `locale`, `forceUpgradeStatus`) costs the
 * user nothing and must not claim their changes aren't saving.
 *
 * **The one subtle invariant.** `typedStorage` warns that a quarantine must
 * never be cleared by a *probe*: a speculative read before a derived write would
 * fetch the real value, then let the caller's stale derived value overwrite it —
 * the original data-loss bug, a moment later. A rehydrator's read *is* such a
 * probe, and is safe for exactly one reason: it **consumes** the value it reads
 * instead of discarding it, merging disk back into memory before anything else
 * can write. That merge must stay in the continuation immediately after the
 * `await`, where no store action can interleave. A rehydrator that reads and
 * throws the value away reintroduces the bug.
 */

/**
 * Re-read this key and reconcile it with whatever the store holds in memory.
 *
 * Contract, by `ReadResult` status:
 * - `ok` — merge disk into memory and persist the result.
 * - `absent` / `corrupt` — nothing on disk worth keeping; persist memory.
 * - `unreadable` — still broken; change nothing and stay degraded.
 */
export type Rehydrate = () => Promise<void>;

type HealthState = {
  /** Sorted, and only replaced when membership actually changes. */
  degradedKeys: readonly string[];
};

const managed = new Map<string, Rehydrate | undefined>();
const degraded = new Set<string>();

export const useStorageHealthStore = create<HealthState>(() => ({
  degradedKeys: [],
}));

/**
 * Delays for retrying a key the backend just refused. Short and fixed, matching
 * `STORAGE_RETRY_DELAYS_MS` in `stores/auth.ts`: this is a local read, there is
 * no server to overload, and the usual cause — the app started before the device
 * was unlocked — clears within a second or two. Recovering on this ladder is
 * also why no `init*` call site needs to change.
 */
const RETRY_DELAYS_MS = [250, 1_000, 3_000];

let retryTimer: ReturnType<typeof setTimeout> | null = null;
let retryAttempt = 0;
let recoverInFlight: Promise<void> | null = null;
let appStateSubscription: { remove(): void } | null = null;

function publish(): void {
  const next = [...degraded].filter((key) => managed.has(key)).sort();
  const prev = useStorageHealthStore.getState().degradedKeys;
  if (next.length === prev.length && next.every((key, i) => key === prev[i])) return;
  useStorageHealthStore.setState({ degradedKeys: next });
}

/**
 * Declare a key as one whose failures matter to the user, optionally with a way
 * to recover it. Idempotent — the `init*` functions that call it are themselves
 * guarded, but re-registering simply replaces the rehydrator.
 */
export function registerManagedKey(key: string, rehydrate?: Rehydrate): void {
  managed.set(key, rehydrate);
  // A failure may have been recorded before the owning store finished starting;
  // registering is what makes it worth surfacing and worth retrying.
  if (degraded.has(key)) {
    publish();
    scheduleRetry();
  }
}

/**
 * A read or write of this key failed at the backend.
 *
 * Write failures count as degraded even though they don't quarantine: disk still
 * holds the last good value, but the change the user just made did not land, and
 * that is exactly what the banner exists to say. A *refused* `setDerived` is not
 * reported here — the key is already degraded from the read that caused it.
 */
export function reportStorageFailure(key: string, _kind: "read" | "write"): void {
  if (degraded.has(key)) return;
  degraded.add(key);
  // Recorded even for unregistered keys, so a store that registers later still
  // sees the failure — but nothing is surfaced or retried until it does. A key
  // no one manages has no rehydrator to run and no claim to make about saving.
  if (!managed.has(key)) return;
  publish();
  scheduleRetry();
}

/** A read, write or remove of this key succeeded — the backend is working. */
export function reportStorageOk(key: string): void {
  if (!degraded.delete(key)) return;
  publish();
  if (degraded.size === 0) cancelRetry();
}

function scheduleRetry(): void {
  if (retryTimer) return;
  const delay = RETRY_DELAYS_MS[retryAttempt];
  if (delay === undefined) return;
  retryAttempt += 1;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void recoverStorage();
  }, delay);
}

function cancelRetry(): void {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;
  retryAttempt = 0;
}

/**
 * Try to bring every degraded key back. Runs each key's rehydrator; keys with no
 * rehydrator (the mutation queues, which are re-read from disk on every
 * mutation) recover on their own next read.
 */
export function recoverStorage(): Promise<void> {
  if (recoverInFlight) return recoverInFlight;
  recoverInFlight = (async () => {
    for (const key of [...degraded]) {
      const rehydrate = managed.get(key);
      if (!rehydrate) continue;
      // A throwing rehydrator must not strand the others; the key just stays
      // degraded and the next trigger retries it.
      await rehydrate().catch(() => undefined);
    }
  })().finally(() => {
    recoverInFlight = null;
    // Still broken: keep climbing the ladder until it runs out. Foregrounding
    // the app remains the open-ended trigger after that.
    if (degraded.size > 0) scheduleRetry();
  });
  return recoverInFlight;
}

let initialized = false;

/**
 * Start the foreground listener. Returning to the foreground is the signal that
 * the device was unlocked, which is when a refusing backend typically starts
 * working again — the same reasoning as the auth store's AppState hook.
 */
export function initStorageHealth(): void {
  if (initialized) return;
  initialized = true;
  appStateSubscription = AppState.addEventListener("change", (next) => {
    if (next === "active" && degraded.size > 0) void recoverStorage();
  });
}

/** Synchronous accessor for use inside store actions (outside React). */
export function isStorageDegraded(): boolean {
  return useStorageHealthStore.getState().degradedKeys.length > 0;
}

/** Hook for components that need to react to storage health. */
export function useIsStorageDegraded(): boolean {
  return useStorageHealthStore((s) => s.degradedKeys.length > 0);
}

/** Test-only: this module is a singleton. */
export function __resetForTest(): void {
  managed.clear();
  degraded.clear();
  cancelRetry();
  recoverInFlight = null;
  appStateSubscription?.remove();
  appStateSubscription = null;
  initialized = false;
  useStorageHealthStore.setState({ degradedKeys: [] });
}
