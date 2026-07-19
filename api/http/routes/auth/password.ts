import { z } from 'zod';
import { type RouteDefinition } from '../../types';
import {
  changePasswordBodySchema,
  setPasswordBodySchema,
  resetPasswordInitBodySchema,
  resetPasswordBodySchema,
  validateResetCodeBodySchema,
} from '../../../validation/schemas/auth';
import {
  changePassword,
  setPassword,
  beginPasswordReset,
  validatePasswordResetCode,
  completePasswordReset,
} from '../../handlers/auth/password';

const tags = ['Authentication'];

export const authPasswordRoutes: RouteDefinition[] = [
  {
    method: 'PATCH',
    path: '/auth/password',
    handler: changePassword,
    docs: {
      summary: 'Change user password',
      tags,
      request: { body: changePasswordBodySchema },
      response: {
        description: 'Password changed successfully',
        schema: z.object({ success: z.boolean() }),
      },
      errors: [400],
    },
  },
  {
    method: 'POST',
    path: '/auth/password/set',
    handler: setPassword,
    docs: {
      summary: 'Set a password for a Google-only account',
      tags,
      request: { body: setPasswordBodySchema },
      response: {
        description: 'Password set successfully',
        schema: z.object({ success: z.boolean() }),
      },
      errors: [400],
    },
  },
  {
    method: 'POST',
    path: '/auth/password/reset',
    handler: beginPasswordReset,
    docs: {
      summary: 'Initiate password reset process',
      tags,
      public: true,
      request: { body: resetPasswordInitBodySchema },
      response: {
        description: 'Always succeeds, whether or not an account exists (prevents enumeration)',
        schema: z.object({ success: z.boolean() }),
      },
      errors: [],
    },
  },
  {
    method: 'POST',
    path: '/auth/password/reset/validate',
    handler: validatePasswordResetCode,
    docs: {
      summary: 'Check if a password reset code is valid for an email',
      tags,
      public: true,
      request: { body: validateResetCodeBodySchema },
      response: {
        description: 'Whether the password reset code is valid',
        schema: z.object({ valid: z.boolean() }),
      },
      errors: [],
    },
  },
  {
    method: 'POST',
    path: '/auth/password/reset/complete',
    handler: completePasswordReset,
    docs: {
      summary: 'Reset password using an email and reset code',
      tags,
      public: true,
      request: { body: resetPasswordBodySchema },
      response: {
        description: 'Password reset successful',
        schema: z.object({ token: z.string().optional() }),
      },
      setsAuthCookie: true,
      errors: [400],
    },
  },
];
