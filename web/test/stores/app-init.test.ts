import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAppInitStore } from '~/stores/app-init';
import { useLogEntriesStore } from '~/stores/log-entries';
import { useUserSettingsStore } from '~/stores/user-settings';
import { usePassageNoteTagsStore } from '~/stores/passage-note-tags';
import { useReadingGoalsStore } from '~/stores/reading-goals';

beforeEach(() => setActivePinia(createPinia()));

describe('app-init store', () => {
  it('loads settings before kicking off log entries, passage note tags and reading goals in parallel', async () => {
    const order: string[] = [];
    const logEntries = useLogEntriesStore();
    const userSettings = useUserSettingsStore();
    const passageNoteTags = usePassageNoteTagsStore();
    const readingGoals = useReadingGoalsStore();
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
    vi.spyOn(readingGoals, 'loadReadingGoals').mockImplementation(() => {
      order.push('readingGoals:start');
      return Promise.resolve();
    });

    await useAppInitStore().loadUserData();

    expect(userSettings.loadSettings).toHaveBeenCalledTimes(1);
    expect(logEntries.loadLogEntries).toHaveBeenCalledTimes(1);
    expect(passageNoteTags.loadPassageNoteTags).toHaveBeenCalledTimes(1);
    expect(readingGoals.loadReadingGoals).toHaveBeenCalledTimes(1);
    // settings must fully resolve before the others start, since
    // loadPassageNoteTags reads the settings-derived sort order synchronously
    expect(order).toEqual(['settings:start', 'settings:end', 'logEntries:start', 'passageNoteTags:start', 'readingGoals:start']);
  });
});
