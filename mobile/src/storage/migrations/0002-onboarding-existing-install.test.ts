import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { up } from "./0002-onboarding-existing-install";

const ONBOARDING_KEY = "onboarding.v1";
const AUTH_SESSION_KEY = "auth.session.v1";
const USER_SETTINGS_KEY = "userSettings.v1";
const LOG_ENTRIES_KEY = "logEntries.v1";

async function readOnboarding(): Promise<{ completed: boolean } | null> {
  const raw = await AsyncStorage.getItem(ONBOARDING_KEY);
  return raw ? JSON.parse(raw) : null;
}

beforeEach(async () => {
  await AsyncStorage.clear();
  await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
});

describe("migration 0002 (onboarding existing-install backfill)", () => {
  it("marks onboarding complete when an auth session exists", async () => {
    await SecureStore.setItemAsync(AUTH_SESSION_KEY, JSON.stringify({ token: "t" }));
    await up();
    expect(await readOnboarding()).toEqual({ completed: true });
  });

  it("marks onboarding complete when settings were previously persisted", async () => {
    await AsyncStorage.setItem(USER_SETTINGS_KEY, JSON.stringify({ dailyVerseCountGoal: 40 }));
    await up();
    expect(await readOnboarding()).toEqual({ completed: true });
  });

  it("marks onboarding complete when a reading entry was logged", async () => {
    await AsyncStorage.setItem(LOG_ENTRIES_KEY, JSON.stringify([{ clientId: "c1" }]));
    await up();
    expect(await readOnboarding()).toEqual({ completed: true });
  });

  it("does not mark onboarding complete for an untouched fresh install", async () => {
    await up();
    expect(await readOnboarding()).toEqual({ completed: false });
  });

  it("treats an empty log entries array as no prior use", async () => {
    await AsyncStorage.setItem(LOG_ENTRIES_KEY, JSON.stringify([]));
    await up();
    expect(await readOnboarding()).toEqual({ completed: false });
  });

  it("is idempotent — does not overwrite an already-migrated value", async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify({ completed: false }));
    await SecureStore.setItemAsync(AUTH_SESSION_KEY, JSON.stringify({ token: "t" }));
    await up();
    expect(await readOnboarding()).toEqual({ completed: false });
  });
});
