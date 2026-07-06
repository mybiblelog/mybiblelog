jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));

import { renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { useAuthStore } from "@/src/stores/auth";
import { useConnectivityStore } from "@/src/stores/connectivity";
import SettingsIndex from "@/app/(tabs)/settings/index";

beforeEach(() => {
  useConnectivityStore.setState({ isOnline: true });
});

describe("Settings index screen", () => {
  it("flags the Account row when signed out", () => {
    useAuthStore.setState({ state: { status: "unauthenticated" } });
    const { queryByTestId } = renderWithProviders(<SettingsIndex />);
    expect(queryByTestId("attentionDot")).toBeTruthy();
  });

  it("hides the flag once signed in", () => {
    useAuthStore.setState({
      state: { status: "authenticated", session: { token: "t", user: { email: "a@b.com" } } },
    });
    const { queryByTestId } = renderWithProviders(<SettingsIndex />);
    expect(queryByTestId("attentionDot")).toBeNull();
  });

  it("shows the offline banner (Settings screens previously had none)", () => {
    useConnectivityStore.setState({ isOnline: false });
    const { getByText } = renderWithProviders(<SettingsIndex />);
    expect(getByText("You’re offline — changes will sync when you reconnect.")).toBeTruthy();
  });
});
