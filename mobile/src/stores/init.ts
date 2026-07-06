import { initConnectivity } from "@/src/stores/connectivity";
import { initAuth } from "@/src/stores/auth";
import { initLogEntries } from "@/src/stores/logEntries";
import { initNotes } from "@/src/stores/offlineNotes";
import { initUserSettings } from "@/src/stores/userSettings";
import { initDateVerseCounts } from "@/src/stores/dateVerseCounts";
import { initBibleProgress } from "@/src/stores/bibleProgress";
import { runStorageMigrations } from "@/src/storage/migrations/runner";

/**
 * Initialize the Zustand domain stores once, in dependency order.
 *
 * Replaces the former provider nesting / per-provider mount effects. Connectivity
 * must start first so auth, log-entries and user-settings can read online status
 * inside their actions. Each `init*` is idempotent. Mirrors the sequencing of
 * the Nuxt `app-init` plugin (hydrate, then refresh when authenticated + online).
 *
 * Storage migrations (`src/storage/migrations/`) run to completion *before* any
 * store hydrates, so the loaders read already-migrated bytes. The signature
 * stays sync (fire-and-forget from `app/_layout.tsx`); the `await` sequences
 * migrations ahead of the `init*` calls — the stores start in a `loading` state
 * the UI already tolerates, so no splash gating is needed.
 */
let started = false;

export function initStores(): void {
  if (started) return;
  started = true;
  void (async () => {
    await runStorageMigrations();
    initConnectivity();
    initAuth();
    initLogEntries();
    // Offline notes: hydrate local notes + subscribe to auth/connectivity so the
    // queue drains and the online list refreshes once reachable.
    initNotes();
    initUserSettings();
    // Depends on log entries + user settings stores; subscribes to both.
    initDateVerseCounts();
    // Precomputes whole-Bible progress for the bible/checklist screens; subscribes
    // to log entries + look-back date.
    initBibleProgress();
  })();
}
