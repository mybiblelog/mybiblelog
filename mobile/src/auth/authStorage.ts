import { secureStorage } from "@/src/storage/keys";

export type AuthSession = {
  token: string;
  user: {
    email: string;
  };
};

/**
 * Outcome of reading the stored session.
 *
 * `unreadable` exists because the OS keychain can be temporarily unavailable —
 * most commonly on a launch before the device's first unlock after a reboot, or
 * after a backup restore. The bytes are still there, so reporting that as "no
 * session" tells the user they've been signed out when they haven't.
 */
export type AuthSessionRead =
  { status: "ok"; session: AuthSession } | { status: "absent" } | { status: "unreadable" };

function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== "object") return false;
  const s = value as Record<string, unknown>;
  return (
    typeof s.token === "string" &&
    !!s.user &&
    typeof (s.user as { email?: unknown }).email === "string"
  );
}

export async function readAuthSession(): Promise<AuthSessionRead> {
  const result = await secureStorage.read("authSession");
  if (result.status === "unreadable") return { status: "unreadable" };
  // A stored value of the wrong shape, or bytes that don't parse, is as good as
  // no session: it can't be sent as a bearer token. Drop it so it doesn't fail
  // every launch from here on.
  if (result.status === "corrupt") {
    void secureStorage.remove("authSession");
    return { status: "absent" };
  }
  if (result.status === "absent" || !isAuthSession(result.value)) return { status: "absent" };
  return { status: "ok", session: result.value };
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

export async function saveAuthSession(session: AuthSession): Promise<boolean> {
  return secureStorage.set("authSession", session);
}

/**
 * Returns false when the token could not be deleted — the caller must not treat
 * a failed delete as a completed sign-out, since the bytes are still on disk.
 */
export async function clearAuthSession(): Promise<boolean> {
  return secureStorage.remove("authSession");
}
