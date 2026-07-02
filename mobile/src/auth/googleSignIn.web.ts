import type { GoogleSignInResult } from './googleSignIn';

/**
 * Web stub for the native Google Sign-In wrapper.
 *
 * The native implementation (`googleSignIn.ts`) imports
 * `react-native-nitro-google-signin`, a Nitro native module with no web build.
 * Metro automatically resolves this `.web.ts` variant for web bundles, which
 * keeps the native module out of the web bundle entirely (otherwise it crashes
 * the static render with "__fbBatchedBridgeConfig is not set").
 *
 * Google Sign-In is not wired up for web; these are inert stubs so the web
 * build compiles. If web login is needed later, implement it here via Google
 * Identity Services.
 */

export type { GoogleSignInResult } from './googleSignIn';

/** No-op on web — there is no native SDK to configure. */
export function configureGoogleSignIn(): void {}

/** Google Sign-In is unavailable on web. */
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  return { ok: false };
}

/** No-op on web; local app logout proceeds regardless. */
export async function signOutGoogle(): Promise<void> {}
