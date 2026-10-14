// The package's real module chain pulls in the native NitroModules turbo
// module, which isn't available off-device — mock it fully rather than
// `requireActual`ing it (mirrors the intent of the stale global mock in
// jest.setup.ts, which predates the switch to `GoogleOneTapSignIn`).
jest.mock("react-native-nitro-google-signin", () => {
  class MockGoogleSignInError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.name = "GoogleSignInError";
      this.code = code;
    }
  }
  return {
    GoogleOneTapSignIn: {
      configure: jest.fn(),
      presentExplicitSignIn: jest.fn(),
      signOut: jest.fn(),
    },
    GoogleSignInError: MockGoogleSignInError,
    statusCodes: { SIGN_IN_CANCELLED: "SIGN_IN_CANCELLED" },
    isCancelledResponse: (response: { type: string }) => response.type === "cancelled",
    isSuccessResponse: (response: { type: string; data?: unknown }) =>
      response.type === "success" && response.data != null,
    isErrorWithCode: (error: unknown) => error instanceof MockGoogleSignInError,
  };
});

import {
  GoogleOneTapSignIn,
  GoogleSignInError,
  statusCodes,
} from "react-native-nitro-google-signin";
import { signInWithGoogle } from "@/src/auth/googleSignIn";

const mockedPresentExplicitSignIn = GoogleOneTapSignIn.presentExplicitSignIn as jest.Mock;

describe("signInWithGoogle", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns cancelled when the user dismisses the sign-in UI", async () => {
    mockedPresentExplicitSignIn.mockResolvedValue({ type: "cancelled" });
    expect(await signInWithGoogle()).toEqual({ ok: "cancelled" });
  });

  it("returns the id token on success", async () => {
    mockedPresentExplicitSignIn.mockResolvedValue({
      type: "success",
      data: { idToken: "token-123" },
    });
    expect(await signInWithGoogle()).toEqual({ ok: true, idToken: "token-123" });
  });

  it("falls through to ok:false when the success response is missing an idToken", async () => {
    mockedPresentExplicitSignIn.mockResolvedValue({ type: "success", data: {} });
    expect(await signInWithGoogle()).toEqual({ ok: false });
  });

  it("falls through to ok:false when the idToken is empty", async () => {
    mockedPresentExplicitSignIn.mockResolvedValue({
      type: "success",
      data: { idToken: "" },
    });
    expect(await signInWithGoogle()).toEqual({ ok: false });
  });

  it("returns ok:false for a native GoogleSignInError", async () => {
    mockedPresentExplicitSignIn.mockRejectedValue(
      new GoogleSignInError(statusCodes.SIGN_IN_CANCELLED, "cancelled")
    );
    expect(await signInWithGoogle()).toEqual({ ok: false });
  });

  it("returns ok:false for a generic error", async () => {
    mockedPresentExplicitSignIn.mockRejectedValue(new Error("boom"));
    expect(await signInWithGoogle()).toEqual({ ok: false });
  });
});
