import NetInfo from "@react-native-community/netinfo";
import { getIsOnline, initConnectivity, useConnectivityStore } from "./connectivity";

type Listener = (s: { isConnected: boolean | null; isInternetReachable: boolean | null }) => void;

// initConnectivity subscribes once (module-level guard) and `clearMocks` wipes
// mock.calls before each test, so capture the registered listener up front.
let listener: Listener;
beforeAll(() => {
  initConnectivity();
  listener = (NetInfo.addEventListener as jest.Mock).mock.calls[0][0] as Listener;
});

beforeEach(() => {
  useConnectivityStore.setState({ isOnline: null });
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
