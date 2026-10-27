import { type ZodType } from 'zod';
import { type RouteDocs } from '../types';
import { componentSchemas } from './components';
import { openApiRegistry } from './entity-schemas';
import { zodToJsonSchema, zodToOpenApiSchema } from './to-json-schema';

/**
 * Generates an OpenAPI `paths` fragment from framework-neutral route tables.
 *
 * The request/response shapes are derived from the very zod schemas the
 * handlers validate with (via `RouteDefinition.docs`), so the docs are a
 * projection of the real contract rather than a hand-maintained copy of it. To
 * document a new route, add a `docs` entry to its `RouteDefinition` — there is
 * nothing else to keep in sync.
 */

type JsonSchema = Record<string, any>;

/**
 * `all` documents every route (the development Swagger UI); `public` leaves out
 * routes marked `docs.internal` (the spec served in production).
 */
export type SpecAudience = 'public' | 'all';

/**
 * The minimal shape the generator needs to document a route. Both a full
 * `RouteDefinition` (with an attached `docs`) and a documentation-only
 * `DocumentedRoute` satisfy this structurally.
 */
interface DocumentableRoute {
  method: string;
  path: string;
  docs?: RouteDocs;
  scopes?: readonly string[];
}

/**
 * Converts a request/response schema, emitting `$ref`s to entity components for
 * any registered entity (top-level or nested) instead of inlining them.
 */
const toRefAwareSchema = (schema: ZodType, io: 'input' | 'output'): JsonSchema =>
  zodToOpenApiSchema(schema, io, openApiRegistry);

/** Converts an Express-style path (`/log-entries/:id`) to OpenAPI (`/log-entries/{id}`). */
const toOpenApiPath = (path: string): string => path.replace(/:([A-Za-z0-9_]+)/g, '{$1}');

/** Expands an object schema into a list of OpenAPI `parameters`. */
const toParameters = (schema: ZodType, location: 'path' | 'query'): JsonSchema[] => {
  const js = zodToJsonSchema(schema, 'input');
  const required = new Set<string>(js.required ?? []);
  return Object.entries(js.properties ?? {}).map(([name, propSchema]) => ({
    name,
    in: location,
    // Path params are always required; query params follow the schema.
    required: location === 'path' ? true : required.has(name),
    schema: propSchema,
  }));
};

/** Wraps a payload schema in the standard `{ data: ... }` success envelope. */
const successEnvelope = (dataSchema: JsonSchema): JsonSchema => ({
  type: 'object',
  required: ['data'],
  properties: { data: dataSchema },
});

const errorResponse = {
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ApiErrorResponse' },
    },
  },
};

/** Default descriptions for the error statuses the generator knows how to emit. */
const ERROR_DESCRIPTIONS: Record<number, string> = {
  400: 'Invalid request or validation error',
  401: 'Unauthenticated: the token is missing, expired or revoked',
  403: 'Forbidden: not allowed for this user, or the access token lacks a required scope',
  404: 'Resource not found',
  429: 'Too many requests',
};

/** Standard description for the auth cookie set on a successful auth response. */
const AUTH_COOKIE_HEADER = {
  'Set-Cookie': {
    description: 'Authentication cookie containing the JWT (`auth_token`; HttpOnly, Secure in production).',
    schema: { type: 'string' },
  },
};

/**
 * Who can call an operation: nobody needs a token (`public`), only a signed-in
 * session (`bearerAuth`), or a session or a personal access token holding the
 * route's scopes (`accessToken`). OpenAPI 3.0 has no way to attach scopes to an
 * `http` scheme, so they are listed in `x-required-scopes` instead.
 */
const securityFor = (route: DocumentableRoute): JsonSchema[] => {
  if (route.docs?.public) { return []; }
  if (route.scopes?.length) { return [{ bearerAuth: [] }, { accessToken: [] }]; }
  return [{ bearerAuth: [] }];
};

const buildOperation = (route: DocumentableRoute): JsonSchema | undefined => {
  const { docs } = route;
  if (!docs) { return undefined; }

  const parameters: JsonSchema[] = [];
  if (docs.request?.params) { parameters.push(...toParameters(docs.request.params, 'path')); }
  if (docs.request?.query) { parameters.push(...toParameters(docs.request.query, 'query')); }

  const hasPathParam = parameters.some((p) => p.in === 'path');
  const hasScopes = Boolean(route.scopes?.length);
  const defaultErrors = [400, ...(docs.public ? [] : [401]), ...(hasPathParam ? [404] : [])];
  // A scoped route can always answer 403 (the token lacks a scope) and 429
  // (the per-token rate limit), whatever else it documents.
  const errorStatuses = [...new Set([
    ...(docs.errors ?? defaultErrors),
    ...(hasScopes ? [403, 429] : []),
  ])].sort((a, b) => a - b);

  const responses: JsonSchema = {
    200: {
      description: docs.response?.description ?? 'Successful response',
      ...(docs.setsAuthCookie ? { headers: AUTH_COOKIE_HEADER } : {}),
      ...(docs.response
        ? {
          content: {
            [docs.response.contentType ?? 'application/json']: {
              // `raw` responses (e.g. XML) are documented as the schema itself;
              // JSON responses are wrapped in the standard `{ data }` envelope.
              schema: docs.response.raw
                ? toRefAwareSchema(docs.response.schema, 'output')
                : successEnvelope(toRefAwareSchema(docs.response.schema, 'output')),
            },
          },
        }
        : {}),
    },
  };
  for (const status of errorStatuses) {
    responses[status] = { description: ERROR_DESCRIPTIONS[status] ?? 'Error', ...errorResponse };
  }

  return {
    ...(docs.operationId ? { operationId: docs.operationId } : {}),
    summary: docs.summary,
    tags: docs.tags,
    ...(docs.description ? { description: docs.description } : {}),
    security: securityFor(route),
    ...(hasScopes ? { 'x-required-scopes': [...route.scopes!] } : {}),
    ...(docs.destructive ? { 'x-destructive': true } : {}),
    ...(parameters.length ? { parameters } : {}),
    ...(docs.request?.body
      ? {
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: toRefAwareSchema(docs.request.body, 'input'),
            },
          },
        },
      }
      : {}),
    responses,
  };
};

/**
 * Builds the OpenAPI `paths` object for the given route tables. Routes without a
 * `docs` field are skipped (they simply won't appear in the docs yet).
 */
export const generateOpenApiPaths = (
  routes: DocumentableRoute[],
  { audience = 'all' }: { audience?: SpecAudience } = {},
): { paths: JsonSchema } => {
  const paths: JsonSchema = {};

  for (const route of routes) {
    if (audience === 'public' && route.docs?.internal) { continue; }
    const operation = buildOperation(route);
    if (!operation) { continue; }

    const path = toOpenApiPath(route.path);
    paths[path] ??= {};
    paths[path][route.method.toLowerCase()] = operation;
  }

  return { paths };
};

/**
 * The reusable component schemas (`ApiErrorResponse` and friends, `User`) that
 * generated and JSDoc-authored paths reference by `$ref`. These previously lived
 * as hand-written JSDoc in the auth router.
 */
export const generateOpenApiComponents = (): { schemas: JsonSchema } => ({
  schemas: componentSchemas,
});
