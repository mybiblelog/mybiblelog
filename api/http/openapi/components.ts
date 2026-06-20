import { ApiErrorCode } from '../errors/error-codes';
import { entityComponentSchemas } from './entity-schemas';

/**
 * Reusable OpenAPI component schemas referenced by `$ref` across the docs.
 *
 * The error-envelope schemas mirror the response types in `http/response.ts`
 * and are authored here once (rather than re-declared as JSDoc in every router).
 * The top-level error `enum` is sourced from `ApiErrorCode` so it cannot drift
 * from the codes the API actually emits. The entity schemas (`User`,
 * `Feedback`, `LogEntry`, ...) are generated from their zod schemas in
 * `entity-schemas.ts`.
 */
const errorEnvelopeSchemas: Record<string, any> = {
  ApiErrorDetail: {
    type: 'object',
    required: ['code'],
    properties: {
      field: {
        type: 'string',
        nullable: true,
        description: 'Field name for field-level errors, or null for top-level errors',
      },
      code: { type: 'string', description: 'Machine-readable i18n-friendly error code' },
      properties: {
        type: 'object',
        additionalProperties: true,
        description: 'Optional metadata for the error',
      },
    },
  },
  ApiError: {
    type: 'object',
    required: ['code'],
    properties: {
      code: {
        type: 'string',
        description: 'Top-level error code',
        enum: Object.values(ApiErrorCode),
      },
      errors: {
        type: 'array',
        items: { $ref: '#/components/schemas/ApiErrorDetail' },
        description: 'Optional array of field errors',
      },
    },
  },
  ApiErrorResponse: {
    type: 'object',
    required: ['error'],
    properties: {
      error: { $ref: '#/components/schemas/ApiError' },
    },
  },
};

export const componentSchemas: Record<string, any> = {
  ...errorEnvelopeSchemas,
  ...entityComponentSchemas,
};
