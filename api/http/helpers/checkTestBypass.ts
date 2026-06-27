import { getConfig } from '../../config';

/**
 * Minimal request shape this helper needs. Both Express's `req` and the
 * normalized `HttpRequest` (`api/http/types.ts`) structurally satisfy it, so the
 * helper works under any adapter (and inside the framework-agnostic `RateLimiter`).
 */
type BypassRequest = {
  headers: Record<string, string | string[] | undefined>;
};

/**
 * Check if the request is coming from a test environment.
 *
 * This is used to bypass certain checks in the API for testing purposes.
 *
 * @returns {boolean}
 */
const checkTestBypass = (req: BypassRequest): boolean => {
  const config = getConfig();
  // Never honor the test bypass in production, even if a secret is configured.
  // The bypass can skip rate limiting and grant admin on registration, so it
  // must be impossible to trigger against a production deployment.
  if (config.nodeEnv === 'production') {
    return false;
  }
  const testBypassSecret = config.testBypassSecret;
  if (!testBypassSecret) {
    return false;
  }
  if (req.headers['x-test-bypass-secret'] === testBypassSecret) {
    return true;
  }
  return false;
};

export default checkTestBypass;
