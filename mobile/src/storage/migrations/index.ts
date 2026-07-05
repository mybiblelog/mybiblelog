import { up as up0001 } from "@/src/storage/migrations/0001-baseline";

/**
 * Ordered registry of storage migrations.
 *
 * Each migration transforms the raw AsyncStorage bytes to the shape expected by
 * schema version `version`. They are forward-only, idempotent, and frozen once
 * shipped — never edit a released migration; add a new one and bump
 * `CURRENT_SCHEMA_VERSION` (`src/storage/schemaVersion.ts`).
 *
 * See `mobile/docs/offline-storage.md` for the authoring playbook.
 */

export type Migration = {
  /** Schema version this step upgrades storage *to*. Contiguous from 1. */
  version: number;
  /** Human-readable name, mirrors the file basename (e.g. "0001-baseline"). */
  name: string;
  /** Apply the transform. Must be idempotent and operate on raw keys only. */
  up: () => Promise<void>;
};

export const MIGRATIONS: Migration[] = [{ version: 1, name: "0001-baseline", up: up0001 }];

// Guard the registry invariants at module load so a mis-authored migration
// fails loudly in dev/CI rather than silently misordering at runtime.
MIGRATIONS.forEach((migration, index) => {
  const expected = index + 1;
  if (migration.version !== expected) {
    throw new Error(
      `Storage migrations must be contiguous from 1: expected version ${expected} at index ${index}, got ${migration.version} ("${migration.name}")`
    );
  }
});
