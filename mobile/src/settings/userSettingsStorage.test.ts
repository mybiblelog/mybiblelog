import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import { appStorage } from "@/src/storage/keys";
import {
  DEFAULT_LOCAL_USER_SETTINGS,
  deriveDefaultSettings,
  readLocalUserSettings,
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

describe("readLocalUserSettings", () => {
  it("reports absent when nothing is stored", async () => {
    expect(await readLocalUserSettings()).toEqual({ status: "absent" });
  });

  it("round-trips valid settings", async () => {
    await saveLocalUserSettings(valid);
    expect(await readLocalUserSettings()).toEqual({ status: "ok", value: valid });
  });

  it("reports absent when stored data is the wrong shape", async () => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...valid, dailyVerseCountGoal: "not a number" })
    );
    expect(await readLocalUserSettings()).toEqual({ status: "absent" });
  });

  it("reports corrupt when stored JSON is unparseable", async () => {
    await AsyncStorage.setItem(STORAGE_KEY, "{ not valid json");
    expect(await readLocalUserSettings()).toEqual({ status: "corrupt" });
  });
});

describe("deriveDefaultSettings", () => {
  it("starts the tracker at the earliest logged entry", () => {
    const settings = deriveDefaultSettings([
      { date: "2024-03-10" },
      { date: "2023-11-02" },
      { date: "2024-01-01" },
    ]);
    expect(settings).toEqual({ ...DEFAULT_LOCAL_USER_SETTINGS, lookBackDate: "2023-11-02" });
  });

  it("starts the tracker today (local date) when nothing is logged", () => {
    expect(deriveDefaultSettings([]).lookBackDate).toBe(dayjs().format("YYYY-MM-DD"));
  });
});

/**
 * The worst version of this bug: the default look-back date is today, and
 * every progress surface filters entries on `date >= lookBackDate`. Persisting
 * the defaults over the real settings makes the user's whole history disappear
 * from the UI — and looks like a legitimate tracker reset rather than a bug.
 */
describe("a failed read never becomes a durable delete", () => {
  it("refuses to persist settings derived from a read that failed", async () => {
    await saveLocalUserSettings(valid);

    jest.spyOn(AsyncStorage, "getItem").mockRejectedValueOnce(new Error("disk error"));
    expect(await readLocalUserSettings()).toEqual({ status: "unreadable" });

    await saveLocalUserSettings(DEFAULT_LOCAL_USER_SETTINGS);
    expect(JSON.parse((await AsyncStorage.getItem(STORAGE_KEY))!)).toEqual(valid);
  });
});
