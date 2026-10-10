import path from 'node:path';
import dotenv from 'dotenv';
import { afterAll } from 'vitest';

/**
 * Repository test setup. Runs (via Vitest `setupFiles`) before any test module
 * imports `config`/`useRepositories`, so it can redirect the data layer at a
 * dedicated test database: a derived Mongo database, or (with
 * DATABASE_DRIVER=sqlite) an in-memory SQLite database that needs no server.
 * Dev data is therefore never touched and the suite is free to make
 * whole-collection assertions.
 *
 * Important: this file must NOT statically import `config` or the data layer
 * — `config` is parsed once and cached, which would happen before the
 * overrides below. Teardown therefore imports the data layer lazily.
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

const useSqlite = process.env.DATABASE_DRIVER === 'sqlite';

if (useSqlite) {
  // Each test file runs in its own module context, so each gets a fresh database.
  process.env.SQLITE_PATH = ':memory:';
}
else {
  const baseUri = process.env.MONGODB_URI;
  if (!baseUri) {
    throw new Error('MONGODB_URI is not set; cannot derive the repository test database URI');
  }
  // Override before `config` is ever imported. `config` loads .env with dotenv's
  // default `override: false`, so the value set here wins.
  process.env.MONGODB_URI = deriveTestUri(baseUri);
}

// The repositories never use these, but `config` requires them. Placeholders
// let the suite run without a .env (e.g. in a sandbox, against SQLite).
const REQUIRED_CONFIG_PLACEHOLDERS: Record<string, string> = {
  SITE_URL: 'http://localhost:3000',
  JWT_SECRET: 'repository-tests-secret',
  REQUIRE_EMAIL_VERIFICATION: 'true',
  EMAIL_SENDING_DOMAIN: 'example.com',
  EMAIL_UNSUBSCRIBE_ADDRESS: 'unsubscribe@example.com',
  RESEND_API_KEY: 'unused',
  GOOGLE_CLIENT_ID: 'unused',
  GOOGLE_CLIENT_SECRET: 'unused',
  GOOGLE_REDIRECT: 'http://localhost:3000/unused',
};
for (const [key, value] of Object.entries(REQUIRED_CONFIG_PLACEHOLDERS)) {
  process.env[key] ??= value;
}

// Drop the test data and release the connection after each test file so dev
// data stays clean and Vitest can exit without open handles.
afterAll(async () => {
  // Imported lazily so the overrides above are in place when `config` is first evaluated.
  if (!useSqlite) {
    const { dropDatabase } = await import('../../mongo/useCollections');
    await dropDatabase();
  }
  const { closeDatabase } = await import('../../repositories/useRepositories');
  await closeDatabase();
});
