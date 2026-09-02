import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

/**
 * Migration 0002 — backfill the onboarding-completed flag for installs that
 * predate the onboarding wizard.
 *
 * Without this, everyone who already has the app would see the wizard
 * unexpectedly on their next launch. Checks three raw signals of prior use —
 * an existing auth session, previously-persisted settings, or a logged
 * reading entry — and marks onboarding complete if any are present. A
 * genuinely fresh install (none of the three) is left incomplete so the
 * wizard shows.
 *
 * Frozen in time: operates on raw keys only, never the typed accessors
 * (`onboardingStorage.ts`, `userSettingsStorage.ts`, `storage/logEntries.ts`),
 * which will drift.
 */

const ONBOARDING_KEY = "onboarding.v1";
const AUTH_SESSION_KEY = "auth.session.v1";
const USER_SETTINGS_KEY = "userSettings.v1";
const LOG_ENTRIES_KEY = "logEntries.v1";

async function hasPriorUse(): Promise<boolean> {
  const [session, settings, entriesRaw] = await Promise.all([
    SecureStore.getItemAsync(AUTH_SESSION_KEY),
    AsyncStorage.getItem(USER_SETTINGS_KEY),
    AsyncStorage.getItem(LOG_ENTRIES_KEY),
  ]);
  if (session != null || settings != null) return true;

  if (entriesRaw != null) {
    try {
      const parsed: unknown = JSON.parse(entriesRaw);
      if (Array.isArray(parsed) && parsed.length > 0) return true;
    } catch {
      // Unparseable is not evidence of prior use either way; fall through.
    }
  }
  return false;
}

export async function up(): Promise<void> {
  const existing = await AsyncStorage.getItem(ONBOARDING_KEY);
  if (existing != null) return; // idempotent — already migrated

  const completed = await hasPriorUse();
  await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify({ completed }));
}
