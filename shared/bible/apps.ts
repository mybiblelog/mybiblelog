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

/*
 * The reader's version usually has no deuterocanonical books (NASB, NIV, ESV...),
 * so deuterocanonical passages open in a fixed edition that has all of them.
 * Blue Letter Bible has no deuterocanonical pages, and Olive Tree's book numbers
 * for them aren't known, so those apps fall back to Bible Gateway.
 *
 * Additions to Esther is modelled as additions A-F (chapters 1-6); the other
 * editions number it differently, hence the per-addition chapter maps.
 */
const DC_BIBLE_COM_VERSION = { id: 546, code: 'KJVAAE' };
const DC_BIBLE_GATEWAY_VERSION = 'NRSVA';
const DC_LOGOS_VERSION = 'NRSV';

// KJVAAE chapter codes: Esther additions sit in KJV chapters 10-16 (codes 1_1-7_1),
// and Sirach 1 / Susanna use a "_n" code because of a prologue/intro chapter.
const KJVAAE_ESTHER_ADDITION_CHAPTERS = ['2_1', '4_1', '4_1', '6_1', '7_1', '1_1'];
const KJVAAE_CHAPTER_CODES: Record<string, Record<number, string>> = {
  SIR: { 1: '1_2' },
  SUS: { 1: '1_1' },
};
// The Greek Esther chapter each addition A-F is printed in. The NRSV editions
// disagree on C and D: NRSVA prints them in chapter 4, NRSVue (what ref.ly
// resolves NRSV to) in chapter 5.
const NRSVA_GREEK_ESTHER_ADDITION_CHAPTERS = [1, 3, 4, 4, 8, 10];
const NRSVUE_GREEK_ESTHER_ADDITION_CHAPTERS = [1, 3, 5, 5, 8, 10];

const getDeuterocanonicalYouVersionChapter = (bookIndex: number, chapterIndex: number): string => {
  const usfm = Bible.getBookUsfmCode(bookIndex);
  if (usfm === 'ESG') {
    return KJVAAE_ESTHER_ADDITION_CHAPTERS[chapterIndex - 1] ?? '1_1';
  }
  return KJVAAE_CHAPTER_CODES[usfm]?.[chapterIndex] ?? String(chapterIndex);
};

const getDeuterocanonicalReference = (
  bookIndex: number,
  chapterIndex: number,
  greekEstherChapters: number[],
): { book: string; chapter: number } => {
  const usfm = Bible.getBookUsfmCode(bookIndex);
  if (usfm === 'ESG') {
    return { book: 'Greek Esther', chapter: greekEstherChapters[chapterIndex - 1] ?? 1 };
  }
  if (usfm === 'BAR' && chapterIndex === 6) {
    return { book: 'Letter of Jeremiah', chapter: 1 };
  }
  return { book: Bible.getBookName(bookIndex, 'en'), chapter: chapterIndex };
};

const getDeuterocanonicalReadingUrl = (app: keyof typeof BibleApps, bookIndex: number, chapterIndex: number) => {
  const usfm = Bible.getBookUsfmCode(bookIndex);
  const { id, code } = DC_BIBLE_COM_VERSION;
  switch (app) {
  case BibleApps.YOUVERSIONAPP:
    return `youversion://bible?reference=${usfm}.${getDeuterocanonicalYouVersionChapter(bookIndex, chapterIndex)}.${code}`;
  case BibleApps.BIBLECOM:
    return `https://www.bible.com/bible/${id}/${usfm}.${getDeuterocanonicalYouVersionChapter(bookIndex, chapterIndex)}.${code}`;
  case BibleApps.LOGOS: {
    const { book, chapter } = getDeuterocanonicalReference(bookIndex, chapterIndex, NRSVUE_GREEK_ESTHER_ADDITION_CHAPTERS);
    // ref.ly resolves the single-chapter Letter of Jeremiah only without a chapter number.
    const reference = book === 'Letter of Jeremiah' ? book : `${book} ${chapter}`;
    return `https://ref.ly/${encodeURIComponent(reference)};${DC_LOGOS_VERSION}`;
  }
  default: {
    const { book, chapter } = getDeuterocanonicalReference(bookIndex, chapterIndex, NRSVA_GREEK_ESTHER_ADDITION_CHAPTERS);
    return encodeURI(`https://www.biblegateway.com/passage/?version=${DC_BIBLE_GATEWAY_VERSION}&search=${book} ${chapter}`);
  }
  }
};

export const getAppReadingUrl = (app: keyof typeof BibleApps, version: keyof typeof BibleVersions, bookIndex: number, chapterIndex: number) => {
  if (Bible.isDeuterocanonical(bookIndex)) {
    return getDeuterocanonicalReadingUrl(app, bookIndex, chapterIndex);
  }
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
