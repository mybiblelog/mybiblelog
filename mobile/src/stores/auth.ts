import { AppState } from "react-native";
import { create } from "zustand";
import {
  type AuthSession,
  clearAuthSession,
  clearLastLoggedInEmail,
  loadAuthSession,
  loadLastLoggedInEmail,
  saveAuthSession,
  saveLastLoggedInEmail,
} from "@/src/auth/authStorage";
import { isApiAnswer, probeStoredToken } from "@/src/auth/tokenValidation";
import { getApiBaseUrl } from "@/src/api/apiBase";
import type { ApiErrorPayload } from "@/src/api/apiError";
import { fetchWithTimeout } from "@/src/api/fetchWithTimeout";
import { emailPasswordLogin, googleIdTokenLogin } from "@/src/api/authApi";
import { signOutGoogle } from "@/src/auth/googleSignIn";
import {
  getIsOnline,
  reportApiReachability,
  useConnectivityStore,
} from "@/src/stores/connectivity";

/**
 * Auth store (Zustand).
 *
 * Replaces `AuthProvider`. Mirrors the Nuxt auth store: it owns the session and
 * exposes the token so other stores and the HTTP adapter can read it outside of
 * React via `getAuthToken()`. The `useAuth()` hook preserves the previous
 * provider contract (`{ state, ...actions }`) so consumers only change imports.
 *
 * The stored session is verified in the background, never in front of the user:
 * hydration trusts the token on disk, and only an authoritative rejection from
 * `probeStoredToken` (see `src/auth/tokenValidation.ts`) may clear it. An
 * unreachable or broken server leaves the user signed in and schedules a retry.
 */

export type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated"; lastLoggedInEmail?: string | null }
  | { status: "authenticated"; session: AuthSession };

type AuthStore = {
  state: AuthState;
  finishGoogleLogin: (idToken: string, locale?: string) => Promise<{ ok: true } | { ok: false }>;
  loginWithEmailPassword: (
    email: string,
    password: string
  ) => Promise<{ ok: true } | { ok: false; error: ApiErrorPayload }>;
  /**
   * Persists a session from a token + email obtained by the code-based flows
   * (verify email, reset password, change email), which return a native token
   * directly rather than going through the login endpoint.
   */
  establishSession: (token: string, email: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  state: { status: "loading" },

  finishGoogleLogin: async (idToken, locale) => {
    if (typeof idToken !== "string" || idToken.length === 0) return { ok: false };
    const result = await googleIdTokenLogin(idToken, locale);
    if (!result) return { ok: false };
    const session: AuthSession = { token: result.token, user: { email: result.email } };
    await clearLastLoggedInEmail();
    await saveAuthSession(session);
    set({ state: { status: "authenticated", session } });
    return { ok: true };
  },

  loginWithEmailPassword: async (email, password) => {
    const result = await emailPasswordLogin(email, password);
    if (!result.ok) return { ok: false, error: result.error };
    const session: AuthSession = { token: result.token, user: { email: result.email } };
    await clearLastLoggedInEmail();
    await saveAuthSession(session);
    set({ state: { status: "authenticated", session } });
    return { ok: true };
  },

  establishSession: async (token, email) => {
    const session: AuthSession = { token, user: { email } };
    await clearLastLoggedInEmail();
    await saveAuthSession(session);
    set({ state: { status: "authenticated", session } });
  },

  logout: async () => {
    const current = get().state;
    // Drop any pending verification so it can't fire against a torn-down session.
    cancelRetry();
    try {
      if (current.status === "authenticated") {
        await fetchWithTimeout(`${getApiBaseUrl()}/auth/logout`, {
          method: "POST",
          headers: { Accept: "application/json", Authorization: `Bearer ${current.session.token}` },
        });
      }
    } catch {
      // ignore logout network errors; local logout still proceeds
    }
    await signOutGoogle();
    await clearAuthSession();
    await clearLastLoggedInEmail();
    set({ state: { status: "unauthenticated" } });
  },
}));

/** Synchronous token accessor for the HTTP adapter and store actions. */
export function getAuthToken(): string | null {
  const s = useAuthStore.getState().state;
  return s.status === "authenticated" ? s.session.token : null;
}

let initialized = false;

/** Backoff between verification attempts while the server can't give an answer. */
const RETRY_DELAYS_MS = [5_000, 15_000, 60_000, 300_000, 900_000];
/**
 * Floor between probes for event-driven triggers. NetInfo flaps on handovers
 * and iOS reports `active` every time a notification shade is dismissed, so
 * without this a bad network could probe continuously.
 */
