import { z } from 'zod';
import { type RouteDefinition } from '../types';
import { getMobileAppSupport } from '../handlers/mobile-app';

/**
 * Framework-neutral route table for mobile-app endpoints. The handler parses its
 * query parameters inline, so the `docs.request.query` schema below is a
 * documentation-only mirror of that contract (used solely by the OpenAPI
 * generator). See `api/http/openapi/generate.ts`.
 */
const tags = ['Mobile'];

// Documentation-only schema mirroring the query the handler parses by hand.
const supportQuerySchema = z.object({
  platform: z.enum(['ios', 'android']),
  version: z.string(),
});

export const mobileAppRoutes: RouteDefinition[] = [
  {
    method: 'GET',
    path: '/mobile-app/support',
    handler: getMobileAppSupport,
    docs: {
      summary: 'Mobile app support / upgrade status',
      description:
        'Used by the React Native app at startup to determine whether the installed app '
        + 'version is still supported by the API. If not supported, the client should block '
        + 'usage and show a "please update" screen.',
      tags,
      public: true,
      request: { query: supportQuerySchema },
      response: {
        description: 'Support status for the given platform/version',
        schema: z.object({
          platform: z.enum(['ios', 'android']),
          current: z.object({ version: z.string() }),
          minimumSupported: z.object({ version: z.string() }),
          latest: z.object({ version: z.string() }).nullable(),
          supported: z.boolean(),
          forceUpgrade: z.boolean(),
          storeUrl: z.string().nullable(),
        }),
      },
      errors: [400],
    },
  },
];
