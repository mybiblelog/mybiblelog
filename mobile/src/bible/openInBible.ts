import { Linking, Platform } from "react-native";
import { Bible, BibleApps, type BibleApps as BibleAppsType, getAppReadingUrl, getDefaultBibleVersion } from "@mybiblelog/shared";

export type OpenInBiblePrefs = {
  preferredBibleApp?: string;
  preferredBibleVersion?: string;
};

function defaultBibleAppForDevice(): keyof typeof BibleAppsType {
  // Prefer the native YouVersion deep link on Android (matches Nuxt intent).
  if (Platform.OS === "android") return BibleApps.YOUVERSIONAPP;
  return BibleApps.BIBLEGATEWAY;
}

function normalizeBibleApp(app?: string): keyof typeof BibleAppsType {
  if (!app) return defaultBibleAppForDevice();
  const values = Object.values(BibleApps);
  if (values.includes(app as any)) return app as any;
  return defaultBibleAppForDevice();
}

function normalizeBibleVersion(version?: string): any {
  // util expects one of the BibleVersions enum keys/values; fall back to default.
  return (version as any) || getDefaultBibleVersion();
}

export async function openPassageInBible(
  startVerseId: number,
  prefs: OpenInBiblePrefs
): Promise<boolean> {
  const start = Bible.parseVerseId(startVerseId);
  if (!start.book || !start.chapter) return false;

  const app = normalizeBibleApp(prefs.preferredBibleApp);
  const version = normalizeBibleVersion(prefs.preferredBibleVersion);

  const primaryUrl = getAppReadingUrl(app, version, start.book, start.chapter);

  // Fallback to web if a deep link fails.
  const fallbackApp =
    app === BibleApps.YOUVERSIONAPP ? BibleApps.BIBLECOM : BibleApps.BIBLEGATEWAY;
  const fallbackUrl = getAppReadingUrl(fallbackApp, version, start.book, start.chapter);

  try {
    await Linking.openURL(primaryUrl);
    return true;
  } catch {
    try {
      await Linking.openURL(fallbackUrl);
      return true;
    } catch {
      return false;
    }
  }
}

