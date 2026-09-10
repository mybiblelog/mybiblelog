jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn() },
}));

import { renderWithProviders } from "@/src/test-utils/renderWithProviders";
import { useAuthStore } from "@/src/stores/auth";
import { useConnectivityStore } from "@/src/stores/connectivity";
import Register from "@/app/register";

beforeEach(() => {
  useAuthStore.setState({ state: { status: "unauthenticated" } });
  useConnectivityStore.setState({ isOnline: true, apiReachable: true });
});

describe("Register screen", () => {
  it("leaves the submit buttons enabled and shows no notice when the server is reachable", () => {
    const { getByTestId, queryByText } = renderWithProviders(<Register />);

    expect(getByTestId("register.submit")).not.toBeDisabled();
    expect(getByTestId("register.google")).not.toBeDisabled();
    expect(queryByText("Signing up requires an internet connection.")).toBeNull();
    expect(queryByText("Signing up requires reaching the My Bible Log server.")).toBeNull();
  });

  it("disables submitting and says why while the device is offline", () => {
    useConnectivityStore.setState({ isOnline: false, apiReachable: null });

    const { getByTestId, getByText } = renderWithProviders(<Register />);

    expect(getByTestId("register.submit")).toBeDisabled();
    expect(getByTestId("register.google")).toBeDisabled();
    expect(getByText("Signing up requires an internet connection.")).toBeTruthy();
  });

  it("distinguishes an unreachable server from a dead network", () => {
    useConnectivityStore.setState({ isOnline: true, apiReachable: false });

    const { getByTestId, getByText } = renderWithProviders(<Register />);

    expect(getByTestId("register.submit")).toBeDisabled();
    expect(getByTestId("register.google")).toBeDisabled();
    expect(getByText("Signing up requires reaching the My Bible Log server.")).toBeTruthy();
  });
});
