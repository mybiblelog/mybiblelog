import { z } from 'zod';
import {
  ACCESS_TOKEN_EXPIRY_DAYS,
  ACCESS_TOKEN_SCOPES,
  DEFAULT_ACCESS_TOKEN_EXPIRY_DAYS,
} from '@mybiblelog/shared';

const scope = z.enum(ACCESS_TOKEN_SCOPES);

export const accessTokenCreateSchema = z.object({
  name: z.string().trim().min(1).max(60).describe('What the token is for, e.g. "Claude", 1–60 characters'),
  scopes: z.array(scope).min(1).refine((scopes) => new Set(scopes).size === scopes.length)
    .describe('What the token may do; at least one, no duplicates'),
  expiresInDays: z.union(ACCESS_TOKEN_EXPIRY_DAYS.map((days) => z.literal(days)))
    .default(DEFAULT_ACCESS_TOKEN_EXPIRY_DAYS)
    .describe(`Days until the token expires: ${ACCESS_TOKEN_EXPIRY_DAYS.join(', ')} (default ${DEFAULT_ACCESS_TOKEN_EXPIRY_DAYS})`),
}).describe('A new personal access token.');

export type AccessTokenCreateBody = z.infer<typeof accessTokenCreateSchema>;

/** The serialized shape of an access token (see `toAccessTokenJSON`). Never includes the token itself. */
export const accessTokenSchema = z.object({
  id: z.string(),
  name: z.string(),
  prefix: z.string().describe('The first characters of the token, to tell tokens apart'),
  scopes: z.array(scope),
  createdAt: z.string().describe('ISO 8601 timestamp'),
  expiresAt: z.string().describe('ISO 8601 timestamp'),
  lastUsedAt: z.string().nullable().describe('ISO 8601 timestamp, accurate to a few minutes; null if never used'),
});

export type AccessTokenJSON = z.infer<typeof accessTokenSchema>;

export const accessTokenCreatedSchema = z.object({
  token: z.string().describe('The token itself. It is shown only in this response and cannot be retrieved again.'),
  accessToken: accessTokenSchema,
});
