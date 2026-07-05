import { computeEntryVerseStatsForDate } from "./entryStats";
import type { StoredLogEntry } from "@/src/storage/logEntries";

import { Bible } from "@mybiblelog/shared";

// Genesis 1, encoded with the shared verse-ID scheme.
const gen1v1 = Bible.makeVerseId(1, 1, 1);
const gen1v5 = Bible.makeVerseId(1, 1, 5);
const gen1v10 = Bible.makeVerseId(1, 1, 10);

function entry(clientId: string, date: string, start: number, end: number): StoredLogEntry {
  return { clientId, date, startVerseId: start, endVerseId: end };
}

describe("computeEntryVerseStatsForDate", () => {
  it("returns an empty map when the target date has no entries", () => {
    const entries = [entry("a", "2026-06-01", gen1v1, gen1v5)];
    expect(computeEntryVerseStatsForDate(entries, "0000-00-00", "2026-06-27").size).toBe(0);
  });

  it("computes total and incremental new verses per entry", () => {
    const entries = [
      // Earlier day: Gen 1:1-5 (5 unique verses read before today).
      entry("earlier", "2026-06-20", gen1v1, gen1v5),
      // Today: Gen 1:1-10 → only 6:10 are new (5 overlap with the earlier read).
      entry("today", "2026-06-27", gen1v1, gen1v10),
    ];
    const stats = computeEntryVerseStatsForDate(entries, "0000-00-00", "2026-06-27");
    expect(stats.get("today")).toEqual({ total: 10, newSinceLookBack: 5 });
    expect(stats.has("earlier")).toBe(false);
  });

  it("reports zero new verses for entries before the look-back date", () => {
    const entries = [entry("old", "2020-01-01", gen1v1, gen1v5)];
    const stats = computeEntryVerseStatsForDate(entries, "2026-01-01", "2020-01-01");
    expect(stats.get("old")).toEqual({ total: 5, newSinceLookBack: 0 });
  });

  it("ignores entries dated after the target date", () => {
    const entries = [
      entry("today", "2026-06-27", gen1v1, gen1v5),
      // A future-dated overlap must not siphon off "new" credit.
      entry("future", "2026-07-01", gen1v1, gen1v10),
    ];
    const stats = computeEntryVerseStatsForDate(entries, "0000-00-00", "2026-06-27");
    expect(stats.get("today")).toEqual({ total: 5, newSinceLookBack: 5 });
  });
});
