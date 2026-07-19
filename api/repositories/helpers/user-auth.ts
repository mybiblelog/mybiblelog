import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { getConfig } from '../../config';
import { UserRecord } from './types';
import { type UserJSON } from '../../validation/schemas/auth';
import { MAX_CODE_ATTEMPTS } from './verification-codes';

/**
 * Pure authentication helpers operating on UserRecord domain objects.
 * These replace the instance methods that previously lived on the
 * Mongoose User schema.
 */

const SALT_WORK_FACTOR = 10;

/**
 * Hashes a plaintext password with bcrypt. The user repository calls this
 * before persisting a password; it replaces the User schema's pre-save hook.
 */
export const hashPassword = (plain: string): Promise<string> => {
  return bcrypt.hash(plain, SALT_WORK_FACTOR);
};

// JWT lifetime; the auth cookie max age (authCurrentUser.ts) is derived from
// this so the cookie and the token it carries expire together.
export const AUTH_TOKEN_TTL_DAYS = 30;

export const generateUserJWT = (user: Pick<UserRecord, 'id' | 'isAdmin' | 'hasLocalAccount' | 'tokenVersion'>): string => {
  const { jwtSecret, siteUrl } = getConfig();
  const issuer = new URL(siteUrl).origin;
  const today = new Date();
  const exp = new Date(today);
  exp.setDate(today.getDate() + AUTH_TOKEN_TTL_DAYS);

  return jwt.sign({
    id: user.id,
    hasLocalAccount: user.hasLocalAccount,
    isAdmin: user.isAdmin,
    // Revocation marker: compared against the user's current tokenVersion on
    // every request so bumping it (password change, "log out all sessions")
    // invalidates this token.
    tokenVersion: user.tokenVersion,
    exp: Math.round(exp.getTime() / 1000),
  }, jwtSecret, {
    algorithm: 'HS256',
    issuer,
    audience: issuer,
  });
};

export const toAuthJSON = (user: Pick<UserRecord, 'hasLocalAccount' | 'email' | 'isAdmin'>): UserJSON => {
  return {
    hasLocalAccount: user.hasLocalAccount,
    email: user.email,
    isAdmin: user.isAdmin,
  };
};

export const isEmailVerified = (user: Pick<UserRecord, 'emailVerificationCode'>): boolean => {
  return user.emailVerificationCode === '';
};

/**
 * Constant-time string equality. Returns false immediately when the lengths
 * differ (which is not itself secret — codes are fixed length); otherwise uses
 * `crypto.timingSafeEqual` so the comparison time does not leak how many leading
 * characters matched, defeating timing-based guessing of a short numeric code.
 */
const constantTimeEqual = (a: string, b: string): boolean => {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(aBuf, bBuf);
};

/**
 * Validates a verification code against its expected value, expiration, and
 * per-code attempt cap. An empty `expectedCode` means "no code outstanding" and
 * never matches. `attempts` is the number of failed submissions already recorded
 * against this code; once it reaches MAX_CODE_ATTEMPTS the code is spent and the
 * user must request a new one. Comparison is constant-time.
 */
export const isCodeValid = ({ code, expectedCode, expiresAt, attempts = 0 }: {
  code: string;
  expectedCode: string;
  expiresAt: Date;
  attempts?: number;
}): boolean => {
  if (expectedCode === '') {
    return false;
  }
  if (attempts >= MAX_CODE_ATTEMPTS) {
    return false;
  }
  if (!constantTimeEqual(code, expectedCode)) {
    return false;
  }
  if (new Date().getTime() > expiresAt.getTime()) {
    return false;
  }
  return true;
};
