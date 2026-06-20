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
