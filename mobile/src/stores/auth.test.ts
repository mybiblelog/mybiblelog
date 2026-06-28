jest.mock("@/src/api/authApi", () => ({
  googleIdTokenLogin: jest.fn(),
  emailPasswordLogin: jest.fn(),
}));
jest.mock("@/src/auth/authStorage", () => ({
  loadAuthSession: jest.fn(),
  loadLastLoggedInEmail: jest.fn(),
  saveAuthSession: jest.fn(),
  clearAuthSession: jest.fn(),
  saveLastLoggedInEmail: jest.fn(),
  clearLastLoggedInEmail: jest.fn(),
}));
jest.mock("@/src/auth/googleSignIn", () => ({ signOutGoogle: jest.fn() }));
jest.mock("@/src/stores/connectivity", () => ({
  getIsOnline: jest.fn(() => true),
  useConnectivityStore: { subscribe: jest.fn() },
}));

import { emailPasswordLogin, googleIdTokenLogin } from "@/src/api/authApi";
import { clearAuthSession, saveAuthSession } from "@/src/auth/authStorage";
import { signOutGoogle } from "@/src/auth/googleSignIn";
import { getAuthToken, useAuthStore } from "./auth";

const actions = () => useAuthStore.getState();

beforeEach(() => {
  useAuthStore.setState({ state: { status: "loading" } });
  global.fetch = jest.fn().mockResolvedValue({ ok: true });
});

describe("loginWithEmailPassword", () => {
  it("authenticates and persists the session on success", async () => {
    (emailPasswordLogin as jest.Mock).mockResolvedValue({
      ok: true,
      token: "tok",
      email: "a@b.com",
    });
    const result = await actions().loginWithEmailPassword("a@b.com", "pw");
    expect(result).toEqual({ ok: true });
    expect(saveAuthSession).toHaveBeenCalledWith({ token: "tok", user: { email: "a@b.com" } });
    expect(useAuthStore.getState().state.status).toBe("authenticated");
    expect(getAuthToken()).toBe("tok");
  });

  it("returns the error and stays unauthenticated on failure", async () => {
    (emailPasswordLogin as jest.Mock).mockResolvedValue({
      ok: false,
      error: { code: "invalid_login", errors: [] },
    });
    const result = await actions().loginWithEmailPassword("a@b.com", "wrong");
    expect(result).toEqual({ ok: false, error: { code: "invalid_login", errors: [] } });
    expect(useAuthStore.getState().state.status).toBe("loading");
    expect(getAuthToken()).toBeNull();
  });
});

describe("finishGoogleLogin", () => {
  it("rejects an empty id token without calling the API", async () => {
    const result = await actions().finishGoogleLogin("");
    expect(result).toEqual({ ok: false });
    expect(googleIdTokenLogin).not.toHaveBeenCalled();
  });

  it("authenticates on a successful exchange", async () => {
    (googleIdTokenLogin as jest.Mock).mockResolvedValue({ token: "g-tok", email: "a@b.com" });
    const result = await actions().finishGoogleLogin("id-token");
    expect(result).toEqual({ ok: true });
    expect(useAuthStore.getState().state.status).toBe("authenticated");
  });

  it("fails when the exchange returns null", async () => {
    (googleIdTokenLogin as jest.Mock).mockResolvedValue(null);
    const result = await actions().finishGoogleLogin("id-token");
    expect(result).toEqual({ ok: false });
    expect(useAuthStore.getState().state.status).toBe("loading");
  });
});

describe("logout", () => {
  it("clears the session and signs out of Google", async () => {
    useAuthStore.setState({
      state: { status: "authenticated", session: { token: "tok", user: { email: "a@b.com" } } },
    });
    await actions().logout();
    expect(global.fetch).toHaveBeenCalled();
    expect(signOutGoogle).toHaveBeenCalled();
    expect(clearAuthSession).toHaveBeenCalled();
    expect(useAuthStore.getState().state.status).toBe("unauthenticated");
    expect(getAuthToken()).toBeNull();
  });

  it("still logs out locally when the network logout call fails", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("offline"));
    useAuthStore.setState({
      state: { status: "authenticated", session: { token: "tok", user: { email: "a@b.com" } } },
    });
    await actions().logout();
    expect(useAuthStore.getState().state.status).toBe("unauthenticated");
  });
});
