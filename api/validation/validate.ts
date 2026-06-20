import { type Request } from 'express';
import { type ZodType } from 'zod';
import { ValidationError } from '../router/errors/validation-errors';
import { type ApiErrorDetail } from '../router/response';
import { zodErrorToApiDetails } from './zod-error';

interface ValidationSchemas<P, Q, B> {
  params?: ZodType<P>;
  query?: ZodType<Q>;
  body?: ZodType<B>;
}

/**
 * Validates and types the requested parts of an Express request using zod.
 *
 * Returns the parsed (and transformed) `params`, `query`, and `body` values.
 * Callers must use the returned values rather than reading `req.*` directly,
 * since zod transforms (trimming, coercion, defaults) produce new objects and
 * Express 5's `req.query` is a non-writable getter.
 *
 * All issues across the three sources are aggregated into a single
 * `ValidationError` (400) so the client sees every problem at once.
 */
export const validate = <P = unknown, Q = unknown, B = unknown>(
  req: Request,
  schemas: ValidationSchemas<P, Q, B>,
): { params: P; query: Q; body: B } => {
  const details: ApiErrorDetail[] = [];
  const out: { params?: P; query?: Q; body?: B } = {};

  if (schemas.params) {
    const result = schemas.params.safeParse(req.params);
    if (result.success) { out.params = result.data; }
    else { details.push(...zodErrorToApiDetails(result.error)); }
  }
  if (schemas.query) {
    const result = schemas.query.safeParse(req.query);
    if (result.success) { out.query = result.data; }
    else { details.push(...zodErrorToApiDetails(result.error)); }
  }
  if (schemas.body) {
    const result = schemas.body.safeParse(req.body);
    if (result.success) { out.body = result.data; }
    else { details.push(...zodErrorToApiDetails(result.error)); }
  }

  if (details.length) {
    throw new ValidationError(details);
  }

  return out as { params: P; query: Q; body: B };
};
