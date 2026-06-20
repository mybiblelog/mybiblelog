import { z } from 'zod';

// bcrypt only uses the first 72 bytes of a password; longer values would be
// silently truncated, so we reject them at validation time.
const BCRYPT_MAX_PASSWORD_BYTES = 72;

export const passwordSchema = z
  .string()
  .min(8)
  .max(BCRYPT_MAX_PASSWORD_BYTES)
  .refine((value) => Buffer.byteLength(value, 'utf8') <= BCRYPT_MAX_PASSWORD_BYTES);

export const registerBodySchema = z.object({
  email: z.string().toLowerCase().regex(/^\S+@\S+\.\S+$/),
  password: passwordSchema,
});

export const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});

export const resetPasswordBodySchema = z.object({
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
 * Documentation-only request schemas for the auth endpoints that still validate
 * their input inline (the handlers are Express-coupled and not yet migrated).
 * They describe the accepted request body for the generated OpenAPI docs; when
 * these endpoints are migrated to framework-agnostic handlers they should be
 * wired into `validate()` so the docs and validation share one definition.
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

export const verifyEmailBodySchema = z.object({
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

export const resetPasswordInitBodySchema = z.object({
  email: z.string(),
});
