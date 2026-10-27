import useRepositories from '../repositories/useRepositories';
import { authenticateRequest, type AuthResult } from './helpers/auth-current-user';
import useEmailService from '../services/email/email-service';
import { sharedRateLimiter } from './rate-limit';
import { trackClientActivity } from './helpers/platform';
import { type UserRecord } from '../repositories/helpers/types';
import { type HttpRequest, type RouteDependencies } from './types';

type AuthenticateOptions = { optional?: boolean; adminOnly?: boolean };

// Each access token gets its own budget per endpoint, on top of any limit the
// handler applies, so a runaway agent loop slows down instead of flooding the API.
const ACCESS_TOKEN_RATE_LIMIT = { maxRequests: 60, windowMs: 60 * 1000 };
// `lastUsedAt` only needs to be roughly right, so it is written at most this often.
const ACCESS_TOKEN_USE_THROTTLE_MS = 5 * 60 * 1000;

/**
 * Default production wiring of `RouteDependencies`. Resolves the repository and
 * email layers (both idempotent), binds the real authentication helper, and
 * injects the process-wide rate limiter. Unit tests bypass this entirely and
 * inject fakes.
 */
export const createRouteDependencies = async (): Promise<RouteDependencies> => {
  const [repositories, emailService] = await Promise.all([
    useRepositories(),
    useEmailService(),
  ]);

  // Every authenticated request also refreshes the caller's per-platform
  // activity (throttled; see `trackClientActivity`). Fire-and-forget so it
  // never delays or fails the request.
  async function authenticate(req: HttpRequest, opts?: AuthenticateOptions): Promise<UserRecord | null> {
    // `authenticateRequest` is overloaded; this cast selects its broad signature.
    const result = await (authenticateRequest as (r: HttpRequest, o?: AuthenticateOptions) => Promise<AuthResult | null>)(req, opts);
    if (!result) {
      return null;
    }
    const { user, accessToken } = result;
    if (accessToken) {
      await sharedRateLimiter.check(req, { ...ACCESS_TOKEN_RATE_LIMIT, keyFn: () => `access-token:${accessToken.id}` });
      const now = new Date();
      if (!accessToken.lastUsedAt || now.getTime() - accessToken.lastUsedAt.getTime() > ACCESS_TOKEN_USE_THROTTLE_MS) {
        repositories.accessTokens.recordUse(accessToken.id, now).catch(() => {});
      }
    }
    void trackClientActivity(repositories.users, req, user);
    return user;
  }

  return {
    repositories,
    emailService,
    rateLimiter: sharedRateLimiter,
    // The wrapper implements only the broad call signature; the cast restores
    // the overloads `RouteDependencies['authenticate']` declares.
    authenticate: authenticate as RouteDependencies['authenticate'],
  };
};
