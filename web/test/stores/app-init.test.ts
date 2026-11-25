import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAppInitStore } from '~/stores/app-init';
import { useLogEntriesStore } from '~/stores/log-entries';
import { useUserSettingsStore } from '~/stores/user-settings';
import { usePassageNoteTagsStore } from '~/stores/passage-note-tags';
import { usePassageNotesStore } from '~/stores/passage-notes';
import { useDateVerseCountsStore } from '~/stores/date-verse-counts';
import { useReadingSuggestionsStore } from '~/stores/reading-suggestions';

beforeEach(() => setActivePinia(createPinia()));

describe('app-init store', () => {
  it('loads settings before kicking off log entries and passage note tags in parallel', async () => {
    const order: string[] = [];
    const logEntries = useLogEntriesStore();
    const userSettings = useUserSettingsStore();
    const passageNoteTags = usePassageNoteTagsStore();
    vi.spyOn(userSettings, 'loadSettings').mockImplementation(async () => {
      order.push('settings:start');
      await Promise.resolve();
      order.push('settings:end');
    });
    vi.spyOn(logEntries, 'loadLogEntries').mockImplementation(() => {
      order.push('logEntries:start');
      return Promise.resolve([]);
    });
    vi.spyOn(passageNoteTags, 'loadPassageNoteTags').mockImplementation(() => {
      order.push('passageNoteTags:start');
      return Promise.resolve();
    });

    await useAppInitStore().loadUserData();

    expect(userSettings.loadSettings).toHaveBeenCalledTimes(1);
    expect(logEntries.loadLogEntries).toHaveBeenCalledTimes(1);
    expect(passageNoteTags.loadPassageNoteTags).toHaveBeenCalledTimes(1);
    // settings must fully resolve before the other two start, since
    // loadPassageNoteTags reads the settings-derived sort order synchronously
    expect(order).toEqual(['settings:start', 'settings:end', 'logEntries:start', 'passageNoteTags:start']);
  });

  it('resetUserData clears every store holding per-user data', () => {
    const logEntries = useLogEntriesStore();
    const userSettings = useUserSettingsStore();
    const passageNoteTags = usePassageNoteTagsStore();
    const passageNotes = usePassageNotesStore();
    const dateVerseCounts = useDateVerseCountsStore();
    const readingSuggestions = useReadingSuggestionsStore();

    logEntries.$patch({ logEntries: [{ id: 1 }] as never, isLoaded: true });
    userSettings.$patch({ isLoaded: true });
    userSettings.settings.lookBackDate = '2026-01-01';
    passageNoteTags.$patch({ passageNoteTags: [{ id: 1 }] as never, isLoaded: true });
    passageNotes.$patch({ passageNotes: [{ id: 1 }] as never, hasLoadedOnce: true });
    dateVerseCounts.$patch({ dateVerseCounts: { '2020-01-01': { total: 1, unique: 1 } } });
    readingSuggestions.$patch({ passages: [{}] as never });

    useAppInitStore().resetUserData();

    expect(logEntries.logEntries).toEqual([]);
    expect(logEntries.isLoaded).toBe(false);
    expect(userSettings.isLoaded).toBe(false);
    expect(userSettings.settings.lookBackDate).toBe('');
    expect(passageNoteTags.passageNoteTags).toEqual([]);
    expect(passageNoteTags.isLoaded).toBe(false);
    expect(passageNotes.passageNotes).toEqual([]);
    expect(passageNotes.hasLoadedOnce).toBe(false);
    expect(dateVerseCounts.dateVerseCounts).toEqual({});
    expect(readingSuggestions.passages).toEqual([]);
  });
});
