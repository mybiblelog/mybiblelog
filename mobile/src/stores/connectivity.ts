import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";
import { create } from "zustand";

/**
 * Connectivity store.
 *
 * Two independent axes, because "the device has no network" and "our API isn't
 * answering" are different problems and the UI must not blame the user's
 * network for a server outage:
 *
 * - `isOnline` — device link state, from a single NetInfo subscriber started in
 *   `initConnectivity()`.
 * - `apiReachable` — whether our API actually answered, reported by the HTTP
 *   adapter and the auth probe via `reportApiReachability()`.
 *
 * Store actions (which run outside React) read these synchronously via
 * `getIsOnline()` / `getConnectionStatus()`; components subscribe with
 * `useConnectionStatus()`.
 */

type ConnectivityState = {
  /** `null` until the first NetInfo event resolves. */
  isOnline: boolean | null;
  /** `null` until the first API attempt resolves. */
  apiReachable: boolean | null;
};

/** What the UI should tell the user about the connection. */
export type ConnectionStatus = "unknown" | "online" | "device-offline" | "server-unreachable";

export const useConnectivityStore = create<ConnectivityState>(() => ({
  isOnline: null,
  apiReachable: null,
}));

function computeIsOnline(
  s: Pick<NetInfoState, "isConnected" | "isInternetReachable">
): boolean | null {
  return s.isInternetReachable === null ? s.isConnected : s.isInternetReachable;
}

function computeStatus(s: ConnectivityState): ConnectionStatus {
  if (s.isOnline === false) return "device-offline";
  if (s.apiReachable === false) return "server-unreachable";
  return s.isOnline === true ? "online" : "unknown";
}

let unsubscribe: (() => void) | null = null;

/** Start the NetInfo subscription once. Returns the unsubscribe function. */
export function initConnectivity(): () => void {
  if (unsubscribe) return unsubscribe;
  unsubscribe = NetInfo.addEventListener((s) => {
    const isOnline = computeIsOnline(s);
    useConnectivityStore.setState((prev) => ({
      isOnline,
      // A "server is down" verdict must not outlive the network it was measured
      // on; the next request re-establishes it.
      apiReachable: isOnline === false ? null : prev.apiReachable,
    }));
  });
  return unsubscribe;
}

/**
 * Record the outcome of a real request to our API. Called on every HTTP
 * response, so it must not touch the store when nothing changed — four modules
 * subscribe to this store and would otherwise be woken by each request.
 */
export function reportApiReachability(reachable: boolean): void {
  if (useConnectivityStore.getState().apiReachable === reachable) return;
  useConnectivityStore.setState({ apiReachable: reachable });
}

/**
 * Forget whether the API was reachable.
 *
 * The verdict is measured on behalf of a session — the token probe and every
 * authenticated request produce it — so it must not outlive one. Without this a
 * "server is down" reading taken before sign-out sticks forever, because a
 * signed-out app makes no further requests to correct it, and then greets the
 * next sign-in as though the server were still down. Same reasoning as clearing
 * it when the device drops its network; the next request re-establishes it.
 */
export function resetApiReachability(): void {
  if (useConnectivityStore.getState().apiReachable === null) return;
  useConnectivityStore.setState({ apiReachable: null });
}

/** Synchronous accessor for use inside store actions (outside React). */
export function getIsOnline(): boolean | null {
  return useConnectivityStore.getState().isOnline;
}

export function getConnectionStatus(): ConnectionStatus {
  return computeStatus(useConnectivityStore.getState());
}

/** Hook for components that need to react to connectivity changes. */
export function useConnectionStatus(): ConnectionStatus {
  return useConnectivityStore(computeStatus);
}
