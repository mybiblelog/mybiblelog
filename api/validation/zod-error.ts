import { ZodError } from 'zod';
import { ApiErrorDetailCode } from '../http/errors/error-codes';
import { ApiErrorDetail } from '../http/response';

/**
 * Translates zod validation errors into the API's `ApiErrorDetail[]` shape.
 *
 * This replaces the old `translate-mongoose-error` helper: validation now
 * happens in route handlers via zod, so we map zod issue codes onto the same
 * `ApiErrorDetailCode` values (and `properties`) the frontend i18n relies on.
 */

type ZodIssue = ZodError['issues'][number];

// e.g. ['passages', 0, 'startVerseId'] -> 'passages.0.startVerseId'
// An empty path (top-level refinements) maps to a `null` field.
const fieldFromPath = (path: ReadonlyArray<PropertyKey>): string | null =>
  path.length ? path.map(String).join('.') : null;

const mapIssue = (issue: ZodIssue): ApiErrorDetail => {
  const field = fieldFromPath(issue.path);

  switch (issue.code) {
  // zod reports both missing keys and wrong-typed values as `invalid_type`.
  // The dominant case is a missing required field, so map to `required`.
  case 'invalid_type':
    return { field, code: ApiErrorDetailCode.Required };

  case 'too_small':
    // String/array length violations carry a meaningful minimum length;
    // numeric range violations are reported as a generic invalid value.
    return issue.origin === 'string' || issue.origin === 'array'
      ? { field, code: ApiErrorDetailCode.MinLength, properties: { minlength: Number(issue.minimum) } }
      : { field, code: ApiErrorDetailCode.NotValid };

  case 'too_big':
    return issue.origin === 'string' || issue.origin === 'array'
      ? { field, code: ApiErrorDetailCode.MaxLength, properties: { maxlength: Number(issue.maximum) } }
      : { field, code: ApiErrorDetailCode.NotValid };

    // Format (regex/email), enum/literal mismatches, and our custom
    // refinements (verse existence, verse range, ObjectId) are all "invalid".
  case 'invalid_format':
  case 'invalid_value':
  case 'not_multiple_of':
  case 'invalid_union':
  case 'invalid_key':
  case 'invalid_element':
  case 'custom':
    return { field, code: ApiErrorDetailCode.NotValid };

  default:
    return { field, code: ApiErrorDetailCode.Review };
  }
};

export const zodErrorToApiDetails = (error: ZodError): ApiErrorDetail[] =>
  error.issues.map(mapIssue);
