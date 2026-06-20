import { z } from 'zod';
import { type DocumentedRoute } from '../types';
import {
  loginBodySchema,
  registerBodySchema,
  googleVerifyBodySchema,
  verifyEmailBodySchema,
  resendEmailVerificationBodySchema,
  changePasswordBodySchema,
  changeEmailBodySchema,
  resetPasswordInitBodySchema,
  resetPasswordBodySchema,
  userSchema,
} from '../../validation/schemas/auth';

/**
 * Documentation-only descriptors for the auth endpoints. The handlers are still
 * Express-coupled (cookies, post-response email side effects, rate limiting) and
 * have not been migrated to the framework-agnostic pattern, but their OpenAPI
 * spec is generated from these descriptors + the shared zod schemas instead of
 * hand-written JSDoc. See `api/http/openapi/generate.ts`.
 *
 * Request schemas for the endpoints that validate inline (login, google verify,
 * verify-email, resend, change-email, reset-password init) are documentation
 * mirrors defined in `validation/schemas/auth.ts`; the rest reuse the exact
 * schemas the handlers already `validate()` with.
 */
const tags = ['Authentication'];

const codeParam = z.object({ newEmailVerificationCode: z.string() });
const resetCodeParam = z.object({ passwordResetCode: z.string() });

export const authDocRoutes: DocumentedRoute[] = [
  {
    method: 'GET',
    path: '/auth/user',
    docs: {
      summary: 'Get the currently logged-in user',
      tags,
      response: {
        description: 'The current user (the `user` field is null when not authenticated)',
        schema: z.object({ user: userSchema }),
      },
      errors: [],
    },
  },
  {
    method: 'POST',
    path: '/auth/login',
    docs: {
      summary: 'Login with email and password',
      tags,
      public: true,
      request: { body: loginBodySchema },
      response: {
        description: 'Login successful',
        schema: z.object({ token: z.string(), user: userSchema }),
      },
      setsAuthCookie: true,
      errors: [400],
    },
  },
  {
    method: 'POST',
    path: '/auth/logout',
    docs: {
      summary: 'Logout the current user',
      tags,
      response: { description: 'User logged out successfully', schema: z.boolean() },
      errors: [],
    },
  },
  {
    method: 'POST',
    path: '/auth/register',
    docs: {
      summary: 'Register a new user account',
      tags,
      public: true,
      request: { body: registerBodySchema },
      response: {
        description: 'Registration successful',
        schema: z.object({ success: z.boolean() }),
      },
      errors: [400],
    },
  },
  {
    method: 'GET',
    path: '/auth/oauth2/google/url',
    docs: {
      summary: 'Get Google OAuth2 URL',
      tags,
      public: true,
      response: {
        description: 'Google OAuth2 redirect URL and CSRF state',
        schema: z.object({ url: z.string(), state: z.string() }),
      },
      errors: [],
    },
  },
  {
    method: 'POST',
    path: '/auth/oauth2/google/verify',
    docs: {
      summary: 'Verify Google OAuth2 code',
      tags,
      public: true,
      request: { body: googleVerifyBodySchema },
      response: {
        description: 'Google OAuth2 verification successful',
        schema: z.object({ token: z.string() }),
      },
      setsAuthCookie: true,
      errors: [400],
    },
  },
  {
    method: 'POST',
    path: '/auth/verify-email',
    docs: {
      summary: 'Verify email via code',
      tags,
      public: true,
      request: { body: verifyEmailBodySchema },
      response: {
        description: 'Email verified successfully',
        schema: z.object({ token: z.string() }),
      },
      setsAuthCookie: true,
      errors: [400, 404],
    },
  },
  {
    method: 'POST',
    path: '/auth/resend-email-verification',
    docs: {
      summary: 'Resend verification email (with cooldown)',
      tags,
      public: true,
      request: { body: resendEmailVerificationBodySchema },
      response: {
        description: 'Whether the resend was queued, plus cooldown seconds',
        schema: z.object({ success: z.boolean(), secondsUntilCanRetry: z.number() }),
      },
      errors: [400],
    },
  },
  {
    method: 'PUT',
    path: '/auth/change-password',
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
    path: '/auth/change-email',
    docs: {
      summary: 'Initiate email change process',
      tags,
      request: { body: changeEmailBodySchema },
      response: {
        description: 'Email change process initiated',
        schema: z.object({ success: z.boolean() }),
      },
      errors: [400],
    },
  },
  {
    method: 'GET',
    path: '/auth/change-email',
    docs: {
      summary: 'Check for an in-progress email change',
      tags,
      response: {
        description: 'Pending email change (fields are null when none is pending)',
        schema: z.object({ newEmail: z.string(), expires: z.string() }),
      },
      errors: [],
    },
  },
  {
    method: 'GET',
    path: '/auth/change-email/:newEmailVerificationCode',
    docs: {
      summary: 'Get an email change request by verification code',
      tags,
      public: true,
      request: { params: codeParam },
      response: {
        description: 'Email change request data (null if not found)',
        schema: z.object({ newEmail: z.string(), expires: z.string() }),
      },
      errors: [],
    },
  },
  {
    method: 'DELETE',
    path: '/auth/change-email',
    docs: {
      summary: 'Cancel email change process',
      tags,
      response: {
        description: 'True if a pending change was cancelled, false otherwise',
        schema: z.boolean(),
      },
      errors: [],
    },
  },
  {
    method: 'POST',
    path: '/auth/change-email/:newEmailVerificationCode',
    docs: {
      summary: 'Complete email change process using verification code',
      tags,
      public: true,
      request: { params: codeParam },
      response: {
        description: 'Email change completed',
        schema: z.object({ token: z.string() }),
      },
      setsAuthCookie: true,
      errors: [400, 404],
    },
  },
  {
    method: 'POST',
    path: '/auth/reset-password',
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
    path: '/auth/reset-password/:passwordResetCode/valid',
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
    path: '/auth/reset-password/:passwordResetCode',
    docs: {
      summary: 'Reset password using a reset code',
      tags,
      public: true,
      request: { params: resetCodeParam, body: resetPasswordBodySchema },
      response: {
        description: 'Password reset successful',
        schema: z.object({ token: z.string() }),
      },
      setsAuthCookie: true,
      errors: [400],
    },
  },
];
