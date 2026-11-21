import { Bible } from '@mybiblelog/shared';
import { encodePassageNotesQueryToRoute } from '~/helpers/passage-notes-route-query';
import { useDialogStore } from '~/stores/dialog';
import { useLogEntriesStore } from '~/stores/log-entries';
import { useLogEntryEditorStore } from '~/stores/log-entry-editor';
import { usePassageNoteEditorStore } from '~/stores/passage-note-editor';
import { useToastStore } from '~/stores/toast';
import { useUserSettingsStore } from '~/stores/user-settings';

type IdLike = number | string;

type LogEntryLike = { id: IdLike; startVerseId: number; endVerseId: number };

export type LogEntryAction = { label: string; callback: () => void };

/**
 * Builds the shared action menu for a log entry (Open Bible / Continue Reading /
 * Take Note / View Notes / Edit / Delete), used by the log, today, and calendar
 * pages.
 *
 * `t` is the caller's own `useI18n().t`, so the action labels and the
 * `deleteMessageKeys` resolve against that page's message block.
 */
export function useLogEntryActions(
  t: (key: string) => string,
  options: {
    continueReading: boolean;
    deleteMessageKeys: { confirm: string; failed: string };
  },
) {
  const router = useRouter();
  const localePath = useLocalePath();
  const { openPassageInBible } = useOpenInBible();
  const userSettingsStore = useUserSettingsStore();
  const logEntriesStore = useLogEntriesStore();
  const logEntryEditorStore = useLogEntryEditorStore();
  const passageNoteEditorStore = usePassageNoteEditorStore();
  const dialogStore = useDialogStore();
  const toastStore = useToastStore();

  function nextReadingVerseId(entry: LogEntryLike) {
    return Bible.getNextReadingVerseId(entry.endVerseId, userSettingsStore.settings.includeDeuterocanonical);
  }

  function continueReading(nextVerseId: number) {
    const { book, chapter } = Bible.parseVerseId(nextVerseId);
    openPassageInBible({
      startVerseId: nextVerseId,
      endVerseId: Bible.getLastBookChapterVerseId(book, chapter),
    });
  }

  function takeNote({ startVerseId, endVerseId }: LogEntryLike) {
    passageNoteEditorStore.openEditor({ passages: [{ startVerseId, endVerseId }], content: '' });
  }

  function viewNotes({ startVerseId, endVerseId }: LogEntryLike) {
    const query = encodePassageNotesQueryToRoute({
      filterPassageStartVerseId: startVerseId,
      filterPassageEndVerseId: endVerseId,
      offset: 0,
    });
    router.push({ path: localePath('notes'), query: query as Record<string, string | string[]> });
  }

  function edit(id: IdLike) {
    const entry = logEntriesStore.logEntries.find(e => e.id === id);
    if (!entry) { return; }
    const { date, startVerseId, endVerseId } = entry;
    logEntryEditorStore.openEditor({ id, date, startVerseId, endVerseId });
  }

  async function remove(id: IdLike) {
    const confirmed = await dialogStore.confirm({
      message: t(options.deleteMessageKeys.confirm),
      confirmButtonType: 'danger',
    });
    if (!confirmed) { return; }
    const success = await logEntriesStore.deleteLogEntry(id);
    if (!success) {
      toastStore.add({ type: 'error', text: t(options.deleteMessageKeys.failed) });
    }
  }

  function actionsForLogEntry(entry: LogEntryLike): LogEntryAction[] {
    const nextVerseId = options.continueReading ? nextReadingVerseId(entry) : null;
    return [
      { label: t('open_bible'), callback: () => openPassageInBible(entry) },
      ...(nextVerseId
        ? [{ label: t('continue_reading'), callback: () => continueReading(nextVerseId) }]
        : []),
      { label: t('take_note'), callback: () => takeNote(entry) },
      { label: t('view_notes'), callback: () => viewNotes(entry) },
      { label: t('edit'), callback: () => edit(entry.id) },
      { label: t('delete'), callback: () => remove(entry.id) },
    ];
  }

  return { actionsForLogEntry };
}
