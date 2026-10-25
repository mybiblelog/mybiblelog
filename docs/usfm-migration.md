# Migrating clients to USFM passage references

The API accepts and returns USFM-style passage references (e.g. `JHN.3.16-18`) alongside the integer verse IDs it has always used. This guide covers moving the web and mobile clients onto USFM at the network boundary, and what it would take to drop verse IDs from the API contract entirely.

## Where things stand

| Surface | Integer verse IDs | USFM |
|---|---|---|
| `POST`/`PATCH /log-entries` body | `startVerseId` + `endVerseId` | `passage` |
| `POST`/`PATCH /passage-notes` body, `passages[]` | `{ startVerseId, endVerseId }` | `"GEN.1"` or `{ passage }` |
| `GET /passage-notes` filter | `filterPassageStartVerseId` + `filterPassageEndVerseId` | `filterPassage` (wins if both are sent) |
| Log entry and note passage responses | `startVerseId`, `endVerseId` | `passage`, always the shortest form |
| `GET /scripture/passage` query | `startVerseId` + `endVerseId` | — |
| `GET /passage-notes/count/books` response | keyed by book number (1–66) | — |

Sending both forms in one body is a `400` on `passage`. Storage is unchanged: the API resolves USFM to integers during validation, so handlers, repositories and MongoDB only ever see integers.

The grammar is the dot notation YouVersion and Bible.com use, the same one the `apps.ts` deep links already build: `GEN`, `GEN.1`, `GEN.1-3`, `GEN.1.1`, `GEN.1.1-5`, `GEN.1.1-2.3`. A reference names exactly one book; the end of a range never names a book, so a passage cannot cross books. That matches the existing rule in `Bible.validateRange`. `Bible.parseUsfmReference` and `Bible.formatUsfmReference` in `@mybiblelog/shared` are the single implementation that the API and both clients should use.

## The recommended shape: USFM on the wire, integers inside

Both clients do real arithmetic on verse IDs: segments and progress bars, unique-verse counts, range overlap and consolidation, sorting and the reading-suggestion engine. All of it lives in `shared/bible` and `shared/insights` and depends on integers being ordered and dense. USFM strings are neither: `1CO` sorts before `GEN`, and `GEN.1` and `GEN.1.1-31` are the same range.

So the migration is a **boundary change**, not a rewrite. Each client converts to USFM as it sends a request and keeps (or converts back to) integers in its state. Nothing in the components, insights code or on-device caches needs to change.

## Web

1. **Log entry requests.** `shared/log-entry/api.ts` (`postLogEntry`, `patchLogEntry`) is the network boundary for log entries, and both web and mobile call it. Send `{ date, passage: Bible.formatUsfmReference(startVerseId, endVerseId) }` instead of the integer pair. The input types can keep taking integers, so no caller changes. Doing this in `shared` moves web and mobile at once, which is the main reason to start here.
2. **Note requests.** `web/app/stores/passage-notes.ts` posts the notes the editor store builds; map each passage to its USFM string there.
3. **Note search.** Send `filterPassage` instead of the integer pair from `passage-notes.ts`.
4. **URLs.** `web/app/helpers/passage-notes-route-query.ts` and `log-entries-route-query.ts` write `filterPassageStartVerseId`/`filterPassageEndVerseId` into the address bar, so users have bookmarks and shared links in that form. Switch the encoder to a single readable `passage=JHN.3` parameter. The decoder must keep accepting the legacy pair indefinitely, because bookmarks never expire. Keep both directions symmetric (the existing round-trip tests in those helpers' tests are the guard).
5. **Responses.** Optional. Responses still carry integers, so the stores can keep reading them. If you want the client to read `passage` instead, parse it once in the store and keep integers in state.
6. **Import/export.** The CSV export and import use human-readable references (`displayVerseRange`), not verse IDs, so nothing changes there.
7. **E2E.** The Playwright suite seeds data through the API (`e2e/helpers/seed.ts`). It can keep seeding with integers, but switching one seed path to USFM gives end-to-end coverage of the new form.

## Mobile

1. **Log entries.** Mobile already calls `shared/log-entry/api.ts`, so web step 1 covers it. `src/api/logEntryMapper.ts` only reads `startVerseId`/`endVerseId` and ignores unknown fields, so the new `passage` response field is harmless to every build already in the store.
2. **Notes.** `src/api/notesApi.ts` builds note payloads and search queries itself. Map passages to USFM strings and send `filterPassage`, as on web.
3. **Offline queue.** Pending mutations (`src/log-entries/sync.ts`, `src/notes/offlineSync.ts`) are persisted on the device with integer verse IDs and replayed later, possibly by a newer build. Keep them in integers and convert at send time. The API accepts integers, so mutations queued by an old build still replay. If the stored shape ever changes, it needs a storage migration (`src/storage/migrations`, bumping `CURRENT_SCHEMA_VERSION`).
4. **Builds in the wild.** Every shipped version keeps sending and expecting integers for as long as it is installed. That doesn't matter while the API accepts both forms, but it decides when integers can be removed (see below).

## Rollout order

1. API accepts both forms and returns both. **Done.**
2. Change `shared/log-entry/api.ts` (web and mobile log entries) and web notes. Web deploys atomically with the API, so nothing is in flight.
3. Ship mobile notes and search in a release, after the shared change.
4. Leave the integer inputs accepted until the "dropping verse IDs" checklist below is satisfied, if ever.

Each step works without the next one.

## Considerations for dropping verse IDs from the API contract

Accepting USFM costs nothing to keep. Removing integers is the expensive step, and it should be justified by external consumers rather than by tidiness.

**Shipped mobile builds break silently.** `parseApiLogEntry` returns `null` for a row without numeric `startVerseId`/`endVerseId`, and `notesApi.ts` drops such passages. Removing the integer fields from responses would make an old build show an **empty reading log**, with no error and no crash. Before removing response fields, either version the API (below) or force every build that reads integers to upgrade. The lever is the minimum-version gate behind `/mobile-app/support` (`MOBILE_IOS_MIN_VERSION` / `MOBILE_ANDROID_MIN_VERSION`). Only raise it once the release that reads `passage` has been out long enough, and check that version's adoption first. Removing integer *inputs* has the same constraint: old builds and their queued offline mutations would start getting `400`s, which the queue treats as permanent and **discards**.

**Version rather than break.** The safer path is a `v2` contract (a path prefix or a version header) that speaks only USFM, with `v1` frozen and integer-based. Old builds keep `v1`, and new clients and third parties use `v2`. If you'd rather deprecate in place, mark the integer fields `deprecated` in the OpenAPI schemas (zod `.meta({ deprecated: true })`; `zodToOpenApiSchema` currently copies only descriptions from zod's global registry, so its `override` would need to copy `deprecated` too), send `Deprecation`/`Sunset` headers on requests that use them, and log usage so the removal date is based on data.

