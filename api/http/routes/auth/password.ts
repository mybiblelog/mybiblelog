import { z } from 'zod';
import { type RouteDefinition } from '../../types';
import {
  changePasswordBodySchema,
  setPasswordBodySchema,
  resetPasswordInitBodySchema,
  resetPasswordBodySchema,
} from '../../../validation/schemas/auth';
import {
  changePassword,
  setPassword,
  beginPasswordReset,
  checkPasswordResetCode,
  completePasswordReset,
} from '../../handlers/auth/password';

const tags = ['Authentication'];

const resetCodeParam = z.object({ passwordResetCode: z.string() });

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
    method: 'GET',
    path: '/auth/password/reset/:passwordResetCode/valid',
    handler: checkPasswordResetCode,
    docs: {
      summary: 'Check if a password reset code is valid',
      tags,
      public: true,
      request: { params: resetCodeParam },
      response: {
        description: 'Whether the password reset code is valid',
        schema: z.object({ valid: z.boolean() }),
      },
      errors: [],
    },
  },
  {
    method: 'POST',
    path: '/auth/password/reset/:passwordResetCode',
    handler: completePasswordReset,
    docs: {
      summary: 'Reset password using a reset code',
      tags,
      public: true,
      request: { params: resetCodeParam, body: resetPasswordBodySchema },
      response: {
        description: 'Password reset successful',
        schema: z.object({ token: z.string().optional() }),
      },
      setsAuthCookie: true,
      errors: [400],
    },
  },
];
