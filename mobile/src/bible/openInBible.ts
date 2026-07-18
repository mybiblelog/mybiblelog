import { Linking, Platform } from "react-native";
import {
  Bible,
  BibleApps,
  type BibleApps as BibleAppsType,
  type BibleVersions,
  getAppReadingUrl,
  getDefaultBibleVersion,
  isBibleVersionKey,
} from "@mybiblelog/shared";
import { justOpenedActions } from "@/src/stores/justOpened";

export type OpenInBiblePrefs = {
  preferredBibleApp?: string;
  preferredBibleVersion?: string;
};

function defaultBibleAppForDevice(): keyof typeof BibleAppsType {
  // Prefer the native YouVersion deep link on Android (matches Nuxt intent).
  if (Platform.OS === "android") return BibleApps.YOUVERSIONAPP;
  return BibleApps.BIBLEGATEWAY;
}

function isBibleAppKey(s: string): s is keyof typeof BibleAppsType {
  return Object.prototype.hasOwnProperty.call(BibleApps, s);
}

function normalizeBibleApp(app?: string): keyof typeof BibleAppsType {
  if (app && isBibleAppKey(app)) return app;
  return defaultBibleAppForDevice();
}

function normalizeBibleVersion(version?: string): keyof typeof BibleVersions {
  // util expects one of the BibleVersions enum keys/values; fall back to default.
  if (version && isBibleVersionKey(version)) return version;
  return getDefaultBibleVersion();
}

/**
 * Opens the user's preferred Bible app/site to the passage's starting chapter,
 * then raises the "Just Opened" prompt (via the just-opened store) so the user
 * can log the reading when they return — mirroring web's `useOpenInBible`.
 * `endVerseId` is only carried into that prompt; the reading link itself always
 * targets the start chapter. Returns `false` (without prompting) if nothing
 * could be opened.
 */
export async function openPassageInBible(
  startVerseId: number,
  endVerseId: number,
  prefs: OpenInBiblePrefs
): Promise<boolean> {
  const start = Bible.parseVerseId(startVerseId);
  if (!start.book || !start.chapter) return false;

  const app = normalizeBibleApp(prefs.preferredBibleApp);
  const version = normalizeBibleVersion(prefs.preferredBibleVersion);

  const primaryUrl = getAppReadingUrl(app, version, start.book, start.chapter);

  // Fallback to web if a deep link fails.
  const fallbackApp = app === BibleApps.YOUVERSIONAPP ? BibleApps.BIBLECOM : BibleApps.BIBLEGATEWAY;
  const fallbackUrl = getAppReadingUrl(fallbackApp, version, start.book, start.chapter);

  try {
    await Linking.openURL(primaryUrl);
    justOpenedActions.openPrompt(startVerseId, endVerseId);
    return true;
  } catch {
    try {
      await Linking.openURL(fallbackUrl);
      justOpenedActions.openPrompt(startVerseId, endVerseId);
      return true;
    } catch {
      return false;
    }
  }
}
