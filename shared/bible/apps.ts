import Bible from './index';
import { bibleVersions, BibleVersions } from './translations';
import { getMobileOperatingSystem, isMobileOperatingSystem } from '../platform/device';

export {
  BibleVersions,
  isBibleVersionKey,
  defaultLocaleBibleVersions,
  bibleVersionNames,
  bibleVersionOptions,
  localeVersionGroups,
  getDefaultBibleVersion,
} from './translations';

const defaultBibleVersion: keyof typeof BibleVersions = BibleVersions.NASB2020;

const getYouVersionReadingURL = (version: keyof typeof BibleVersions, bookIndex: number, chapterIndex: number) => {
  // Map version to YouVersion accepted values
  version = BibleVersions[version] || defaultBibleVersion;
  const bookUsfmCode = Bible.getBookUsfmCode(bookIndex);
  const url = `youversion://bible?reference=${bookUsfmCode}.${chapterIndex}.${version}`;
  return url;
};

const getBibleComReadingURL = (version: keyof typeof BibleVersions, bookIndex: number, chapterIndex: number) => {
  // Example: https://www.bible.com/bible/1/GEN.1.KJV
  // Map version to Bible.com accepted values
  version = BibleVersions[version] || defaultBibleVersion;
  const versionId = bibleVersions[version]?.apps.bibleComVersionId ?? bibleVersions[defaultBibleVersion].apps.bibleComVersionId;
  const bookUsfmCode = Bible.getBookUsfmCode(bookIndex);
  const url = `https://www.bible.com/bible/${versionId}/${bookUsfmCode}.${chapterIndex}.${version}`;
  return url;
};

const getBlueLetterBibleReadingURL = (version: keyof typeof BibleVersions, bookIndex: number, chapterIndex: number) => {
  // Example: https://www.blueletterbible.org/nasb20/1jo/3/1/s_1162001
  // Map version to Blue Letter Bible accepted values
  const versionCode = bibleVersions[version]?.apps.blueLetterBible ?? bibleVersions[defaultBibleVersion].apps.blueLetterBible;
  // Get app-specific book code
  const bookCode = Bible.getBookBlbCode(bookIndex);
  const url = `https://www.blueletterbible.org/${versionCode}/${bookCode}/${chapterIndex}/1`;
  return url;
};

const getBibleGatewayReadingURL = (version: keyof typeof BibleVersions, bookIndex: number, chapterIndex: number) => {
  // Example: https://www.biblegateway.com/passage/?search=John+3&version=NIV
  // Map version to Bible Gateway accepted values
  const versionCode = bibleVersions[version]?.apps.bibleGateway ?? bibleVersions[defaultBibleVersion].apps.bibleGateway;
  const bookName = Bible.getBookName(bookIndex, 'en');
  const chapterReference = `${bookName} ${chapterIndex}`;
  const url = encodeURI(`https://www.biblegateway.com/passage/?version=${versionCode}&search=${chapterReference}`);
  return url;
};

const getOliveTreeReadingUrl = (version: keyof typeof BibleVersions, bookIndex: number, chapterIndex: number) => {
  return `olivetree://bible/${bookIndex}.${chapterIndex}.1`;
};

const getLogosReadingURL = (version: keyof typeof BibleVersions, bookIndex: number, chapterIndex: number) => {
  // Example: https://ref.ly/Romans%208;NIV
  // ref.ly is Logos's reference-link service; it redirects into the Logos web
  // app (app.logos.com), resolving the resource edition + Logos book number.
  const versionCode = bibleVersions[version]?.apps.logos ?? bibleVersions[defaultBibleVersion].apps.logos;
  const bookName = Bible.getBookName(bookIndex, 'en');
  // Full book name, space-separated from the chapter, URL-encoded.
  // e.g. "Song of Songs 2" -> "Song%20of%20Songs%202" (do NOT glue -- glued
  // multi-word names like "SongofSongs2" don't reliably resolve on ref.ly).
  const reference = encodeURIComponent(`${bookName} ${chapterIndex}`);
  return `https://ref.ly/${reference};${versionCode}`;
};

export const BibleApps = {
  YOUVERSIONAPP: 'YOUVERSIONAPP',
  BIBLECOM: 'BIBLECOM',
  BLUELETTERBIBLE: 'BLUELETTERBIBLE',
  BIBLEGATEWAY: 'BIBLEGATEWAY',
  OLIVETREE: 'OLIVETREE',
  LOGOS: 'LOGOS',
} as const;

export const getAppReadingUrl = (app: keyof typeof BibleApps, version: keyof typeof BibleVersions, bookIndex: number, chapterIndex: number) => {
  switch (app) {
  case BibleApps.YOUVERSIONAPP:
    return getYouVersionReadingURL(version, bookIndex, chapterIndex);
  case BibleApps.BIBLECOM:
    return getBibleComReadingURL(version, bookIndex, chapterIndex);
  case BibleApps.BLUELETTERBIBLE:
    return getBlueLetterBibleReadingURL(version, bookIndex, chapterIndex);
  case BibleApps.OLIVETREE:
    return getOliveTreeReadingUrl(version, bookIndex, chapterIndex);
  case BibleApps.LOGOS:
    return getLogosReadingURL(version, bookIndex, chapterIndex);
  case BibleApps.BIBLEGATEWAY:
  default:
    return getBibleGatewayReadingURL(version, bookIndex, chapterIndex);
  }
};

/**
 * Gets the default Bible app to use if no user preference is available.
 * This is based on whether the OS supports opening the YouVersion directly.
 */
export const getDefaultBibleApp = () => {
  if (isMobileOperatingSystem() && getMobileOperatingSystem() === 'Android') {
    return BibleApps.YOUVERSIONAPP;
  }
  return BibleApps.BIBLEGATEWAY;
};

export const bibleAppNames: Record<typeof BibleApps[keyof typeof BibleApps], string> = {
  [BibleApps.BIBLEGATEWAY]: 'Bible Gateway',
  [BibleApps.YOUVERSIONAPP]: 'YouVersion App',
  [BibleApps.BIBLECOM]: 'Bible.com (YouVersion)',
  [BibleApps.BLUELETTERBIBLE]: 'Blue Letter Bible',
  [BibleApps.OLIVETREE]: 'Olive Tree App',
  [BibleApps.LOGOS]: 'Logos',
};

export const bibleAppOptions = Object.entries(bibleAppNames).map(([value, text]) => ({ text, value }));
