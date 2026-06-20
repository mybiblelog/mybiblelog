import path from 'node:path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { afterAll } from 'vitest';

/**
 * Repository test setup. Runs (via Vitest `setupFiles`) before any test module
 * imports `config`/`useMongooseModels`, so it can redirect the data layer at a
 * dedicated test database. Dev data is therefore never touched and the suite is
 * free to make whole-collection assertions.
 *
 * Important: this file must NOT statically import `config` or
 * `useMongooseModels` — those evaluate `config` (which reads `MONGODB_URI`) at
 * import time, which would happen before the override below. Teardown therefore
 * uses the `mongoose` singleton directly.
 */

// Load the root .env to obtain the base connection string.
dotenv.config({
  path: path.resolve(__dirname, '../../../.env'),
  quiet: true,
});

const REPO_TEST_DB_NAME = 'mybiblelog_repo_test';

/**
 * Derives a dedicated test-database URI from the base `MONGODB_URI`, replacing
 * any database name with `mybiblelog_repo_test` and forcing `authSource=admin`
 * (the docker root user authenticates against the admin database).
 */
const deriveTestUri = (uri: string): string => {
  const match = uri.match(/^(mongodb(?:\+srv)?:\/\/[^/?]+)(?:\/[^?]*)?(?:\?(.*))?$/);
  if (!match) {
    throw new Error(`Could not parse MONGODB_URI for repository tests: ${uri}`);
  }
  const [, schemeAndAuthority, query] = match;
  const params = new URLSearchParams(query ?? '');
  if (!params.has('authSource')) {
    params.set('authSource', 'admin');
  }
  return `${schemeAndAuthority}/${REPO_TEST_DB_NAME}?${params.toString()}`;
};

const baseUri = process.env.MONGODB_URI;
if (!baseUri) {
  throw new Error('MONGODB_URI is not set; cannot derive the repository test database URI');
}

// Override before `config` is ever imported. `config` loads .env with dotenv's
// default `override: false`, so the value set here wins.
process.env.MONGODB_URI = deriveTestUri(baseUri);

// Drop the dedicated test database and release the connection after each test
// file so dev data stays clean and Vitest can exit without open handles.
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
