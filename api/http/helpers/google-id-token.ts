import { OAuth2Client } from 'google-auth-library';
import { getConfig } from '../../config';

/**
 * Verifies a Google `id_token` obtained from a native/mobile Google sign-in
 * flow. Used by the mobile-friendly login route
 * (`POST /auth/oauth2/google/id-token`), which has no redirect/callback to
 * exchange an authorization code.
 *
 * Verification is performed locally with `google-auth-library`: the token's
 * signature, issuer (`iss`), audience (`aud`), and expiry (`exp`) are all
 * checked against Google's published keys without a per-login round-trip to
 * Google's `tokeninfo` endpoint. We additionally enforce the app-level
 * requirements (subject + verified email) on the decoded payload.
 *
 * Mirrors the `google-oauth2` helper's default-export shape so handlers can be
 * unit-tested by mocking this module.
 */

export type VerifiedGoogleIdToken = {
  googleUserId: string; // "sub"
  email: string;
  audience: string;
};

// A single reusable client. No client ID is needed for verification — the
// accepted audiences are passed to `verifyIdToken` directly. The library caches
// Google's signing certificates internally across calls.
const client = new OAuth2Client();

async function verifyGoogleIdToken(idToken: string): Promise<VerifiedGoogleIdToken> {
  // Throws on a bad signature, disallowed audience, wrong issuer, or expiry.
  const ticket = await client.verifyIdToken({
    idToken,
    audience: getConfig().google.allowedClientIds,
  });

  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error('Google id_token has no payload');
  }

  const audience = payload.aud;
  const googleUserId = payload.sub;
  const email = payload.email;

  if (typeof audience !== 'string' || !audience) {
    throw new Error('Google id_token missing audience');
  }

  if (typeof googleUserId !== 'string' || !googleUserId) {
    throw new Error('Google id_token missing subject');
  }

  if (typeof email !== 'string' || !email) {
    throw new Error('Google id_token missing email');
  }

  if (payload.email_verified !== true) {
    throw new Error('Google email not verified');
  }

  return { googleUserId, email, audience };
}

export default {
  verifyGoogleIdToken,
};
