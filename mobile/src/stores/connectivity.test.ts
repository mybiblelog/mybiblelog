import NetInfo from "@react-native-community/netinfo";
import {
  getConnectionStatus,
  getIsOnline,
  initConnectivity,
  reportApiReachability,
  useConnectivityStore,
} from "./connectivity";

type Listener = (s: { isConnected: boolean | null; isInternetReachable: boolean | null }) => void;

// initConnectivity subscribes once (module-level guard) and `clearMocks` wipes
// mock.calls before each test, so capture the registered listener up front.
let listener: Listener;
beforeAll(() => {
  initConnectivity();
  listener = (NetInfo.addEventListener as jest.Mock).mock.calls[0][0] as Listener;
});

beforeEach(() => {
  useConnectivityStore.setState({ isOnline: null, apiReachable: null });
});

describe("connectivity store", () => {
  it("starts as null until the first NetInfo event", () => {
    expect(getIsOnline()).toBeNull();
  });

  it("prefers isInternetReachable when it is known", () => {
    listener({ isConnected: true, isInternetReachable: true });
    expect(getIsOnline()).toBe(true);

    listener({ isConnected: true, isInternetReachable: false });
    expect(getIsOnline()).toBe(false);
  });

  it("falls back to isConnected when reachability is unknown (null)", () => {
    listener({ isConnected: true, isInternetReachable: null });
    expect(getIsOnline()).toBe(true);

    listener({ isConnected: false, isInternetReachable: null });
    expect(getIsOnline()).toBe(false);
  });
});

describe("api reachability", () => {
  it("starts as null until the first API attempt", () => {
    expect(useConnectivityStore.getState().apiReachable).toBeNull();
  });

  // Every HTTP response reports reachability, and four modules subscribe to this
  // store — an unchanged value must not wake any of them.
  it("does not notify subscribers when the value is unchanged", () => {
    const spy = jest.fn();
    const unsubscribe = useConnectivityStore.subscribe(spy);

    reportApiReachability(true);
    reportApiReachability(true);
    reportApiReachability(true);
    expect(spy).toHaveBeenCalledTimes(1);

    reportApiReachability(false);
    expect(spy).toHaveBeenCalledTimes(2);
    unsubscribe();
  });

  it("clears a stale server-down verdict when the device drops its network", () => {
    listener({ isConnected: true, isInternetReachable: true });
    reportApiReachability(false);
    expect(useConnectivityStore.getState().apiReachable).toBe(false);

    listener({ isConnected: false, isInternetReachable: false });
    expect(useConnectivityStore.getState().apiReachable).toBeNull();
  });
});

describe("getConnectionStatus", () => {
  const cases: [boolean | null, boolean | null, string][] = [
    [null, null, "unknown"],
    [null, true, "unknown"],
    [true, null, "online"],
    [true, true, "online"],
    [true, false, "server-unreachable"],
    [null, false, "server-unreachable"],
    // No network beats everything: don't blame the server when the device is off.
    [false, false, "device-offline"],
    [false, null, "device-offline"],
    [false, true, "device-offline"],
  ];

  it.each(cases)("isOnline=%p apiReachable=%p -> %s", (isOnline, apiReachable, expected) => {
    useConnectivityStore.setState({ isOnline, apiReachable });
    expect(getConnectionStatus()).toBe(expected);
  });
});
