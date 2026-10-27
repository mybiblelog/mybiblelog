import { MAX_ACTIVE_ACCESS_TOKENS } from '@mybiblelog/shared';
import { toAccessTokenJSON } from '../../repositories/helpers/serializers';
import { InvalidRequestError, NotFoundError } from '../errors/http-errors';
import { ApiErrorDetailCode } from '../errors/error-codes';
import { validate } from '../../validation/validate';
import { objectIdParam } from '../../validation/primitives';
import { accessTokenCreateSchema } from '../../validation/schemas/access-token';
import { type RouteHandler } from '../types';

/**
 * Framework-agnostic handlers for managing personal access tokens.
 *
 * These routes declare no `scopes`, so only a signed-in session reaches them:
 * an access token can never list, mint or revoke tokens.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

// GET /access-tokens - List the current user's tokens (never the token values)
export const listAccessTokens: RouteHandler = async (req, deps) => {
  const currentUser = await deps.authenticate(req);
  const accessTokens = await deps.repositories.accessTokens.listByOwner(currentUser.id);
  return { status: 200, body: { data: accessTokens.map(toAccessTokenJSON) } };
};

// POST /access-tokens - Create a token; the response is the only time its value is shown
export const createAccessToken: RouteHandler = async (req, deps) => {
  await deps.rateLimiter.check(req, { maxRequests: 10, windowMs: 60 * 60 * 1000 });
  const { body } = validate(req, { body: accessTokenCreateSchema });
  const currentUser = await deps.authenticate(req);

  const now = new Date();
  const unexpired = await deps.repositories.accessTokens.countUnexpiredByOwner(currentUser.id, now);
  if (unexpired >= MAX_ACTIVE_ACCESS_TOKENS) {
    throw new InvalidRequestError([{
      field: null,
      code: ApiErrorDetailCode.AccessTokenLimit,
      properties: { limit: MAX_ACTIVE_ACCESS_TOKENS },
    }]);
  }

  const { record, token } = await deps.repositories.accessTokens.create(currentUser.id, {
    name: body.name,
    scopes: body.scopes,
    expiresAt: new Date(now.getTime() + body.expiresInDays * DAY_MS),
    tokenVersion: currentUser.tokenVersion,
  });
  return { status: 200, body: { data: { token, accessToken: toAccessTokenJSON(record) } } };
};

// DELETE /access-tokens/:id - Revoke a token
export const deleteAccessToken: RouteHandler = async (req, deps) => {
  const { params } = validate(req, { params: objectIdParam });
  const currentUser = await deps.authenticate(req);

  const deleted = await deps.repositories.accessTokens.deleteByIdForOwner(currentUser.id, params.id);
  if (!deleted) {
    throw new NotFoundError();
  }
  return { status: 200, body: { data: true } };
};
