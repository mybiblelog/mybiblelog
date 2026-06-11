import Bible from './bible';
import { LocaleCode } from './i18n';
import { getMobileOperatingSystem, isMobileOperatingSystem } from './device';

/**
 * This is an enum of translations *internal* to My Bible Log.
 * They are not official codes used across apps.
 * However, these are based on the Bible.com / YouVersion codes.
 *
 * These values may need converted to a list of codes specific
 * to other Bible reading apps.
 */
export const BibleVersions = {
  AMP: 'AMP',
  KJV: 'KJV',
  NKJV: 'NKJV',
  NIV: 'NIV',
  ESV: 'ESV',
  NASB1995: 'NASB1995',
  NASB2020: 'NASB2020',
  NABRE: 'NABRE',
  NLT: 'NLT',
  TPT: 'TPT',
  MSG: 'MSG', // The Message
  RVR1960: 'RVR1960', // Reina Valera 1960 (Spanish)
  RVR2020: 'RVR2020', // Reina Valera 2020 (Spanish)
  UKR: 'UKR', // Ukrainian (any version available)
  BDS: 'BDS', // Bible du Semeur (French)
  LSG: 'LSG', // Louis Segond (French)
  ARC: 'ARC', // Almeida Revista e Corrigida (Portuguese)
  LUT: 'LUT', // Luther 1912 (German)
  KLB: 'KLB', // Korean Language Bible
  KRV: 'KRV', // Korean Revised Version (개역한글)
} as const;

export const defaultLocaleBibleVersions = {
  en: BibleVersions.NASB2020,
  de: BibleVersions.LUT,
  es: BibleVersions.RVR2020,
  fr: BibleVersions.LSG,
  ko: BibleVersions.KRV,
  pt: BibleVersions.ARC,
  uk: BibleVersions.UKR,
} as const satisfies Record<LocaleCode, typeof BibleVersions[keyof typeof BibleVersions]>;

type BibleVersionsType = {
  [Key in keyof typeof BibleVersions]: string | number;
};

const BlueLetterBibleVersions: BibleVersionsType = {
  [BibleVersions.AMP]: 'amp',
  [BibleVersions.KJV]: 'kjv',
  [BibleVersions.NKJV]: 'nkjv',
  [BibleVersions.NIV]: 'niv',
  [BibleVersions.ESV]: 'esv',
  [BibleVersions.NASB1995]: 'nasb95',
  [BibleVersions.NASB2020]: 'nasb20',
  [BibleVersions.NABRE]: 'nasb20', // NABRE not available -- fall back to NASB2020
  [BibleVersions.NLT]: 'nlt',
  [BibleVersions.TPT]: 'nlt', // Fall back to NLT on Blue Letter Bible
  [BibleVersions.MSG]: 'nlt', // Fall back to NLT on Blue Letter Bible
  [BibleVersions.RVR1960]: 'rvr60',
  [BibleVersions.RVR2020]: 'rvr60', // 2020 not available -- fall back to 1960
  [BibleVersions.UKR]: 'niv', // There is no Ukrainian version on Blue Letter Bible
  [BibleVersions.BDS]: 'ls', // There's no Bible du Semeur version on Blue Letter Bible
  [BibleVersions.LSG]: 'ls',
  [BibleVersions.ARC]: 'nasb20', // There is no ARC version on Blue Letter Bible
  [BibleVersions.LUT]: 'lut',
  [BibleVersions.KLB]: 'niv', // No Korean on Blue Letter Bible
  [BibleVersions.KRV]: 'niv', // No Korean on Blue Letter Bible
} as const;

