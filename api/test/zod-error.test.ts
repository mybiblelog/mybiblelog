import { describe, it, expect } from 'vitest';
import { z, ZodError } from 'zod';
import { zodErrorToApiDetails } from '../validation/zod-error';
import { ApiErrorDetailCode } from '../http/errors/error-codes';

/**
 * Unit tests for `zodErrorToApiDetails` / `mapIssue`, which translate zod issue
 * codes into the API's `ApiErrorDetail` shape (see validation/zod-error.ts).
 * Each case below drives the mapping via a real zod `safeParse` failure so the
 * issue shapes match what zod actually produces, rather than hand-rolling
 * issue objects that could drift from zod's real output.
 */
describe('zodErrorToApiDetails (unit)', () => {
  it('maps invalid_type (e.g. a missing/wrong-typed field) to required', () => {
    const schema = z.object({ name: z.string() });
    const result = schema.safeParse({});
    expect(result.success).toBe(false);

    const details = zodErrorToApiDetails(result.error!);
    expect(details).toEqual([{ field: 'name', code: ApiErrorDetailCode.Required }]);
  });

  it('lets a custom refinement choose its API code via params.apiCode', () => {
    const schema = z.object({ a: z.string().optional() })
      .refine((v) => v.a !== undefined, { path: ['a'], params: { apiCode: ApiErrorDetailCode.Required } });
    const result = schema.safeParse({});
    expect(result.success).toBe(false);

    const details = zodErrorToApiDetails(result.error!);
    expect(details).toEqual([{ field: 'a', code: ApiErrorDetailCode.Required }]);
  });

  it('maps too_small on a string to min_length with the minimum length', () => {
    const schema = z.object({ password: z.string().min(8) });
    const result = schema.safeParse({ password: 'ab' });
    expect(result.success).toBe(false);

    const details = zodErrorToApiDetails(result.error!);
    expect(details).toEqual([{
      field: 'password',
      code: ApiErrorDetailCode.MinLength,
      properties: { minlength: 8 },
    }]);
  });

  it('maps too_small on a number to a generic not_valid (no length semantics)', () => {
    const schema = z.object({ age: z.number().min(3) });
    const result = schema.safeParse({ age: 1 });
    expect(result.success).toBe(false);

    const details = zodErrorToApiDetails(result.error!);
    expect(details).toEqual([{ field: 'age', code: ApiErrorDetailCode.NotValid }]);
  });

  it('maps too_big on an array to max_length with the maximum length', () => {
    const schema = z.object({ tags: z.array(z.string()).max(2) });
    const result = schema.safeParse({ tags: ['a', 'b', 'c'] });
    expect(result.success).toBe(false);

    const details = zodErrorToApiDetails(result.error!);
    expect(details).toEqual([{
      field: 'tags',
      code: ApiErrorDetailCode.MaxLength,
      properties: { maxlength: 2 },
    }]);
  });

  it('maps too_big on a number to a generic not_valid (no length semantics)', () => {
    const schema = z.object({ age: z.number().max(2) });
    const result = schema.safeParse({ age: 5 });
    expect(result.success).toBe(false);

    const details = zodErrorToApiDetails(result.error!);
    expect(details).toEqual([{ field: 'age', code: ApiErrorDetailCode.NotValid }]);
  });

  it('maps invalid_format (e.g. a malformed email) to not_valid', () => {
    const schema = z.object({ email: z.string().email() });
    const result = schema.safeParse({ email: 'not-an-email' });
    expect(result.success).toBe(false);

    const details = zodErrorToApiDetails(result.error!);
    expect(details).toEqual([{ field: 'email', code: ApiErrorDetailCode.NotValid }]);
  });

  it('maps custom refinement failures to not_valid, with a null field for a top-level refinement', () => {
    const schema = z.object({ a: z.string() }).refine(() => false, { message: 'bad' });
    const result = schema.safeParse({ a: 'x' });
    expect(result.success).toBe(false);

    const details = zodErrorToApiDetails(result.error!);
    expect(details).toEqual([{ field: null, code: ApiErrorDetailCode.NotValid }]);
  });

  it('maps an unrecognized/unmapped issue code to the review fallback', () => {
    // Every zod issue code the API's schemas can actually produce is handled
    // explicitly by `mapIssue`; this exercises the `default` branch for a
    // hypothetical future/unknown code, which should degrade to `review`
    // rather than throwing.
    const error = new ZodError([
      {
        code: 'this_is_not_a_real_zod_code' as any,
        path: ['field'],
        message: 'unknown issue code',
      } as any,
    ]);

    const details = zodErrorToApiDetails(error);
    expect(details).toEqual([{ field: 'field', code: ApiErrorDetailCode.Review }]);
  });

  it('joins nested/array paths with dots, and uses null for an empty path', () => {
    const schema = z.object({
      passages: z.array(z.object({ startVerseId: z.string() })),
    });
    const result = schema.safeParse({ passages: [{ startVerseId: 5 }] });
    expect(result.success).toBe(false);

    const details = zodErrorToApiDetails(result.error!);
    expect(details).toEqual([{ field: 'passages.0.startVerseId', code: ApiErrorDetailCode.Required }]);
  });
});
