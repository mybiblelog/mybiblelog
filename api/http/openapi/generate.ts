import { z, type ZodType } from 'zod';
import { type RouteDefinition } from '../types';

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

const JS_INT_MIN = -9007199254740991;
const JS_INT_MAX = 9007199254740991;

/**
 * Strips JSON Schema bookkeeping that OpenAPI 3.0 / Swagger UI does not need:
 * the `$schema`/`$id` dialect markers and the noisy safe-integer bounds zod
 * emits for `.int()`.
 */
const clean = (node: any): any => {
  if (Array.isArray(node)) {
    return node.map(clean);
  }
  if (node && typeof node === 'object') {
    const rest: JsonSchema = { ...node };
    delete rest.$schema;
    delete rest.$id;
    if (rest.minimum === JS_INT_MIN) { delete rest.minimum; }
    if (rest.maximum === JS_INT_MAX) { delete rest.maximum; }
    for (const key of Object.keys(rest)) {
      rest[key] = clean(rest[key]);
    }
    return rest;
  }
  return node;
};

const toJsonSchema = (schema: ZodType, io: 'input' | 'output'): JsonSchema =>
  clean(z.toJSONSchema(schema, { io }));

/** Converts an Express-style path (`/log-entries/:id`) to OpenAPI (`/log-entries/{id}`). */
const toOpenApiPath = (path: string): string => path.replace(/:([A-Za-z0-9_]+)/g, '{$1}');

/** Expands an object schema into a list of OpenAPI `parameters`. */
const toParameters = (schema: ZodType, location: 'path' | 'query'): JsonSchema[] => {
  const js = toJsonSchema(schema, 'input');
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

const buildOperation = (route: RouteDefinition): JsonSchema | undefined => {
  const { docs } = route;
  if (!docs) { return undefined; }

  const parameters: JsonSchema[] = [];
  if (docs.request?.params) { parameters.push(...toParameters(docs.request.params, 'path')); }
  if (docs.request?.query) { parameters.push(...toParameters(docs.request.query, 'query')); }

  const responses: JsonSchema = {
    200: {
      description: docs.response?.description ?? 'Successful response',
      ...(docs.response
        ? {
          content: {
            'application/json': {
              schema: successEnvelope(toJsonSchema(docs.response.schema, 'output')),
            },
          },
        }
        : {}),
    },
    400: { description: 'Invalid request or validation error', ...errorResponse },
  };
  // Routes that take a resource id can 404 when it does not exist.
  if (parameters.some((p) => p.in === 'path')) {
    responses[404] = { description: 'Resource not found', ...errorResponse };
  }

  return {
    summary: docs.summary,
    tags: docs.tags,
    ...(docs.description ? { description: docs.description } : {}),
    security: [{ bearerAuth: [] }],
    ...(parameters.length ? { parameters } : {}),
    ...(docs.request?.body
      ? {
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: toJsonSchema(docs.request.body, 'input'),
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
export const generateOpenApiPaths = (routes: RouteDefinition[]): { paths: JsonSchema } => {
  const paths: JsonSchema = {};

  for (const route of routes) {
    const operation = buildOperation(route);
    if (!operation) { continue; }

    const path = toOpenApiPath(route.path);
    paths[path] ??= {};
    paths[path][route.method.toLowerCase()] = operation;
  }

  return { paths };
};
