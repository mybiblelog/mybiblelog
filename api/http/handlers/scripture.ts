import {
  Bible,
  getDefaultBibleVersion,
  isBibleVersionKey,
  type VerseRange,
} from '@mybiblelog/shared';
import { toPassageJSON } from '../../repositories/helpers/serializers';
import { ApiErrorDetailCode } from '../errors/error-codes';
import { ValidationError } from '../errors/validation-errors';
import { getPassageChunk } from '../../services/scripture/scripture.service';
import { type RouteHandler } from '../types';

/**
 * Framework-agnostic scripture handler.
 *
 * The passage query parameters (a USFM `passage`, or the `startVerseId`/
 * `endVerseId` pair) are parsed and validated inline (preserving the original
 * `not_valid` error codes and field names) rather than through `validate()`, and the passage text is fetched via the provider-neutral
 * scripture service. The handler authenticates through the injected
 * `authenticate` and returns a normalized JSON result.
 */

const parsePositiveInt = (v: unknown): number | null => {
  if (v === undefined || v === null || v === '') {
    return null;
  }
  const n = typeof v === 'string' ? parseInt(v, 10) : Number(v);
  if (!Number.isFinite(n) || n <= 0) {
    return null;
  }
  return Math.floor(n);
};

const parseVerseIdPair = (query: Record<string, unknown>): VerseRange => {
  const startVerseId = parsePositiveInt(query.startVerseId);
  if (startVerseId === null) {
    throw new ValidationError([{ code: ApiErrorDetailCode.NotValid, field: 'startVerseId' }]);
  }
  const endVerseId = parsePositiveInt(query.endVerseId);
  if (endVerseId === null) {
    throw new ValidationError([{ code: ApiErrorDetailCode.NotValid, field: 'endVerseId' }]);
  }
  return { startVerseId, endVerseId };
};

const parsePassageQuery = (query: Record<string, unknown>): VerseRange => {
  if (query.passage === undefined || query.passage === '') {
    return parseVerseIdPair(query);
  }
  const range = Bible.parseUsfmReference(String(query.passage));
  if (!range) {
    throw new ValidationError([{ code: ApiErrorDetailCode.NotValid, field: 'passage' }]);
  }
  // As in request bodies, both forms may be sent only if they name the same range.
  const pairSent = query.startVerseId !== undefined || query.endVerseId !== undefined;
  if (pairSent) {
    const pair = parseVerseIdPair(query);
    if (pair.startVerseId !== range.startVerseId || pair.endVerseId !== range.endVerseId) {
      throw new ValidationError([{ code: ApiErrorDetailCode.PassageConflict, field: 'passage' }]);
    }
  }
  return range;
};

// GET /scripture/passage - Get one chunk of passage text for a verse range
export const getScripturePassage: RouteHandler = async (req, deps) => {
  await deps.authenticate(req);

  const { startVerseId, endVerseId } = parsePassageQuery(req.query);

  const qVersion = typeof req.query.bibleVersion === 'string' ? req.query.bibleVersion : '';
  const bibleVersion = isBibleVersionKey(qVersion) ? qVersion : getDefaultBibleVersion();

  const chunk = await getPassageChunk({ startVerseId, endVerseId, bibleVersion });
  return { status: 200, body: { data: { ...chunk, next: chunk.next && toPassageJSON(chunk.next) } } };
};
