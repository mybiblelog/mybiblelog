import { Bible } from "@mybiblelog/shared";
import type { StoredLogEntry } from "@/src/storage/logEntries";
import { compareEntriesNewestFirst } from "@/src/log-entries/sync";

/**
 * Per-entry verse stats for a single day, keyed by `clientId`.
 *
 * `total` is the entry's raw verse count; `newSinceLookBack` is the entry's
 * incremental contribution to the cumulative unique-verse count since the
 * tracker start (`lookBackDate`) — the same delta the Nuxt
 * `date-verse-counts` store derives, replayed entry-by-entry.
 *
 * Extracted from the Today screen so the walk is unit-testable and can stop
 * early: entries dated after `forDate` can't affect the result, and when the
 * target day has no entries the (relatively expensive) cumulative unique-verse
 * replay is skipped entirely.
 */

export type EntryVerseStats = { total: number; newSinceLookBack: number };

export function computeEntryVerseStatsForDate(
  entries: StoredLogEntry[],
  lookBackDate: string,
  forDate: string
): Map<string, EntryVerseStats> {
  const map = new Map<string, EntryVerseStats>();
  if (!entries.some((e) => e.date === forDate)) return map;

  // Chronological replay (oldest first) so each entry's delta matches the
  // cumulative behavior of the web app.
  const chronological = entries.slice().sort((a, b) => compareEntriesNewestFirst(b, a));

  const cumulative: { startVerseId: number; endVerseId: number }[] = [];
  let uniqueVersesToDate = 0;

  for (const e of chronological) {
    if (e.date > forDate) break;
    const total = Bible.countRangeVerses(e.startVerseId, e.endVerseId);

    if (e.date < lookBackDate) {
      if (e.date === forDate) map.set(e.clientId, { total, newSinceLookBack: 0 });
      continue;
    }

    cumulative.push({ startVerseId: e.startVerseId, endVerseId: e.endVerseId });
    const uniqueVersesThrough = Bible.countUniqueRangeVerses(cumulative);
    const newSinceLookBack = uniqueVersesThrough - uniqueVersesToDate;
    uniqueVersesToDate = uniqueVersesThrough;

    if (e.date === forDate) map.set(e.clientId, { total, newSinceLookBack });
  }

  return map;
}
