# Offline Storage & Cross-Version Migrations

How the mobile app persists data on the device, and how that data is upgraded
between app versions.

> **TL;DR — storage engine choice.** The app uses **AsyncStorage** (key-value
> JSON), not SQLite. This is deliberate: the data is tiny and always consumed
> whole, so a relational store adds cost with no benefit. See
> [Why not SQLite](#why-not-sqlite-or-drizzle) for the reasoning and the
> conditions under which we'd revisit it.

---

## Part A — How data is stored on the device

### Principles

- **Offline-first.** Log entries can be created/edited/deleted with no network;
  changes queue locally and sync when connectivity + auth return (see
  [the offline mutation queue](#the-offline-mutation-queue)).
- **AsyncStorage for app data, SecureStore for secrets.** Non-sensitive data is
  JSON in AsyncStorage; auth tokens live in the OS keychain via `expo-secure-store`.
- **Load-all, compute-in-JS.** The primary dataset is loaded fully into memory
  and every derived value (calendar counts, whole-Bible progress, achievements)
  is computed by folding over the whole array. There is no partial/indexed read
  anywhere. At this data scale (see below) that is simpler and fast enough.

### Storage backends in use

| Backend | Package | Used for |
|---|---|---|
| **AsyncStorage** | `@react-native-async-storage/async-storage` | Log entries, mutation queue, settings, derived caches, UI prefs, the schema-version marker |
| **SecureStore** | `expo-secure-store` | Auth session token + last-logged-in email (falls back to `sessionStorage` on the web target) |

There is **no SQLite / Realm / WatermelonDB / MMKV**.

### Key catalog

| Key | Owner module | Shape | Class |
|---|---|---|---|
| `logEntries.v1` | `src/storage/logEntries.ts` | `StoredLogEntry[]` | primary / durable |
| `logEntries.mutations.v1` | `src/storage/logEntries.ts` | `PendingLogEntryMutation[]` | primary / durable (offline queue) |
| `userSettings.v1` | `src/settings/userSettingsStorage.ts` | `LocalUserSettings` | durable pref |
| `themeMode.v1` | `src/design/ThemeProvider.tsx` | `"light" \| "dark" \| "system"` | UI pref |
| `locale.v1` | `src/i18n/LocaleProvider.tsx` | locale string | UI pref |
| `forceUpgradeStatus.v1` | `src/upgrade/UpgradeGate.tsx` | upgrade-gate payload | UI pref |
| `cache.dateVerseCounts` | `src/storage/dateVerseCountsCache.ts` | `{ value: DateVerseCountsMap, expiresAt }` | derived / disposable (24h TTL) |
| `cache.bibleProgress` | `src/storage/dateVerseCountsCache.ts` | `{ value: BibleProgress, expiresAt }` | derived / disposable (24h TTL) |
| `storage.schemaVersion` | `src/storage/schemaVersion.ts` | integer (as string) | version marker |
| `auth.session.v1` | `src/auth/authStorage.ts` (**SecureStore**) | `{ token, user: { email } }` | secret |
| `auth.lastLoggedInEmail.v1` | `src/auth/authStorage.ts` (**SecureStore**) | email string | secret |

**Passage notes and tags are online-only** — they are paginated from the API and
never persisted on device.

### Data shapes

Source-of-truth types (don't duplicate them — link):

- `StoredLogEntry` / `PendingLogEntryMutation` — `src/storage/logEntries.ts`
  (`StoredLogEntry = LogEntry & { clientId: string }`, where `LogEntry` is
  `src/types/log-entry.ts`).
- `LocalUserSettings` — `src/settings/userSettingsStorage.ts`.
- Cache envelope `{ value, expiresAt }` — `src/storage/dateVerseCountsCache.ts`.
- Schema version — `src/storage/schemaVersion.ts`.

### The offline mutation queue

`logEntries.mutations.v1` is a write-ahead log of `create` / `update` / `delete`
operations. Pure logic lives in `src/log-entries/sync.ts`; the drain loop is
`syncNow()` in `src/stores/logEntries.ts`.

- Each entry has a stable **`clientId`** (offline identity) plus, once synced, a
  server **`id`**. Mutations are keyed by `clientId`.
- Operations **coalesce** (`coalesceCreate/Update/Delete`): e.g. a create then a
  delete of an unsynced entry cancels out; an update folds into a pending create.
- On drain, **transient** failures (network, 5xx, 401/403 auth, 408, 429) stay
  queued; **permanent 4xx** failures are dropped (`isPermanentMutationError`) so
  one bad mutation can't stall the queue forever.

### Durability & failure model

- All writes are **best-effort**: a failed `setItem` is logged and swallowed
  (`console.warn` / `reportHandledError`) — persistence never crashes the app.
- All reads run **defensive type-guards** (`isLogEntry`, `isLocalUserSettings`,
  `isPendingMutation`) that silently drop malformed records and fall back to
  defaults. A read never throws.
- **Derived caches are disposable.** `cache.dateVerseCounts` and
  `cache.bibleProgress` are recomputed from the log entries; deleting them just
  forces a rebuild on next launch.

### Security note

Secrets (the auth token) live **only** in SecureStore (OS keychain), never in
AsyncStorage. Nothing sensitive is written to the plain key-value store.

---

## Part B — How data is updated between app versions

### Versioning model — two complementary mechanisms

1. **Per-key `.vN` name suffix** (e.g. `logEntries.v1`). Use this for a
   **wholesale replacement**: when a key's shape changes so drastically that the
   old data is simply abandoned, write to `…v2` and let the old key rot (or delete
   it in a migration). Coarse; no transform.
2. **Global `storage.schemaVersion` integer** (`src/storage/schemaVersion.ts`).
   Use this for **in-place transforms** that must preserve existing data, possibly
   spanning multiple keys. This is the number the migration runner advances.

Prefer the schema-version mechanism for anything that must keep user data. Reach
for a `.vN` bump only when the old shape is genuinely disposable.

### The migration runner

- Lives in `src/storage/migrations/runner.ts`; the ordered registry is
  `src/storage/migrations/index.ts`.
- Runs in `src/stores/init.ts` **before any Zustand store hydrates** — the
  `initStores()` body `await runStorageMigrations()` first, then calls the `init*`
  functions. So loaders always read already-migrated bytes.
- **Forward-only, idempotent, one step per version.** Each step's `up()` runs in
  a try/catch; the stored version advances only *after* a step succeeds. A failure
  stops progression and is reported via `reportHandledError` — it never blocks app
  start. Because steps are idempotent, a failed step retries next launch.

### Authoring a migration (playbook)

1. Bump `CURRENT_SCHEMA_VERSION` in `src/storage/schemaVersion.ts` by one.
2. Add `src/storage/migrations/NNNN-name.ts` exporting `async function up()`.
3. Register it in `src/storage/migrations/index.ts` (`MIGRATIONS` is asserted
   contiguous from 1 at module load, so a gap fails loudly).
4. **Operate on raw JSON keys only** — `AsyncStorage.getItem` / `setItem`. Never
   import today's typed loaders or `LogEntry`: a migration is frozen in time and
   must not break when those types drift.
5. Make it **idempotent** (safe to run twice) and a **no-op** when there's nothing
   to do (absent key, already-migrated records).
6. Add a co-located `NNNN-name.test.ts`.

**Worked example — the `0001-baseline` migration**
(`src/storage/migrations/0001-baseline.ts`) formalizes the historical implicit
backfill: it reads raw `logEntries.v1`, ensures every entry has a `clientId`
(derived from its server `id` or freshly generated), and re-persists only if
something changed. It's a no-op for entries that already have a `clientId`.

### Compatibility guarantees

- **Forward-only.** There are no down-migrations. A newer binary migrates older
  data on first launch; there is no path back.
- **Older binaries tolerate newer data.** Loaders use type-guards that ignore
  unknown fields, so installing an older build after a newer one won't crash — it
  just ignores what it doesn't understand.
- **Never destroy data you don't understand.** Type-guards drop only clearly
  malformed *records*, and only for that read — they never rewrite the store to
  remove unknown fields. Migrations, likewise, transform rather than truncate.

### Cross-version scenarios

- **Add a field with a default** — either read-time defaulting in the loader (for
  optional fields) or a migration that backfills the default into each record.
- **Rename / move a field across keys** — a migration reads the old key, writes the
  new shape (or a new key), and removes the stale one. Bump the schema version.
- **Retire an implicit inline migration** — once `0001-baseline` has shipped and
  baked for a release (every install has passed schema v1), the inline
  `ensureClientIds` branch in `loadLogEntries` can be deleted, leaving a pure
  loader. Do this in a follow-up release, not the same one.
- **Invalidate a derived cache after a shape change** — just `removeItem` the
  `cache.*` key in a migration; the store recomputes it from the log entries.

### Testing & release checklist

- Unit-test the migration against the in-memory AsyncStorage mock:
  fresh-install, idempotency, and no-op cases at minimum.
- **Migrations are frozen once shipped.** Never edit a released migration — add a
  new one and bump the version. Editing a shipped step means installs that already
  ran it won't pick up the change.
- CI gates (`.github/workflows/mobile-ci.yml`) must pass: `npm run typecheck`,
  `npm run lint`, `npm run format:check`, `npm test`.

---

## Why not SQLite (or Drizzle)?

Evaluated and deliberately declined for the current app:

- **Data volume is trivial.** Log-entry records are ~80 bytes; even logging the
  whole Bible in chapter ranges is ~1,200 entries. The full array is ~100–250 KB
  — parse/serialize is sub-millisecond. There is no performance problem to solve.
- **Access pattern nullifies SQLite's advantage.** Every derived value folds over
  the *entire* array, so there is no indexed/partial-read workload. SQLite would
  load all rows and rebuild the same in-memory array.
- **The backend is MongoDB** (document store, ObjectId string IDs). There is no
  shared SQL schema to reuse, so a relational ORM (Drizzle/drizzle-kit) on device
  would be a second, inconsistent data model with real setup + native-module +
  test-tooling cost.
- **The offline queue already works** (`src/log-entries/sync.ts`); SQLite wouldn't
  improve it, only relocate it.

**Revisit SQLite only when two or more of these become true:**

1. Passage notes & tags become fully offline (free-text bodies + tag/full-text
   search over thousands of rows) — the most likely future trigger.
2. Full offline Bible **text** is bundled on device (large blob + range queries;
   arguably a separate read-only asset store regardless).
3. A genuine partial/indexed read appears (e.g. "entries for book Y" without
   loading everything).
4. Cross-entity relational queries/joins across notes, tags, and entries run on
   device.
5. The whole-array-rewrite-per-mutation cost shows up in profiling — the cheaper
   fix there is debounced/batched writes, not SQLite.
