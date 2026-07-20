import { z } from 'zod';

// The code-based auth flows keep `code` a loose string in every body schema: an
// invalid/malformed code surfaces the friendly "expired" error from the handler
// (which looks the account up by email and compares the code) rather than a raw
// schema error. See resetPasswordBodySchema below and the handlers in
// api/http/handlers/auth/.

// bcrypt only uses the first 72 bytes of a password; longer values would be
// silently truncated, so we reject them at validation time.
const BCRYPT_MAX_PASSWORD_BYTES = 72;

export const passwordSchema = z
  .string()
  .min(8)
  .max(BCRYPT_MAX_PASSWORD_BYTES)
  .refine((value) => Buffer.byteLength(value, 'utf8') <= BCRYPT_MAX_PASSWORD_BYTES);

export const registerBodySchema = z.object({
  // An empty (or whitespace-only) email reports as `required` rather than
  // `invalid` so the UI shows "A email is required" — matching the inline
  // checks the login/email-change handlers use. A present-but-malformed value
  // still fails the regex as `invalid`. The leading `z.string()` keeps both the
  // generated OpenAPI schema and the parsed type honest (email stays required).
  email: z
    .string()
    .transform((value) => (value.trim() === '' ? undefined : value.toLowerCase()))
    .pipe(z.string().regex(/^\S+@\S+\.\S+$/)),
  password: passwordSchema,
});

export const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});

// Completing a password reset now identifies the account by email (the short
// code is not globally unique) and carries the typed/linked code plus the new
// password. `code` stays a loose string so an invalid one surfaces the friendly
// "reset link expired" error from the handler rather than a schema error.
export const resetPasswordBodySchema = z.object({
  email: z.string(),
  code: z.string(),
  newPassword: passwordSchema,
});

/**
 * The serialized shape of the authenticated user (see `toAuthJSON`). Single
 * source of truth for both that serializer's return type and the OpenAPI `User`
 * component.
 */
export const userSchema = z.object({
  hasLocalAccount: z.boolean(),
  email: z.string(),
  isAdmin: z.boolean(),
});

export type UserJSON = z.infer<typeof userSchema>;

/**
 * Request schemas for the auth endpoints whose handlers validate their input
 * inline rather than through `validate()`. Those handlers keep hand-rolled
 * `typeof … === 'string'` guards to reject NoSQL operator-injection payloads
 * (e.g. `{ email: { $gt: '' } }`) with endpoint-specific error codes. These
 * schemas mirror the accepted body for the generated OpenAPI docs.
 */
export const loginBodySchema = z.object({
  email: z.string(),
  password: z.string(),
});

export const googleVerifyBodySchema = z.object({
  code: z.string(),
  state: z.string(),
  locale: z.string().optional(),
});

export const googleIdTokenBodySchema = z.object({
  idToken: z.string(),
  locale: z.string().optional(),
});

export const verifyEmailBodySchema = z.object({
  email: z.string(),
  code: z.string(),
});

export const resendEmailVerificationBodySchema = z.object({
  email: z.string(),
  locale: z.string().optional(),
});

export const changeEmailBodySchema = z.object({
  newEmail: z.string(),
  password: z.string(),
});

// Completing a change identifies the account by its current email plus the code
// sent to the new address; either the modal (logged in) or the magic link
// (which embeds the current email) supplies both.
export const completeEmailChangeBodySchema = z.object({
  email: z.string(),
  code: z.string(),
});

export const resetPasswordInitBodySchema = z.object({
  email: z.string(),
});

// Step 1 of the reset modal: check a code before revealing the new-password
// fields. Also used to record a failed attempt against the code.
export const validateResetCodeBodySchema = z.object({
  email: z.string(),
  code: z.string(),
});

export const setPasswordBodySchema = z.object({
  password: passwordSchema,
  confirmPassword: passwordSchema,
});
