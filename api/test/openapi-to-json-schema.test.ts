import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { clean, zodToOpenApiSchema, zodToJsonSchema } from '../http/openapi/to-json-schema';

/**
 * Covers the untested branches in `http/openapi/to-json-schema.ts`:
 * `clean()` stripping zod's noisy safe-integer bounds, `zodToOpenApiSchema()`
 * rewriting `$ref`s for registered entities vs. leaving unregistered `$defs`
 * refs untouched, dropping a `$defs` block that becomes empty once its only
 * entries were entity refs, and short-circuiting to a bare `$ref` when the
 * root schema itself is a registered entity.
 */
describe('clean', () => {
  it('strips the safe-integer min/max bounds zod emits for .int()', () => {
    const node = {
      type: 'integer',
      minimum: -9007199254740991,
      maximum: 9007199254740991,
    };
    expect(clean(node)).toEqual({ type: 'integer' });
  });

  it('leaves non-safe-integer-bound minimum/maximum values untouched', () => {
    const node = { type: 'integer', minimum: 0, maximum: 100 };
    expect(clean(node)).toEqual({ type: 'integer', minimum: 0, maximum: 100 });
  });

  it('strips $schema and $id dialect markers', () => {
    const node = { $schema: 'https://json-schema.org/draft/2020-12/schema', $id: 'foo', type: 'string' };
    expect(clean(node)).toEqual({ type: 'string' });
  });
});

describe('zodToOpenApiSchema', () => {
  it('rewrites a nested $ref to a registered entity to the components location', () => {
    const Entity = z.object({ y: z.string() });
    const registry = z.registry<{ id: string }>();
    registry.add(Entity, { id: 'Entity' });

    const schema = z.object({ entity: Entity });
    const result = zodToOpenApiSchema(schema, 'output', registry);

    expect(result.properties.entity).toEqual({ $ref: '#/components/schemas/Entity' });
    // The only $defs entry was the entity itself, so the block is dropped entirely.
    expect(result.$defs).toBeUndefined();
  });

  it('leaves a $ref to an unregistered $defs entry untouched', () => {
    // A self-referential schema forces zod to hoist it into $defs under a
    // generated (unregistered) id, since it cannot be inlined.
    const registry = z.registry<{ id: string }>();
    const Category: z.ZodType<any> = z.object({
      name: z.string(),
      get children() {
        return z.array(Category);
      },
    });

    const schema = z.object({ category: Category });
    const result = zodToOpenApiSchema(schema, 'output', registry);

    const categoryRef = result.properties.category.$ref as string;
    expect(categoryRef).toMatch(/^#\/\$defs\//);
    const defsId = categoryRef.slice('#/$defs/'.length);
    expect(result.$defs[defsId].properties.children.items.$ref).toBe(categoryRef);
  });

  it('returns a bare $ref when the root schema is itself a registered entity', () => {
    const Entity = z.object({ y: z.string() });
    const registry = z.registry<{ id: string }>();
    registry.add(Entity, { id: 'Entity' });

    const result = zodToOpenApiSchema(Entity, 'output', registry);
    expect(result).toEqual({ $ref: '#/components/schemas/Entity' });
  });
});

describe('zodToJsonSchema', () => {
  it('inlines schemas fully with no $ref rewriting', () => {
    const schema = z.object({ name: z.string() });
    const result = zodToJsonSchema(schema, 'input');
    expect(result).toMatchObject({ type: 'object', properties: { name: { type: 'string' } } });
  });
});
