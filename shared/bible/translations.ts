import type { LocaleCode } from '../platform/i18n';

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
  CSB: 'CSB', // Christian Standard Bible
  NET: 'NET', // NET Bible
  NRSV: 'NRSV', // New Revised Standard Version
  ASV: 'ASV', // American Standard Version (public domain)
  WEB: 'WEB', // World English Bible (public domain)
  GNT: 'GNT', // Good News Translation
  RVR1960: 'RVR1960', // Reina Valera 1960 (Spanish)
  RVR2020: 'RVR2020', // Reina Valera 2020 (Spanish)
  NVI: 'NVI', // Nueva Versión Internacional (Spanish)
  NTV: 'NTV', // Nueva Traducción Viviente (Spanish)
  LBLA: 'LBLA', // La Biblia de las Américas (Spanish)
  UKR: 'UKR', // Ukrainian (Ohienko translation)
  TURK: 'TURK', // Turkonyak translation (Ukrainian)
  BDS: 'BDS', // Bible du Semeur (French)
  LSG: 'LSG', // Louis Segond (French)
  S21: 'S21', // Segond 21 (French)
  NEG1979: 'NEG1979', // Nouvelle Édition de Genève (French)
  ARC: 'ARC', // Almeida Revista e Corrigida (Portuguese)
  NVIPT: 'NVIPT', // Nova Versão Internacional (Portuguese)
  ARA: 'ARA', // Almeida Revista e Atualizada (Portuguese)
  LUT: 'LUT', // Luther 1545 (German)
  ELB: 'ELB', // Elberfelder Bibel (German)
  HFA: 'HFA', // Hoffnung für alle (German)
  KLB: 'KLB', // Korean Living Bible
  KRV: 'KRV', // Korean Revised Version (개역한글)
  NKRV: 'NKRV', // 개역개정 -- the current standard Korean Protestant translation
} as const;

export const isBibleVersionKey = (s: string): s is keyof typeof BibleVersions =>
  Object.prototype.hasOwnProperty.call(BibleVersions, s);

export const defaultLocaleBibleVersions = {
  en: BibleVersions.NASB2020,
  de: BibleVersions.LUT,
  es: BibleVersions.RVR2020,
  fr: BibleVersions.LSG,
  ko: BibleVersions.KRV,
  pt: BibleVersions.ARC,
  uk: BibleVersions.UKR,
} as const satisfies Record<LocaleCode, typeof BibleVersions[keyof typeof BibleVersions]>;

/**
 * Fallback HelloAO translation id (see {@link BibleVersionDefinition.helloaoId})
 * for versions HelloAO has no matching text for.
 */
export const HELLOAO_DEFAULT_TRANSLATION_ID = 'BSB';

/*
 * Where to find each provider's own currently-supported-translations list,
 * for whoever adds the next entry to {@link bibleVersions} below:
 *
 * - YouVersion / Bible.com (apps: BIBLECOM, YOUVERSIONAPP): bible.com/versions
 *   lists all versions/languages; a version's own page shows the numeric
 *   version id used in this repo's deep links
 *   (bible.com/bible/{bibleComVersionId}/{BOOK}.{chapter}.{VERSION}).
 *   developers.youversion.com exposes the same catalog as an API to
 *   registered apps.
 * - Blue Letter Bible (app: BLUELETTERBIBLE): no public API -- the code is
 *   visible in the address bar when switching versions on any passage page
 *   at blueletterbible.org (e.g. /nasb20/, /kjv/).
 * - Bible Gateway (app: BIBLEGATEWAY, the default): biblegateway.com/versions/
 *   lists every version grouped by language together with the exact
 *   ?version= code used in passage URLs -- the canonical reference.
 * - Logos / ref.ly (app: LOGOS): no public list -- a resource's short code
 *   is shown on its info panel at logos.com when you search for it.
 *   Unrecognized codes degrade gracefully (the passage opens in the user's
 *   default Bible instead of erroring), so a wrong guess here is low-risk.
 * - Olive Tree (app: OLIVETREE): the olivetree:// URL scheme this repo uses
 *   doesn't take a version parameter (opens to book/chapter only), so no
 *   per-translation code applies.
 * - HelloAO (api/'s live scripture-text provider, not a reading app):
 *   bible.helloao.org/api/available_translations.json is the authoritative
 *   machine-readable list (id, name, language, license) of every
 *   translation it actually has text for -- check this before assuming a
 *   new translation will show real text instead of silently falling back
 *   to {@link HELLOAO_DEFAULT_TRANSLATION_ID}.
 */

