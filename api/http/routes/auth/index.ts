import { type RouteDefinition } from '../../types';
import { authSessionRoutes } from './session';
import { authOauthRoutes } from './oauth';
import { authEmailVerificationRoutes } from './email-verification';
import { authPasswordRoutes } from './password';
import { authEmailChangeRoutes } from './email-change';

/**
 * Framework-neutral route table for authentication, assembled from sub-tables
 * grouped by concern (session, OAuth, email verification, password, email
 * change). Each route pairs its framework-agnostic handler with `docs` that
 * reuse the same zod schemas, so the generated OpenAPI spec stays in lockstep
 * with the real contract. Routes flagged `setsAuthCookie` return an
 * `auth_token` cookie.
 */
export const authRoutes: RouteDefinition[] = [
  ...authSessionRoutes,
  ...authOauthRoutes,
  ...authEmailVerificationRoutes,
  ...authPasswordRoutes,
  ...authEmailChangeRoutes,
];
