import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNetInfo } from "@react-native-community/netinfo";
import { useAuth } from "@/src/auth/AuthProvider";
import {
  DEFAULT_LOCAL_USER_SETTINGS,
  type LocalUserSettings,
  loadLocalUserSettings,
  saveLocalUserSettings,
} from "@/src/settings/userSettingsStorage";
import { getSettings, updateSettings, type ServerUserSettings } from "@/src/api/settingsApi";

type UserSettingsState =
  | { status: "loading" }
  | {
      status: "ready";
      settings: LocalUserSettings;
      isRefreshingFromServer: boolean;
    };

type UserSettingsContextValue = {
  state: UserSettingsState;
  refreshFromServer: () => Promise<void>;
  setLocalSettings: (partial: Partial<LocalUserSettings>) => Promise<void>;
  updateServerSettings: (partial: Partial<ServerUserSettings>) => Promise<boolean>;
};

const Ctx = createContext<UserSettingsContextValue | null>(null);

function computeIsOnline(netInfo: ReturnType<typeof useNetInfo>): boolean | null {
  return netInfo.isInternetReachable === null ? netInfo.isConnected : netInfo.isInternetReachable;
}

function applyServerTruth(local: LocalUserSettings, server: ServerUserSettings): LocalUserSettings {
  // Server-backed fields: dailyVerseCountGoal, lookBackDate, preferredBibleVersion
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

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const { state: authState } = useAuth();
  const netInfo = useNetInfo();
  const isOnline = computeIsOnline(netInfo);
  const refreshInFlightRef = useRef<Promise<void> | null>(null);

  const [state, setState] = useState<UserSettingsState>({ status: "loading" });

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const local = await loadLocalUserSettings();
      if (!isMounted) return;
      setState({ status: "ready", settings: local, isRefreshingFromServer: false });
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  async function setLocalSettings(partial: Partial<LocalUserSettings>): Promise<void> {
    if (state.status !== "ready") return;
    const next = { ...state.settings, ...partial };
    setState({ ...state, settings: next });
    await saveLocalUserSettings(next);
  }

  async function refreshFromServer(): Promise<void> {
    if (refreshInFlightRef.current) return refreshInFlightRef.current;
    if (authState.status !== "authenticated") return;
    if (isOnline !== true) return;
    if (state.status !== "ready") return;

    refreshInFlightRef.current = (async () => {
      setState((prev) =>
        prev.status === "ready" ? { ...prev, isRefreshingFromServer: true } : prev
      );
      try {
        const server = await getSettings(authState.session.token);
        const next = applyServerTruth(state.settings, server);
        if (!shallowEqualReadingSettings(next, state.settings)) {
          setState((prev) => (prev.status === "ready" ? { ...prev, settings: next } : prev));
          await saveLocalUserSettings(next);
        }
      } catch {
        // Network or API error: keep local settings, fail gracefully
      } finally {
        setState((prev) =>
          prev.status === "ready" ? { ...prev, isRefreshingFromServer: false } : prev
        );
        refreshInFlightRef.current = null;
      }
    })();

    return refreshInFlightRef.current;
  }

  async function updateServerSettings(partial: Partial<ServerUserSettings>): Promise<boolean> {
    if (authState.status !== "authenticated") return false;
    if (isOnline !== true) return false;
    if (state.status !== "ready") return false;
    try {
      const updated = await updateSettings(authState.session.token, partial);
      const next = applyServerTruth(state.settings, updated);
      setState({ status: "ready", settings: next, isRefreshingFromServer: false });
      await saveLocalUserSettings(next);
      return true;
    } catch {
      return false;
    }
  }

  // Server is the source of truth while authenticated: refresh on auth or connectivity changes.
  useEffect(() => {
    if (state.status !== "ready") return;
    if (authState.status !== "authenticated") return;
    if (isOnline !== true) return;
    void refreshFromServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState.status, isOnline, state.status]);

  const value = useMemo<UserSettingsContextValue>(
    () => ({
      state,
      refreshFromServer,
      setLocalSettings,
      updateServerSettings,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, authState.status, isOnline]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUserSettings() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUserSettings must be used within UserSettingsProvider");
  return ctx;
}

export function getDefaultLocalUserSettingsForTest(): LocalUserSettings {
  return DEFAULT_LOCAL_USER_SETTINGS;
}

