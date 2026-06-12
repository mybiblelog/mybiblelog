import {
  Bible,
  type BibleVersions,
  type PassageCursor,
  type ScripturePassageChunk,
} from '@mybiblelog/shared';
import { ApiErrorDetailCode } from '../../router/errors/error-codes';
import { ValidationError } from '../../router/errors/validation-errors';
import { getHelloaoTranslationId } from './helloao-translations';
import { fetchHelloaoChapter } from './helloao-client';
import { extractPassageBlocksFromChapter, extractTranslationMeta } from './helloao-parser';

export type PassageChunkBounds = {
  usfm: string;
  chapter: number;
  fromVerse: number;
  toVerse: number;
  next: PassageCursor | null;
};

/**
 * Computes the bounds of the next chunk of a passage: the start chapter only,
 * with a continuation cursor when the passage spans further chapters.
 * Throws a {@link ValidationError} for an invalid range (nonexistent verses,
 * reversed order, or a cross-book range).
 */
export const computePassageChunkBounds = (
  startVerseId: number,
  endVerseId: number,
): PassageChunkBounds => {
  if (!Bible.validateRange(startVerseId, endVerseId)) {
    throw new ValidationError([{ code: ApiErrorDetailCode.NotValid, field: 'passage' }]);
  }
  const start = Bible.parseVerseId(startVerseId);
  const end = Bible.parseVerseId(endVerseId);
  const sameChapter = start.chapter === end.chapter;
  return {
    usfm: Bible.getBookUsfmCode(start.book),
    chapter: start.chapter,
    fromVerse: start.verse,
    toVerse: sameChapter ? end.verse : Bible.getChapterVerseCount(start.book, start.chapter),
    next: sameChapter ?
      null :
      {
        startVerseId: Bible.makeVerseId(start.book, start.chapter + 1, 1),
        endVerseId,
      },
  };
};

/**
 * Loads one chunk of passage text. The response is provider-neutral;
 * callers re-request with the returned `next` cursor to continue reading.
 */
export const getPassageChunk = async ({ startVerseId, endVerseId, bibleVersion }: {
  startVerseId: number;
  endVerseId: number;
  bibleVersion: keyof typeof BibleVersions;
}): Promise<ScripturePassageChunk> => {
  const bounds = computePassageChunkBounds(startVerseId, endVerseId);
  const translationId = getHelloaoTranslationId(bibleVersion);
  const payload = await fetchHelloaoChapter(translationId, bounds.usfm, bounds.chapter);
  return {
    blocks: extractPassageBlocksFromChapter(payload, bounds.chapter, bounds.fromVerse, bounds.toVerse),
    translation: extractTranslationMeta(payload, translationId),
    next: bounds.next,
  };
};
