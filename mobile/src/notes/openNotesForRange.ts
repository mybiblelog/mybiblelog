import type { PassageNotesPassageMatching } from "@mybiblelog/shared";
import { router } from "expo-router";
import { notesActions } from "@/src/stores/passageNotes";

/**
 * Show the Notes tab filtered to a passage range (web `viewBookNotes` /
 * `viewNotesForChapter`). Books use `exclusive` matching (notes fully inside
 * the book); chapters keep the `inclusive` default (notes overlapping the
 * chapter) — mirroring the web query defaults.
 */
export function openNotesForRange(
  startVerseId: number,
  endVerseId: number,
  matching: PassageNotesPassageMatching = "inclusive"
): void {
  void notesActions.resetQuery({
    filterPassageStartVerseId: startVerseId,
    filterPassageEndVerseId: endVerseId,
    filterPassageMatching: matching,
  });
  router.push("/(tabs)/notes");
}
