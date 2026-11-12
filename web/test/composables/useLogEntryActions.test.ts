import { beforeEach, describe, it, expect, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { Bible } from '@mybiblelog/shared';
import { useLogEntryActions } from '~/composables/useLogEntryActions';
import { useUserSettingsStore } from '~/stores/user-settings';

const t = (key: string) => key;

type Entry = { id: number; startVerseId: number; endVerseId: number };

const midEntry: Entry = {
  id: 1,
  startVerseId: Bible.makeVerseId(1, 1, 1),
  endVerseId: Bible.makeVerseId(1, 1, 5),
};

const makeHandlers = () => ({
  openInBible: vi.fn(),
  takeNote: vi.fn(),
  viewNotes: vi.fn(),
  edit: vi.fn(),
  remove: vi.fn(),
  continueReading: vi.fn(),
});

describe('useLogEntryActions', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('omits continue_reading when no handler is provided (log page)', () => {
    const handlers = makeHandlers();
    const { actionsForLogEntry } = useLogEntryActions<Entry>(t, {
      openInBible: handlers.openInBible,
      takeNote: handlers.takeNote,
      viewNotes: handlers.viewNotes,
      edit: handlers.edit,
      remove: handlers.remove,
    });
    const labels = actionsForLogEntry(midEntry).map(a => a.label);
    expect(labels).toEqual(['open_bible', 'take_note', 'view_notes', 'edit', 'delete']);
  });

  it('includes continue_reading and view_notes when a next verse exists', () => {
    const handlers = makeHandlers();
    const { actionsForLogEntry } = useLogEntryActions<Entry>(t, handlers);
    const labels = actionsForLogEntry(midEntry).map(a => a.label);
    expect(labels).toEqual(['open_bible', 'continue_reading', 'take_note', 'view_notes', 'edit', 'delete']);
  });

  it('drops continue_reading at the very last verse of the Bible', () => {
    const handlers = makeHandlers();
    const lastVerseId = Bible.getLastBookChapterVerseId(66, 22);
    const lastEntry: Entry = { id: 2, startVerseId: lastVerseId, endVerseId: lastVerseId };
    const { actionsForLogEntry } = useLogEntryActions<Entry>(t, handlers);
    const labels = actionsForLogEntry(lastEntry).map(a => a.label);
    expect(labels).not.toContain('continue_reading');
  });

  it('continues from the end of a deuterocanonical book when they are included', () => {
    const lastTobitVerseId = Bible.getLastBookVerseId(67);
    const tobitEntry: Entry = { id: 3, startVerseId: lastTobitVerseId, endVerseId: lastTobitVerseId };
    useUserSettingsStore().settings.includeDeuterocanonical = true;
    const { actionsForLogEntry } = useLogEntryActions<Entry>(t, makeHandlers());
    expect(actionsForLogEntry(tobitEntry).map(a => a.label)).toContain('continue_reading');
  });

  it('wires callbacks to the matching handlers', () => {
    const handlers = makeHandlers();
    const { actionsForLogEntry } = useLogEntryActions<Entry>(t, handlers);
    const byLabel = Object.fromEntries(actionsForLogEntry(midEntry).map(a => [a.label, a.callback]));
    byLabel.view_notes!();
    byLabel.delete!();
    expect(handlers.viewNotes).toHaveBeenCalledWith(midEntry);
    expect(handlers.remove).toHaveBeenCalledWith(midEntry.id);
  });
});
