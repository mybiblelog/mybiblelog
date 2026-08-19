import { renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { act, type RenderResult } from "@testing-library/react-native";
import {
  __resetForTest,
  registerManagedKey,
  reportStorageFailure,
  reportStorageOk,
} from "@/src/storage/health";
import { useAuthStore } from "@/src/stores/auth";
import { useConnectivityStore } from "@/src/stores/connectivity";
import { StatusBanner } from "./StatusBanner";

beforeEach(() => {
  __resetForTest();
  useConnectivityStore.setState({ isOnline: null, apiReachable: null });
  signIn();
});

function signIn() {
  useAuthStore.setState({
    state: { status: "authenticated", session: { token: "t", user: { email: "a@b.c" } } },
  });
}

function signOut() {
  useAuthStore.setState({ state: { status: "unauthenticated" } });
}

afterEach(() => {
  __resetForTest();
});

const OFFLINE_TEXT = "You’re offline — changes will sync when you reconnect.";
const SERVER_TEXT = "Can’t reach My Bible Log — changes will sync once the server is back.";
const STORAGE_TEXT = "Changes can’t be saved right now. Your saved data is safe.";

function degradeStorage() {
  registerManagedKey("logEntries.v1");
  reportStorageFailure("logEntries.v1", "read");
}

function expectSilent({ queryByText }: RenderResult) {
  expect(queryByText(OFFLINE_TEXT)).toBeNull();
  expect(queryByText(SERVER_TEXT)).toBeNull();
  expect(queryByText(STORAGE_TEXT)).toBeNull();
}

describe("StatusBanner", () => {
  it("stays out of the way while everything is healthy", () => {
    useConnectivityStore.setState({ isOnline: true, apiReachable: true });
    expectSilent(renderWithProviders(<StatusBanner />));
  });

  it("stays out of the way before the first connectivity signal", () => {
    expectSilent(renderWithProviders(<StatusBanner />));
  });

  it("says the device is offline when it has no network", () => {
    useConnectivityStore.setState({ isOnline: false });
    const { getByText } = renderWithProviders(<StatusBanner />);
    expect(getByText(OFFLINE_TEXT)).toBeTruthy();
  });

  // Telling someone they're offline while every other app works blames the
  // wrong thing.
  it("names the server when the device is online but the API isn't answering", () => {
    useConnectivityStore.setState({ isOnline: true, apiReachable: false });
    const { getByText } = renderWithProviders(<StatusBanner />);
    expect(getByText(SERVER_TEXT)).toBeTruthy();
  });

  it("warns that changes aren't saving when storage is degraded", () => {
    useConnectivityStore.setState({ isOnline: true, apiReachable: true });
    degradeStorage();
    const { getByText } = renderWithProviders(<StatusBanner />);
    expect(getByText(STORAGE_TEXT)).toBeTruthy();
  });

  // "Your changes aren't being saved" outranks "your changes will sync later" —
  // the queue the connectivity copy promises can't be written to either.
  it("shows only the storage warning when the device is also offline", () => {
    useConnectivityStore.setState({ isOnline: false });
    degradeStorage();
    const { getByText, queryByText } = renderWithProviders(<StatusBanner />);
    expect(getByText(STORAGE_TEXT)).toBeTruthy();
    expect(queryByText(OFFLINE_TEXT)).toBeNull();
  });

  // A key nobody manages has no rehydrator and no claim to make about saving.
  it("ignores a failure on a key no store registered", () => {
    useConnectivityStore.setState({ isOnline: true, apiReachable: true });
    reportStorageFailure("themeMode.v1", "read");
    expectSilent(renderWithProviders(<StatusBanner />));
  });

  it("clears once the backend answers again", () => {
    useConnectivityStore.setState({ isOnline: true, apiReachable: true });
    degradeStorage();
    const { queryByText } = renderWithProviders(<StatusBanner />);
    expect(queryByText(STORAGE_TEXT)).toBeTruthy();

    act(() => reportStorageOk("logEntries.v1"));
    expect(queryByText(STORAGE_TEXT)).toBeNull();
  });

  describe("while signed out", () => {
    // Both connectivity messages promise the changes will sync, and there is
    // nothing to sync to without a session.
    it.each([
      ["the device has no network", { isOnline: false, apiReachable: null }],
      ["the server isn't answering", { isOnline: true, apiReachable: false }],
    ])("says nothing when %s", (_label, connectivity) => {
      useConnectivityStore.setState(connectivity);
      signOut();
      expectSilent(renderWithProviders(<StatusBanner />));
    });

    // A device that can't save is a fact regardless of who is signed in.
    it("still warns that changes aren't saving", () => {
      useConnectivityStore.setState({ isOnline: false });
      signOut();
      degradeStorage();
      const { getByText } = renderWithProviders(<StatusBanner />);
      expect(getByText(STORAGE_TEXT)).toBeTruthy();
    });
  });

  // The session resolves asynchronously on launch; showing a connectivity
  // message before it does would flash a claim we can't yet make.
  it("says nothing about connectivity while the session is still loading", () => {
    useConnectivityStore.setState({ isOnline: false });
    useAuthStore.setState({ state: { status: "loading" } });
    expectSilent(renderWithProviders(<StatusBanner />));
  });
});
