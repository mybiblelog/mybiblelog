jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => false) },
}));

import { renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { useAuthStore } from "@/src/stores/auth";
import { useConnectivityStore } from "@/src/stores/connectivity";
import Login from "@/app/login";

beforeEach(() => {
  useAuthStore.setState({ state: { status: "unauthenticated" } });
  useConnectivityStore.setState({ isOnline: true, apiReachable: true });
});

describe("Login screen", () => {
  it("leaves the submit buttons enabled and shows no notice when the server is reachable", () => {
    const { getByTestId, queryByText } = renderWithProviders(<Login />);

    expect(getByTestId("login.submit")).not.toBeDisabled();
    expect(getByTestId("login.google")).not.toBeDisabled();
    expect(queryByText("Logging in requires an internet connection.")).toBeNull();
    expect(queryByText("Logging in requires reaching the My Bible Log server.")).toBeNull();
  });

  it("disables submitting and says why while the device is offline", () => {
    useConnectivityStore.setState({ isOnline: false, apiReachable: null });

    const { getByTestId, getByText } = renderWithProviders(<Login />);

    expect(getByTestId("login.submit")).toBeDisabled();
    expect(getByTestId("login.google")).toBeDisabled();
    expect(getByText("Logging in requires an internet connection.")).toBeTruthy();
  });

  it("distinguishes an unreachable server from a dead network", () => {
    useConnectivityStore.setState({ isOnline: true, apiReachable: false });

    const { getByTestId, getByText } = renderWithProviders(<Login />);

    expect(getByTestId("login.submit")).toBeDisabled();
    expect(getByTestId("login.google")).toBeDisabled();
    expect(getByText("Logging in requires reaching the My Bible Log server.")).toBeTruthy();
  });
});
