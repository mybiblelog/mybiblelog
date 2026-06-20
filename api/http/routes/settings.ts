import { z } from 'zod';
import { type RouteDefinition } from '../types';
import {
  settingsUpdateBodySchema,
  userSettingsSchema,
} from '../../validation/schemas/user-settings';
import { getSettings, updateSettings, deleteUserAccount } from '../handlers/settings';

/**
 * Framework-neutral route table for the settings endpoints. Each route pairs its
 * framework-agnostic handler with `docs` that reuse the user-settings zod
 * schemas, so the generated OpenAPI spec stays in lockstep with the real
 * contract. All routes require an authenticated user (401 otherwise). See
 * `api/http/openapi/generate.ts`.
 */
const tags = ['Settings'];

export const settingsRoutes: RouteDefinition[] = [
  {
    method: 'GET',
    path: '/settings',
    handler: getSettings,
    docs: {
      summary: 'Get user settings',
      tags,
      response: { description: 'User settings', schema: userSettingsSchema },
      errors: [401],
    },
  },
  {
    method: 'PUT',
    path: '/settings',
    handler: updateSettings,
    docs: {
      summary: 'Update user settings',
      tags,
      request: { body: settingsUpdateBodySchema },
      response: { description: 'The updated user settings', schema: userSettingsSchema },
      errors: [400, 401],
    },
  },
  {
    method: 'PUT',
    path: '/settings/delete-account',
    handler: deleteUserAccount,
    docs: {
      summary: 'Delete user account and all associated data',
      tags,
      response: { description: 'Number of deleted accounts (1)', schema: z.number() },
      errors: [401, 500],
    },
  },
];