const MIN_PROBE_INTERVAL_MS = 15_000;
const JITTER_RATIO = 0.2;

let retryTimer: ReturnType<typeof setTimeout> | null = null;
let retryAttempt = 0;
let probeInFlight: Promise<void> | null = null;
let lastProbeStartedAt = 0;

/**
 * Hydrate the session from storage and verify it in the background. Re-verifies
 * on the offline→online transition and when the app returns to the foreground.
 */
export function initAuth(): void {
  if (initialized) return;
  initialized = true;

  void hydrateAndValidate();

  let wasOnline = getIsOnline();
  useConnectivityStore.subscribe((s) => {
    const isOnline = s.isOnline;
    if (isOnline === true && wasOnline !== true) tryRevalidateNow("edge");
    wasOnline = isOnline;
  });

  AppState.addEventListener("change", (next) => {
    if (next === "active") {
      tryRevalidateNow("edge");
      return;
    }
    // Timers are unreliable while the app is suspended; drop the pending one but
    // keep the backoff level, since foreground/online edges will re-arm it.
    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = null;
  });
}

async function hydrateAndValidate(): Promise<void> {
  const [session, lastEmail] = await Promise.all([loadAuthSession(), loadLastLoggedInEmail()]);

  if (!session) {
    useAuthStore.setState({
      state: { status: "unauthenticated", lastLoggedInEmail: lastEmail ?? undefined },
    });
    return;
  }

  // Trust the stored token immediately: verification can only ever downgrade
  // this, and awaiting it would hold the whole app in `loading` behind a request
  // to a server that may be down.
  useAuthStore.setState({ state: { status: "authenticated", session } });

  if (getIsOnline() === false) {
    scheduleRetry();
    return;
  }
  void revalidate(session);
}

async function revalidate(session: AuthSession): Promise<void> {
  if (probeInFlight) return probeInFlight;

  lastProbeStartedAt = Date.now();
  probeInFlight = (async () => {
    const validation = await probeStoredToken(session.token);
    reportApiReachability(isApiAnswer(validation));

    if (validation.result === "invalid") {
      // The only path that may destroy a session.
      await clearAuthSession();
      await saveLastLoggedInEmail(session.user.email);
      useAuthStore.setState({
        state: { status: "unauthenticated", lastLoggedInEmail: session.user.email },
      });
      cancelRetry();
      return;
    }

    ensureAuthenticated(session);
    if (validation.result === "valid") cancelRetry();
    else scheduleRetry();
  })().finally(() => {
    probeInFlight = null;
  });

  return probeInFlight;
}

/**
 * Write `authenticated` only when it actually changes. `logEntries`, `offlineNotes`
 * and `userSettings` all subscribe to this store without a selector and kick off
 * network work on every notification, so a fresh object per probe would fan a
 * burst of requests out on every retry tick.
 */
function ensureAuthenticated(session: AuthSession): void {
  const current = useAuthStore.getState().state;
  if (current.status === "authenticated" && current.session.token === session.token) return;
  useAuthStore.setState({ state: { status: "authenticated", session } });
}

function scheduleRetry(): void {
  if (retryTimer) return;
  const base = RETRY_DELAYS_MS[Math.min(retryAttempt, RETRY_DELAYS_MS.length - 1)]!;
  // Jitter so a fleet of devices doesn't synchronize on a recovering server.
  const delay = base * (1 + (Math.random() * 2 - 1) * JITTER_RATIO);
  retryAttempt += 1;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    tryRevalidateNow("timer");
  }, delay);
}

/** Only an authoritative answer resets the backoff, so flapping can't reset it. */
function cancelRetry(): void {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;
  retryAttempt = 0;
}

function tryRevalidateNow(trigger: "timer" | "edge"): void {
  const current = useAuthStore.getState().state;
  if (current.status !== "authenticated") {
    cancelRetry();
    return;
  }
  if (getIsOnline() === false) return;
  if (probeInFlight) return;
  if (trigger === "edge" && Date.now() - lastProbeStartedAt < MIN_PROBE_INTERVAL_MS) return;
  void revalidate(current.session);
}

/** Compatibility hook preserving the previous `useAuth()` provider contract. */
export function useAuth(): AuthStore {
  return useAuthStore();
}

/** Subscribe only to the authenticated/unauthenticated boolean. */
export function useIsAuthenticated(): boolean {
  return useAuthStore((s) => s.state.status === "authenticated");
}

/** True once resolved as logged-out (false while the session is still loading). */
export function useIsUnauthenticated(): boolean {
  return useAuthStore((s) => s.state.status === "unauthenticated");
}