const BibleGatewayVersions: BibleVersionsType = {
  [BibleVersions.AMP]: 'AMP',
  [BibleVersions.KJV]: 'KJV',
  [BibleVersions.NKJV]: 'NKJV',
  [BibleVersions.NIV]: 'NIV',
  [BibleVersions.ESV]: 'ESV',
  [BibleVersions.NASB1995]: 'NASB1995',
  [BibleVersions.NASB2020]: 'NASB',
  [BibleVersions.NABRE]: 'NABRE',
  [BibleVersions.NLT]: 'NLT',
  [BibleVersions.TPT]: 'MSG', // Bible Gateway doesn't support TPT, but The Message is similar
  [BibleVersions.MSG]: 'MSG',
  [BibleVersions.RVR1960]: 'RVR1960',
  [BibleVersions.RVR2020]: 'RVR1960', // 2020 not available -- fall back to 1960
  [BibleVersions.UKR]: 'UKR',
  [BibleVersions.BDS]: 'BDS',
  [BibleVersions.LSG]: 'LSG',
  [BibleVersions.ARC]: 'ARC',
  [BibleVersions.LUT]: 'LUTH1545',
  [BibleVersions.KLB]: 'KLB',
  [BibleVersions.KRV]: 'KLB', // Bible Gateway doesn't support KRV
} as const;

// The language code of each translation on Bible.com
const BibleComTranslationLanguages: BibleVersionsType = {
  [BibleVersions.AMP]: 1588,
  [BibleVersions.KJV]: 1,
  [BibleVersions.NKJV]: 114,
  [BibleVersions.NIV]: 111,
  [BibleVersions.ESV]: 59,
  [BibleVersions.NASB1995]: 100,
  [BibleVersions.NASB2020]: 2692,
  [BibleVersions.NABRE]: 463,
  [BibleVersions.NLT]: 116,
  [BibleVersions.TPT]: 1849,
  [BibleVersions.MSG]: 97,
  [BibleVersions.RVR1960]: 149,
  [BibleVersions.RVR2020]: 3425,
  [BibleVersions.UKR]: 188,
  [BibleVersions.BDS]: 21,
  [BibleVersions.LSG]: 93,
  [BibleVersions.ARC]: 212,
  [BibleVersions.LUT]: 51,
  [BibleVersions.KLB]: 86,
  [BibleVersions.KRV]: 88,
} as const;

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
  const languageCode = BibleComTranslationLanguages[version] || 1;
  const bookUsfmCode = Bible.getBookUsfmCode(bookIndex);
  const url = `https://www.bible.com/bible/${languageCode}/${bookUsfmCode}.${chapterIndex}.${version}`;
  return url;
};

const getBlueLetterBibleReadingURL = (version: keyof typeof BibleVersions, bookIndex: number, chapterIndex: number) => {
  // Example: https://www.blueletterbible.org/nasb20/1jo/3/1/s_1162001
  // Map version to Blue Letter Bible accepted values
  version = (BlueLetterBibleVersions[version] || BlueLetterBibleVersions[defaultBibleVersion]) as keyof typeof BibleVersions;
  // Get app-specific book code
  const bookCode = Bible.getBookBlbCode(bookIndex);
  const url = `https://www.blueletterbible.org/${version}/${bookCode}/${chapterIndex}/1`;
  return url;
};

const getBibleGatewayReadingURL = (version: keyof typeof BibleVersions, bookIndex: number, chapterIndex: number) => {
  // Example: https://www.biblegateway.com/passage/?search=John+3&version=NIV
  // Map version to Bible Gateway accepted values
  version = (BibleGatewayVersions[version] || BibleGatewayVersions[defaultBibleVersion]) as keyof typeof BibleVersions;
  const bookName = Bible.getBookName(bookIndex, 'en');
  const chapterReference = `${bookName} ${chapterIndex}`;
  const url = encodeURI(`https://www.biblegateway.com/passage/?version=${version}&search=${chapterReference}`);
  return url;
};

const getOliveTreeReadingUrl = (version: keyof typeof BibleVersions, bookIndex: number, chapterIndex: number) => {
  return `olivetree://bible/${bookIndex}.${chapterIndex}.1`;
};

export const BibleApps = {
  YOUVERSIONAPP: 'YOUVERSIONAPP',
  BIBLECOM: 'BIBLECOM',
  BLUELETTERBIBLE: 'BLUELETTERBIBLE',
  BIBLEGATEWAY: 'BIBLEGATEWAY',
  OLIVETREE: 'OLIVETREE',
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

/**
 * Gets the default Bible version to use if no user preference is available.
 */
export const getDefaultBibleVersion = () => {
  return BibleVersions.NASB2020;
};
