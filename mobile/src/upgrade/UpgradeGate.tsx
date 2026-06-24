import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchAppSupportStatus, type AppSupportStatus } from "@/src/api/appSupportApi";
import UpgradeRequiredScreen from "@/src/upgrade/UpgradeRequiredScreen";
import { useTheme } from "@/src/theme/ThemeProvider";
import { type ReactNode, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

const STORAGE_KEY = "forceUpgradeStatus.v1";

type Cached = {
  cachedAt: number;
  status: AppSupportStatus;
};

async function loadCachedUnsupported(): Promise<AppSupportStatus | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Cached;
    if (!parsed?.status || typeof parsed !== "object") return null;
    const status = (parsed as any).status as AppSupportStatus;
    if (status?.forceUpgrade === true) return status;
    return null;
  } catch {
    return null;
  }
}

async function saveCached(status: AppSupportStatus) {
  try {
    const payload: Cached = { cachedAt: Date.now(), status };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

async function clearCached() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

type State =
  | { status: "checking" }
  | { status: "supported" }
  | { status: "unsupported"; support: AppSupportStatus };

export function UpgradeGate({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const [state, setState] = useState<State>({ status: "checking" });

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const cached = await loadCachedUnsupported();
        if (isMounted && cached) {
          setState({ status: "unsupported", support: cached });
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);
        const fresh = await fetchAppSupportStatus({ signal: controller.signal });
        clearTimeout(timer);

        if (!isMounted) return;

        if (fresh?.forceUpgrade) {
          setState({ status: "unsupported", support: fresh });
          await saveCached(fresh);
          return;
        }

        // If we successfully confirmed support, clear any old cached block.
        if (fresh?.supported) {
          await clearCached();
        }

        setState({ status: "supported" });
      } catch {
        // Network or other error: fail gracefully, allow app to run
        if (isMounted) setState({ status: "supported" });
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  if (state.status === "unsupported") {
    return <UpgradeRequiredScreen status={state.support} />;
  }

  if (state.status === "checking") {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

