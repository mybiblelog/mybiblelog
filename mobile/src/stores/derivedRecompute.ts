import { useLogEntriesStore } from "@/src/stores/logEntries";
import { useUserSettingsStore } from "@/src/stores/userSettings";

/**
 * Shared subscription wiring for the derived stores (`dateVerseCounts`,
 * `bibleProgress`): run `recompute` once immediately, then again whenever the
 * log-entries array reference, the look-back date, or the canon changes.
 *
 * Recomputes are coalesced onto a short trailing timer so a burst of store
 * writes (e.g. an optimistic update followed by the queue-drain reload) costs
 * one recompute instead of one per write — both derived computations walk the
 * whole entry set, so this keeps them off the critical path of a mutation.
 */

const RECOMPUTE_COALESCE_MS = 50;

export function subscribeDerivedRecompute(recompute: () => void): void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const schedule = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      recompute();
    }, RECOMPUTE_COALESCE_MS);
  };

  // Recompute when the entries array reference changes (add/edit/delete/sync).
  let prevEntries: unknown = null;
  let prevReady = false;
  useLogEntriesStore.subscribe((store) => {
    const entries = store.state.status === "ready" ? store.state.entries : null;
    const ready = entries !== null;
    if (ready && (entries !== prevEntries || !prevReady)) {
      prevEntries = entries;
      schedule();
    }
    prevReady = ready;
  });

  // Recompute when the look-back date or the canon changes.
  let prevLookBack: string | null = null;
  let prevCanon: boolean | null = null;
  useUserSettingsStore.subscribe((store) => {
    if (store.state.status !== "ready") return;
    const { lookBackDate, includeDeuterocanonical } = store.state.settings;
    const canon = includeDeuterocanonical === true;
    const lookBackChanged = !!lookBackDate && lookBackDate !== prevLookBack;
    const canonChanged = prevCanon !== null && canon !== prevCanon;
    prevLookBack = lookBackDate || prevLookBack;
    prevCanon = canon;
    if (lookBackChanged || canonChanged) schedule();
  });

  // Initial compute (cache hydrate + first calc) runs immediately.
  recompute();
}
