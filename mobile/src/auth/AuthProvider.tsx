import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNetInfo } from "@react-native-community/netinfo";
import {
  type AuthSession,
  clearAuthSession,
  clearLastLoggedInEmail,
  loadAuthSession,
  loadLastLoggedInEmail,
  saveAuthSession,
  saveLastLoggedInEmail,
} from "./authStorage";
import { getApiBaseUrl } from "../api/apiBase";
import type { ApiErrorPayload } from "../api/apiError";
import { emailPasswordLogin, googleIdTokenLogin } from "../api/authApi";
import { signOutGoogle } from "./googleSignIn";

type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated"; lastLoggedInEmail?: string | null }
  | { status: "authenticated"; session: AuthSession };

type AuthContextValue = {
  state: AuthState;
  finishGoogleLogin: (idToken: string, locale?: string) => Promise<{ ok: true } | { ok: false }>;
  loginWithEmailPassword: (
    email: string,
    password: string
  ) => Promise<{ ok: true } | { ok: false; error: ApiErrorPayload }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function computeIsOnline(netInfo: ReturnType<typeof useNetInfo>): boolean | null {
  return netInfo.isInternetReachable === null ? netInfo.isConnected : netInfo.isInternetReachable;
}

/**
 * Validate token when online. Returns true if valid, false if invalid (e.g. 401).
 * Network errors are treated as "assume valid" (fail gracefully).
 */
async function validateStoredToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/auth/user`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return res.ok;
  } catch {
    return true;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const netInfo = useNetInfo();
  const isOnline = computeIsOnline(netInfo);
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const [session, lastEmail] = await Promise.all([
        loadAuthSession(),
        loadLastLoggedInEmail(),
      ]);
      if (!isMounted) return;

      if (!session) {
        setState({ status: "unauthenticated", lastLoggedInEmail: lastEmail ?? undefined });
        return;
      }

      if (isOnline !== true) {
        setState({ status: "authenticated", session });
        return;
      }

      const valid = await validateStoredToken(session.token);
      if (!isMounted) return;

      if (!valid) {
        await clearAuthSession();
        await saveLastLoggedInEmail(session.user.email);
        setState({ status: "unauthenticated", lastLoggedInEmail: session.user.email });
        return;
      }

      setState({ status: "authenticated", session });
    })();
    return () => {
      isMounted = false;
    };
  }, [isOnline]);

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      finishGoogleLogin: async (idToken: string, locale?: string) => {
        if (typeof idToken !== "string" || idToken.length === 0) return { ok: false };
        // Exchange the Google id_token for a MyBibleLog session. The endpoint
        // returns the token + user, so no extra /auth/user round-trip is needed.
        const result = await googleIdTokenLogin(idToken, locale);
        if (!result) return { ok: false };
        const session: AuthSession = { token: result.token, user: { email: result.email } };
        await clearLastLoggedInEmail();
        await saveAuthSession(session);
        setState({ status: "authenticated", session });
        return { ok: true };
      },
      loginWithEmailPassword: async (email: string, password: string) => {
        // Mirrors the Nuxt web flow: POST /auth/login returns the token + user,
        // so no extra /auth/user round-trip is needed.
        const result = await emailPasswordLogin(email, password);
        if (!result.ok) return { ok: false, error: result.error };
        const session: AuthSession = { token: result.token, user: { email: result.email } };
        await clearLastLoggedInEmail();
        await saveAuthSession(session);
        setState({ status: "authenticated", session });
        return { ok: true };
      },
      logout: async () => {
        try {
          if (state.status === "authenticated") {
            await fetch(`${getApiBaseUrl()}/auth/logout`, {
              method: "POST",
              headers: {
                Accept: "application/json",
                Authorization: `Bearer ${state.session.token}`,
              },
            });
          }
        } catch {
          // ignore logout network errors; local logout still proceeds
        }
        await signOutGoogle();
        await clearAuthSession();
        await clearLastLoggedInEmail();
        setState({ status: "unauthenticated" });
      },
    }),
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

