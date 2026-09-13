import { Bible } from "@mybiblelog/shared";
import type { PassageNote } from "@/src/api/notesApi";
import type { TranslationKey } from "@/src/i18n";
import type { SupportedLocale } from "@/src/i18n/LocaleProvider";

const CONTENT_PREVIEW_LENGTH = 30;

type TFunction = (key: TranslationKey, options?: Record<string, unknown>) => string;

/**
 * Bottom-sheet menu title for a note: names its passage when it has one
 * (falling back to just the first passage, plus an ellipsis, when it has
 * several), or previews its content when it has none. Returns `undefined`
 * for a note with neither passages nor content, since there's nothing to
 * name the sheet after.
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

  const trimmed = note.content.trim();
  if (!trimmed) return undefined;
  const content =
    trimmed.length > CONTENT_PREVIEW_LENGTH
      ? `${trimmed.slice(0, CONTENT_PREVIEW_LENGTH)}…`
      : trimmed;
  return t("note_menu_title_content", { content });
}
