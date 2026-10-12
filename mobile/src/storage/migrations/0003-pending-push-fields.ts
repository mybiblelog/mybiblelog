import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Migration 0003 — replace the boolean "push settings on next sign-in" flag
 * with the list of fields the onboarding wizard actually staged.
 *
 * The v1 boolean made the push send every server-backed setting, including the
 * look-back date the wizard never asks about. That value was only the hydration
 * default (today), so a returning user who went through the wizard and then
 * signed in had their account's tracker start overwritten, and all prior
 * progress disappeared. A pending v1 flag can only have come from the wizard's
 * goal and Bible steps, so it carries over as exactly those two fields.
 *
 * Frozen in time: operates on raw keys only, never the typed accessors.
 * Idempotent — an existing v2 value is left alone, and an absent v1 is a no-op.
 */

const PENDING_PUSH_V1_KEY = "userSettings.pendingServerPush.v1";
const PENDING_PUSH_V2_KEY = "userSettings.pendingServerPush.v2";
const WIZARD_FIELDS = ["dailyVerseCountGoal", "preferredBibleVersion"];

export async function up(): Promise<void> {
  const v1 = await AsyncStorage.getItem(PENDING_PUSH_V1_KEY);
  if (v1 == null) return;

  if (v1 === "true" && (await AsyncStorage.getItem(PENDING_PUSH_V2_KEY)) == null) {
    await AsyncStorage.setItem(PENDING_PUSH_V2_KEY, JSON.stringify(WIZARD_FIELDS));
  }
  await AsyncStorage.removeItem(PENDING_PUSH_V1_KEY);
}
