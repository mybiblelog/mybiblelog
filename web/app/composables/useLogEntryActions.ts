import { Bible } from '@mybiblelog/shared';
import { useUserSettingsStore } from '~/stores/user-settings';

type IdLike = number | string;

type LogEntryLike = { id: IdLike; endVerseId: number };

export type LogEntryAction = { label: string; callback: () => void };

/**
 * Builds the shared action menu for a log entry (Open Bible / Continue Reading /
 * Take Note / View Notes / Edit / Delete), used by the log, today, and calendar
 * pages, which previously each hand-rolled it and had drifted apart.
 *
 * `t` is the caller's own `useI18n().t` so the labels resolve against that
 * page's message block. Pass a `continueReading` handler to include the
 * "Continue Reading" action when the entry has a following verse; omit it to
 * leave that action out entirely (the log page has no such flow).
 */
export function useLogEntryActions<E extends LogEntryLike>(
  t: (key: string) => string,
  handlers: {
    openInBible: (entry: E) => void;
    takeNote: (entry: E) => void;
    viewNotes: (entry: E) => void;
    edit: (id: IdLike) => void;
    remove: (id: IdLike) => void;
    continueReading?: (entry: E) => void;
  },
) {
  const userSettingsStore = useUserSettingsStore();

  function actionsForLogEntry(entry: E): LogEntryAction[] {
    const nextVerseId = Bible.getNextReadingVerseId(entry.endVerseId, userSettingsStore.settings.includeDeuterocanonical);
    const canContinue = Boolean(handlers.continueReading) && Boolean(nextVerseId);
    return [
      { label: t('open_bible'), callback: () => handlers.openInBible(entry) },
      ...(canContinue
        ? [{ label: t('continue_reading'), callback: () => handlers.continueReading!(entry) }]
        : []),
      { label: t('take_note'), callback: () => handlers.takeNote(entry) },
      { label: t('view_notes'), callback: () => handlers.viewNotes(entry) },
      { label: t('edit'), callback: () => handlers.edit(entry.id) },
      { label: t('delete'), callback: () => handlers.remove(entry.id) },
    ];
  }

  return { actionsForLogEntry };
}
