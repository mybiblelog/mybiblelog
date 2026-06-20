import {
  getDefaultBibleVersion,
  isBibleVersionKey,
} from '@mybiblelog/shared';
import { ApiErrorDetailCode } from '../errors/error-codes';
import { ValidationError } from '../errors/validation-errors';
import { getPassageChunk } from '../../services/scripture/scripture.service';
import { type RouteHandler } from '../types';

/**
 * Framework-agnostic scripture handler.
 *
 * The verse-id query parameters are parsed and validated inline (preserving the
 * original `not_valid` error codes and field names) rather than through
 * `validate()`, and the passage text is fetched via the provider-neutral
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

// GET /scripture/passage - Get one chunk of passage text for a verse range
export const getScripturePassage: RouteHandler = async (req, deps) => {
  await deps.authenticate(req);

  const startVerseId = parsePositiveInt(req.query.startVerseId);
  if (startVerseId === null) {
    throw new ValidationError([{ code: ApiErrorDetailCode.NotValid, field: 'startVerseId' }]);
  }
  const endVerseId = parsePositiveInt(req.query.endVerseId);
  if (endVerseId === null) {
    throw new ValidationError([{ code: ApiErrorDetailCode.NotValid, field: 'endVerseId' }]);
  }

  const qVersion = typeof req.query.bibleVersion === 'string' ? req.query.bibleVersion : '';
  const bibleVersion = isBibleVersionKey(qVersion) ? qVersion : getDefaultBibleVersion();

  const chunk = await getPassageChunk({ startVerseId, endVerseId, bibleVersion });
  return { status: 200, body: { data: chunk } };
};
