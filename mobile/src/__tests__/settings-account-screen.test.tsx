jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
import { fireEvent } from "@testing-library/react-native";
import { renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { useAuthStore } from "@/src/stores/auth";
import { useConnectivityStore } from "@/src/stores/connectivity";
import AccountSettings from "@/app/(tabs)/settings/account";

const logout = jest.fn(async () => {});

beforeEach(() => {
  logout.mockClear();
  useAuthStore.setState({ logout });
  useConnectivityStore.setState({ isOnline: true, apiReachable: true });
});

describe("Account settings screen", () => {
  it("clarifies the signed-out state and offers both Login and Create account", () => {
    useAuthStore.setState({ state: { status: "unauthenticated" } });
    const { getByText, getByTestId, queryAllByText } = renderWithProviders(<AccountSettings />);

    expect(getByText("Not Logged In")).toBeTruthy();
    expect(
      getByText(
        "Your offline data on this device will not sync to your account until you are online and logged in."
      )
    ).toBeTruthy();
    // Both paths are offered so it's clear you don't need an account already.
    expect(getByTestId("settings.login")).toBeTruthy();
    expect(getByTestId("settings.register")).toBeTruthy();
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

  it("hides the Login button and explains why when offline and signed out", () => {
    useConnectivityStore.setState({ isOnline: false });
    useAuthStore.setState({ state: { status: "unauthenticated" } });
    const { getByText, queryByTestId } = renderWithProviders(<AccountSettings />);

    expect(queryByTestId("settings.login")).toBeNull();
    expect(queryByTestId("settings.register")).toBeNull();
    expect(getByText("Offline")).toBeTruthy();
    expect(getByText("Logging in requires an internet connection.")).toBeTruthy();
  });

  // A server outage must not read as "you're offline" — the user's own network
  // is fine and other apps work.
  it("blames the server, not the network, when the API is unreachable", () => {
    useConnectivityStore.setState({ isOnline: true, apiReachable: false });
    useAuthStore.setState({ state: { status: "unauthenticated" } });
    const { getByText, queryByTestId } = renderWithProviders(<AccountSettings />);

    expect(queryByTestId("settings.login")).toBeNull();
    expect(getByText("Server unavailable")).toBeTruthy();
    expect(getByText("Logging in requires reaching the My Bible Log server.")).toBeTruthy();
  });

  it("still allows logout while offline", () => {
    useConnectivityStore.setState({ isOnline: false });
    useAuthStore.setState({
      state: { status: "authenticated", session: { token: "t", user: { email: "a@b.com" } } },
    });
    const { getByText } = renderWithProviders(<AccountSettings />);

    expect(getByText("Logout")).toBeTruthy();
  });

  it("confirms before logging out", () => {
    useAuthStore.setState({
      state: { status: "authenticated", session: { token: "t", user: { email: "a@b.com" } } },
    });
    const { getByText, getAllByText, getByTestId } = renderWithProviders(<AccountSettings />);

    fireEvent.press(getByTestId("settings.logout"));
    expect(logout).not.toHaveBeenCalled();
    expect(getByText("Log out?")).toBeTruthy();

    fireEvent.press(getAllByText("Logout")[getAllByText("Logout").length - 1]);
    expect(logout).toHaveBeenCalled();
  });
});
