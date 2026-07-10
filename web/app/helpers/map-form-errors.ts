import type { ApiErrorDetail, ApiErrorPayload } from './api-error';

/**
 * Converts a normalized API error structure to a map of form errors.
 */
const mapFormErrors = (error: ApiErrorPayload): Record<string, ApiErrorDetail> => {
  const formErrors: Record<string, ApiErrorDetail> = {};

  if (!error.errors?.length) {
    formErrors._form = { field: null, code: error.code };
  }

  return error.errors?.reduce<Record<string, ApiErrorDetail>>((acc, err) => {
    if (err.field) {
      acc[err.field] = err;
    }
    else {
      acc._form = err;
    }
    return acc;
  }, formErrors) ?? formErrors;
};

export default mapFormErrors;
