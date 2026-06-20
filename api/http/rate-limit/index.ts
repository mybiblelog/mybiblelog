import { MemoryRateLimitStore } from './store';
import { RateLimiter } from './rate-limiter';

export { RateLimiter, type RateLimitOptions, type RateLimitRequest } from './rate-limiter';
export { type RateLimitStore, MemoryRateLimitStore } from './store';

/**
 * Process-wide rate limiter over a single in-memory store. Shared so that the
 * injected `RouteDependencies.rateLimiter` (framework-agnostic handlers) and the
 * legacy Express `rateLimit` helper (`feedback.ts`) count against the same
 * buckets rather than maintaining divergent state.
 */
export const sharedRateLimiter = new RateLimiter(new MemoryRateLimitStore());
