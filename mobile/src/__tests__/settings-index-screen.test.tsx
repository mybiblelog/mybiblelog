jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));

import { fireEvent } from "@testing-library/react-native";
import { router } from "expo-router";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { useAuthStore } from "@/src/stores/auth";
import { useConnectivityStore } from "@/src/stores/connectivity";
import SettingsIndex from "@/app/(tabs)/settings/index";

beforeEach(() => {
  useConnectivityStore.setState({ isOnline: true });
});

describe("Settings index screen", () => {
  it("flags the Account row when signed out", async () => {
    useAuthStore.setState({ state: { status: "unauthenticated" } });
    const { queryByTestId } = await renderWithProviders(<SettingsIndex />);
    expect(queryByTestId("attentionDot")).toBeTruthy();
  });

  it("hides the flag once signed in", async () => {
    useAuthStore.setState({
      state: { status: "authenticated", session: { token: "t", user: { email: "a@b.com" } } },
    });
    const { queryByTestId } = await renderWithProviders(<SettingsIndex />);
    expect(queryByTestId("attentionDot")).toBeNull();
  });

  it("shows the offline banner (Settings screens previously had none)", async () => {
    useConnectivityStore.setState({ isOnline: false });
    const { getByText } = await renderWithProviders(<SettingsIndex />);
    expect(getByText("You’re offline — changes will sync when you reconnect.")).toBeTruthy();
  });

  it("links to the Feedback screen", async () => {
    const { getByTestId } = await renderWithProviders(<SettingsIndex />);
    await fireEvent.press(getByTestId("settings.feedback-link"));
    expect(router.push).toHaveBeenCalledWith("/settings/feedback");
  });
});
