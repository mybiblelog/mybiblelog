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
import { getApiBaseUrl } from "@/src/api/apiBase";
import type { ApiErrorPayload } from "@/src/api/apiError";
import { fetchWithTimeout } from "@/src/api/fetchWithTimeout";
import { emailPasswordLogin, googleIdTokenLogin } from "@/src/api/authApi";
import { signOutGoogle } from "@/src/auth/googleSignIn";
import { getIsOnline, useConnectivityStore } from "@/src/stores/connectivity";

/**
 * Auth store (Zustand).
 *
 * Replaces `AuthProvider`. Mirrors the Nuxt auth store: it owns the session and
 * exposes the token so other stores and the HTTP adapter can read it outside of
 * React via `getAuthToken()`. The `useAuth()` hook preserves the previous
 * provider contract (`{ state, ...actions }`) so consumers only change imports.
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

/**
 * Validate token when online. Returns true if valid, false if invalid (e.g. 401).
 * Network errors are treated as "assume valid" (fail gracefully).
 */
async function validateStoredToken(token: string): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(`${getApiBaseUrl()}/auth/user`, {
      method: "GET",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return true;
  }
}

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

/**
 * Hydrate the session from storage and validate it when online. Re-validates on
 * the offline→online transition, matching the previous provider's effect.
 */
export function initAuth(): void {
  if (initialized) return;
  initialized = true;

  void hydrateAndValidate();

  let wasOnline = getIsOnline();
  useConnectivityStore.subscribe((s) => {
    const isOnline = s.isOnline;
    if (isOnline === true && wasOnline !== true) {
      const current = useAuthStore.getState().state;
      if (current.status === "authenticated") {
        void revalidate(current.session);
      }
    }
    wasOnline = isOnline;
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

  if (getIsOnline() !== true) {
    useAuthStore.setState({ state: { status: "authenticated", session } });
    return;
  }

  await revalidate(session);
}

async function revalidate(session: AuthSession): Promise<void> {
  const valid = await validateStoredToken(session.token);
  if (!valid) {
    await clearAuthSession();
    await saveLastLoggedInEmail(session.user.email);
    useAuthStore.setState({
      state: { status: "unauthenticated", lastLoggedInEmail: session.user.email },
    });
    return;
  }
  useAuthStore.setState({ state: { status: "authenticated", session } });
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
