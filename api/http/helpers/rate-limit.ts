import { sharedRateLimiter, type RateLimitRequest } from '../rate-limit';

/**
 * Legacy Express-facing rate-limit helper, kept for routers not yet migrated to
 * the framework-agnostic pattern (e.g. `feedback.ts`). It now delegates to the
 * shared `RateLimiter`/store so all routes — migrated or not — count against the
 * same buckets and share one implementation. The test-bypass skip is handled
 * inside the limiter.
 *
 * Express's `req` structurally satisfies `RateLimitRequest` (ip/method/path/headers).
 */
const rateLimit = (
  req: RateLimitRequest,
  { maxRequests = 5, windowMs = 60 * 1000 }: { maxRequests?: number; windowMs?: number } = {},
): Promise<void> => {
  return sharedRateLimiter.check(req, { maxRequests, windowMs });
};

export default rateLimit;
