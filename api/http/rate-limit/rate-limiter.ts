import { TooManyRequestsError } from '../errors/http-errors';
import checkTestBypass from '../helpers/check-test-bypass';
import { type RateLimitStore } from './store';

/**
 * The minimal request shape the limiter needs. Both the normalized `HttpRequest`
 * (`api/http/types.ts`) and Express's `req` structurally satisfy it, so the
 * limiter works under any adapter and is also callable from the legacy
 * Express-coupled `rateLimit` helper.
 */
export interface RateLimitRequest {
  ip?: string;
  method?: string;
  path?: string;
  headers: Record<string, string | string[] | undefined>;
}

export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  /** Override how the client is identified. Defaults to the request IP. */
  keyFn?: (req: RateLimitRequest) => string;
}

/**
 * Framework-agnostic rate limiter. Policy (limits) live at the call site; storage
 * lives in the injected `RateLimitStore`.
 *
 * The test bypass is honored here, centrally: when a request carries a valid
 * `x-test-bypass-secret` (non-production only) the limiter is a no-op. This is
 * where the per-handler `checkTestBypass` rate-limit branch was relocated to, so
 * route handlers contain zero bypass logic.
 */
export class RateLimiter {
  constructor(private store: RateLimitStore) {}

  async check(req: RateLimitRequest, opts: RateLimitOptions): Promise<void> {
    if (checkTestBypass(req)) {
      return;
    }

    const key = this.buildKey(req, opts.keyFn);
    const count = await this.store.increment(key, opts.windowMs);

    if (count > opts.maxRequests) {
      throw new TooManyRequestsError();
    }
  }

  // Scope each bucket per client, method and path — matching the previous
  // `${ip}-${method}-${path}` keying so limits stay per-endpoint.
  private buildKey(req: RateLimitRequest, keyFn?: (req: RateLimitRequest) => string): string {
    const base = keyFn ? keyFn(req) : (req.ip || 'unknown');
    return `${base}:${req.method ?? ''}:${req.path ?? ''}`;
  }
}
