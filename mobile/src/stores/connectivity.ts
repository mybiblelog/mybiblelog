import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";
import { create } from "zustand";

/**
 * Connectivity store.
 *
 * Replaces the per-provider `useNetInfo()` hook usage so that store actions
 * (which run outside React) can read online status synchronously via
 * `getIsOnline()`. A single NetInfo subscriber, started in `initConnectivity()`,
 * keeps the store in sync; components can subscribe with `useIsOnline()`.
 */

type ConnectivityState = {
  /** `null` until the first NetInfo event resolves. */
  isOnline: boolean | null;
};

export const useConnectivityStore = create<ConnectivityState>(() => ({
  isOnline: null,
}));

function computeIsOnline(s: Pick<NetInfoState, "isConnected" | "isInternetReachable">): boolean | null {
  return s.isInternetReachable === null ? s.isConnected : s.isInternetReachable;
}

let unsubscribe: (() => void) | null = null;

/** Start the NetInfo subscription once. Returns the unsubscribe function. */
export function initConnectivity(): () => void {
  if (unsubscribe) return unsubscribe;
  unsubscribe = NetInfo.addEventListener((s) => {
    useConnectivityStore.setState({ isOnline: computeIsOnline(s) });
  });
  return unsubscribe;
}

/** Synchronous accessor for use inside store actions (outside React). */
export function getIsOnline(): boolean | null {
  return useConnectivityStore.getState().isOnline;
}

/** Hook for components that need to react to connectivity changes. */
export function useIsOnline(): boolean | null {
  return useConnectivityStore((s) => s.isOnline);
}
