import { create } from "zustand";
import {
  DEFAULT_LOCAL_USER_SETTINGS,
  type LocalUserSettings,
  loadLocalUserSettings,
  saveLocalUserSettings,
} from "@/src/settings/userSettingsStorage";
import { type ServerUserSettings, getSettings, updateSettings } from "@/src/api/settingsApi";
import { reportHandledError } from "@/src/observability/sentry";
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
  refreshFromServer: () => Promise<void>;
  setLocalSettings: (partial: Partial<LocalUserSettings>) => Promise<void>;
  updateServerSettings: (partial: Partial<ServerUserSettings>) => Promise<boolean>;
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

let refreshInFlight: Promise<void> | null = null;

export const useUserSettingsStore = create<UserSettingsStore>((set, get) => ({
  state: { status: "loading" },

  async setLocalSettings(partial) {
    const current = get().state;
    if (current.status !== "ready") return;
    const next = { ...current.settings, ...partial };
    set({ state: { ...current, settings: next } });
    await saveLocalUserSettings(next);
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
            set({ state: { ...before, settings: next } });
            await saveLocalUserSettings(next);
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
      set({ state: { status: "ready", settings: next, isRefreshingFromServer: false } });
      await saveLocalUserSettings(next);
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
};

export function getDefaultLocalUserSettingsForTest(): LocalUserSettings {
  return DEFAULT_LOCAL_USER_SETTINGS;
}
