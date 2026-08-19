import { create } from "zustand";
import {
  DEFAULT_LOCAL_USER_SETTINGS,
  type LocalUserSettings,
  loadLocalUserSettings,
  readLocalUserSettings,
  saveLocalUserSettings,
} from "@/src/settings/userSettingsStorage";
import { type ServerUserSettings, getSettings, updateSettings } from "@/src/api/settingsApi";
import { reportHandledError } from "@/src/observability/sentry";
import { appStorage } from "@/src/storage/keys";
import { registerManagedKey } from "@/src/storage/health";
import { useAuthStore } from "@/src/stores/auth";
import { getIsOnline, useConnectivityStore } from "@/src/stores/connectivity";

/**
 * User-settings store (Zustand).
 *
 * Mirrors the Nuxt user-settings store: local device settings overlaid by
 * server truth while authenticated. Server-backed fields
 * (`dailyVerseCountGoal`, `lookBackDate`, `preferredBibleVersion`) refresh
 * from the API; `preferredBibleApp` stays device-only. Components subscribe
 * via `useSettingsValue()` and mutate via `userSettingsActions`.
 */

export type UserSettingsState =
  | { status: "loading" }
  | { status: "ready"; settings: LocalUserSettings; isRefreshingFromServer: boolean };

type UserSettingsStore = {
  state: UserSettingsState;
  /**
   * Whether the user has waved off the "start fresh" prompt shown when the
   * whole Bible has been read. Deliberately NOT persisted: web backs this with
   * sessionStorage, so the prompt returns on a fresh launch. Persisting it
   * would also mean a new storage key, and therefore a schema migration, for
   * something that only needs to survive the current session.
   */
  readingTrackerResetDelayed: boolean;
  refreshFromServer: () => Promise<void>;
  setLocalSettings: (partial: Partial<LocalUserSettings>) => Promise<void>;
  updateServerSettings: (partial: Partial<ServerUserSettings>) => Promise<boolean>;
  dismissReadingTrackerReset: () => void;
};

function applyServerTruth(local: LocalUserSettings, server: ServerUserSettings): LocalUserSettings {
  return {
    ...local,
    dailyVerseCountGoal: server.dailyVerseCountGoal ?? local.dailyVerseCountGoal,
    lookBackDate: server.lookBackDate ?? local.lookBackDate,
    preferredBibleVersion: server.preferredBibleVersion ?? local.preferredBibleVersion,
    passageNoteTagSortOrder: server.passageNoteTagSortOrder ?? local.passageNoteTagSortOrder,
    // preferredBibleApp stays device-only
  };
}

function shallowEqualReadingSettings(a: LocalUserSettings, b: LocalUserSettings): boolean {
  return (
    a.dailyVerseCountGoal === b.dailyVerseCountGoal &&
    a.lookBackDate === b.lookBackDate &&
    a.preferredBibleVersion === b.preferredBibleVersion &&
    a.preferredBibleApp === b.preferredBibleApp &&
    a.passageNoteTagSortOrder === b.passageNoteTagSortOrder
  );
}

function isAuthenticated(): boolean {
  return useAuthStore.getState().state.status === "authenticated";
}

/**
 * Settings fields written since the last time this store and disk agreed.
 *
 * A failed read hydrates the store with `DEFAULT_LOCAL_USER_SETTINGS` while the
 * user's real settings sit intact on disk, and quarantines the key so nothing
 * saves. Recovering by taking either side wholesale is wrong in both directions:
 * disk-wins discards choices the user made during the outage, memory-wins
 * promotes hydration defaults — a look-back date silently reset to today — into
 * durable truth. So we remember which fields were actually written and overlay
 * only those onto disk.
 */
const dirtyFields = new Set<keyof LocalUserSettings>();

function markDirty(keys: Iterable<keyof LocalUserSettings>): void {
  for (const key of keys) dirtyFields.add(key);
}

/**
 * Fields the server changed. Diffed rather than assumed, because only the values
 * that actually moved represent a decision worth preserving over disk.
 */
function changedFields(
  before: LocalUserSettings,
  after: LocalUserSettings
): (keyof LocalUserSettings)[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]) as Set<
    keyof LocalUserSettings
  >;
  return [...keys].filter((key) => before[key] !== after[key]);
}

function dirtyOverlay(settings: LocalUserSettings): Partial<LocalUserSettings> {
  const overlay: Record<string, unknown> = {};
  for (const key of dirtyFields) overlay[key] = settings[key];
  return overlay as Partial<LocalUserSettings>;
}

/**
 * Persist, and on success forget the fields that write put on disk — the set
 * tracks "written but not known to be stored", so it must not grow unbounded
 * across a healthy session or a later outage would take memory wholesale.
 *
 * Only the fields dirty when the write was issued are cleared; anything marked
 * while it was in flight is not covered by this write and stays dirty until its
 * own write lands.
 */
async function persistSettings(settings: LocalUserSettings): Promise<void> {
  const written = [...dirtyFields];
  const saved = await saveLocalUserSettings(settings);
  if (!saved) return;
  for (const key of written) dirtyFields.delete(key);
}

let refreshInFlight: Promise<void> | null = null;

