import jwt from 'jsonwebtoken';
import { ACCESS_TOKEN_PREFIX, type AccessTokenScope } from '@mybiblelog/shared';
import { getConfig } from '../../config';
import useRepositories from '../../repositories/useRepositories';
import { parseCookieHeader } from './parse-cookie-header';
import { AUTH_TOKEN_TTL_DAYS } from '../../repositories/helpers/user-auth';
import { type AccessTokenRecord, type UserRecord } from '../../repositories/helpers/types';
import { UnauthenticatedError, UnauthorizedError } from '../errors/http-errors';
import { ApiErrorDetailCode } from '../errors/error-codes';

/**
 * Minimal, framework-agnostic request shape this helper needs. Both the
 * normalized `HttpRequest` (see `api/http/types.ts`) and Express's `req`
 * structurally satisfy this, so the helper works under any adapter without
 * depending on Express.
 */
type AuthRequest = {
  headers: Record<string, string | string[] | undefined>;
  /** The scopes an access token needs for this route; see `RouteDefinition.scopes`. */
  requiredScopes?: readonly AccessTokenScope[];
};

type AuthOptions = { optional?: boolean; adminOnly?: boolean };

/** The authenticated user, plus the access token they authenticated with, if any. */
export type AuthResult = { user: UserRecord; accessToken: AccessTokenRecord | null };

export const AUTH_COOKIE_NAME = 'auth_token';
// Keep the cookie lifetime in sync with the JWT it carries
export const AUTH_COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * AUTH_TOKEN_TTL_DAYS;

const jwtAlgorithms: jwt.Algorithm[] = ['HS256'];

// NOTE: the auth-token cookie is set declaratively via `HttpResult.cookies`
// (see `auth-cookie.ts`); the adapter performs the actual `res.cookie()` call,
// which keeps this helper framework-agnostic.

const isAccessToken = (token: string): boolean => token.startsWith(ACCESS_TOKEN_PREFIX);

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

  // The cookie only ever carries a session. An access token is accepted from
  // the Authorization header alone, so a browser never sends one implicitly.
  const cookies = parseCookieHeader(cookieHeader);
  const cookieToken = cookies[AUTH_COOKIE_NAME] || null;
  return cookieToken && !isAccessToken(cookieToken) ? cookieToken : null;
};

/**
 * Decides whether an access token may make this request. Pure, so the rules
 * are testable without a database.
 *
 * Revocation, expiry and the owner's `tokenVersion` are checked before scopes,
 * so a dead token always reads as 401 (sign in again) rather than 403. A route
 * that declares no scopes rejects every access token: routes are session-only
 * until they opt in, and admin routes never opt in.
 */
export const checkAccessToken = (
  accessToken: AccessTokenRecord | null,
  user: UserRecord | null,
  { requiredScopes, adminOnly = false, now = new Date() }: { requiredScopes?: readonly AccessTokenScope[]; adminOnly?: boolean; now?: Date },
): UserRecord => {
  if (!accessToken || !user || accessToken.expiresAt <= now || accessToken.tokenVersion !== user.tokenVersion) {
    throw new UnauthenticatedError();
  }
  const required = adminOnly ? [] : (requiredScopes ?? []);
  if (required.length === 0 || !required.every((scope) => accessToken.scopes.includes(scope))) {
    throw new UnauthorizedError([{
      field: null,
      code: ApiErrorDetailCode.InsufficientScope,
      properties: { requiredScopes: [...required] },
    }]);
  }
  return user;
};

const authenticateAccessToken = async (req: AuthRequest, token: string, adminOnly: boolean): Promise<AuthResult> => {
  const { accessTokens, users } = await useRepositories();
  const accessToken = await accessTokens.findByToken(token);
  const owner = accessToken && await users.findById(accessToken.ownerId);
  const user = checkAccessToken(accessToken, owner, { requiredScopes: req.requiredScopes, adminOnly });
  return { user, accessToken };
};

/**
 * Authenticates a request from its session JWT (Authorization header or auth
 * cookie) or its personal access token (Authorization header only). Returns
 * `null` for an anonymous or invalid session when `optional` is set. An access
 * token is never treated as anonymous: one that cannot make this request is an
 * error even on an optional route, so an agent hears why instead of silently
 * acting as nobody.
 */
export async function authenticateRequest(req: AuthRequest, opts: { optional: true; adminOnly?: boolean }): Promise<AuthResult | null>;
export async function authenticateRequest(req: AuthRequest, opts?: { optional?: false; adminOnly?: boolean }): Promise<AuthResult>;
export async function authenticateRequest(req: AuthRequest, { optional = false, adminOnly = false }: AuthOptions = {}): Promise<AuthResult | null> {
  const token = getTokenFromHeader(req);
  if (token && isAccessToken(token)) {
    return authenticateAccessToken(req, token, adminOnly);
  }
  const user = await authenticateSession(token, { optional, adminOnly });
  return user && { user, accessToken: null };
}

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

async function authCurrentUser(req: AuthRequest, opts: AuthOptions = {}): Promise<UserRecord | null> {
  const result = await authenticateRequest(req, opts as { optional: true; adminOnly?: boolean });
  return result?.user ?? null;
}

async function authenticateSession(token: string | null, { optional = false, adminOnly = false }: AuthOptions): Promise<UserRecord | null> {
  const { jwtSecret, siteUrl } = getConfig();
  const jwtIssuer = new URL(siteUrl).origin;
  const jwtAudience = jwtIssuer;

  const { users } = await useRepositories();

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
  // Enforce token revocation: a token minted before the user's tokenVersion was
  // bumped (password change/reset, "log out all sessions") no longer matches and
  // is rejected. Legacy tokens carry no version and are treated as 0.
  const payloadVersion = (payload as { tokenVersion?: unknown }).tokenVersion;
  const tokenVersion = typeof payloadVersion === 'number' ? payloadVersion : 0;
  if (tokenVersion !== user.tokenVersion) {
    if (!optional) {
      throw new UnauthenticatedError();
    }
    return null;
  }
  if (adminOnly && !user.isAdmin) {
    throw new UnauthorizedError();
  }
  return user;
}

export default authCurrentUser;
