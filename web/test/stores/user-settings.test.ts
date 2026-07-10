import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUserSettingsStore } from '~/stores/user-settings';

beforeEach(() => setActivePinia(createPinia()));

describe('user-settings store', () => {
  it('applySettingsUpdate only applies provided truthy fields', () => {
    const store = useUserSettingsStore();
    const before = { ...store.settings };
    store.applySettingsUpdate({ dailyVerseCountGoal: 25, startPage: 'today' });
    expect(store.settings.dailyVerseCountGoal).toBe(25);
    expect(store.settings.startPage).toBe('today');
    // Untouched fields keep their defaults.
    expect(store.settings.preferredBibleVersion).toBe(before.preferredBibleVersion);
  });

  it('updateSettings persists then applies and returns true on success', async () => {
    const patch = vi.fn().mockResolvedValue({ data: {} });
    vi.stubGlobal('useNuxtApp', () => ({ $http: { patch } }));
    const store = useUserSettingsStore();

    const ok = await store.updateSettings({ dailyVerseCountGoal: 40 });

    expect(ok).toBe(true);
    expect(patch).toHaveBeenCalledTimes(1);
    expect(store.settings.dailyVerseCountGoal).toBe(40);
  });

  it('updateSettings returns false and does not apply on failure', async () => {
    vi.stubGlobal('useNuxtApp', () => ({ $http: { patch: vi.fn().mockRejectedValue(new Error('boom')) } }));
    const store = useUserSettingsStore();

    const ok = await store.updateSettings({ dailyVerseCountGoal: 40 });

    expect(ok).toBe(false);
    expect(store.settings.dailyVerseCountGoal).toBe(0);
  });

  it('loadServerSettings applies whitelisted fields from the response', async () => {
    vi.stubGlobal('useNuxtApp', () => ({
      $http: { get: vi.fn().mockResolvedValue({ data: { dailyVerseCountGoal: 12, startPage: 'calendar', bogus: 'ignored' } }) },
    }));
    const store = useUserSettingsStore();

    await store.loadServerSettings();

    expect(store.settings.dailyVerseCountGoal).toBe(12);
    expect(store.settings.startPage).toBe('calendar');
    expect(store.isLoaded).toBe(true);
    expect((store.settings as Record<string, unknown>).bogus).toBeUndefined();
  });

  it('getReadingUrl returns a reading url string for a chapter', () => {
    const store = useUserSettingsStore();
    const url = store.getReadingUrl(1, 1);
    expect(typeof url).toBe('string');
    expect(url.length).toBeGreaterThan(0);
  });
});
