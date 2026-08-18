import { renderWithProviders } from "@/src/test-utils/renderWithProviders";
import type { RenderResult } from "@testing-library/react-native";
import { useConnectivityStore } from "@/src/stores/connectivity";
import { OfflineBanner } from "./OfflineBanner";

beforeEach(() => {
  useConnectivityStore.setState({ isOnline: null, apiReachable: null });
});

const OFFLINE_TEXT = "You’re offline — changes will sync when you reconnect.";
const SERVER_TEXT = "Can’t reach My Bible Log — changes will sync once the server is back.";

function expectSilent({ queryByText }: RenderResult) {
  expect(queryByText(OFFLINE_TEXT)).toBeNull();
  expect(queryByText(SERVER_TEXT)).toBeNull();
}

describe("OfflineBanner", () => {
  it("stays out of the way while everything is healthy", () => {
    useConnectivityStore.setState({ isOnline: true, apiReachable: true });
    expectSilent(renderWithProviders(<OfflineBanner />));
  });

  it("stays out of the way before the first connectivity signal", () => {
    expectSilent(renderWithProviders(<OfflineBanner />));
  });

  it("says the device is offline when it has no network", () => {
    useConnectivityStore.setState({ isOnline: false });
    const { getByText } = renderWithProviders(<OfflineBanner />);
    expect(getByText(OFFLINE_TEXT)).toBeTruthy();
  });

  // Telling someone they're offline while every other app works blames the
  // wrong thing.
  it("names the server when the device is online but the API isn't answering", () => {
    useConnectivityStore.setState({ isOnline: true, apiReachable: false });
    const { getByText } = renderWithProviders(<OfflineBanner />);
    expect(getByText(SERVER_TEXT)).toBeTruthy();
  });
});
