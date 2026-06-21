import { z, type ZodType } from 'zod';

/**
 * Helpers for turning zod schemas into the JSON Schema fragments the OpenAPI
 * document embeds. Kept dependency-free (the entity registry is passed in) so
 * both the component builder and the path generator can share one
 * implementation without an import cycle.
 */

type JsonSchema = Record<string, any>;

/** Registry mapping entity schemas to a stable component `id`. */
type EntityRegistry = z.core.$ZodRegistry<{ id?: string }>;

const JS_INT_MIN = -9007199254740991;
const JS_INT_MAX = 9007199254740991;

const DEFS_REF_PREFIX = '#/$defs/';
const COMPONENTS_REF_PREFIX = '#/components/schemas/';

/**
 * Strips JSON Schema bookkeeping that OpenAPI 3.0 / Swagger UI does not need:
 * the `$schema`/`$id` dialect markers and the noisy safe-integer bounds zod
 * emits for `.int()`.
 */
export const clean = (node: any): any => {
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

/**
 * Rewrites every `$ref` zod emitted as `#/$defs/<EntityId>` to the OpenAPI
 * component location `#/components/schemas/<EntityId>`, for the ids registered
 * as components. The corresponding `$defs` entries are then dropped (they live
 * in `components.schemas`); any non-entity `$defs` are left untouched.
 */
const rewriteEntityRefs = (node: any, entityIds: Set<string>): any => {
  if (Array.isArray(node)) {
    return node.map((item) => rewriteEntityRefs(item, entityIds));
  }
  if (node && typeof node === 'object') {
    const rest: JsonSchema = {};
    for (const [key, value] of Object.entries(node)) {
      if (key === '$ref' && typeof value === 'string' && value.startsWith(DEFS_REF_PREFIX)) {
        const id = value.slice(DEFS_REF_PREFIX.length);
        rest[key] = entityIds.has(id) ? `${COMPONENTS_REF_PREFIX}${id}` : value;
        continue;
      }
      if (key === '$defs' && value && typeof value === 'object') {
        const remaining: JsonSchema = {};
        for (const [defId, defSchema] of Object.entries(value as JsonSchema)) {
          if (!entityIds.has(defId)) {
            remaining[defId] = rewriteEntityRefs(defSchema, entityIds);
          }
        }
        if (Object.keys(remaining).length > 0) { rest[key] = remaining; }
        continue;
      }
      rest[key] = rewriteEntityRefs(value, entityIds);
    }
    return rest;
  }
  return node;
};

/**
 * Converts a zod schema to an OpenAPI-ready JSON Schema. Any sub-schema that is
 * registered in `registry` (top-level or nested) is emitted as a
 * `#/components/schemas/<id>` `$ref` rather than inlined, so entity definitions
 * are written once and referenced everywhere.
 */
export const zodToOpenApiSchema = (
  schema: ZodType,
  io: 'input' | 'output',
  registry: EntityRegistry,
): JsonSchema => {
  // zod inlines the root schema (a schema is never a `$ref` to itself), so when
  // the response *is* an entity we emit the component `$ref` directly. Nested
  // entities are handled by the registry-driven rewrite below.
  const rootId = registry.get(schema)?.id;
  if (rootId) { return { $ref: `${COMPONENTS_REF_PREFIX}${rootId}` }; }

  const entityIds = new Set(registry._idmap.keys());
  const js = z.toJSONSchema(schema, { io, metadata: registry }) as JsonSchema;
  return clean(rewriteEntityRefs(js, entityIds));
};

/** Converts a zod schema to JSON Schema with no entity `$ref`s (fully inlined). */
export const zodToJsonSchema = (schema: ZodType, io: 'input' | 'output'): JsonSchema =>
  clean(z.toJSONSchema(schema, { io }));
