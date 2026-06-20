import jwt from 'jsonwebtoken';
import config from '../../config';
import useRepositories from '../../repositories/useRepositories';
import { type Response } from 'express';
import { parseCookieHeader } from './parseCookieHeader';
import { AUTH_TOKEN_TTL_DAYS } from '../../repositories/helpers/user-auth';
import { type UserRecord } from '../../repositories/helpers/types';
import { UnauthenticatedError, UnauthorizedError } from '../errors/http-errors';

/**
 * Minimal, framework-agnostic request shape this helper needs. Both the
 * normalized `HttpRequest` (see `api/http/types.ts`) and Express's `req`
 * structurally satisfy this, so the helper works under any adapter without
 * depending on Express.
 */
type AuthRequest = {
  headers: Record<string, string | string[] | undefined>;
};

export const AUTH_COOKIE_NAME = 'auth_token';
// Keep the cookie lifetime in sync with the JWT it carries
export const AUTH_COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * AUTH_TOKEN_TTL_DAYS;

const { jwtSecret, siteUrl } = config;
const jwtIssuer = new URL(siteUrl).origin;
const jwtAudience = jwtIssuer;
const jwtAlgorithms: jwt.Algorithm[] = ['HS256'];

export const setAuthTokenCookie = (res: Response, token: string) => {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: AUTH_COOKIE_MAX_AGE,
    sameSite: 'lax',
  });
};

const getTokenFromHeader = (req: AuthRequest): string | null => {
  const authorizationHeader = req.headers.authorization;
  if (typeof authorizationHeader === 'string') {
    const [tokenType, token] = authorizationHeader.split(' ');
    if (token && (tokenType === 'Token' || tokenType === 'Bearer')) {
      return token;
    }
  }

  const cookieHeader = req.headers.cookie;
  if (typeof cookieHeader !== 'string') {
    return null;
  }

  const cookies = parseCookieHeader(cookieHeader);
  return cookies[AUTH_COOKIE_NAME] || null;
};

async function authCurrentUser(
  req: AuthRequest,
): Promise<UserRecord>;

async function authCurrentUser(
  req: AuthRequest,
  opts: { optional?: false; adminOnly?: boolean }
): Promise<UserRecord>;

async function authCurrentUser(
  req: AuthRequest,
  opts: { optional: true; adminOnly?: boolean }
): Promise<UserRecord | null>;

async function authCurrentUser(req: AuthRequest, { optional = false, adminOnly = false } = {}): Promise<UserRecord | null> {
  const { users } = await useRepositories();

  const token = getTokenFromHeader(req);
  if (!token) {
    if (!optional) {
      throw new UnauthenticatedError();
    }
    return null;
  }

  let payload;
  try {
    payload = await new Promise((resolve, reject) => {
      jwt.verify(token, jwtSecret, {
        algorithms: jwtAlgorithms,
        issuer: jwtIssuer,
        audience: jwtAudience,
      }, (err, payload) => {
        if (err) {
          return reject(err);
        }
        resolve(payload);
      });
    });
  }
  catch (err) {
    if (!optional) {
      throw new UnauthenticatedError();
    }
    return null;
  }

  if (typeof payload !== 'object' || payload === null || !('id' in payload)) {
    if (!optional) {
      throw new UnauthenticatedError();
    }
    return null;
  }

  const userId = (payload as { id?: unknown }).id;
  if (typeof userId !== 'string' && typeof userId !== 'number') {
    if (!optional) {
      throw new UnauthenticatedError();
    }
    return null;
  }

  const user: UserRecord | null = await users.findById(String(userId));
  if (!user) {
    // We throw an error even when optional because the token is expired
    // and the client will need to re-authenticate. (Or the account was deleted.)
    throw new UnauthenticatedError();
  }
  if (adminOnly && !user.isAdmin) {
    throw new UnauthorizedError();
  }
  return user;
}

export default authCurrentUser;
