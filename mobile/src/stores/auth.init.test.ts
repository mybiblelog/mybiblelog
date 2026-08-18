/**
 * Startup/foreground session verification.
 *
 * The rule these tests defend: a server that can't answer must never cost the
 * user their session. Only an authoritative rejection from `/auth/user` may
 * clear the stored token.
 *
 * `initAuth` is guarded by a module-level `initialized` flag (and owns
 * module-level retry state), so every case runs inside `jest.isolateModulesAsync`
 * with a fresh registry — which also means a fresh Zustand store. Assertions must
 * go through the isolated module's own exports, never a top-level import.
 */

const mockReadAuthSession = jest.fn();
const mockLoadLastLoggedInEmail = jest.fn();
const mockClearAuthSession = jest.fn();
const mockSaveLastLoggedInEmail = jest.fn();

jest.mock("@/src/auth/authStorage", () => ({
  readAuthSession: mockReadAuthSession,
  loadLastLoggedInEmail: mockLoadLastLoggedInEmail,
  saveAuthSession: jest.fn(),
  clearAuthSession: mockClearAuthSession,
  saveLastLoggedInEmail: mockSaveLastLoggedInEmail,
  clearLastLoggedInEmail: jest.fn(),
}));
jest.mock("@/src/api/authApi", () => ({
  googleIdTokenLogin: jest.fn(),
  emailPasswordLogin: jest.fn(),
}));
jest.mock("@/src/auth/googleSignIn", () => ({ signOutGoogle: jest.fn() }));

let mockIsOnline: boolean | null = true;
const mockConnectivityListeners: ((s: { isOnline: boolean | null }) => void)[] = [];
const mockReportApiReachability = jest.fn();

jest.mock("@/src/stores/connectivity", () => ({
  getIsOnline: () => mockIsOnline,
  reportApiReachability: mockReportApiReachability,
  useConnectivityStore: {
    subscribe: (listener: (s: { isOnline: boolean | null }) => void) => {
      mockConnectivityListeners.push(listener);
      return () => {};
    },
  },
}));

import { AppState, type AppStateStatus } from "react-native";

type AuthModule = typeof import("./auth");

const SESSION = { token: "tok", user: { email: "a@b.com" } };

let appStateListeners: ((s: AppStateStatus) => void)[] = [];

