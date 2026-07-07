import useRepositories from '../repositories/useRepositories';
import authCurrentUser from './helpers/auth-current-user';
import useEmailService from '../services/email/email-service';
import { sharedRateLimiter } from './rate-limit';
import { type RouteDependencies } from './types';

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
  return {
    repositories,
    emailService,
    rateLimiter: sharedRateLimiter,
    // `authCurrentUser` is an overloaded function; the cast selects the broad
    // call signature that matches `RouteDependencies['authenticate']`.
    authenticate: authCurrentUser as RouteDependencies['authenticate'],
  };
};
