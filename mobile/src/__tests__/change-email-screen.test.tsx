jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => false) },
}));

jest.mock("@/src/api/authApi", () => ({
  beginEmailChange: jest.fn(),
}));

import { fireEvent, renderWithProviders, waitFor } from "@/src/test-utils/renderWithProviders";
import { useAuthStore } from "@/src/stores/auth";
import { beginEmailChange } from "@/src/api/authApi";
import ChangeEmail from "@/app/(tabs)/settings/change-email";

const mockedBeginEmailChange = beginEmailChange as jest.Mock;

const AUTHENTICATED_STATE = {
  status: "authenticated" as const,
  session: { token: "token-123", user: { email: "current@example.com" } },
};

beforeEach(() => {
  mockedBeginEmailChange.mockReset();
  useAuthStore.setState({ state: AUTHENTICATED_STATE });
});

describe("Change email screen", () => {
  it("shows the not-logged-in guard when unauthenticated", async () => {
    useAuthStore.setState({ state: { status: "unauthenticated" } });

    const { getByText, queryByTestId } = await renderWithProviders(<ChangeEmail />);

    expect(getByText("Not Logged In")).toBeTruthy();
    expect(queryByTestId("change-email.submit")).toBeNull();
    expect(mockedBeginEmailChange).not.toHaveBeenCalled();
  });

  it("requires the new email and password before calling the API", async () => {
    const { getByTestId, getByText } = await renderWithProviders(<ChangeEmail />);

    await fireEvent.press(getByTestId("change-email.submit"));

    expect(getByText("Enter your new email.")).toBeTruthy();
    expect(getByText("Enter your current password.")).toBeTruthy();
    expect(mockedBeginEmailChange).not.toHaveBeenCalled();
  });

  it("renders a field-level error from the API (e.g. email already in use)", async () => {
    mockedBeginEmailChange.mockResolvedValue({
      ok: false,
      error: { code: "validation_error", errors: [{ field: "newEmail", code: "email_in_use" }] },
    });

    const { getByTestId, findByText, queryByText } = await renderWithProviders(<ChangeEmail />);

    await fireEvent.changeText(getByTestId("change-email.new-email"), "taken@example.com");
    await fireEvent.changeText(getByTestId("change-email.password"), "correct-password");
    await fireEvent.press(getByTestId("change-email.submit"));

    expect(await findByText("Email address is already in use")).toBeTruthy();
    expect(queryByText("Enter your current password.")).toBeNull();
    expect(mockedBeginEmailChange).toHaveBeenCalledWith(
      "token-123",
      "taken@example.com",
      "correct-password"
    );
  });

  it("renders a form-level error when the API error has no field mapping", async () => {
    mockedBeginEmailChange.mockResolvedValue({
      ok: false,
      error: { code: "too_many_requests", errors: [] },
    });

    const { getByTestId, findByText } = await renderWithProviders(<ChangeEmail />);

    await fireEvent.changeText(getByTestId("change-email.new-email"), "new@example.com");
    await fireEvent.changeText(getByTestId("change-email.password"), "correct-password");
    await fireEvent.press(getByTestId("change-email.submit"));

    expect(await findByText("Too many requests were sent in a short amount of time")).toBeTruthy();
  });

  it("moves to the code step after a successful submission", async () => {
    mockedBeginEmailChange.mockResolvedValue({ ok: true });

    const { getByTestId, queryByTestId } = await renderWithProviders(<ChangeEmail />);

    await fireEvent.changeText(getByTestId("change-email.new-email"), "new@example.com");
    await fireEvent.changeText(getByTestId("change-email.password"), "correct-password");
    await fireEvent.press(getByTestId("change-email.submit"));

    await waitFor(() => expect(getByTestId("change-email.code.code")).toBeTruthy());
    expect(queryByTestId("change-email.submit")).toBeNull();
  });
});
