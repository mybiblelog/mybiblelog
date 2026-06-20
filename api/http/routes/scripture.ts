import { z } from 'zod';
import { type RouteDefinition } from '../types';
import { getScripturePassage } from '../handlers/scripture';

/**
 * Framework-neutral route table for the scripture endpoints. The handler parses
 * its verse-id query parameters inline, so the `docs.request.query` schema below
 * is a documentation-only mirror of that contract (used solely by the OpenAPI
 * generator). See `api/http/openapi/generate.ts`.
 */
const tags = ['Scripture'];

// Documentation-only schema mirroring the query the handler parses by hand.
const passageQuerySchema = z.object({
  startVerseId: z.coerce.number().int(),
  endVerseId: z.coerce.number().int(),
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
          'One chunk of passage blocks plus a continuation cursor (`next`) when more chapters remain',
        // The chunk shape lives in @mybiblelog/shared; documented as an opaque
        // object rather than re-describing the discriminated block union here.
        schema: z.unknown(),
      },
      errors: [400, 401, 502],
    },
  },
];
