import { create } from "zustand";
import {
  DEFAULT_LOCAL_USER_SETTINGS,
  type LocalUserSettings,
  loadLocalUserSettings,
  saveLocalUserSettings,
} from "@/src/settings/userSettingsStorage";
import { type ServerUserSettings, getSettings, updateSettings } from "@/src/api/settingsApi";
import { getAuthToken, useAuthStore } from "@/src/stores/auth";
import { getIsOnline, useConnectivityStore } from "@/src/stores/connectivity";

/**
 * User-settings store (Zustand).
 *
 * Replaces `UserSettingsProvider`, mirroring the Nuxt user-settings store: local
 * device settings overlaid by server truth while authenticated. Server-backed
 * fields (`dailyVerseCountGoal`, `lookBackDate`, `preferredBibleVersion`) refresh
 * from the API; `preferredBibleApp` stays device-only. `useUserSettings()` keeps
 * the previous provider contract.
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
    // preferredBibleApp stays device-only
  };
}

function shallowEqualReadingSettings(a: LocalUserSettings, b: LocalUserSettings): boolean {
  return (
    a.dailyVerseCountGoal === b.dailyVerseCountGoal &&
    a.lookBackDate === b.lookBackDate &&
    a.preferredBibleVersion === b.preferredBibleVersion &&
    a.preferredBibleApp === b.preferredBibleApp
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
    const token = getAuthToken();
    if (!token) return;

    refreshInFlight = (async () => {
      const ready = get().state;
      if (ready.status === "ready") set({ state: { ...ready, isRefreshingFromServer: true } });
      try {
        const server = await getSettings(token);
        const before = get().state;
        if (before.status === "ready") {
          const next = applyServerTruth(before.settings, server);
          if (!shallowEqualReadingSettings(next, before.settings)) {
            set({ state: { ...before, settings: next } });
            await saveLocalUserSettings(next);
          }
        }
      } catch {
        // Network or API error: keep local settings, fail gracefully
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
    const token = getAuthToken();
    if (!token) return false;
    try {
      const updated = await updateSettings(token, partial);
      const next = applyServerTruth(current.settings, updated);
      set({ state: { status: "ready", settings: next, isRefreshingFromServer: false } });
      await saveLocalUserSettings(next);
      return true;
    } catch {
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

/** Compatibility hook preserving the previous `useUserSettings()` provider contract. */
export function useUserSettings(): UserSettingsStore {
  return useUserSettingsStore();
}

export function getDefaultLocalUserSettingsForTest(): LocalUserSettings {
  return DEFAULT_LOCAL_USER_SETTINGS;
}
