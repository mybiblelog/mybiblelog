import type { ApiErrorDetail } from "@/src/api/apiError";
import type { TranslationKey } from "@/src/i18n";

/**
 * Maps an API error `code` to its i18n message key. Mirrors the Nuxt `$terr`
 * helper, which translates `api_error.${code}`. Codes without an entry have no
 * user-facing message and fall back to a generic error at the call site.
 */
const API_ERROR_MESSAGE_KEYS = {
  unknown_error: "api_error_unknown_error",
  network_error: "api_error_network_error",
  validation_error: "api_error_validation_error",
  required: "api_error_required",
  is_invalid: "api_error_is_invalid",
  unique: "api_error_unique",
  min_length: "api_error_min_length",
  max_length: "api_error_max_length",
  review: "api_error_review",
  not_found: "api_error_not_found",
  invalid_login: "api_error_invalid_login",
  verify_email: "api_error_verify_email",
  new_email_required: "api_error_new_email_required",
  email_in_use: "api_error_email_in_use",
  password_incorrect: "api_error_password_incorrect",
  account_not_found: "api_error_account_not_found",
  password_reset_link_expired: "api_error_password_reset_link_expired",
  too_many_requests: "api_error_too_many_requests",
  invalid_request: "api_error_invalid_request",
  email_not_verified: "api_error_email_not_verified",
  verification_code_expired: "api_error_verification_code_expired",
} satisfies Record<string, TranslationKey>;

type TFn = (key: TranslationKey, options?: Record<string, unknown>) => string;

/**
 * Translates a single API error detail. Returns `null` when the code has no
 * known message so the caller can decide on a fallback. The detail's `field`
 * and `properties` are passed through for interpolation (e.g. `%{field}`,
 * `%{email}`, `%{minlength}`), matching the web app.
 */
export function translateApiError(t: TFn, detail: ApiErrorDetail): string | null {
  const key = API_ERROR_MESSAGE_KEYS[detail.code as keyof typeof API_ERROR_MESSAGE_KEYS];
  if (!key) return null;
  return t(key, {
    field: detail.field ?? undefined,
    ...(detail.properties ?? {}),
  });
}

/**
 * Translates a bare API error `code` (e.g. from `toApiErrorCode`) to a
 * user-facing message, falling back to the generic `unknown_error` message for
 * codes without a specific one. Use for surfacing store error states in the UI
 * so a raw error string is never shown.
 */
export function translateApiErrorCode(t: TFn, code: string): string {
  return translateApiError(t, { field: null, code }) ?? t("api_error_unknown_error");
}
