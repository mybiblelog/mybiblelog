import config from '../../config';
import { type Request} from 'express';

/**
 * Check if the request is coming from a test environment.
 *
 * This is used to bypass certain checks in the API for testing purposes.
 *
 * @param {import('express').Request} req
 * @returns {boolean}
 */
const checkTestBypass = (req: Request): boolean => {
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
