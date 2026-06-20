import { z } from 'zod';
import { type RouteDefinition } from '../types';
import { getSitemap } from '../handlers/sitemap';

/**
 * Framework-neutral route table for the sitemap endpoint. The handler returns a
 * raw XML body (not the JSON envelope), so its `docs.response` is marked `raw`
 * with the `application/xml` content type. The endpoint is public. See
 * `api/http/openapi/generate.ts`.
 */
const tags = ['Sitemap'];

export const sitemapRoutes: RouteDefinition[] = [
  {
    method: 'GET',
    path: '/sitemap.xml',
    handler: getSitemap,
    docs: {
      summary: 'Get sitemap in XML format',
      tags,
      public: true,
      response: {
        description: 'Sitemap in XML format',
        schema: z.string(),
        contentType: 'application/xml',
        raw: true,
      },
      errors: [],
    },
  },
];
