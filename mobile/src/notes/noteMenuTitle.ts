import { Bible } from "@mybiblelog/shared";
import type { PassageNote } from "@/src/api/notesApi";
import type { TranslationKey } from "@/src/i18n";
import { formatLongDate } from "@/src/i18n/date";
import type { SupportedLocale } from "@/src/i18n/LocaleProvider";

type TFunction = (key: TranslationKey, options?: Record<string, unknown>) => string;

/**
 * Bottom-sheet menu title for a note: names its passage when it has one
 * (falling back to just the first passage, plus an ellipsis, when it has
 * several), or names its created date when it has none. Returns `undefined`
 * for a note with neither passages nor a created date, since there's
 * nothing to name the sheet after.
 */
export function getNoteMenuTitle(
  note: PassageNote,
  t: TFunction,
  locale: SupportedLocale
): string | undefined {
  if (note.passages.length >= 1) {
    const passage = Bible.displayVerseRange(
      note.passages[0].startVerseId,
      note.passages[0].endVerseId,
      locale
    );
    return note.passages.length === 1
      ? t("note_menu_title_passage", { passage })
      : t("note_menu_title_passage_multiple", { passage });
  }

  if (!note.createdAt) return undefined;
  const date = formatLongDate(note.createdAt.slice(0, 10), locale);
  return t("note_menu_title_date", { date });
}
