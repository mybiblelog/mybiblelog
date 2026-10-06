import useRepositories from '../repositories/useRepositories';
import authCurrentUser from './helpers/auth-current-user';
import useEmailService from '../services/email/email-service';
import { sharedRateLimiter } from './rate-limit';
import { trackClientActivity } from './helpers/platform';
import { type UserRecord } from '../repositories/helpers/types';
import { type HttpRequest, type RouteDependencies } from './types';

type AuthenticateOptions = { optional?: boolean; adminOnly?: boolean };

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
    // `authCurrentUser` is overloaded; this cast selects its broad signature.
    const user = await (authCurrentUser as (r: HttpRequest, o?: AuthenticateOptions) => Promise<UserRecord | null>)(req, opts);
    if (user) {
      void trackClientActivity(repositories.users, req, user);
    }
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
