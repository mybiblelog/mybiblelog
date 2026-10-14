jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => false) },
}));

jest.mock("@/src/api/authApi", () => ({
  beginPasswordReset: jest.fn(),
}));

// Stub AuthCodeForm so this screen test exercises the forgot-password step
// transition and its wiring to AuthCodeForm's `onDone`, without depending on
// AuthCodeForm's own internal code-validation/API flow (covered separately).
jest.mock("@/src/components", () => {
  const actual = jest.requireActual("@/src/components");
  const { Pressable, Text: RNText } = jest.requireActual("react-native");
  return {
    ...actual,
    AuthCodeForm: ({ onDone, testIDPrefix }: { onDone: () => void; testIDPrefix?: string }) => (
      <Pressable testID={`${testIDPrefix}.done`} onPress={onDone}>
        <RNText>stub-auth-code-form</RNText>
      </Pressable>
    ),
  };
});

import { fireEvent, renderWithProviders, waitFor } from "@/src/test-utils/renderWithProviders";
import { router } from "expo-router";
import { beginPasswordReset } from "@/src/api/authApi";
import ForgotPassword from "@/app/forgot-password";

const mockBeginPasswordReset = beginPasswordReset as jest.Mock;

beforeEach(() => {
  mockBeginPasswordReset.mockReset();
});

describe("Forgot password screen", () => {
  it("shows a validation error and does not call beginPasswordReset when the email is empty", async () => {
    const { getByTestId, getByText } = renderWithProviders(<ForgotPassword />);

    fireEvent.press(getByTestId("forgot-password.submit"));

    await waitFor(() => {
      expect(getByText("Enter your email.")).toBeTruthy();
    });
    expect(mockBeginPasswordReset).not.toHaveBeenCalled();
  });

  it("submits the email and advances to the code step", async () => {
    mockBeginPasswordReset.mockResolvedValueOnce({ ok: true });

    const { getByTestId, queryByTestId, getByText } = renderWithProviders(<ForgotPassword />);

    fireEvent.changeText(getByTestId("forgot-password.email"), "user@example.com");
    fireEvent.press(getByTestId("forgot-password.submit"));

    await waitFor(() => {
      expect(getByText("stub-auth-code-form")).toBeTruthy();
    });
    expect(mockBeginPasswordReset).toHaveBeenCalledWith("user@example.com");
    expect(queryByTestId("forgot-password.submit")).toBeNull();
  });

  it("navigates home when the AuthCodeForm signals it is done", async () => {
    mockBeginPasswordReset.mockResolvedValueOnce({ ok: true });

    const { getByTestId } = renderWithProviders(<ForgotPassword />);

    fireEvent.changeText(getByTestId("forgot-password.email"), "user@example.com");
    fireEvent.press(getByTestId("forgot-password.submit"));

    await waitFor(() => {
      expect(getByTestId("forgot-password.code.done")).toBeTruthy();
    });

    fireEvent.press(getByTestId("forgot-password.code.done"));

    expect(router.replace).toHaveBeenCalledWith("/");
  });

  it("shows an error message when beginPasswordReset rejects", async () => {
    mockBeginPasswordReset.mockRejectedValueOnce(new Error("network down"));

    const { getByTestId, getByText, queryByText } = renderWithProviders(<ForgotPassword />);

    fireEvent.changeText(getByTestId("forgot-password.email"), "user@example.com");
    fireEvent.press(getByTestId("forgot-password.submit"));

    await waitFor(() => {
      expect(getByText("Something went wrong. Please try again.")).toBeTruthy();
    });
    expect(queryByText("stub-auth-code-form")).toBeNull();
    expect(getByTestId("forgot-password.submit")).not.toBeDisabled();
  });
});
