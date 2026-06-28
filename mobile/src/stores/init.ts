import { initConnectivity } from "@/src/stores/connectivity";
import { initAuth } from "@/src/stores/auth";
import { initLogEntries } from "@/src/stores/logEntries";
import { initUserSettings } from "@/src/stores/userSettings";
import { initDateVerseCounts } from "@/src/stores/dateVerseCounts";

/**
 * Initialize the Zustand domain stores once, in dependency order.
 *
 * Replaces the former provider nesting / per-provider mount effects. Connectivity
 * must start first so auth, log-entries and user-settings can read online status
 * inside their actions. Each `init*` is idempotent. Mirrors the sequencing of
 * the Nuxt `app-init` plugin (hydrate, then refresh when authenticated + online).
 */
let started = false;

export function initStores(): void {
  if (started) return;
  started = true;
  initConnectivity();
  initAuth();
  initLogEntries();
  initUserSettings();
  // Depends on log entries + user settings stores; subscribes to both.
  initDateVerseCounts();
}
