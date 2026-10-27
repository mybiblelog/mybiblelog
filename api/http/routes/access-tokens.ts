import { z } from 'zod';
import { type RouteDefinition } from '../types';
import { objectIdParam } from '../../validation/primitives';
import {
  accessTokenCreateSchema,
  accessTokenCreatedSchema,
  accessTokenSchema,
} from '../../validation/schemas/access-token';
import { listAccessTokens, createAccessToken, deleteAccessToken } from '../handlers/access-tokens';

/**
 * Framework-neutral route table for personal access tokens. None of these
 * routes declares `scopes`, so they accept a signed-in session only: an access
 * token cannot manage tokens, including itself.
 */
const tags = ['AccessTokens'];

export const accessTokenRoutes: RouteDefinition[] = [
  {
    method: 'GET',
    path: '/access-tokens',
    handler: listAccessTokens,
    docs: {
      operationId: 'listAccessTokens',
      summary: 'List the current user\'s personal access tokens',
      tags,
      response: { description: 'The user\'s tokens, newest first, including expired ones', schema: z.array(accessTokenSchema) },
      errors: [401],
    },
  },
  {
    method: 'POST',
    path: '/access-tokens',
    handler: createAccessToken,
    docs: {
      operationId: 'createAccessToken',
      summary: 'Create a personal access token',
      description: 'The token value is in this response only; it is stored as a hash and cannot be shown again. A user can hold a limited number of unexpired tokens.',
      tags,
      request: { body: accessTokenCreateSchema },
      response: { description: 'The new token and its details', schema: accessTokenCreatedSchema },
      errors: [400, 401, 429],
    },
  },
  {
    method: 'DELETE',
    path: '/access-tokens/:id',
    handler: deleteAccessToken,
    docs: {
      operationId: 'deleteAccessToken',
      summary: 'Revoke a personal access token',
      tags,
      destructive: true,
      request: { params: objectIdParam },
      response: { description: 'The token was revoked', schema: z.boolean() },
    },
  },
];
