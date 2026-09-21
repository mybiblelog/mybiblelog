import { type HttpRequest, type RouteDependencies } from '../types';

/**
 * Platforms the API will ever record against a user's `platforms` map (see
 * `UserDocument.platforms`). This is an explicit allowlist enforced
 * server-side: the `X-Platform` header is untrusted client input, and writing
 * an arbitrary header value as a document key would let a caller inject
 * arbitrary keys into the user document (a NoSQL mass-assignment risk). Any
 * header value not in this list is treated as absent.
 *
 * - `web` is sent by the Nuxt app (`web/app/plugins/http.ts`).
 * - `Android` is sent by the Expo app (`mobile/src/api/httpClient.ts`).
 * - `iOS` is reserved for a future Expo iOS build; nothing sends it yet.
 */
export const ALLOWED_PLATFORMS = ['web', 'Android', 'iOS'] as const;

export type Platform = (typeof ALLOWED_PLATFORMS)[number];

const PLATFORM_HEADER = 'x-platform';

const isAllowedPlatform = (value: string): value is Platform =>
  (ALLOWED_PLATFORMS as readonly string[]).includes(value);

/**
 * Reads and validates the `X-Platform` header against `ALLOWED_PLATFORMS`.
 * Returns `null` when the header is missing, repeated, or holds any value
 * outside the allowlist — callers should treat that as "nothing to record",
 * never as an error.
 */
export function getRequestPlatform(req: HttpRequest): Platform | null {
  const value = req.headers[PLATFORM_HEADER];
  const header = Array.isArray(value) ? value[0] : value;
  return header !== undefined && isAllowedPlatform(header) ? header : null;
}

/**
 * Best-effort platform tracking: records that `userId` has logged in/registered
 * from the caller's platform (per the validated `X-Platform` header), without
 * ever failing or delaying the auth response it's called from. A missing/invalid
 * header (checked by `getRequestPlatform`) or a DB hiccup here must not block
 * auth. Shared by every login/register path — email/password (`session.ts`)
 * and Google OAuth, both redirect-based and native id-token (`oauth.ts`).
 */
export async function trackPlatform(
  users: RouteDependencies['repositories']['users'],
  req: HttpRequest,
  userId: string,
): Promise<void> {
  const platform = getRequestPlatform(req);
  if (!platform) {
    return;
  }
  try {
    await users.recordPlatform(userId, platform);
  }
  catch {
    // Tracking is best-effort; never let it affect the auth response.
  }
}
