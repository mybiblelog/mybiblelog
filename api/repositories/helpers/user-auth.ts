import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import config from '../../config';
import { UserRecord } from './types';
import { type UserJSON } from '../../validation/schemas/auth';

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

export const generateUserJWT = (user: Pick<UserRecord, 'id' | 'isAdmin' | 'hasLocalAccount'>): string => {
  const today = new Date();
  const exp = new Date(today);
  exp.setDate(today.getDate() + AUTH_TOKEN_TTL_DAYS);

  return jwt.sign({
    id: user.id,
    hasLocalAccount: user.hasLocalAccount,
    isAdmin: user.isAdmin,
    exp: Math.round(exp.getTime() / 1000),
  }, config.jwtSecret, {
    algorithm: 'HS256',
    issuer: new URL(config.siteUrl).origin,
    audience: new URL(config.siteUrl).origin,
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
 * Validates a verification code against its expected value and expiration.
 * Replaces the verify*Code instance methods on the User schema.
 */
export const isCodeValid = ({ code, expectedCode, expiresAt }: {
  code: string;
  expectedCode: string;
  expiresAt: Date;
}): boolean => {
  if (code !== expectedCode) {
    return false;
  }
  if (new Date().getTime() > expiresAt.getTime()) {
    return false;
  }
  return true;
};
