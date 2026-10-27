/**
 * Permissions a personal access token can carry. The API enforces them (a route
 * accepts a token only when it declares the scopes it needs), the web settings
 * page offers them, and the MCP server reports which tools a token unlocks.
 *
 * There is deliberately no scope for account, authentication, settings changes,
 * reminders or admin routes: a token can never reach them, whatever it holds.
 */
export const ACCESS_TOKEN_SCOPES = [
  'logs:read',
  'logs:write',
  'notes:read',
  'notes:write',
  'scripture:read',
] as const;

export type AccessTokenScope = typeof ACCESS_TOKEN_SCOPES[number];

/** Every token string starts with this, which is how the API tells it apart from a session JWT. */
export const ACCESS_TOKEN_PREFIX = 'mbl_pat_';

/** Lifetimes a user can choose when creating a token. Tokens never live forever. */
export const ACCESS_TOKEN_EXPIRY_DAYS = [30, 90, 365] as const;

export type AccessTokenExpiryDays = typeof ACCESS_TOKEN_EXPIRY_DAYS[number];

export const DEFAULT_ACCESS_TOKEN_EXPIRY_DAYS: AccessTokenExpiryDays = 90;

/** How many unrevoked, unexpired tokens one user may hold at a time. */
export const MAX_ACTIVE_ACCESS_TOKENS = 10;

export const isAccessTokenScope = (value: unknown): value is AccessTokenScope =>
  typeof value === 'string' && (ACCESS_TOKEN_SCOPES as readonly string[]).includes(value);
