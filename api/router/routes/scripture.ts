import express from 'express';
import {
  getDefaultBibleVersion,
  isBibleVersionKey,
  type ScripturePassageChunk,
} from '@mybiblelog/shared';
import authCurrentUser from '../helpers/authCurrentUser';
import { ApiErrorDetailCode } from '../errors/error-codes';
import { ValidationError } from '../errors/validation-errors';
import { type ApiResponse } from '../response';
import { getPassageChunk } from '../../services/scripture/scripture.service';

const router = express.Router();

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

/**
 * @swagger
 * /scripture/passage:
 *   get:
 *     summary: Get one chunk of passage text for a verse range
 *     tags: [Scripture]
 *     parameters:
 *       - in: query
 *         name: startVerseId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: endVerseId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: bibleVersion
 *         required: false
 *         schema:
 *           type: string
 *         description: Preferred Bible version key (falls back to the default version)
 *     responses:
 *       200:
 *         description: One chunk of passage blocks plus a continuation cursor (`next`) when more chapters remain
 *       400:
 *         description: Missing or invalid verse ids, or an invalid passage range
 *       401:
 *         description: Unauthenticated
 *       502:
 *         description: The upstream Bible text provider failed
 */
router.get('/scripture/passage', async (req, res, next) => {
  try {
    await authCurrentUser(req);

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
    res.json({ data: chunk } satisfies ApiResponse<ScripturePassageChunk>);
  }
  catch (error) {
    next(error);
  }
});

export default router;
