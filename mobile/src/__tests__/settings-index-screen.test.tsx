jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));

import { renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { useAuthStore } from "@/src/stores/auth";
import SettingsIndex from "@/app/(tabs)/settings/index";

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
});
