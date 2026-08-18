import AsyncStorage from "@react-native-async-storage/async-storage";
import { appStorage } from "@/src/storage/keys";
import {
  DEFAULT_LOCAL_USER_SETTINGS,
  loadLocalUserSettings,
  saveLocalUserSettings,
  type LocalUserSettings,
} from "./userSettingsStorage";

const STORAGE_KEY = "userSettings.v1";

const valid: LocalUserSettings = {
  lookBackDate: "2020-01-01",
  dailyVerseCountGoal: 50,
  preferredBibleVersion: "ESV",
  preferredBibleApp: "youversion",
};

beforeEach(async () => {
  appStorage.__resetForTest();
  await AsyncStorage.clear();
});

describe("loadLocalUserSettings", () => {
  it("returns defaults when nothing is stored", async () => {
    expect(await loadLocalUserSettings()).toEqual(DEFAULT_LOCAL_USER_SETTINGS);
  });

  it("round-trips valid settings", async () => {
    await saveLocalUserSettings(valid);
    expect(await loadLocalUserSettings()).toEqual(valid);
  });

  it("falls back to defaults when stored data is the wrong shape", async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...valid, dailyVerseCountGoal: "not a number" })
    );
    expect(await loadLocalUserSettings()).toEqual(DEFAULT_LOCAL_USER_SETTINGS);
  });

  it("falls back to defaults when stored JSON is corrupt", async () => {
    await AsyncStorage.setItem(STORAGE_KEY, "{ not valid json");
    expect(await loadLocalUserSettings()).toEqual(DEFAULT_LOCAL_USER_SETTINGS);
  });
});

/**
 * The worst version of this bug: `DEFAULT_LOCAL_USER_SETTINGS.lookBackDate` is
 * today's date, and every progress surface filters entries on `date >=
 * lookBackDate`. Persisting the defaults over the real settings makes the user's
 * whole history disappear from the UI — and looks like a legitimate tracker
 * reset rather than a bug.
 */
describe("a failed read never becomes a durable delete", () => {
  it("refuses to persist settings derived from a read that failed", async () => {
    await saveLocalUserSettings(valid);

    jest.spyOn(AsyncStorage, "getItem").mockRejectedValueOnce(new Error("disk error"));
    expect(await loadLocalUserSettings()).toEqual(DEFAULT_LOCAL_USER_SETTINGS);

    await saveLocalUserSettings(DEFAULT_LOCAL_USER_SETTINGS);
    expect(JSON.parse((await AsyncStorage.getItem(STORAGE_KEY))!)).toEqual(valid);
  });
});
