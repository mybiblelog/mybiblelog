import { type UserSettingsRecord } from '../../repositories/helpers/types';
import deleteAccount from '../../router/helpers/deleteAccount';
import { InternalError } from '../../router/errors/internal-error';
import { validate } from '../../validation/validate';
import { settingsUpdateBodySchema } from '../../validation/schemas/user-settings';
import { clearAuthCookie } from '../helpers/auth-cookie';
import { type RouteHandler } from '../types';

/**
 * Framework-agnostic settings handlers.
 *
 * Each handler is a pure function of `(request, dependencies)`: it authenticates
 * through the injected `authenticate`, talks to the injected repositories, and
 * returns a normalized result. Account deletion describes its cookie intent in
 * the result (`clearAuthCookie`) rather than touching a framework `res`.
 */

// GET /settings - Get the current user's settings
export const getSettings: RouteHandler = async (req, deps) => {
  const currentUser = await deps.authenticate(req);
  return { status: 200, body: { data: currentUser.settings } };
};

// PUT /settings - Update the current user's settings
export const updateSettings: RouteHandler = async (req, deps) => {
  const currentUser = await deps.authenticate(req);
  const { body } = validate(req, { body: settingsUpdateBodySchema });
  // `settings` is a validated partial containing only the provided, known
  // keys; updateSettings ignores any that are undefined.
  const patch: Partial<UserSettingsRecord> = body.settings;
  const updatedSettings = await deps.repositories.users.updateSettings(currentUser.id, patch);
  return { status: 200, body: { data: updatedSettings } };
};

// PUT /settings/delete-account - Delete the account and all associated data
export const deleteUserAccount: RouteHandler = async (req, deps) => {
  const currentUser = await deps.authenticate(req);
  const success = await deleteAccount(currentUser.email);
  if (!success) {
    throw new InternalError();
  }
  // Clear the auth cookie on account deletion.
  return { status: 200, body: { data: 1 }, cookies: [clearAuthCookie()] };
};
