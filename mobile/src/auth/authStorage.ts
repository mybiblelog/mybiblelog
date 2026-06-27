import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export type AuthSession = {
  token: string;
  user: {
    email: string;
  };
};

const STORAGE_KEY = "auth.session.v1";
const LAST_EMAIL_KEY = "auth.lastLoggedInEmail.v1";

export async function loadAuthSession(): Promise<AuthSession | null> {
  try {
    const raw =
      Platform.OS === "web"
        ? globalThis.sessionStorage?.getItem(STORAGE_KEY) ?? null
        : await SecureStore.getItemAsync(STORAGE_KEY);

    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const s = parsed as Record<string, unknown>;
    if (
      typeof s.token === "string" &&
      s.user &&
      typeof (s.user as { email?: unknown }).email === "string"
    ) {
      return { token: s.token, user: { email: (s.user as { email: string }).email } };
    }
    return null;
  } catch {
    return null;
  }
}

/** Last known email when session was invalidated (e.g. expired). Used to show "Sign in again as …" */
export async function loadLastLoggedInEmail(): Promise<string | null> {
  try {
    const raw =
      Platform.OS === "web"
        ? globalThis.sessionStorage?.getItem(LAST_EMAIL_KEY) ?? null
        : await SecureStore.getItemAsync(LAST_EMAIL_KEY);
    if (!raw) return null;
    const email = raw.trim();
    return email.length > 0 ? email : null;
  } catch {
    return null;
  }
}

export async function saveLastLoggedInEmail(email: string): Promise<void> {
  const trimmed = email.trim();
  if (!trimmed) return;
  if (Platform.OS === "web") {
    globalThis.sessionStorage?.setItem(LAST_EMAIL_KEY, trimmed);
    return;
  }
  await SecureStore.setItemAsync(LAST_EMAIL_KEY, trimmed);
}

export async function clearLastLoggedInEmail(): Promise<void> {
  if (Platform.OS === "web") {
    globalThis.sessionStorage?.removeItem(LAST_EMAIL_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(LAST_EMAIL_KEY);
}

export async function saveAuthSession(session: AuthSession): Promise<void> {
  const raw = JSON.stringify(session);
  if (Platform.OS === "web") {
    globalThis.sessionStorage?.setItem(STORAGE_KEY, raw);
    return;
  }
  await SecureStore.setItemAsync(STORAGE_KEY, raw);
}

export async function clearAuthSession(): Promise<void> {
  if (Platform.OS === "web") {
    globalThis.sessionStorage?.removeItem(STORAGE_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(STORAGE_KEY);
}