export interface BibleVersionDefinition {
  /** Full display name, including the abbreviation, e.g. "New International Version (NIV)". */
  name: string;
  /** Which site locale this translation is grouped under. */
  locale: LocaleCode;
  /** HelloAO translation id used by api/ to fetch live chapter text. */
  helloaoId: string;
  apps: {
    /** Blue Letter Bible URL code. */
    blueLetterBible: string;
    /** Bible Gateway URL code. */
    bibleGateway: string;
    /** ref.ly / Logos resource code. */
    logos: string;
    /** Bible.com's per-translation numeric id (despite YouVersion calling it a "language" id, it differs per translation, not just per language). */
    bibleComVersionId: number;
  };
}

export const bibleVersions: Record<keyof typeof BibleVersions, BibleVersionDefinition> = {
  [BibleVersions.AMP]: {
    name: 'Amplified Bible (AMP)',
    locale: 'en',
    helloaoId: HELLOAO_DEFAULT_TRANSLATION_ID,
    apps: { blueLetterBible: 'amp', bibleGateway: 'AMP', logos: 'AMP', bibleComVersionId: 1588 },
  },
  [BibleVersions.KJV]: {
    name: 'King James Version (KJV)',
    locale: 'en',
    helloaoId: 'eng_cpb',
    apps: { blueLetterBible: 'kjv', bibleGateway: 'KJV', logos: 'KJV', bibleComVersionId: 1 },
  },
  [BibleVersions.NKJV]: {
    name: 'New King James Version (NKJV)',
    locale: 'en',
    helloaoId: HELLOAO_DEFAULT_TRANSLATION_ID,
    apps: { blueLetterBible: 'nkjv', bibleGateway: 'NKJV', logos: 'NKJV', bibleComVersionId: 114 },
  },
  [BibleVersions.NIV]: {
    name: 'New International Version (NIV)',
    locale: 'en',
    helloaoId: HELLOAO_DEFAULT_TRANSLATION_ID,
    apps: { blueLetterBible: 'niv', bibleGateway: 'NIV', logos: 'NIV', bibleComVersionId: 111 },
  },
  [BibleVersions.ESV]: {
    name: 'English Standard Version (ESV)',
    locale: 'en',
    helloaoId: HELLOAO_DEFAULT_TRANSLATION_ID,
    apps: { blueLetterBible: 'esv', bibleGateway: 'ESV', logos: 'ESV', bibleComVersionId: 59 },
  },
  [BibleVersions.NASB1995]: {
    name: 'New American Standard Bible 1995 (NASB 1995)',
    locale: 'en',
    helloaoId: HELLOAO_DEFAULT_TRANSLATION_ID,
    apps: { blueLetterBible: 'nasb95', bibleGateway: 'NASB1995', logos: 'NASB95', bibleComVersionId: 100 },
  },
  [BibleVersions.NASB2020]: {
    name: 'New American Standard Bible (NASB)',
    locale: 'en',
    helloaoId: HELLOAO_DEFAULT_TRANSLATION_ID,
    apps: { blueLetterBible: 'nasb20', bibleGateway: 'NASB', logos: 'NASB', bibleComVersionId: 2692 },
  },
  [BibleVersions.NABRE]: {
    name: 'New American Bible Revised Edition (NABRE)',
    locale: 'en',
    helloaoId: HELLOAO_DEFAULT_TRANSLATION_ID,
    // NABRE isn't on Blue Letter Bible -- fall back to NASB2020.
    apps: { blueLetterBible: 'nasb20', bibleGateway: 'NABRE', logos: 'NABRE', bibleComVersionId: 463 },
  },
  [BibleVersions.NLT]: {
    name: 'New Living Translation (NLT)',
    locale: 'en',
    helloaoId: HELLOAO_DEFAULT_TRANSLATION_ID,
    apps: { blueLetterBible: 'nlt', bibleGateway: 'NLT', logos: 'NLT', bibleComVersionId: 116 },
  },
  [BibleVersions.TPT]: {
    name: 'The Passion Translation (TPT)',
    locale: 'en',
    helloaoId: HELLOAO_DEFAULT_TRANSLATION_ID,
    // TPT isn't on Blue Letter Bible or Bible Gateway -- fall back to NLT/MSG.
    apps: { blueLetterBible: 'nlt', bibleGateway: 'MSG', logos: 'TPT', bibleComVersionId: 1849 },
  },
  [BibleVersions.MSG]: {
    name: 'The Message (MSG)',
    locale: 'en',
    helloaoId: HELLOAO_DEFAULT_TRANSLATION_ID,
    // MSG isn't on Blue Letter Bible -- fall back to NLT.
    apps: { blueLetterBible: 'nlt', bibleGateway: 'MSG', logos: 'MSG', bibleComVersionId: 97 },
  },
  [BibleVersions.CSB]: {
    name: 'Christian Standard Bible (CSB)',
    locale: 'en',
    helloaoId: HELLOAO_DEFAULT_TRANSLATION_ID,
    apps: { blueLetterBible: 'csb', bibleGateway: 'CSB', logos: 'CSB', bibleComVersionId: 1713 },
  },
  [BibleVersions.NET]: {
    name: 'NET Bible (NET)',
    locale: 'en',
    helloaoId: HELLOAO_DEFAULT_TRANSLATION_ID,
    apps: { blueLetterBible: 'net', bibleGateway: 'NETfull', logos: 'NET', bibleComVersionId: 107 },
  },
  [BibleVersions.NRSV]: {
    name: 'New Revised Standard Version (NRSV)',
    locale: 'en',
    helloaoId: HELLOAO_DEFAULT_TRANSLATION_ID,
    // Blue Letter Bible has RSV but not NRSV specifically -- closest fallback.
    apps: { blueLetterBible: 'rsv', bibleGateway: 'NRSVUE', logos: 'NRSV', bibleComVersionId: 2016 },
  },
  [BibleVersions.ASV]: {
    name: 'American Standard Version (ASV)',
    locale: 'en',
    helloaoId: 'eng_asv',
    apps: { blueLetterBible: 'asv', bibleGateway: 'ASV', logos: 'ASV', bibleComVersionId: 12 },
  },
  [BibleVersions.WEB]: {
    name: 'World English Bible (WEB)',
    locale: 'en',
    helloaoId: 'eng_web',
    // WEB isn't on Blue Letter Bible -- fall back to the closest public-domain literal translation.
    apps: { blueLetterBible: 'asv', bibleGateway: 'WEB', logos: 'WEB', bibleComVersionId: 206 },
  },
  [BibleVersions.GNT]: {
    name: 'Good News Translation (GNT)',
    locale: 'en',
    helloaoId: HELLOAO_DEFAULT_TRANSLATION_ID,
    // GNT isn't on Blue Letter Bible -- fall back to NLT (similar dynamic-equivalence style).
    apps: { blueLetterBible: 'nlt', bibleGateway: 'GNT', logos: 'GNT', bibleComVersionId: 68 },
  },
  [BibleVersions.RVR1960]: {
    name: 'Reina-Valera 1960 (RVR1960)',
    locale: 'es',
    helloaoId: 'spa_r09',
    apps: { blueLetterBible: 'rvr60', bibleGateway: 'RVR1960', logos: 'RVR60', bibleComVersionId: 149 },
  },
  [BibleVersions.RVR2020]: {
    name: 'Reina-Valera 2020 (RVR2020)',
    locale: 'es',
    helloaoId: 'spa_r09', // 2020 text not available on HelloAO -- fall back to 1960.
    apps: {
      blueLetterBible: 'rvr60', // 2020 not available -- fall back to 1960.
      bibleGateway: 'RVR1960', // 2020 not available -- fall back to 1960.
      logos: 'RVR60', // 2020 not confirmed on ref.ly -- fall back to 1960.
      bibleComVersionId: 3425,
    },
  },
  [BibleVersions.NVI]: {
    name: 'Nueva Versión Internacional (NVI)',
    locale: 'es',
    helloaoId: 'spa_r09', // No NVI text on HelloAO -- fall back to Reina-Valera.
    // NVI isn't on Blue Letter Bible -- fall back to Reina-Valera 1960.
    apps: { blueLetterBible: 'rvr60', bibleGateway: 'NVI', logos: 'NVI', bibleComVersionId: 128 },
  },
  [BibleVersions.NTV]: {
    name: 'Nueva Traducción Viviente (NTV)',
    locale: 'es',
    helloaoId: 'spa_r09', // No NTV text on HelloAO -- fall back to Reina-Valera.
    // NTV isn't on Blue Letter Bible -- fall back to Reina-Valera 1960.
    apps: { blueLetterBible: 'rvr60', bibleGateway: 'NTV', logos: 'NTV', bibleComVersionId: 129 },
  },
  [BibleVersions.LBLA]: {
    name: 'La Biblia de las Américas (LBLA)',
    locale: 'es',
    helloaoId: 'spa_r09', // No LBLA text on HelloAO -- fall back to Reina-Valera.
    // LBLA isn't on Blue Letter Bible -- fall back to Reina-Valera 1960.
    apps: { blueLetterBible: 'rvr60', bibleGateway: 'LBLA', logos: 'LBLA', bibleComVersionId: 149 },
  },
  [BibleVersions.UKR]: {
    name: 'українська (UKRK)',
    locale: 'uk',
    helloaoId: 'ukr_1996',
    // There is no Ukrainian version on Blue Letter Bible.
    apps: { blueLetterBible: 'niv', bibleGateway: 'UKR', logos: 'UKR', bibleComVersionId: 188 },
  },
  [BibleVersions.TURK]: {
    name: 'Turkonyak Ukrainian Bible',
    locale: 'uk',
    helloaoId: 'ukr_1996', // Distinct Turkonyak text not confirmed on HelloAO -- fall back to Ohienko.
    // No Ukrainian version on Blue Letter Bible, and the Turkonyak
    // translation isn't confirmed as a distinct Bible Gateway/Logos code --
    // fall back to the same codes as UKR pending verification.
    apps: { blueLetterBible: 'niv', bibleGateway: 'UKR', logos: 'UKR', bibleComVersionId: 188 },
  },
  [BibleVersions.BDS]: {
    name: 'Bible du Semeur (BDS)',
    locale: 'fr',
    helloaoId: 'fra_lsg', // No BDS text on HelloAO -- fall back to Louis Segond.
    // There's no Bible du Semeur version on Blue Letter Bible.
    apps: { blueLetterBible: 'ls', bibleGateway: 'BDS', logos: 'BDS', bibleComVersionId: 21 },
  },
  [BibleVersions.LSG]: {
    name: 'Louis Segond (LSG)',
    locale: 'fr',
    helloaoId: 'fra_lsg',
    apps: { blueLetterBible: 'ls', bibleGateway: 'LSG', logos: 'LSG', bibleComVersionId: 93 },
  },
  [BibleVersions.S21]: {
    name: 'Segond 21 (S21)',
    locale: 'fr',
    helloaoId: 'fra_lsg', // No Segond 21 text on HelloAO -- fall back to Louis Segond.
    // No Segond 21 version on Blue Letter Bible.
    apps: { blueLetterBible: 'ls', bibleGateway: 'SG21', logos: 'SG21', bibleComVersionId: 93 },
  },
  [BibleVersions.NEG1979]: {
    name: 'Nouvelle Édition de Genève (NEG1979)',
    locale: 'fr',
    helloaoId: 'fra_lsg', // No NEG1979 text on HelloAO -- fall back to Louis Segond.
    // No NEG1979 version on Blue Letter Bible.
    apps: { blueLetterBible: 'ls', bibleGateway: 'NEG1979', logos: 'NEG1979', bibleComVersionId: 93 },
  },
  [BibleVersions.ARC]: {
    name: 'Almeida Revista e Corrigida (ARC)',
    locale: 'pt',
    helloaoId: 'por_bsl',
    // There is no ARC version on Blue Letter Bible.
    apps: { blueLetterBible: 'nasb20', bibleGateway: 'ARC', logos: 'ARC', bibleComVersionId: 212 },
  },
  [BibleVersions.NVIPT]: {
    name: 'Nova Versão Internacional (NVI-PT)',
    locale: 'pt',
    helloaoId: 'por_bsl', // No NVI-PT text on HelloAO -- fall back to Almeida.
    // No Portuguese NVI version on Blue Letter Bible.
    apps: { blueLetterBible: 'nasb20', bibleGateway: 'NVI-PT', logos: 'NVIPT', bibleComVersionId: 212 },
  },
  [BibleVersions.ARA]: {
    name: 'Almeida Revista e Atualizada (ARA)',
    locale: 'pt',
    helloaoId: 'por_bsl', // No ARA text on HelloAO -- fall back to Almeida Revista e Corrigida.
    // No ARA version on Blue Letter Bible.
    apps: { blueLetterBible: 'nasb20', bibleGateway: 'ARA', logos: 'ARA', bibleComVersionId: 212 },
  },
  [BibleVersions.LUT]: {
    name: 'Luther 1545 (LUT)',
    locale: 'de',
    helloaoId: 'deu_l12',
    apps: { blueLetterBible: 'lut', bibleGateway: 'LUTH1545', logos: 'LUT', bibleComVersionId: 51 },
  },
  [BibleVersions.ELB]: {
    name: 'Elberfelder Bibel (ELB)',
    locale: 'de',
    helloaoId: 'deu_l12', // No Elberfelder text on HelloAO -- fall back to Luther.
    // No Elberfelder version on Blue Letter Bible.
    apps: { blueLetterBible: 'lut', bibleGateway: 'ELB', logos: 'ELB', bibleComVersionId: 51 },
  },
  [BibleVersions.HFA]: {
    name: 'Hoffnung für alle (HFA)',
    locale: 'de',
    helloaoId: 'deu_l12', // No Hoffnung für alle text on HelloAO -- fall back to Luther.
    // No Hoffnung für alle version on Blue Letter Bible.
    apps: { blueLetterBible: 'lut', bibleGateway: 'HOF', logos: 'HFA', bibleComVersionId: 51 },
  },
  [BibleVersions.KLB]: {
    name: '한글성경 (KLB)',
    locale: 'ko',
    helloaoId: 'kor_old',
    // No Korean on Blue Letter Bible.
    apps: { blueLetterBible: 'niv', bibleGateway: 'KLB', logos: 'KLB', bibleComVersionId: 86 },
  },
  [BibleVersions.KRV]: {
    name: '개역한글 (KRV)',
    locale: 'ko',
    helloaoId: 'kor_old',
    // No Korean on Blue Letter Bible. Bible Gateway doesn't support KRV specifically.
    apps: { blueLetterBible: 'niv', bibleGateway: 'KLB', logos: 'KRV', bibleComVersionId: 88 },
  },
  [BibleVersions.NKRV]: {
    name: '개역개정 (NKRV)',
    locale: 'ko',
    helloaoId: 'kor_old', // The 1998/2005 revision isn't confirmed as distinct on HelloAO -- fall back to the older public-domain text.
    // No Korean on Blue Letter Bible. Bible Gateway's Korean options are
    // limited to KLB -- fall back to it pending confirmation of a real code.
    apps: { blueLetterBible: 'niv', bibleGateway: 'KLB', logos: 'NKRV', bibleComVersionId: 86 },
  },
};

export const bibleVersionNames = Object.fromEntries(
  Object.entries(bibleVersions).map(([key, def]) => [key, def.name]),
) as Record<keyof typeof BibleVersions, string>;

export const bibleVersionOptions = Object.entries(bibleVersionNames).map(([value, text]) => ({ text, value }));

export const localeVersionGroups: Record<LocaleCode, readonly string[]> = Object.entries(bibleVersions).reduce(
  (groups, [key, def]) => {
    groups[def.locale] = [...(groups[def.locale] ?? []), key];
    return groups;
  },
  {} as Record<LocaleCode, string[]>,
);

/**
 * Gets the default Bible version to use if no user preference is available.
 */
export const getDefaultBibleVersion = () => BibleVersions.NASB2020;
