import { resetConfig } from '../config';

/**
 * Helpers for exercising config-dependent branches in-process.
 *
 * `getConfig()` (api/config/index.ts) lazily parses `process.env` once and caches
 * the result; `resetConfig()` clears that cache. Together they let an in-process
 * test temporarily set an environment variable, force a re-parse, and drive code
 * that branches on configuration (e.g. REQUIRE_EMAIL_VERIFICATION).
 *
 * IMPORTANT: this only affects code running in this Vitest process. The supertest
 * suites talk to a separate API server over HTTP, so these helpers do nothing for
 * them — use them only with directly-invoked handlers/helpers.
 *
 * Usage:
 *   afterEach(restoreEnvConfig);
 *   ...
 *   withEnvConfig({ REQUIRE_EMAIL_VERIFICATION: 'false' });
 *   // call the code under test
 *
 * `restoreEnvConfig()` returns `process.env` and the config cache to the real
 * test-env values so later tests/files are unaffected (the runner is serial:
 * `fileParallelism: false`).
 */

// Snapshot of the original values for keys touched by withEnvConfig, so they can
// be restored exactly (including keys that were originally absent).
let snapshot: Record<string, string | undefined> | null = null;

/**
 * Apply environment overrides and clear the config cache. A `undefined` value
 * deletes the key. Snapshots the original values on first call so a single
 * `restoreEnvConfig()` reverts everything.
 */
export function withEnvConfig(overrides: Record<string, string | undefined>): void {
  if (!snapshot) {
    snapshot = {};
  }
  for (const [key, value] of Object.entries(overrides)) {
    // Only record the original value the first time we touch a key.
    if (!(key in snapshot)) {
      snapshot[key] = process.env[key];
    }
    if (value === undefined) {
      delete process.env[key];
    }
    else {
      process.env[key] = value;
    }
  }
  resetConfig();
}

/**
 * Restore any keys mutated by `withEnvConfig` and clear the config cache. Safe to
 * call when nothing was overridden. Intended for `afterEach`.
 */
export function restoreEnvConfig(): void {
  if (!snapshot) {
    return;
  }
  for (const [key, value] of Object.entries(snapshot)) {
    if (value === undefined) {
      delete process.env[key];
    }
    else {
      process.env[key] = value;
    }
  }
  snapshot = null;
  resetConfig();
}
