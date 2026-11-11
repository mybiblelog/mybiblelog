import { z } from 'zod';
import { type RouteDefinition } from '../types';
import { USFM_PASSAGE_DESCRIPTION } from '../../validation/primitives';
import { getScripturePassage } from '../handlers/scripture';

/**
 * Framework-neutral route table for the scripture endpoints. The handler parses
 * its passage query parameters inline, so the `docs.request.query` schema below
 * is a documentation-only mirror of that contract (used solely by the OpenAPI
 * generator). See `api/http/openapi/generate.ts`.
 */
const tags = ['Scripture'];

// Documentation-only schema mirroring the query the handler parses by hand.
const passageQuerySchema = z.object({
  passage: z.string().optional().describe(`Passage to read. ${USFM_PASSAGE_DESCRIPTION} Required unless both verse IDs are sent; if both forms are sent they must name the same range (passage_conflict).`),
  startVerseId: z.coerce.number().int().optional().describe('Integer ID of the first verse; required with endVerseId when `passage` is absent'),
  endVerseId: z.coerce.number().int().optional().describe('Integer ID of the last verse, in the same book as `startVerseId`'),
  bibleVersion: z.string().optional(),
});

export const scriptureRoutes: RouteDefinition[] = [
  {
    method: 'GET',
    path: '/scripture/passage',
    handler: getScripturePassage,
    docs: {
      summary: 'Get one chunk of passage text for a verse range',
      tags,
      request: { query: passageQuerySchema },
      response: {
        description:
          'One chunk of passage blocks plus a continuation cursor (`next`: `startVerseId`, `endVerseId` and USFM `passage`) when more chapters remain',
        // The chunk shape lives in @mybiblelog/shared; documented as an opaque
        // object rather than re-describing the discriminated block union here.
        schema: z.unknown(),
      },
      errors: [400, 401, 502],
    },
  },
];
