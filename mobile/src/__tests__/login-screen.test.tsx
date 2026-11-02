jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => false) },
}));

jest.mock("@/src/auth/googleSignIn", () => ({
  signInWithGoogle: jest.fn(),
}));

import { act, fireEvent, renderWithProviders, waitFor } from "@/src/test-utils/renderWithProviders";
import { useAuthStore } from "@/src/stores/auth";
import { useConnectivityStore } from "@/src/stores/connectivity";
import { signInWithGoogle } from "@/src/auth/googleSignIn";
import { router } from "expo-router";
import Login from "@/app/login";

const mockSignInWithGoogle = signInWithGoogle as jest.Mock;

beforeEach(() => {
  useAuthStore.setState({ state: { status: "unauthenticated" } });
  useConnectivityStore.setState({ isOnline: true, apiReachable: true });
  jest.clearAllMocks();
});

async function fillAndSubmit(
  getByTestId: Awaited<ReturnType<typeof renderWithProviders>>["getByTestId"]
) {
  await fireEvent.changeText(getByTestId("login.email"), "person@example.com");
  await fireEvent.changeText(getByTestId("login.password"), "hunter2");
  await act(async () => {
    await fireEvent.press(getByTestId("login.submit"));
  });
}

describe("Login screen", () => {
  it("leaves the submit buttons enabled and shows no notice when the server is reachable", async () => {
    const { getByTestId, queryByText } = await renderWithProviders(<Login />);

    expect(getByTestId("login.submit")).not.toBeDisabled();
    expect(getByTestId("login.google")).not.toBeDisabled();
    expect(queryByText("Logging in requires an internet connection.")).toBeNull();
    expect(queryByText("Logging in requires reaching the My Bible Log server.")).toBeNull();
  });

  it("disables submitting and says why while the device is offline", async () => {
    useConnectivityStore.setState({ isOnline: false, apiReachable: null });

    const { getByTestId, getByText } = await renderWithProviders(<Login />);

    expect(getByTestId("login.submit")).toBeDisabled();
    expect(getByTestId("login.google")).toBeDisabled();
    expect(getByText("Logging in requires an internet connection.")).toBeTruthy();
  });

  it("distinguishes an unreachable server from a dead network", async () => {
    useConnectivityStore.setState({ isOnline: true, apiReachable: false });

    const { getByTestId, getByText } = await renderWithProviders(<Login />);

    expect(getByTestId("login.submit")).toBeDisabled();
    expect(getByTestId("login.google")).toBeDisabled();
    expect(getByText("Logging in requires reaching the My Bible Log server.")).toBeTruthy();
  });

  describe("email login", () => {
    it("navigates away on a successful login", async () => {
      const loginWithEmailPassword = jest.fn().mockResolvedValue({ ok: true });
      useAuthStore.setState({ loginWithEmailPassword });

      const { getByTestId } = await renderWithProviders(<Login />);
      await fillAndSubmit(getByTestId);

      expect(loginWithEmailPassword).toHaveBeenCalledWith("person@example.com", "hunter2");
      expect(router.replace).toHaveBeenCalledWith("/");
    });

    it("shows field-level errors from the API response", async () => {
      const loginWithEmailPassword = jest.fn().mockResolvedValue({
        ok: false,
        error: {
          code: "validation_error",
          errors: [
            { field: "email", code: "is_invalid" },
            { field: "password", code: "required" },
          ],
        },
      });
      useAuthStore.setState({ loginWithEmailPassword });

      const { getByTestId, getByText } = await renderWithProviders(<Login />);
      await fillAndSubmit(getByTestId);

      expect(getByText("Please enter a valid email")).toBeTruthy();
      expect(getByText("A password is required")).toBeTruthy();
      expect(router.replace).not.toHaveBeenCalled();
      expect(router.back).not.toHaveBeenCalled();
    });

    it("falls back to a form-level message when there is one", async () => {
      const loginWithEmailPassword = jest.fn().mockResolvedValue({
        ok: false,
        error: { code: "invalid_login", errors: [] },
      });
      useAuthStore.setState({ loginWithEmailPassword });

      const { getByTestId, getByText } = await renderWithProviders(<Login />);
      await fillAndSubmit(getByTestId);

      expect(getByText("Email or password is incorrect")).toBeTruthy();
    });

    it("switches to the verify-email code flow for verify_email errors", async () => {
      const loginWithEmailPassword = jest.fn().mockResolvedValue({
        ok: false,
        error: { code: "verify_email", errors: [] },
      });
      useAuthStore.setState({ loginWithEmailPassword });

      const { getByTestId } = await renderWithProviders(<Login />);
      await fillAndSubmit(getByTestId);

      expect(getByTestId("login.verify.code")).toBeTruthy();
    });

    it("shows a generic error when the response has no translatable message", async () => {
      const loginWithEmailPassword = jest.fn().mockResolvedValue({
        ok: false,
        error: { code: "some_untranslated_code", errors: [] },
      });
      useAuthStore.setState({ loginWithEmailPassword });

      const { getByTestId, getByText } = await renderWithProviders(<Login />);
      await fillAndSubmit(getByTestId);

      expect(getByText("Something went wrong. Please try again.")).toBeTruthy();
    });

    it("shows a generic error when the login call rejects", async () => {
      const loginWithEmailPassword = jest.fn().mockRejectedValue(new Error("network down"));
      useAuthStore.setState({ loginWithEmailPassword });

      const { getByTestId, getByText } = await renderWithProviders(<Login />);
      await fillAndSubmit(getByTestId);

      expect(getByText("Something went wrong. Please try again.")).toBeTruthy();
    });
  });

  describe("Google login", () => {
    it("stays quiet and resets submitting when the user cancels", async () => {
      mockSignInWithGoogle.mockResolvedValue({ ok: "cancelled" });

      const { getByTestId, queryByText } = await renderWithProviders(<Login />);
      await act(async () => {
        await fireEvent.press(getByTestId("login.google"));
      });

      expect(queryByText("Something went wrong. Please try again.")).toBeNull();
      await waitFor(() => expect(getByTestId("login.submit")).not.toBeDisabled());
    });

    it("shows a generic error when signInWithGoogle fails", async () => {
      mockSignInWithGoogle.mockResolvedValue({ ok: false });

      const { getByTestId, getByText } = await renderWithProviders(<Login />);
      await act(async () => {
        await fireEvent.press(getByTestId("login.google"));
      });

      expect(getByText("Something went wrong. Please try again.")).toBeTruthy();
    });

    it("navigates away when finishGoogleLogin succeeds", async () => {
      mockSignInWithGoogle.mockResolvedValue({ ok: true, idToken: "id-token" });
      const finishGoogleLogin = jest.fn().mockResolvedValue({ ok: true });
      useAuthStore.setState({ finishGoogleLogin });

      const { getByTestId } = await renderWithProviders(<Login />);
      await act(async () => {
        await fireEvent.press(getByTestId("login.google"));
      });

      expect(finishGoogleLogin).toHaveBeenCalledWith("id-token", expect.anything());
      expect(router.replace).toHaveBeenCalledWith("/");
    });

    it("shows a generic error when finishGoogleLogin fails", async () => {
      mockSignInWithGoogle.mockResolvedValue({ ok: true, idToken: "id-token" });
      const finishGoogleLogin = jest.fn().mockResolvedValue({ ok: false });
      useAuthStore.setState({ finishGoogleLogin });

      const { getByTestId, getByText } = await renderWithProviders(<Login />);
      await act(async () => {
        await fireEvent.press(getByTestId("login.google"));
      });

      expect(getByText("Something went wrong. Please try again.")).toBeTruthy();
    });

    it("shows a generic error when signInWithGoogle rejects", async () => {
      mockSignInWithGoogle.mockRejectedValue(new Error("native failure"));

      const { getByTestId, getByText } = await renderWithProviders(<Login />);
      await act(async () => {
        await fireEvent.press(getByTestId("login.google"));
      });

      expect(getByText("Something went wrong. Please try again.")).toBeTruthy();
    });
  });
});
