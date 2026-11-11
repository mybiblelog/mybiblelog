# USFM passage references

The API accepts and returns USFM-style passage references (`JHN.3.16-18`) alongside the integer verse IDs it has always used. The grammar is the dot notation YouVersion and Bible.com use: `GEN`, `GEN.1`, `GEN.1-3`, `GEN.1.1`, `GEN.1.1-5`, `GEN.1.1-2.3`. The range end may repeat the start's book (`GEN.1.1-GEN.2.3`). `Bible.parseUsfmReference` and `Bible.formatUsfmReference` in `@mybiblelog/shared` are the single implementation.

## USFM on the wire, integers inside

USFM is resolved to integer verse IDs during request validation, so handlers, repositories, MongoDB and client state only ever see integers. That split is deliberate:

- Progress bars, unique-verse counts, range overlap and the reading-suggestion engine all depend on verse IDs being **ordered and dense**. USFM strings are neither: `1CO` sorts before `GEN`, and `GEN.1` and `GEN.1.1-31` are the same range.
- MongoDB queries rely on integer ordering (passage overlap `$gte`/`$lte`, sorting notes by passage, per-book counts). Dropping verse IDs from the *contract* should never mean dropping them from *storage*.

Clients adopt USFM by converting at the request boundary, not by changing their state (tracked as `usfm-client-migration` in the [tech debt register](tech-debt.md)).

## Contract rules

- **Both forms may be sent if they agree.** Responses carry `passage` next to `startVerseId`/`endVerseId`, so a client can send a response passage back unchanged (a null `passage` counts as absent). A body where the two forms describe different ranges is rejected with the `passage_conflict` detail code, which is what a client sees if it edits the integers of a fetched object and sends the stale `passage` back. `GET /passage-notes` applies the same rule to `filterPassage` and the verse ID pair (a `400` with a `filterPassage` detail of `passage_conflict`, or `not_valid` for a bad reference), except that an invalid pair is ignored, as it always was.
- **One book per reference.** The end of a range never names a different book, which matches `Bible.validateRange`. "Genesis 50 to Exodus 2" is two passages.
- **Many spellings, one range.** `GEN.1`, `GEN.1-1`, `GEN.1.1-31` and `GEN.1.1-GEN.1.31` are equal. Responses always use the shortest form, but clients must compare parsed ranges, never strings.
- **The versification is the app's.** References are validated against the English/NASB table in `shared/bible/static/chapter-verses/`, so `MAL.4` is valid and `3JN.1.15` is not. Third parties that form references from another tradition will hit "verse doesn't exist" errors, so the `passage` field's OpenAPI description names the versification.

## Dropping integer verse IDs from the contract

Accepting USFM costs nothing to keep. Removing integers is the expensive step, and should be driven by external consumers rather than tidiness.

- **Shipped mobile builds break silently.** An old build drops log entries and note passages that lack numeric `startVerseId`/`endVerseId`, so it would show an empty reading log with no error. Removing integer *inputs* makes its offline-queued mutations fail with a `400`, which the queue treats as permanent and discards.
- **Version rather than break.** Prefer a `v2` contract that speaks only USFM, with `v1` frozen. If deprecating in place instead, mark the integer fields deprecated in OpenAPI, send `Deprecation`/`Sunset` headers, log usage, and raise the mobile minimum-version gate only after the release that reads `passage` has broad adoption.
- **Remaining integer-only surfaces:** `GET /scripture/passage` (and its `next` cursor), and `GET /passage-notes/count/books`, which is keyed by book number.