beforeEach(() => {
  jest.useFakeTimers();
  // Neutralize the retry jitter so scheduled delays are exactly the base value.
  jest.spyOn(Math, "random").mockReturnValue(0.5);
  mockIsOnline = true;
  mockConnectivityListeners.length = 0;
  appStateListeners = [];
  jest.spyOn(AppState, "addEventListener").mockImplementation((type, handler) => {
    if (type === "change") appStateListeners.push(handler as (s: AppStateStatus) => void);
    return { remove: () => {} } as ReturnType<typeof AppState.addEventListener>;
  });
  mockReadAuthSession.mockResolvedValue({ status: "ok", session: SESSION });
  mockLoadLastLoggedInEmail.mockResolvedValue(null);
  mockClearAuthSession.mockResolvedValue(true);
  mockSaveLastLoggedInEmail.mockResolvedValue(undefined);
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

/** Let queued promise callbacks run without advancing the clock. */
async function flush() {
  await jest.advanceTimersByTimeAsync(0);
  await jest.advanceTimersByTimeAsync(0);
}

async function withFreshAuth(fn: (auth: AuthModule) => Promise<void>) {
  await jest.isolateModulesAsync(async () => {
    const auth = require("./auth") as AuthModule;
    await fn(auth);
  });
}

function respondWith(status: number, body: unknown) {
  (global.fetch as jest.Mock).mockResolvedValue({ status, json: async () => body });
}

const fetchCount = () => (global.fetch as jest.Mock).mock.calls.length;

describe("session survives a server that can't answer", () => {
  const cases: [string, () => void][] = [
    ["a 500 while the database is down", () => respondWith(500, { error: { code: "x" } })],
    ["a 502 during a deploy", () => respondWith(502, undefined)],
    ["a 503 maintenance page", () => respondWith(503, "<html>down</html>")],
    ["a 504 gateway timeout", () => respondWith(504, undefined)],
    ["a 429 rate limit", () => respondWith(429, { error: { code: "too_many_requests" } })],
    ["a 404 from a wrong base URL", () => respondWith(404, { error: { code: "not_found" } })],
    ["a captive-portal page", () => respondWith(200, "<html>Sign in to WiFi</html>")],
    [
      "a refused connection",
      () => (global.fetch as jest.Mock).mockRejectedValue(new TypeError("Network request failed")),
    ],
    [
      "a request timeout",
      () =>
        (global.fetch as jest.Mock).mockRejectedValue(
          Object.assign(new Error("Aborted"), { name: "AbortError" })
        ),
    ],
  ];

  it.each(cases)("stays signed in through %s", async (_label, arrange) => {
    arrange();
    await withFreshAuth(async (auth) => {
      auth.initAuth();
      await flush();

      expect(auth.useAuthStore.getState().state.status).toBe("authenticated");
      expect(auth.getAuthToken()).toBe("tok");
      expect(mockClearAuthSession).not.toHaveBeenCalled();
      expect(mockSaveLastLoggedInEmail).not.toHaveBeenCalled();
    });
  });
});

describe("session is cleared only on an authoritative rejection", () => {
  // The API authenticates `/auth/user` optionally, so an expired or revoked
  // token comes back as a 200 with a null user.
  it("logs out on a 200 with a null user", async () => {
    respondWith(200, { data: { user: null } });
    await withFreshAuth(async (auth) => {
      auth.initAuth();
      await flush();

      const state = auth.useAuthStore.getState().state;
      expect(state.status).toBe("unauthenticated");
      expect(state).toMatchObject({ lastLoggedInEmail: "a@b.com" });
      expect(mockClearAuthSession).toHaveBeenCalled();
      expect(mockSaveLastLoggedInEmail).toHaveBeenCalledWith("a@b.com");
    });
  });

  it("logs out on our own 401 envelope (deleted account)", async () => {
    respondWith(401, { error: { code: "unauthenticated", errors: [] } });
    await withFreshAuth(async (auth) => {
      auth.initAuth();
      await flush();

      expect(auth.useAuthStore.getState().state.status).toBe("unauthenticated");
      expect(mockClearAuthSession).toHaveBeenCalled();
    });
  });

  it("stops retrying once the session is gone", async () => {
    respondWith(200, { data: { user: null } });
    await withFreshAuth(async (auth) => {
      auth.initAuth();
      await flush();
      expect(fetchCount()).toBe(1);

      await jest.advanceTimersByTimeAsync(30 * 60_000);
      expect(fetchCount()).toBe(1);
    });
  });
});

describe("hydration", () => {
  it("signs the user in from storage without waiting for the probe", async () => {
    (global.fetch as jest.Mock).mockReturnValue(new Promise(() => {}));
    await withFreshAuth(async (auth) => {
      auth.initAuth();
      await flush();

      expect(auth.useAuthStore.getState().state.status).toBe("authenticated");
    });
  });

  it("resolves to unauthenticated when there is no stored session", async () => {
    mockReadAuthSession.mockResolvedValue({ status: "absent" });
    mockLoadLastLoggedInEmail.mockResolvedValue("old@b.com");
    await withFreshAuth(async (auth) => {
      auth.initAuth();
      await flush();

      expect(auth.useAuthStore.getState().state).toEqual({
        status: "unauthenticated",
        lastLoggedInEmail: "old@b.com",
      });
      expect(fetchCount()).toBe(0);
    });
  });

  it("does not probe while the device has no network, then probes on the online edge", async () => {
    mockIsOnline = false;
    respondWith(200, { data: { user: { email: "a@b.com" } } });
    await withFreshAuth(async (auth) => {
      auth.initAuth();
      await flush();

      expect(auth.useAuthStore.getState().state.status).toBe("authenticated");
      expect(fetchCount()).toBe(0);

      mockIsOnline = true;
      mockConnectivityListeners.forEach((l) => l({ isOnline: true }));
      await flush();
      expect(fetchCount()).toBe(1);
    });
  });
});

describe("retry", () => {
  it("backs off while the server keeps failing and stops once it recovers", async () => {
    respondWith(503, undefined);
    await withFreshAuth(async (auth) => {
      auth.initAuth();
      await flush();
      expect(fetchCount()).toBe(1);

      await jest.advanceTimersByTimeAsync(5_000);
      expect(fetchCount()).toBe(2);

      // Still on the previous delay's schedule — the next one is 15s, not 5s.
      await jest.advanceTimersByTimeAsync(5_000);
      expect(fetchCount()).toBe(2);
      await jest.advanceTimersByTimeAsync(10_000);
      expect(fetchCount()).toBe(3);

      respondWith(200, { data: { user: { email: "a@b.com" } } });
      await jest.advanceTimersByTimeAsync(60_000);
      expect(fetchCount()).toBe(4);

      await jest.advanceTimersByTimeAsync(60 * 60_000);
      expect(fetchCount()).toBe(4);
      expect(auth.useAuthStore.getState().state.status).toBe("authenticated");
    });
  });

  it("absorbs NetInfo flapping and repeated foregrounding", async () => {
    respondWith(503, undefined);
    mockIsOnline = false;
    await withFreshAuth(async (auth) => {
      auth.initAuth();
      await flush();
      expect(fetchCount()).toBe(0);

      mockIsOnline = true;
      for (let i = 0; i < 5; i += 1) {
        mockConnectivityListeners.forEach((l) => l({ isOnline: false }));
        mockConnectivityListeners.forEach((l) => l({ isOnline: true }));
        appStateListeners.forEach((l) => l("active"));
        await flush();
      }

      expect(fetchCount()).toBe(1);
    });
  });

  it("probes when the app comes back to the foreground after the floor", async () => {
    respondWith(503, undefined);
    await withFreshAuth(async (auth) => {
      auth.initAuth();
      await flush();
      expect(fetchCount()).toBe(1);

      // Suspending drops the pending timer, so only the foreground edge can fire.
      appStateListeners.forEach((l) => l("background"));
      await jest.advanceTimersByTimeAsync(60_000);
      expect(fetchCount()).toBe(1);

      appStateListeners.forEach((l) => l("active"));
      await flush();
      expect(fetchCount()).toBe(2);
    });
  });

  /**
   * `logEntries`, `offlineNotes` and `userSettings` all subscribe to this store
   * without a selector and start network work on every notification, so repeated
   * probes for an unchanged session must not write to it.
   */
  it("does not touch the store on repeated indeterminate probes", async () => {
    respondWith(503, undefined);
    await withFreshAuth(async (auth) => {
      auth.initAuth();
      await flush();

      const spy = jest.fn();
      const unsubscribe = auth.useAuthStore.subscribe(spy);
      await jest.advanceTimersByTimeAsync(5_000);
      await jest.advanceTimersByTimeAsync(15_000);
      await jest.advanceTimersByTimeAsync(60_000);

      expect(fetchCount()).toBe(4);
      expect(spy).not.toHaveBeenCalled();
      unsubscribe();
    });
  });

  it("reports reachability so the UI can name the right culprit", async () => {
    respondWith(503, undefined);
    await withFreshAuth(async (auth) => {
      auth.initAuth();
      await flush();
      expect(mockReportApiReachability).toHaveBeenLastCalledWith(false);

      respondWith(200, { data: { user: { email: "a@b.com" } } });
      await jest.advanceTimersByTimeAsync(5_000);
      expect(mockReportApiReachability).toHaveBeenLastCalledWith(true);
    });
  });

  it("cancels a pending retry on logout", async () => {
    respondWith(503, undefined);
    await withFreshAuth(async (auth) => {
      auth.initAuth();
      await flush();
      expect(fetchCount()).toBe(1);

      await auth.useAuthStore.getState().logout();
      const afterLogout = fetchCount();

      await jest.advanceTimersByTimeAsync(30 * 60_000);
      expect(fetchCount()).toBe(afterLogout);
    });
  });
});

/**
 * A keychain that won't hand over the token is not the same as having no token.
 * Nothing here may clear storage — the bytes are still on disk and become
 * readable again once the device is unlocked.
 */
describe("an unreadable stored session", () => {
  const unreadable = { status: "unreadable" } as const;
  const ok = { status: "ok", session: SESSION } as const;

  it("retries and signs the user in when the keychain opens up", async () => {
    mockReadAuthSession
      .mockResolvedValueOnce(unreadable)
      .mockResolvedValueOnce(unreadable)
      .mockResolvedValue(ok);
    respondWith(200, { data: { user: { email: "a@b.com" } } });

    await withFreshAuth(async (auth) => {
      auth.initAuth();
      await jest.advanceTimersByTimeAsync(2_000);

      expect(auth.useAuthStore.getState().state.status).toBe("authenticated");
      expect(mockReadAuthSession).toHaveBeenCalledTimes(3);
      expect(mockClearAuthSession).not.toHaveBeenCalled();
    });
  });

  it("gives up as signed out without ever clearing the stored token", async () => {
    mockReadAuthSession.mockResolvedValue(unreadable);

    await withFreshAuth(async (auth) => {
      auth.initAuth();
      await jest.advanceTimersByTimeAsync(10_000);

      expect(auth.useAuthStore.getState().state.status).toBe("unauthenticated");
      expect(mockClearAuthSession).not.toHaveBeenCalled();
      expect(mockSaveLastLoggedInEmail).not.toHaveBeenCalled();
      expect(fetchCount()).toBe(0);
    });
  });

  // Foregrounding is the post-unlock signal. This must not go through
  // `tryRevalidateNow`, which bails out (and cancels the retry) while the store
  // is unauthenticated.
  it("restores the session on the next foreground, with no relaunch", async () => {
    mockReadAuthSession.mockResolvedValue(unreadable);
    respondWith(200, { data: { user: { email: "a@b.com" } } });

    await withFreshAuth(async (auth) => {
      auth.initAuth();
      await jest.advanceTimersByTimeAsync(10_000);
      expect(auth.useAuthStore.getState().state.status).toBe("unauthenticated");

      mockReadAuthSession.mockResolvedValue(ok);
      appStateListeners.forEach((l) => l("active"));
      await jest.advanceTimersByTimeAsync(10_000);

      expect(auth.useAuthStore.getState().state.status).toBe("authenticated");
    });
  });

  // A keychain read has nothing to do with the network.
  it("recovers even while the device reports itself offline", async () => {
    mockIsOnline = false;
    mockReadAuthSession.mockResolvedValue(unreadable);

    await withFreshAuth(async (auth) => {
      auth.initAuth();
      await jest.advanceTimersByTimeAsync(10_000);

      mockReadAuthSession.mockResolvedValue(ok);
      appStateListeners.forEach((l) => l("active"));
      await jest.advanceTimersByTimeAsync(10_000);

      expect(auth.useAuthStore.getState().state.status).toBe("authenticated");
      expect(fetchCount()).toBe(0);
    });
  });

  it("runs one retry ladder however many triggers arrive", async () => {
    mockReadAuthSession.mockResolvedValue(unreadable);

    await withFreshAuth(async (auth) => {
      auth.initAuth();
      await jest.advanceTimersByTimeAsync(300);
      const during = mockReadAuthSession.mock.calls.length;
      appStateListeners.forEach((l) => l("active"));
      appStateListeners.forEach((l) => l("active"));
      await jest.advanceTimersByTimeAsync(0);

      expect(mockReadAuthSession.mock.calls.length).toBe(during);
    });
  });

  /**
   * If the keychain refuses the delete, the token is still on disk. Nothing may
   * read it back and sign the user in again — that would be a privacy failure on
   * a shared device.
   */
  it("never signs a user back in after they logged out", async () => {
    respondWith(200, { data: { user: { email: "a@b.com" } } });
    mockClearAuthSession.mockResolvedValue(false);

    await withFreshAuth(async (auth) => {
      auth.initAuth();
      await flush();
      expect(auth.useAuthStore.getState().state.status).toBe("authenticated");

      await auth.useAuthStore.getState().logout();
      expect(auth.useAuthStore.getState().state.status).toBe("unauthenticated");

      mockReadAuthSession.mockResolvedValue(ok);
      appStateListeners.forEach((l) => l("active"));
      await jest.advanceTimersByTimeAsync(10_000);

      expect(auth.useAuthStore.getState().state.status).toBe("unauthenticated");
    });
  });

  // The network ladder is for a server that can't answer; a locked keychain must
  // not inflate it.
  it("leaves the network backoff untouched", async () => {
    mockReadAuthSession.mockResolvedValueOnce(unreadable).mockResolvedValue(ok);
    respondWith(503, undefined);

    await withFreshAuth(async (auth) => {
      auth.initAuth();
      await jest.advanceTimersByTimeAsync(300);
      expect(fetchCount()).toBe(1);

      // Still the first rung of the network ladder, not a later one.
      await jest.advanceTimersByTimeAsync(5_000);
      expect(fetchCount()).toBe(2);
    });
  });
});
