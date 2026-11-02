jest.mock("@/src/api/authApi", () => ({
  ...jest.requireActual("@/src/api/authApi"),
  verifyEmailCode: jest.fn(),
  completeEmailChange: jest.fn(),
  validatePasswordResetCode: jest.fn(),
  completePasswordReset: jest.fn(),
}));

import type { TestInstance } from "test-renderer";
import {
  completeEmailChange,
  completePasswordReset,
  validatePasswordResetCode,
  verifyEmailCode,
} from "@/src/api/authApi";
import { fireEvent, renderWithProviders, waitFor } from "@/src/test-utils/renderWithProviders";
import { useAuthStore } from "@/src/stores/auth";
import { AuthCodeForm } from "./AuthCodeForm";

const CODE = "123456";

beforeEach(() => {
  useAuthStore.setState({ state: { status: "unauthenticated" } });
});

async function typeCode(getByTestId: (id: string) => TestInstance, prefix = "auth-code") {
  await fireEvent.changeText(getByTestId(`${prefix}.code`), CODE);
}

describe("AuthCodeForm", () => {
  it("verify-email: submits the code and establishes a session on success", async () => {
    (verifyEmailCode as jest.Mock).mockResolvedValue({ ok: true, token: "tok-1" });
    const onDone = jest.fn();
    const { getByTestId } = await renderWithProviders(
      <AuthCodeForm flow="verify-email" email="a@example.com" onDone={onDone} />
    );

    await typeCode(getByTestId);

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(verifyEmailCode).toHaveBeenCalledWith("a@example.com", CODE);
    expect(useAuthStore.getState().state).toEqual(
      expect.objectContaining({
        status: "authenticated",
        session: expect.objectContaining({ token: "tok-1", user: { email: "a@example.com" } }),
      })
    );
  });

  it("verify-email: shows the mapped error and clears the code on failure", async () => {
    (verifyEmailCode as jest.Mock).mockResolvedValue({
      ok: false,
      error: { code: "verification_code_expired", errors: [] },
    });
    const onDone = jest.fn();
    const { getByTestId, findByTestId } = await renderWithProviders(
      <AuthCodeForm flow="verify-email" email="a@example.com" onDone={onDone} />
    );

    await typeCode(getByTestId);

    const error = await findByTestId("auth-code.error");
    expect(error.props.children).toBeTruthy();
    expect(onDone).not.toHaveBeenCalled();
    expect(getByTestId("auth-code.code").props.value).toBe("");
  });

  it("change-email: submits the code against the current email and establishes a session using resultEmail", async () => {
    (completeEmailChange as jest.Mock).mockResolvedValue({ ok: true, token: "tok-2" });
    const onDone = jest.fn();
    const { getByTestId } = await renderWithProviders(
      <AuthCodeForm
        flow="change-email"
        email="old@example.com"
        resultEmail="new@example.com"
        onDone={onDone}
      />
    );

    await typeCode(getByTestId);

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(completeEmailChange).toHaveBeenCalledWith("old@example.com", CODE);
    expect(useAuthStore.getState().state).toEqual(
      expect.objectContaining({
        status: "authenticated",
        session: expect.objectContaining({ token: "tok-2", user: { email: "new@example.com" } }),
      })
    );
  });

  it("change-email: shows the mapped error on failure", async () => {
    (completeEmailChange as jest.Mock).mockResolvedValue({
      ok: false,
      error: { code: "unknown_error", errors: [] },
    });
    const onDone = jest.fn();
    const { getByTestId, findByTestId } = await renderWithProviders(
      <AuthCodeForm flow="change-email" email="old@example.com" onDone={onDone} />
    );

    await typeCode(getByTestId);

    expect(await findByTestId("auth-code.error")).toBeTruthy();
    expect(onDone).not.toHaveBeenCalled();
  });

  it("reset-password: validates the code, reveals the password step, and completes the reset", async () => {
    (validatePasswordResetCode as jest.Mock).mockResolvedValue({ ok: true, valid: true });
    (completePasswordReset as jest.Mock).mockResolvedValue({ ok: true, token: "tok-3" });
    const onDone = jest.fn();
    const { getByTestId, findByTestId } = await renderWithProviders(
      <AuthCodeForm flow="reset-password" email="a@example.com" onDone={onDone} />
    );

    await typeCode(getByTestId);

    const newPassword = await findByTestId("auth-code.new-password");
    await fireEvent.changeText(newPassword, "hunter22");
    await fireEvent.changeText(getByTestId("auth-code.confirm-password"), "hunter22");
    await fireEvent.press(getByTestId("auth-code.submit"));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    expect(completePasswordReset).toHaveBeenCalledWith("a@example.com", CODE, "hunter22");
    expect(useAuthStore.getState().state).toEqual(
      expect.objectContaining({
        status: "authenticated",
        session: expect.objectContaining({ token: "tok-3", user: { email: "a@example.com" } }),
      })
    );
  });

  it("reset-password: shows the invalid-code error and clears the code without advancing", async () => {
    (validatePasswordResetCode as jest.Mock).mockResolvedValue({ ok: true, valid: false });
    const { getByTestId, findByText, queryByTestId } = await renderWithProviders(
      <AuthCodeForm flow="reset-password" email="a@example.com" onDone={jest.fn()} />
    );

    await typeCode(getByTestId);

    expect(
      await findByText(
        "That code is invalid or has expired. Please check your email or request a new code."
      )
    ).toBeTruthy();
    expect(getByTestId("auth-code.code").props.value).toBe("");
    expect(queryByTestId("auth-code.new-password")).toBeNull();
  });

  it("reset-password: shows the mapped error when validating the code fails", async () => {
    (validatePasswordResetCode as jest.Mock).mockResolvedValue({
      ok: false,
      error: { code: "unknown_error", errors: [] },
    });
    const { getByTestId, findByTestId, queryByTestId } = await renderWithProviders(
      <AuthCodeForm flow="reset-password" email="a@example.com" onDone={jest.fn()} />
    );

    await typeCode(getByTestId);

    expect(await findByTestId("auth-code.error")).toBeTruthy();
    expect(queryByTestId("auth-code.new-password")).toBeNull();
  });

  it("reset-password: rejects mismatched passwords without calling the API", async () => {
    (validatePasswordResetCode as jest.Mock).mockResolvedValue({ ok: true, valid: true });
    const { getByTestId, findByTestId, findByText } = await renderWithProviders(
      <AuthCodeForm flow="reset-password" email="a@example.com" onDone={jest.fn()} />
    );

    await typeCode(getByTestId);

    const newPassword = await findByTestId("auth-code.new-password");
    await fireEvent.changeText(newPassword, "hunter22");
    await fireEvent.changeText(getByTestId("auth-code.confirm-password"), "different1");
    await fireEvent.press(getByTestId("auth-code.submit"));

    expect(await findByText("Passwords must match.")).toBeTruthy();
    expect(completePasswordReset).not.toHaveBeenCalled();
  });
});
