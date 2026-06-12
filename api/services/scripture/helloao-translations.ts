import { BibleVersions } from '@mybiblelog/shared';

/**
 * Translation ids for https://bible.helloao.org/api/{id}/{USFM}/{chapter}.json
 * (see GET /api/available_translations.json). Where helloao has no matching
 * text, we use a close substitute or English {@link HELLOAO_DEFAULT_TRANSLATION_ID}.
 */
export const HELLOAO_DEFAULT_TRANSLATION_ID = 'BSB';

const HelloaoTranslationIds: { readonly [Key in keyof typeof BibleVersions]: string } = {
  [BibleVersions.AMP]: HELLOAO_DEFAULT_TRANSLATION_ID,
  [BibleVersions.KJV]: 'eng_cpb',
  [BibleVersions.NKJV]: HELLOAO_DEFAULT_TRANSLATION_ID,
  [BibleVersions.NIV]: HELLOAO_DEFAULT_TRANSLATION_ID,
  [BibleVersions.ESV]: HELLOAO_DEFAULT_TRANSLATION_ID,
  [BibleVersions.NASB1995]: HELLOAO_DEFAULT_TRANSLATION_ID,
  [BibleVersions.NASB2020]: HELLOAO_DEFAULT_TRANSLATION_ID,
  [BibleVersions.NABRE]: HELLOAO_DEFAULT_TRANSLATION_ID,
  [BibleVersions.NLT]: HELLOAO_DEFAULT_TRANSLATION_ID,
  [BibleVersions.TPT]: HELLOAO_DEFAULT_TRANSLATION_ID,
  [BibleVersions.MSG]: HELLOAO_DEFAULT_TRANSLATION_ID,
  [BibleVersions.RVR1960]: 'spa_r09',
  [BibleVersions.RVR2020]: 'spa_r09',
  [BibleVersions.UKR]: 'ukr_1996',
  [BibleVersions.BDS]: 'fra_lsg',
  [BibleVersions.LSG]: 'fra_lsg',
  [BibleVersions.ARC]: 'por_bsl',
  [BibleVersions.LUT]: 'deu_l12',
  [BibleVersions.KLB]: 'kor_old',
  [BibleVersions.KRV]: 'kor_old',
};

export const getHelloaoTranslationId = (version: keyof typeof BibleVersions): string =>
  HelloaoTranslationIds[version] ?? HELLOAO_DEFAULT_TRANSLATION_ID;
