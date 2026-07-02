import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_LOCAL_USER_SETTINGS,
  loadLocalUserSettings,
  saveLocalUserSettings,
  type LocalUserSettings,
} from './userSettingsStorage';

const STORAGE_KEY = 'userSettings.v1';

const valid: LocalUserSettings = {
  lookBackDate: '2020-01-01',
  dailyVerseCountGoal: 50,
  preferredBibleVersion: 'ESV',
  preferredBibleApp: 'youversion',
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('loadLocalUserSettings', () => {
  it('returns defaults when nothing is stored', async () => {
    expect(await loadLocalUserSettings()).toEqual(DEFAULT_LOCAL_USER_SETTINGS);
  });

  it('round-trips valid settings', async () => {
    await saveLocalUserSettings(valid);
    expect(await loadLocalUserSettings()).toEqual(valid);
  });

  it('falls back to defaults when stored data is the wrong shape', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...valid, dailyVerseCountGoal: 'not a number' }),
    );
    expect(await loadLocalUserSettings()).toEqual(DEFAULT_LOCAL_USER_SETTINGS);
  });

  it('falls back to defaults when stored JSON is corrupt', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, '{ not valid json');
    expect(await loadLocalUserSettings()).toEqual(DEFAULT_LOCAL_USER_SETTINGS);
  });
});
