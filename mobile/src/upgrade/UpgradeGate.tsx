import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchAppSupportStatus, type AppSupportStatus } from "@/src/api/appSupportApi";
import UpgradeRequiredScreen from "@/src/upgrade/UpgradeRequiredScreen";
import { type ReactNode, useEffect, useState } from "react";

const STORAGE_KEY = "forceUpgradeStatus.v1";

type Cached = {
  cachedAt: number;
  status: AppSupportStatus;
};

function parseCachedUnsupported(raw: string): AppSupportStatus | null {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object") return null;
  const status = (parsed as { status?: unknown }).status;
  if (!status || typeof status !== "object") return null;
  const s = status as Partial<AppSupportStatus>;
  return s.forceUpgrade === true ? (s as AppSupportStatus) : null;
}

async function loadCachedUnsupported(): Promise<AppSupportStatus | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parseCachedUnsupported(raw);
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
  | { status: "supported" }
  | { status: "unsupported"; support: AppSupportStatus };

/**
 * Blocks the app with an "update required" screen when the API reports this
 * app version is no longer supported.
 *
 * The check is optimistic: the app renders immediately while the support
 * status is fetched in the background, so a slow network never delays cold
 * start. A cached `forceUpgrade` verdict (from a previous launch) flips to the
 * block screen as soon as it loads; a fresh verdict replaces the cache.
 */
export function UpgradeGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ status: "supported" });

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
        // Network or other error: fail gracefully, allow app to run.
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

  return <>{children}</>;
}
