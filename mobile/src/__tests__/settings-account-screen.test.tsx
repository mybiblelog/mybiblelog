jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("@react-native-community/netinfo", () => ({
  useNetInfo: () => ({ isConnected: true, isInternetReachable: true }),
}));

import { renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { useAuthStore } from "@/src/stores/auth";
import AccountSettings from "@/app/(tabs)/settings/account";

describe("Account settings screen", () => {
  it("clarifies the signed-out state and offers a single Login action", () => {
    useAuthStore.setState({ state: { status: "unauthenticated" } });
    const { getByText, getByTestId, queryAllByText } = renderWithProviders(<AccountSettings />);

    expect(getByText("Not Logged In")).toBeTruthy();
    expect(
      getByText(
        "Your offline data on this device will not sync to your account until you are online and logged in."
      )
    ).toBeTruthy();
    expect(getByTestId("settings.login")).toBeTruthy();
    // Only the button says "Login" now — no redundant inline copy beside it.
    expect(queryAllByText("Login")).toHaveLength(1);
  });

  it("shows the signed-in email once authenticated", () => {
    useAuthStore.setState({
      state: { status: "authenticated", session: { token: "t", user: { email: "a@b.com" } } },
    });
    const { getByText } = renderWithProviders(<AccountSettings />);

    expect(getByText("Logged In")).toBeTruthy();
    expect(getByText("Signed in as a@b.com")).toBeTruthy();
  });
});
