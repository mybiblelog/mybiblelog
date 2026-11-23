import { beforeEach, describe, it, expect, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { Bible } from '@mybiblelog/shared';
import { useLogEntryActions } from '~/composables/useLogEntryActions';
import { useDialogStore } from '~/stores/dialog';
import { useLogEntriesStore } from '~/stores/log-entries';
import { useLogEntryEditorStore } from '~/stores/log-entry-editor';
import { usePassageNoteEditorStore } from '~/stores/passage-note-editor';
import { useToastStore } from '~/stores/toast';
import { useUserSettingsStore } from '~/stores/user-settings';

const t = (key: string) => key;

const deleteMessageKeys = { confirm: 'confirm_delete', failed: 'delete_failed' };

const midEntry = {
  id: 1,
  date: '2026-01-01',
  startVerseId: Bible.makeVerseId(1, 1, 1),
  endVerseId: Bible.makeVerseId(1, 1, 5),
};

function callbacksFor(entry: typeof midEntry, continueReading = true) {
  const { actionsForLogEntry } = useLogEntryActions(t, { continueReading, deleteMessageKeys });
  return Object.fromEntries(actionsForLogEntry(entry).map(a => [a.label, a.callback]));
}

describe('useLogEntryActions', () => {
  let openPassageInBible: ReturnType<typeof vi.fn>;
  let push: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setActivePinia(createPinia());
    openPassageInBible = vi.fn();
    push = vi.fn();
    vi.stubGlobal('useOpenInBible', () => ({ openPassageInBible, openChapterInBible: vi.fn() }));
    vi.stubGlobal('useRouter', () => ({ push, replace: vi.fn(), back: vi.fn() }));
  });

  it('omits continue_reading when disabled', () => {
    expect(Object.keys(callbacksFor(midEntry, false)))
      .toEqual(['open_bible', 'take_note', 'view_notes', 'edit', 'delete']);
  });

  it('includes continue_reading when enabled and a next verse exists', () => {
    expect(Object.keys(callbacksFor(midEntry)))
      .toEqual(['open_bible', 'continue_reading', 'take_note', 'view_notes', 'edit', 'delete']);
  });

  it('drops continue_reading at the very last verse of the Bible', () => {
    const lastVerseId = Bible.getLastBookChapterVerseId(66, 22);
    const lastEntry = { ...midEntry, startVerseId: lastVerseId, endVerseId: lastVerseId };
    expect(Object.keys(callbacksFor(lastEntry))).not.toContain('continue_reading');
  });

  it('continues from the end of a deuterocanonical book when they are included', () => {
    const lastTobitVerseId = Bible.getLastBookVerseId(67);
    const tobitEntry = { ...midEntry, startVerseId: lastTobitVerseId, endVerseId: lastTobitVerseId };
    useUserSettingsStore().settings.includeDeuterocanonical = true;
    expect(Object.keys(callbacksFor(tobitEntry))).toContain('continue_reading');
  });

  it('continue_reading opens the rest of the chapter after the entry', () => {
    callbacksFor(midEntry).continue_reading!();
    expect(openPassageInBible).toHaveBeenCalledWith({
      startVerseId: Bible.makeVerseId(1, 1, 6),
      endVerseId: Bible.getLastBookChapterVerseId(1, 1),
    });
  });

  it('take_note opens the note editor on the entry passage', () => {
    const editor = usePassageNoteEditorStore();
    const openEditor = vi.spyOn(editor, 'openEditor').mockImplementation(() => {});
    callbacksFor(midEntry).take_note!();
    expect(openEditor).toHaveBeenCalledWith({
      passages: [{ startVerseId: midEntry.startVerseId, endVerseId: midEntry.endVerseId }],
      content: '',
    });
  });

  it('view_notes navigates to notes filtered by the entry passage', () => {
    callbacksFor(midEntry).view_notes!();
    expect(push).toHaveBeenCalledWith(expect.objectContaining({ path: '/notes' }));
  });

  it('edit opens the log entry editor with the stored entry', () => {
    useLogEntriesStore().logEntries = [midEntry] as never;
    const openEditor = vi.spyOn(useLogEntryEditorStore(), 'openEditor').mockImplementation(() => {});
    callbacksFor(midEntry).edit!();
    expect(openEditor).toHaveBeenCalledWith({
      id: midEntry.id,
      date: midEntry.date,
      startVerseId: midEntry.startVerseId,
      endVerseId: midEntry.endVerseId,
    });
  });

  it('delete confirms, then toasts the failure message when deletion fails', async () => {
    const confirm = vi.spyOn(useDialogStore(), 'confirm').mockResolvedValue(true);
    vi.spyOn(useLogEntriesStore(), 'deleteLogEntry').mockResolvedValue(false);
    const add = vi.spyOn(useToastStore(), 'add');
    await callbacksFor(midEntry).delete!();
    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ message: 'confirm_delete' }));
    expect(add).toHaveBeenCalledWith({ type: 'error', text: 'delete_failed' });
  });

  it('delete does nothing when the user cancels', async () => {
    vi.spyOn(useDialogStore(), 'confirm').mockResolvedValue(false);
    const deleteLogEntry = vi.spyOn(useLogEntriesStore(), 'deleteLogEntry');
    await callbacksFor(midEntry).delete!();
    expect(deleteLogEntry).not.toHaveBeenCalled();
  });
});
