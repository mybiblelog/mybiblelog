import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { generateOpenApiPaths } from '../http/openapi/generate';
import { type DocumentedRoute } from '../http/types';
import { documentedRoutes } from '../http/routes';
import { buildOpenApiSpec } from '../config/swagger';

/**
 * Covers `buildOperation()`'s branches in `http/openapi/generate.ts`: routes
 * without `docs` are skipped, the default error-status set depends on whether
 * the route has a path param, `docs.response.raw` documents the schema
 * verbatim instead of wrapping it in the `{ data }` envelope,
 * `docs.setsAuthCookie` documents the `Set-Cookie` header, and `docs.public`
 * controls the emitted `security` array.
 */
describe('generateOpenApiPaths', () => {
  it('skips routes with no docs', () => {
    const { paths } = generateOpenApiPaths([{ method: 'GET', path: '/undocumented' }]);
    expect(paths).toEqual({});
  });

  it('does not default to 401 for a public route', () => {
    const route: DocumentedRoute = {
      method: 'GET',
      path: '/public-thing',
      docs: { summary: 'Public thing', tags: ['things'], public: true },
    };
    const { paths } = generateOpenApiPaths([route]);
    expect(Object.keys(paths['/public-thing'].get.responses).sort()).toEqual(['200', '400']);
  });

  it('defaults to 404 in errors for a route with a path param, and not otherwise', () => {
    const withParam: DocumentedRoute = {
      method: 'GET',
      path: '/things/:id',
      docs: {
        summary: 'Get a thing',
        tags: ['things'],
        request: { params: z.object({ id: z.string() }) },
      },
    };
    const withoutParam: DocumentedRoute = {
      method: 'GET',
      path: '/things',
      docs: { summary: 'List things', tags: ['things'] },
    };

    const { paths } = generateOpenApiPaths([withParam, withoutParam]);

    // Both are private, so both also document 401.
    const paramOp = paths['/things/{id}'].get;
    expect(Object.keys(paramOp.responses).sort()).toEqual(['200', '400', '401', '404']);

    const noParamOp = paths['/things'].get;
    expect(Object.keys(noParamOp.responses).sort()).toEqual(['200', '400', '401']);
  });

  it('documents a public route with an empty security array', () => {
    const route: DocumentedRoute = {
      method: 'GET',
      path: '/public-thing',
      docs: { summary: 'Public thing', tags: ['things'], public: true },
    };
    const { paths } = generateOpenApiPaths([route]);
    expect(paths['/public-thing'].get.security).toEqual([]);
  });

  it('documents a private route with bearerAuth security', () => {
    const route: DocumentedRoute = {
      method: 'GET',
      path: '/private-thing',
      docs: { summary: 'Private thing', tags: ['things'] },
    };
    const { paths } = generateOpenApiPaths([route]);
    expect(paths['/private-thing'].get.security).toEqual([{ bearerAuth: [] }]);
  });

  it('documents a raw response schema verbatim, not wrapped in the data envelope', () => {
    const route: DocumentedRoute = {
      method: 'GET',
      path: '/sitemap.xml',
      docs: {
        summary: 'Sitemap',
        tags: ['sitemap'],
        response: {
          schema: z.string(),
          contentType: 'application/xml',
          raw: true,
        },
      },
    };
    const { paths } = generateOpenApiPaths([route]);
    const schema = paths['/sitemap.xml'].get.responses[200].content['application/xml'].schema;
    expect(schema).toEqual({ type: 'string' });
  });

  it('wraps a non-raw response schema in the { data } success envelope', () => {
    const route: DocumentedRoute = {
      method: 'GET',
      path: '/wrapped-thing',
      docs: {
        summary: 'Wrapped thing',
        tags: ['things'],
        response: { schema: z.object({ name: z.string() }) },
      },
    };
    const { paths } = generateOpenApiPaths([route]);
    const schema = paths['/wrapped-thing'].get.responses[200].content['application/json'].schema;
    expect(schema).toMatchObject({
      type: 'object',
      required: ['data'],
      properties: { data: { type: 'object' } },
    });
  });

  it('documents the Set-Cookie header when setsAuthCookie is true', () => {
    const route: DocumentedRoute = {
      method: 'POST',
      path: '/login',
      docs: {
        summary: 'Log in',
        tags: ['auth'],
        setsAuthCookie: true,
      },
    };
    const { paths } = generateOpenApiPaths([route]);
    const headers = paths['/login'].post.responses[200].headers;
    expect(headers).toHaveProperty('Set-Cookie');
    expect(headers['Set-Cookie'].schema).toEqual({ type: 'string' });
  });

  it('omits headers when setsAuthCookie is not set', () => {
    const route: DocumentedRoute = {
      method: 'GET',
      path: '/no-cookie',
      docs: { summary: 'No cookie', tags: ['things'] },
    };
    const { paths } = generateOpenApiPaths([route]);
    expect(paths['/no-cookie'].get.responses[200].headers).toBeUndefined();
  });

  it('keeps .describe() descriptions in request bodies', () => {
    const route: DocumentedRoute = {
      method: 'POST',
      path: '/things',
      docs: {
        summary: 'Create a thing',
        tags: ['things'],
        request: { body: z.object({ name: z.string().describe('The name') }).describe('A thing') },
      },
    };
    const { paths } = generateOpenApiPaths([route]);
    const schema = paths['/things'].post.requestBody.content['application/json'].schema;
    expect(schema.description).toBe('A thing');
    expect(schema.properties.name.description).toBe('The name');
  });

  it('describes every request body and every field in it', () => {
    const undescribed: string[] = [];
    const walk = (node: any, path: string) => {
      if (!node || typeof node !== 'object') { return; }
      for (const [key, child] of Object.entries<any>(node.properties ?? {})) {
        if (!child.description && !child.$ref) { undescribed.push(`${path}.${key}`); }
        walk(child, `${path}.${key}`);
      }
      walk(node.items, `${path}[]`);
      (node.anyOf ?? []).forEach((option: any, i: number) => walk(option, `${path}|${i}`));
    };

    const { paths } = generateOpenApiPaths(documentedRoutes);
    for (const [path, operations] of Object.entries<any>(paths)) {
      for (const [method, operation] of Object.entries<any>(operations)) {
        const schema = operation.requestBody?.content['application/json'].schema;
        if (!schema) { continue; }
        const label = `${method.toUpperCase()} ${path}`;
        if (!schema.description) { undescribed.push(label); }
        walk(schema, label);
      }
    }
    expect(undescribed).toEqual([]);
  });

  it('documents a scoped route as accepting access tokens, with its scopes, 403 and 429', () => {
    const route: DocumentedRoute = {
      method: 'GET',
      path: '/scoped-thing',
      scopes: ['logs:read'],
      docs: { summary: 'Scoped thing', tags: ['things'], errors: [] },
    };
    const { paths } = generateOpenApiPaths([route]);
    const op = paths['/scoped-thing'].get;
    expect(op.security).toEqual([{ bearerAuth: [] }, { accessToken: [] }]);
    expect(op['x-required-scopes']).toEqual(['logs:read']);
    expect(Object.keys(op.responses).sort()).toEqual(['200', '403', '429']);
  });

  it('emits operationId and x-destructive from docs', () => {
    const route: DocumentedRoute = {
      method: 'DELETE',
      path: '/things/:id',
      docs: { operationId: 'deleteThing', summary: 'Delete a thing', tags: ['things'], destructive: true },
    };
    const { paths } = generateOpenApiPaths([route]);
    expect(paths['/things/{id}'].delete.operationId).toBe('deleteThing');
    expect(paths['/things/{id}'].delete['x-destructive']).toBe(true);
  });

  it('leaves internal routes out of the public audience only', () => {
    const route: DocumentedRoute = {
      method: 'GET',
      path: '/internal-thing',
      docs: { summary: 'Internal thing', tags: ['things'], internal: true },
    };
    expect(generateOpenApiPaths([route], { audience: 'public' }).paths).toEqual({});
    expect(generateOpenApiPaths([route]).paths).toHaveProperty('/internal-thing');
  });

  it('gives every documented route a unique operationId', () => {
    const ids = documentedRoutes.filter((route) => route.docs).map((route) => route.docs?.operationId);
    expect(ids.filter((id) => !id)).toEqual([]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('marks every DELETE route an access token can call as destructive', () => {
    const unmarked = documentedRoutes
      .filter((route) => route.method === 'DELETE' && route.scopes?.length && !route.docs?.destructive)
      .map((route) => route.path);
    expect(unmarked).toEqual([]);
  });

  it('keeps admin and other internal routes out of the public spec', () => {
    const spec = buildOpenApiSpec({ audience: 'public' });
    const paths = Object.keys(spec.paths);
    expect(paths.filter((path) => path.startsWith('/admin'))).toEqual([]);
    expect(paths).not.toContain('/sitemap.xml');
    expect(paths).toContain('/log-entries');
    expect(spec.tags.map((tag) => tag.name)).not.toContain('Admin');
  });
});
