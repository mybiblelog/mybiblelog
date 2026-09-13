import { BibleVersions, bibleVersions, HELLOAO_DEFAULT_TRANSLATION_ID } from '@mybiblelog/shared';

export { HELLOAO_DEFAULT_TRANSLATION_ID };

/**
 * Translation ids for https://bible.helloao.org/api/{id}/{USFM}/{chapter}.json
 * (see GET /api/available_translations.json). Where helloao has no matching
 * text, we use a close substitute or English {@link HELLOAO_DEFAULT_TRANSLATION_ID}.
 *
 * The id for each version lives alongside its other provider codes in
 * `shared/bible/translations.ts` so it can't drift out of sync with the rest
 * of that translation's data.
 */
export const getHelloaoTranslationId = (version: keyof typeof BibleVersions): string =>
  bibleVersions[version]?.helloaoId ?? HELLOAO_DEFAULT_TRANSLATION_ID;