**Keep integers in storage.** Several MongoDB queries rely on integer ordering: passage range-overlap filters (`$gte`/`$lte` in `passage-note.repository.ts`), sorting notes by passage, and `countByBook`'s per-book ranges. USFM strings can't express those. Dropping verse IDs from the *contract* should not mean dropping them from the *database*; translating at the edge, as the API does now, is the right long-term shape.

**References have many spellings.** `GEN.1`, `GEN.1-1` and `GEN.1.1-31` are the same range, as are `OBA` and `OBA.1`. The API always responds with the shortest form, but clients must compare passages by parsing them (or comparing the integers), never by string equality. Any client-side cache keyed by a reference string needs to normalize through `formatUsfmReference(...parseUsfmReference(ref))`.

**Versification is the app's, not the reader's.** USFM codes name books, but chapter and verse numbering differ between traditions. The API validates against the English/NASB versification table in `shared/bible/static/chapter-verses/`. For example, Malachi has 4 chapters here (`MAL.4` is valid, though it doesn't exist in Hebrew numbering), and 3 John 1 has 14 verses (`3JN.1.15` is rejected, though some translations number it). Integer IDs hid this because clients never formed references themselves. A USFM-only contract invites third parties to send references from their own versification, so the API docs should state the versification, and the error should be clear about a verse that "doesn't exist".

**No multi-book passages.** A USFM reference covers one book by design, matching the existing range rule. A client that reads "Genesis 50 to Exodus 2" must send two log entries or two note passages. Keep that explicit in client UX, as it is today.

**The remaining integer surfaces.** A USFM-only contract also has to cover:
- `GET /scripture/passage`, which still takes `startVerseId`/`endVerseId`. It should take `passage`, and its `next` continuation cursor (currently a verse ID pair) needs a USFM equivalent.
- `GET /passage-notes/count/books`, which is keyed by book number (1–66). USFM codes (`GEN`, `1CO`) would make the keys self-describing.
- Error details, which name `startVerseId`/`endVerseId`/`passage` in their `field`. Clients that map errors to form fields by name need updating with each contract change.
- Backups and scripts (`api/scripts/`), which read the database directly. They are unaffected as long as storage stays integer-based.

**Testing the cutover.** The API integration suites (`api/test/log-entries.test.ts`, `api/test/passage-notes.test.ts`) cover both forms today. Under a versioned contract, run them once per version. Before raising the mobile minimum version, test an upgrade with a populated offline queue: queue mutations offline on the old build, upgrade, and confirm they replay.
