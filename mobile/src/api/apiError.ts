/**
 * Mirrors the API's error envelope and the Nuxt web app's error-mapping helpers
 * so the mobile app surfaces the same messages.
 *
 * The API serializes errors as `{ error: { code, errors? } }` (see
 * `api/app.ts` error handler). `errors` is a list of field-level details; a
 * detail with `field: null` is a top-level/form error.
 */

export type ApiErrorDetail = {
  /** Field name for field-level errors; `null` for top-level/form errors. */
  field: string | null;
  /** Machine-readable code, e.g. `invalid_login` (maps to an i18n message). */
  code: string;
  /** Optional metadata interpolated into the message, e.g. `{ email }`. */
  properties?: Record<string, unknown>;
};

export type ApiErrorPayload = {
  code: string;
  errors: ApiErrorDetail[];
};

/**
 * Typed error thrown by the HTTP adapter on non-OK responses. Ported from the
 * Nuxt web app's `helpers/api-error.ts` so stores can branch on
 * `err instanceof ApiError` and surface the same field-level messages via
 * `mapFormErrors`.
 */
export class ApiError extends Error {
  readonly code: string;
  readonly errors: ApiErrorDetail[];
  /** HTTP status of the failed response, when known. */
  readonly status?: number;

  constructor(payload: ApiErrorPayload, status?: number) {
    super(payload.code);
    this.name = "ApiError";
    this.code = payload.code;
    this.errors = payload.errors ?? [];
    this.status = status;
  }
}

/**
 * Machine-readable code for any thrown value, for surfacing a translated
 * message instead of a raw (possibly platform-native) error string. Returns the
 * `ApiError` code when present, otherwise `unknown_error`.
 */
export function toApiErrorCode(err: unknown): string {
  return err instanceof ApiError ? err.code : "unknown_error";
}

/**
 * Extracts an `ApiErrorPayload` from a parsed response body. Falls back to a
 * generic `unknown_error` payload when the body doesn't match the expected shape.
 */
export function parseApiErrorBody(body: unknown): ApiErrorPayload {
  const error =
    body && typeof body === "object" ? (body as Record<string, unknown>).error : undefined;
  if (!error || typeof error !== "object") {
    return { code: "unknown_error", errors: [] };
  }

  const e = error as Record<string, unknown>;
  const code = typeof e.code === "string" && e.code ? e.code : "unknown_error";
  const rawErrors = Array.isArray(e.errors) ? e.errors : [];
  const errors: ApiErrorDetail[] = rawErrors.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const detail = entry as Record<string, unknown>;
    if (typeof detail.code !== "string") return [];
    return [
      {
        field: typeof detail.field === "string" ? detail.field : null,
        code: detail.code,
        properties:
          detail.properties && typeof detail.properties === "object"
            ? (detail.properties as Record<string, unknown>)
            : undefined,
      },
    ];
  });

  return { code, errors };
}

/**
 * Converts an `ApiErrorPayload` into a map keyed by field name, with top-level
 * errors under `_form`. Ported from the Nuxt `mapFormErrors` helper so behavior
 * matches the web app.
 */
export function mapFormErrors(payload: ApiErrorPayload): Record<string, ApiErrorDetail> {
  const formErrors: Record<string, ApiErrorDetail> = {};

  if (!payload.errors.length) {
    formErrors._form = { field: null, code: payload.code };
    return formErrors;
  }

  return payload.errors.reduce<Record<string, ApiErrorDetail>>((acc, err) => {
    if (err.field) {
      acc[err.field] = err;
    } else {
      acc._form = err;
    }
    return acc;
  }, formErrors);
}
