import { secureStorage } from "@/src/storage/keys";

export type AuthSession = {
  token: string;
  user: {
    email: string;
  };
};

function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== "object") return false;
  const s = value as Record<string, unknown>;
  return (
    typeof s.token === "string" &&
    !!s.user &&
    typeof (s.user as { email?: unknown }).email === "string"
  );
}

export async function loadAuthSession(): Promise<AuthSession | null> {
  const stored = await secureStorage.get("authSession");
  return isAuthSession(stored) ? stored : null;
}

/** Last known email when session was invalidated (e.g. expired). Used to show "Sign in again as …" */
export async function loadLastLoggedInEmail(): Promise<string | null> {
  const email = (await secureStorage.get("lastLoggedInEmail"))?.trim();
  return email ? email : null;
}

export async function saveLastLoggedInEmail(email: string): Promise<void> {
  const trimmed = email.trim();
  if (!trimmed) return;
  await secureStorage.set("lastLoggedInEmail", trimmed);
}

export async function clearLastLoggedInEmail(): Promise<void> {
  await secureStorage.remove("lastLoggedInEmail");
}

export async function saveAuthSession(session: AuthSession): Promise<void> {
  await secureStorage.set("authSession", session);
}

export async function clearAuthSession(): Promise<void> {
  await secureStorage.remove("authSession");
}
