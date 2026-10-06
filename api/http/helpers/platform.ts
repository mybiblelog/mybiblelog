import { type UserRecord } from '../../repositories/helpers/types';
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
 * - `android` / `ios` are sent by the Expo app (`mobile/src/api/httpClient.ts`),
 *   from `Platform.OS`; only Android builds ship today.
 */
export const ALLOWED_PLATFORMS = ['web', 'android', 'ios'] as const;

export type Platform = (typeof ALLOWED_PLATFORMS)[number];

const PLATFORM_HEADER = 'x-platform';
const APP_VERSION_HEADER = 'x-app-version';

/**
 * Shape accepted for `X-App-Version`: a semver (mobile, e.g. `1.4.2`) or a
 * short git SHA (web). The value is stored as a document *value*, never a key,
 * so a character/length cap is enough — no allowlist needed.
 */
const APP_VERSION_PATTERN = /^[0-9A-Za-z.+_-]{1,40}$/;

/**
 * Minimum gap between activity writes for the same user/platform/version on
 * ordinary authenticated requests. Keeps "last seen" fresh enough for
 * day-granularity activity queries without a DB write on every request.
 */
export const ACTIVITY_WRITE_THROTTLE_MS = 60 * 60 * 1000;

const isAllowedPlatform = (value: string): value is Platform =>
  (ALLOWED_PLATFORMS as readonly string[]).includes(value);

const getHeader = (req: HttpRequest, name: string): string | undefined => {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
};

/**
 * Reads and validates the `X-Platform` header against `ALLOWED_PLATFORMS`.
 * Returns `null` when the header is missing, repeated, or holds any value
 * outside the allowlist — callers should treat that as "nothing to record",
 * never as an error.
 */
export function getRequestPlatform(req: HttpRequest): Platform | null {
  const header = getHeader(req, PLATFORM_HEADER);
  return header !== undefined && isAllowedPlatform(header) ? header : null;
}

/**
 * Auth endpoints use `X-Platform: web` to omit the session token from the JSON
 * body for browser callers — the httpOnly `auth_token` cookie is sufficient
 * there, and leaving the token out of the body keeps it out of reach of
 * anything that logs, serializes, or (via XSS) reads the response.
 *
 * This is a header-gated *exclusion* for web, not an allowlist for mobile: any
 * caller that doesn't send `X-Platform: web` (the mobile app, which stores the
 * token itself and can't rely on a browser cookie jar, or a bare API client)
 * keeps getting the token in the body. That intentionally avoids needing a
 * coordinated mobile rollout — installed mobile builds are unaffected.
 */
export function isWebClient(req: HttpRequest): boolean {
  return getRequestPlatform(req) === 'web';
}

/**
 * Reads and validates the `X-App-Version` header against `APP_VERSION_PATTERN`.
 * Returns `null` when missing or malformed.
 */
export function getRequestAppVersion(req: HttpRequest): string | null {
  const header = getHeader(req, APP_VERSION_HEADER);
  return header !== undefined && APP_VERSION_PATTERN.test(header) ? header : null;
}

/**
 * Best-effort client activity tracking: records that `user` was seen on the
 * caller's platform (per the validated `X-Platform` header) running the
 * caller's app version (`X-App-Version`), without ever failing or delaying the
 * response it's called from. A missing/invalid platform header or a DB hiccup
 * here must not affect the request.
 *
 * Called with `force: true` from every login/register path — email/password
 * (`session.ts`) and Google OAuth, both redirect-based and native id-token
 * (`oauth.ts`) — and without it from `authenticate` on every authenticated
 * request (`api/http/dependencies.ts`), where writes are skipped if the same
 * platform+version was already recorded within `ACTIVITY_WRITE_THROTTLE_MS`.
 * The throttle check uses the already-loaded `user`, so it costs no extra read.
 */
export async function trackClientActivity(
  users: RouteDependencies['repositories']['users'],
  req: HttpRequest,
  user: UserRecord,
  { force = false }: { force?: boolean } = {},
): Promise<void> {
  const platform = getRequestPlatform(req);
  if (!platform) {
    return;
  }
  const appVersion = getRequestAppVersion(req);
  if (!force) {
    const existing = user.platforms?.[platform];
    if (
      existing
      && existing.appVersion === appVersion
      && Date.now() - existing.lastSeenAt.getTime() < ACTIVITY_WRITE_THROTTLE_MS
    ) {
      return;
    }
  }
  try {
    await users.recordClientActivity(user.id, platform, appVersion);
  }
  catch {
    // Tracking is best-effort; never let it affect the response.
  }
}
