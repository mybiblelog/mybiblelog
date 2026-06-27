import {
  GoogleOneTapSignIn,
  isCancelledResponse,
  isErrorWithCode,
  isSuccessResponse,
} from "react-native-nitro-google-signin";
import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from "@/src/config";

/**
 * Thin wrapper around the native Google Sign-In SDK. The app uses Google purely
 * to obtain an `id_token`, which it forwards to the API
 * (`POST /auth/oauth2/google/id-token`). The `id_token`'s audience is the
 * **web** client ID, so that's what we configure here (and what the API must
 * allow). The iOS client ID is only needed for the native iOS redirect.
 *
 * Requires a dev/prod build — the native module is unavailable in Expo Go.
 */

let configured = false;

export function configureGoogleSignIn(): void {
  if (configured) return;
  GoogleOneTapSignIn.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
  });
  configured = true;
}

export type GoogleSignInResult =
  | { ok: true; idToken: string }
  | { ok: "cancelled" }
  | { ok: false };

/**
 * Presents the explicit "Sign in with Google" UI and returns the resulting
 * `id_token`. Distinguishes a user cancellation from a genuine failure so the
 * caller can stay quiet on cancel and surface an error otherwise.
 */
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  configureGoogleSignIn();
  try {
    const response = await GoogleOneTapSignIn.presentExplicitSignIn();

    if (isCancelledResponse(response)) {
      return { ok: "cancelled" };
    }
    if (isSuccessResponse(response)) {
      const idToken = response.data.idToken;
      if (typeof idToken === "string" && idToken.length > 0) {
        return { ok: true, idToken };
      }
    }
    return { ok: false };
  } catch (err) {
    if (isErrorWithCode(err)) {
      // Native error (e.g. Play Services missing) — treat as a generic failure.
      return { ok: false };
    }
    return { ok: false };
  }
}

/** Best-effort native sign-out; never throws. */
export async function signOutGoogle(): Promise<void> {
  try {
    await GoogleOneTapSignIn.signOut();
  } catch {
    // ignore — local app logout proceeds regardless
  }
}
