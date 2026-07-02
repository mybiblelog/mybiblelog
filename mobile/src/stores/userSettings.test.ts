const DEFAULTS = {
  lookBackDate: '2020-01-01',
  dailyVerseCountGoal: 86,
  preferredBibleVersion: 'ESV',
  preferredBibleApp: '',
};

jest.mock('@/src/settings/userSettingsStorage', () => ({
  DEFAULT_LOCAL_USER_SETTINGS: DEFAULTS,
  loadLocalUserSettings: jest.fn(),
  saveLocalUserSettings: jest.fn(),
}));
jest.mock('@/src/api/settingsApi', () => ({
  getSettings: jest.fn(),
  updateSettings: jest.fn(),
}));
jest.mock('@/src/stores/auth', () => ({
  getAuthToken: jest.fn(() => 'tok'),
  useAuthStore: {
    getState: jest.fn(() => ({ state: { status: 'authenticated' } })),
    subscribe: jest.fn(),
  },
}));
jest.mock('@/src/stores/connectivity', () => ({
  getIsOnline: jest.fn(() => true),
  useConnectivityStore: { subscribe: jest.fn() },
}));

import { saveLocalUserSettings } from '@/src/settings/userSettingsStorage';
import { getSettings, updateSettings } from '@/src/api/settingsApi';
import { getIsOnline } from '@/src/stores/connectivity';
import { useUserSettingsStore } from './userSettings';

const actions = () => useUserSettingsStore.getState();

function setReady(settings = DEFAULTS) {
  useUserSettingsStore.setState({
    state: { status: 'ready', settings, isRefreshingFromServer: false },
  });
}

beforeEach(() => {
  (getIsOnline as jest.Mock).mockReturnValue(true);
  setReady();
});

describe('setLocalSettings', () => {
  it('merges and persists the partial update', async () => {
    await actions().setLocalSettings({ preferredBibleApp: 'youversion' });
    const state = useUserSettingsStore.getState().state;
    expect(state.status === 'ready' && state.settings.preferredBibleApp).toBe('youversion');
    expect(saveLocalUserSettings).toHaveBeenCalledWith(
      expect.objectContaining({ preferredBibleApp: 'youversion' }),
    );
  });
});

describe('refreshFromServer', () => {
  it('applies server truth and persists when values differ', async () => {
    (getSettings as jest.Mock).mockResolvedValue({ dailyVerseCountGoal: 100 });
    await actions().refreshFromServer();
    const state = useUserSettingsStore.getState().state;
    expect(state.status === 'ready' && state.settings.dailyVerseCountGoal).toBe(100);
    expect(saveLocalUserSettings).toHaveBeenCalled();
  });

  it('does not persist when server values match local settings', async () => {
    (getSettings as jest.Mock).mockResolvedValue({ dailyVerseCountGoal: 86 });
    await actions().refreshFromServer();
    expect(saveLocalUserSettings).not.toHaveBeenCalled();
  });

  it('is a no-op when offline', async () => {
    (getIsOnline as jest.Mock).mockReturnValue(false);
    await actions().refreshFromServer();
    expect(getSettings).not.toHaveBeenCalled();
  });
});

describe('updateServerSettings', () => {
  it('returns true and applies the server response on success', async () => {
    (updateSettings as jest.Mock).mockResolvedValue({ dailyVerseCountGoal: 42 });
    const ok = await actions().updateServerSettings({ dailyVerseCountGoal: 42 });
    expect(ok).toBe(true);
    const state = useUserSettingsStore.getState().state;
    expect(state.status === 'ready' && state.settings.dailyVerseCountGoal).toBe(42);
  });

  it('returns false when offline without calling the API', async () => {
    (getIsOnline as jest.Mock).mockReturnValue(false);
    const ok = await actions().updateServerSettings({ dailyVerseCountGoal: 42 });
    expect(ok).toBe(false);
    expect(updateSettings).not.toHaveBeenCalled();
  });

  it('returns false when the API call throws', async () => {
    (updateSettings as jest.Mock).mockRejectedValue(new Error('500'));
    const ok = await actions().updateServerSettings({ dailyVerseCountGoal: 42 });
    expect(ok).toBe(false);
  });
});
