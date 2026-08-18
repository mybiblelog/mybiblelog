import * as SecureStore from "expo-secure-store";
import {
  clearAuthSession,
  loadLastLoggedInEmail,
  readAuthSession,
  saveAuthSession,
  saveLastLoggedInEmail,
  type AuthSession,
} from "./authStorage";
import { secureStorage } from "@/src/storage/keys";

// On native (default Platform.OS in jest-expo is "ios"), these go through the
// mocked expo-secure-store from jest.setup.ts.
const session: AuthSession = { token: "tok", user: { email: "a@b.com" } };

beforeEach(async () => {
  // `secureStorage` is a module-scoped singleton, so a key quarantined by one
  // test would otherwise block writes in the next.
  secureStorage.__resetForTest();
  await SecureStore.deleteItemAsync("auth.session.v1");
  await SecureStore.deleteItemAsync("auth.lastLoggedInEmail.v1");
});

describe("auth session storage", () => {
  it("reports absent when no session is stored", async () => {
    expect(await readAuthSession()).toEqual({ status: "absent" });
  });

  it("round-trips a saved session", async () => {
    await saveAuthSession(session);
    expect(await readAuthSession()).toEqual({ status: "ok", session });
  });

  it("reports absent for a structurally invalid stored session", async () => {
    await SecureStore.setItemAsync("auth.session.v1", JSON.stringify({ token: 1 }));
    expect(await readAuthSession()).toEqual({ status: "absent" });
  });

  it("reports absent for corrupt JSON and drops the unusable blob", async () => {
    await SecureStore.setItemAsync("auth.session.v1", "not json");
    expect(await readAuthSession()).toEqual({ status: "absent" });
    // Otherwise it would fail the same way on every launch from here on.
    expect(await SecureStore.getItemAsync("auth.session.v1")).toBeNull();
  });

  it("clears a stored session", async () => {
    await saveAuthSession(session);
    expect(await clearAuthSession()).toBe(true);
    expect(await readAuthSession()).toEqual({ status: "absent" });
  });

  // A locked keychain must not be reported as "you have no session" — the token
  // is still on disk and becomes readable again once the device is unlocked.
  it("distinguishes an unreadable keychain from an absent session", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(new Error("keychain locked"));
    expect(await readAuthSession()).toEqual({ status: "unreadable" });
  });

  it("reports a failed delete instead of pretending the token is gone", async () => {
    await saveAuthSession(session);
    (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValueOnce(new Error("keychain locked"));
    expect(await clearAuthSession()).toBe(false);
    expect(await readAuthSession()).toEqual({ status: "ok", session });
  });
});

describe("last logged-in email", () => {
  it("round-trips a trimmed email", async () => {
    await saveLastLoggedInEmail("  a@b.com  ");
    expect(await loadLastLoggedInEmail()).toBe("a@b.com");
  });

  it("ignores a blank email", async () => {
    await saveLastLoggedInEmail("   ");
    expect(await loadLastLoggedInEmail()).toBeNull();
  });
});
