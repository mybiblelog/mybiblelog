import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAppInitStore } from '~/stores/app-init';
import { useLogEntriesStore } from '~/stores/log-entries';
import { useUserSettingsStore } from '~/stores/user-settings';

beforeEach(() => setActivePinia(createPinia()));

describe('app-init store', () => {
  it('loads log entries then user settings', async () => {
    const order: string[] = [];
    const logEntries = useLogEntriesStore();
    const userSettings = useUserSettingsStore();
    vi.spyOn(logEntries, 'loadLogEntries').mockImplementation(() => {
      order.push('logEntries');
      return Promise.resolve([]);
    });
    vi.spyOn(userSettings, 'loadSettings').mockImplementation(() => {
      order.push('settings');
      return Promise.resolve();
    });

    await useAppInitStore().loadUserData();

    expect(logEntries.loadLogEntries).toHaveBeenCalledTimes(1);
    expect(userSettings.loadSettings).toHaveBeenCalledTimes(1);
    expect(order).toEqual(['logEntries', 'settings']);
  });
});
