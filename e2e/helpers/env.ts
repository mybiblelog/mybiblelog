import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
  quiet: true,
});

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is not set`);
  }
  return value;
};

const stripTrailingSlash = (url: string): string => url.replace(/\/+$/, '');

export const env = {
  /** Base URL of the site under test (browser navigation). */
  siteUrl: stripTrailingSlash(required('TEST_SITE_URL')),
  /** Base URL of the API under test (helper/seeding requests). */
  apiUrl: stripTrailingSlash(required('TEST_API_URL')),
  /** Secret for the x-test-bypass-secret header (skips email verification + rate limits; disabled in production). */
  bypassSecret: required('TEST_BYPASS_SECRET'),
  /**
   * Origin expected in canonical/hreflang URLs (the app builds them from its SITE_URL env).
   * Defaults to the site under test; override when testing a deployment behind a different public URL.
   */
  expectedSiteUrl: stripTrailingSlash(process.env.EXPECTED_SITE_URL || required('TEST_SITE_URL')),
};
