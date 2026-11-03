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
    .describe('Email address for the new account (stored lowercased)')
    .transform((value) => (value.trim() === '' ? undefined : value.toLowerCase()))
    .pipe(z.string().regex(/^\S+@\S+\.\S+$/)),
  password: passwordSchema.describe('Password: 8–72 bytes (bcrypt reads only the first 72)'),
}).describe('A new local account. A verification email is sent when email verification is required.');

export const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1).describe('The account\'s current password'),
  newPassword: passwordSchema.describe('The new password: 8–72 bytes'),
}).describe('Changes the password of the authenticated account and re-issues the session.');

// Completing a password reset now identifies the account by email (the short
// code is not globally unique) and carries the typed/linked code plus the new
// password. `code` stays a loose string so an invalid one surfaces the friendly
// "reset link expired" error from the handler rather than a schema error.
export const resetPasswordBodySchema = z.object({
  email: z.string().describe('Email address of the account being reset'),
  code: z.string().describe('Reset code from the password reset email'),
  newPassword: passwordSchema.describe('The new password: 8–72 bytes'),
}).describe('Completes a password reset with the emailed code.');

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
  email: z.string().describe('Account email address'),
  password: z.string().describe('Account password'),
}).describe('Email/password credentials.');

export const googleVerifyBodySchema = z.object({
  code: z.string().describe('Authorization code returned by Google\'s OAuth2 redirect'),
  state: z.string().describe('The `state` value returned by the OAuth2 redirect, checked against the one issued'),
  locale: z.string().optional().describe('UI locale code applied to a newly created account'),
}).describe('Completes the Google OAuth2 authorization-code flow (web).');

export const googleIdTokenBodySchema = z.object({
  idToken: z.string().describe('Google ID token obtained by the native sign-in SDK'),
  locale: z.string().optional().describe('UI locale code applied to a newly created account'),
}).describe('Signs in with a Google ID token (mobile).');

export const verifyEmailBodySchema = z.object({
  email: z.string().describe('Email address being verified'),
  code: z.string().describe('Verification code from the verification email'),
}).describe('Verifies an account\'s email address and signs the user in.');

export const resendEmailVerificationBodySchema = z.object({
  email: z.string().describe('Email address of the unverified account'),
  locale: z.string().optional().describe('Locale code for the email\'s language'),
}).describe('Requests a new verification email. Always responds with success so it does not reveal which emails have accounts.');

export const changeEmailBodySchema = z.object({
  newEmail: z.string().describe('The address to change to; a confirmation code is sent there'),
  password: z.string().describe('The account\'s current password'),
}).describe('Starts changing the authenticated account\'s email address.');

// Completing a change identifies the account by its current email plus the code
// sent to the new address; either the modal (logged in) or the magic link
// (which embeds the current email) supplies both.
export const completeEmailChangeBodySchema = z.object({
  email: z.string().describe('The account\'s current email address'),
  code: z.string().describe('Confirmation code sent to the new address'),
}).describe('Completes an email change with the code sent to the new address.');

export const resetPasswordInitBodySchema = z.object({
  email: z.string().describe('Email address of the account to reset'),
}).describe('Requests a password reset email. Always responds with success so it does not reveal which emails have accounts.');

// Step 1 of the reset modal: check a code before revealing the new-password
// fields. Also used to record a failed attempt against the code.
export const validateResetCodeBodySchema = z.object({
  email: z.string().describe('Email address of the account being reset'),
  code: z.string().describe('Reset code to check'),
}).describe('Checks a password reset code without using it up.');

export const setPasswordBodySchema = z.object({
  password: passwordSchema.describe('The new password: 8–72 bytes'),
  confirmPassword: passwordSchema.describe('Must match `password`'),
}).describe('Sets a first password on an account that only signs in with Google.');
