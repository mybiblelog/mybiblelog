/**
 * Represents all possible top-level errors that can be thrown by the API.
 * These codes are used to map to i18n keys for translation.
 *
 * Keep in sync with locales/locale.d.ts
 * @enum {string}
 */
export const ApiErrorCode = {
  ValidationError: 'validation_error', // 400
  InvalidRequest: 'invalid_request', // 400
  Unauthenticated: 'unauthenticated', // 401
  Unauthorized: 'unauthorized', // 403
  NotFound: 'not_found', // 404
  TooManyRequests: 'too_many_requests', // 429
  InternalServerError: 'internal_server_error', // 500
};

export type ApiErrorCode = typeof ApiErrorCode[keyof typeof ApiErrorCode];

/**
 * Represents all possible detail errors that can be thrown by the API.
 * These codes are used to map to i18n keys for translation.
 *
 * Keep in sync with locales/locale.d.ts
 * @enum {string}
 */
export const ApiErrorDetailCode = {
  // Request Input Validation Errors
  // (produced by zod request validation; see validation/zod-error.ts)
  Required: 'required',
  NotValid: 'not_valid',
  Unique: 'unique',
  MinLength: 'min_length', // properties.minlength
  MaxLength: 'max_length', // properties.maxlength
  LimitReached: 'limit_reached', // a per-user resource count limit was reached
  Review: 'review',

  // Custom Errors
  InvalidLogin: 'invalid_login',
  VerifyEmail: 'verify_email',
  NewEmailRequired: 'new_email_required',
  EmailInUse: 'email_in_use',
  PasswordIncorrect: 'password_incorrect',
  AccountNotFound: 'account_not_found',
  PasswordResetLinkExpired: 'password_reset_link_expired',
  EmailNotVerified: 'email_not_verified',
  VerificationCodeExpired: 'verification_code_expired',
  AdminCannotDeleteOwnAccount: 'admin_cannot_delete_own_account',
};

export type ApiErrorDetailCode = typeof ApiErrorDetailCode[keyof typeof ApiErrorDetailCode];
