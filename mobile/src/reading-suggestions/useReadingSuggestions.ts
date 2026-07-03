import {
  Bible,
  displayDaysSince,
  getReadingSuggestions,
  type ReadingSuggestionContext,
} from "@mybiblelog/shared";
import { useMemo } from "react";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";
import type { StoredLogEntry } from "@/src/storage/logEntries";

export type DisplayReadingSuggestion = {
  startVerseId: number;
  endVerseId: number;
  /** Human-readable passage, e.g. "Genesis 2". */
  passageLabel: string;
  /** Why this passage is suggested, rendered in the user's locale. */
  contextMessage: string;
  /** Verses in the suggestion the user has not yet read. */
  newVerseCount: number;
};

const capitalize = (word: string): string => word.charAt(0).toUpperCase() + word.slice(1);

/**
 * Reading suggestions for the Today screen (web `reading-suggestions` store
 * equivalent). Pure derivation of the log entries — the shared algorithm
 * returns structured context which is mapped to display strings here.
 *
 * @param entries the user's log entries (pass the full list; entries outside
 *   the look-back window are the caller's concern, matching web
 *   `currentLogEntries` which is already scoped)
 * @param today 'YYYY-MM-DD'
 */
export function useReadingSuggestions(
  entries: StoredLogEntry[],
  today: string
): DisplayReadingSuggestion[] {
  const t = useT();
  const { locale } = useLocale();

  return useMemo(() => {
    const displayContext = (context: ReadingSuggestionContext): string => {
      if (context.kind === "continue") {
        const message = t("reading_suggestion_date_you_read_passage", {
          display_date: displayDaysSince(context.lastRead.date, locale),
          passage: Bible.displayVerseRange(
            context.lastRead.startVerseId,
            context.lastRead.endVerseId,
            locale
          ),
        });
        return capitalize(message);
      }
      switch (context.path) {
        case "nt":
          return t("reading_suggestion_new_testament");
        case "ot":
          return t("reading_suggestion_old_testament");
        case "wisdom":
          return t("reading_suggestion_wisdom");
      }
    };

    const throughToday = entries.filter((e) => e.date <= today);
    const uniqueThroughToday = Bible.countUniqueRangeVerses(throughToday);

    return getReadingSuggestions(entries, today).map((suggestion) => ({
      startVerseId: suggestion.startVerseId,
      endVerseId: suggestion.endVerseId,
      passageLabel: Bible.displayVerseRange(suggestion.startVerseId, suggestion.endVerseId, locale),
      contextMessage: displayContext(suggestion.context),
      newVerseCount:
        Bible.countUniqueRangeVerses([...throughToday, suggestion]) - uniqueThroughToday,
    }));
  }, [entries, today, locale, t]);
}