export const useUserSettingsStore = create<UserSettingsStore>((set, get) => ({
  state: { status: "loading" },
  readingTrackerResetDelayed: false,

  dismissReadingTrackerReset() {
    set({ readingTrackerResetDelayed: true });
  },

  async setLocalSettings(partial) {
    const current = get().state;
    if (current.status !== "ready") return;
    const next = { ...current.settings, ...partial };
    // Keyed on what the caller asked to set, not on what changed: choosing the
    // value that happens to match the hydration default is still a choice.
    markDirty(Object.keys(partial) as (keyof LocalUserSettings)[]);
    set({ state: { ...current, settings: next } });
    await persistSettings(next);
  },

  async refreshFromServer() {
    if (refreshInFlight) return refreshInFlight;
    if (!isAuthenticated() || getIsOnline() !== true) return;
    if (get().state.status !== "ready") return;

    refreshInFlight = (async () => {
      const ready = get().state;
      if (ready.status === "ready") set({ state: { ...ready, isRefreshingFromServer: true } });
      try {
        const server = await getSettings();
        const before = get().state;
        if (before.status === "ready") {
          const next = applyServerTruth(before.settings, server);
          if (!shallowEqualReadingSettings(next, before.settings)) {
            markDirty(changedFields(before.settings, next));
            set({ state: { ...before, settings: next } });
            await persistSettings(next);
          }
        }
      } catch (err) {
        // Network or API error: keep local settings, fail gracefully.
        reportHandledError(err, { op: "userSettings.refreshFromServer" });
      } finally {
        const after = get().state;
        if (after.status === "ready") set({ state: { ...after, isRefreshingFromServer: false } });
        refreshInFlight = null;
      }
    })();

    return refreshInFlight;
  },

  async updateServerSettings(partial) {
    if (!isAuthenticated() || getIsOnline() !== true) return false;
    const current = get().state;
    if (current.status !== "ready") return false;
    try {
      const updated = await updateSettings(partial);
      const next = applyServerTruth(current.settings, updated);
      markDirty(changedFields(current.settings, next));
      set({ state: { status: "ready", settings: next, isRefreshingFromServer: false } });
      await persistSettings(next);
      return true;
    } catch (err) {
      reportHandledError(err, { op: "userSettings.updateServerSettings" });
      return false;
    }
  },
}));

let initialized = false;

/** Hydrate local settings, then refresh from server when authenticated + online. */
export function initUserSettings(): void {
  if (initialized) return;
  initialized = true;

  registerManagedKey(appStorage.keyName("userSettings"), rehydrateFromDisk);

  void (async () => {
    const local = await loadLocalUserSettings();
    useUserSettingsStore.setState({
      state: { status: "ready", settings: local, isRefreshingFromServer: false },
    });
    void useUserSettingsStore.getState().refreshFromServer();
  })();

  const tryRefresh = () => {
    if (isAuthenticated() && getIsOnline() === true) {
      void useUserSettingsStore.getState().refreshFromServer();
    }
  };
  let wasOnline = getIsOnline();
  useConnectivityStore.subscribe((s) => {
    if (s.isOnline === true && wasOnline !== true) tryRefresh();
    wasOnline = s.isOnline;
  });
  useAuthStore.subscribe(() => tryRefresh());
}

/**
 * Merge the stored settings back into memory once the backend answers again.
 *
 * Disk is the base and only `dirtyFields` are overlaid, so an untouched
 * hydration default never overwrites a real stored value while a setting the
 * user actually chose during the outage survives. Re-reading is safe here, and
 * *only* here, because this consumes the value it reads — the merge runs in the
 * continuation immediately after the `await`. See the invariant in
 * `storage/health.ts`.
 */
async function rehydrateFromDisk(): Promise<void> {
  const disk = await readLocalUserSettings();
  if (disk.status === "unreadable") return; // still broken; stay degraded

  const current = useUserSettingsStore.getState().state;
  if (current.status !== "ready") return;

  // `absent`/`corrupt` mean there is nothing worth merging; re-persisting what
  // is in memory is what gets this key writing again.
  const merged =
    disk.status === "ok" ? { ...disk.value, ...dirtyOverlay(current.settings) } : current.settings;

  useUserSettingsStore.setState({ state: { ...current, settings: merged } });
  await persistSettings(merged);
}

/**
 * The current settings object, or `null` while hydrating. The reference only
 * changes when a setting actually changes, so consumers don't re-render when
 * `isRefreshingFromServer` toggles during background refreshes.
 */
export function useSettingsValue(): LocalUserSettings | null {
  return useUserSettingsStore((s) => (s.state.status === "ready" ? s.state.settings : null));
}

/**
 * Store actions, stable for the lifetime of the app — safe to use directly in
 * event handlers without subscribing the component to any store state.
 */
export const userSettingsActions = {
  setLocalSettings: (partial: Partial<LocalUserSettings>) =>
    useUserSettingsStore.getState().setLocalSettings(partial),
  updateServerSettings: (partial: Partial<ServerUserSettings>) =>
    useUserSettingsStore.getState().updateServerSettings(partial),
  refreshFromServer: () => useUserSettingsStore.getState().refreshFromServer(),
  dismissReadingTrackerReset: () => useUserSettingsStore.getState().dismissReadingTrackerReset(),
};

export function getDefaultLocalUserSettingsForTest(): LocalUserSettings {
  return DEFAULT_LOCAL_USER_SETTINGS;
}
