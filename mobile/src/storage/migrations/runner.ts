import { reportHandledError } from "@/src/observability/sentry";
import {
  CURRENT_SCHEMA_VERSION,
  getStoredSchemaVersion,
  setStoredSchemaVersion,
} from "@/src/storage/schemaVersion";
import { MIGRATIONS, type Migration } from "@/src/storage/migrations";

/**
 * Run pending storage migrations, in order, up to `target`.
 *
 * Called once from `src/stores/init.ts` **before** any store hydrates, so the
 * loaders read already-migrated bytes. Forward-only: each step's `up()` runs
 * inside a try/catch, and the stored version advances only after a step
 * succeeds. A failure stops progression and is reported (never crashes app
 * start); because steps are idempotent, the same step retries next launch.
 *
 * `migrations`/`target` are injectable so the runner is pure-testable.
 */
export async function runStorageMigrations(
  migrations: Migration[] = MIGRATIONS,
  target: number = CURRENT_SCHEMA_VERSION
): Promise<void> {
  const stored = await getStoredSchemaVersion();
  if (stored >= target) return;

  const pending = migrations
    .filter((m) => m.version > stored && m.version <= target)
    .sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    try {
      await migration.up();
      await setStoredSchemaVersion(migration.version);
    } catch (err) {
      // Leave the version at the last good step so this migration retries next
      // launch. Don't block app start — downstream loaders' type-guards discard
      // anything malformed a partial migration may have left behind.
      reportHandledError(err, {
        op: "storage.runMigrations",
        version: migration.version,
        name: migration.name,
      });
      return;
    }
  }
}
