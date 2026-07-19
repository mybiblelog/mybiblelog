import crypto from 'node:crypto';

/**
 * Shared configuration for the short numeric verification codes used by the
 * email-verification, password-reset, and change-email flows.
 *
 * These codes are emailed to the user (both as a typed code and embedded in a
 * magic link) and validated server-side against the account looked up by email.
 * Because a short code is not globally unique, lookups are email-scoped and the
 * brute-force surface is contained by a per-code attempt cap plus IP/email rate
 * limiting at the route layer.
 */

/** Number of digits in a verification code. */
export const CODE_LENGTH = 6;

/** How long a freshly issued code remains valid. */
export const CODE_TTL_MS = 10 * 60 * 1000;

/**
 * How many failed submissions a single code tolerates before it is treated as
 * invalid. Once exceeded, the user must request a new code.
 */
export const MAX_CODE_ATTEMPTS = 5;

/**
 * Generates a zero-padded numeric code (e.g. "042317"). `crypto.randomInt` draws
 * from a cryptographically secure source; padding keeps every code exactly
 * `CODE_LENGTH` digits so the constant-time comparison always sees equal lengths.
 */
export const generateVerificationCode = (): string =>
  crypto.randomInt(0, 10 ** CODE_LENGTH).toString().padStart(CODE_LENGTH, '0');
