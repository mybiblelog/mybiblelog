import { z } from 'zod';
import { type RouteDefinition } from '../../types';
import { googleVerifyBodySchema, googleIdTokenBodySchema, userSchema } from '../../../validation/schemas/auth';
import { getGoogleOauthUrl, verifyGoogleOauth, googleIdTokenLogin } from '../../handlers/auth/oauth';

const tags = ['Authentication'];

export const authOauthRoutes: RouteDefinition[] = [
  {
    method: 'GET',
    path: '/auth/oauth2/google/url',
    handler: getGoogleOauthUrl,
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
    handler: verifyGoogleOauth,
    docs: {
      summary: 'Verify Google OAuth2 code',
      tags,
      public: true,
      request: { body: googleVerifyBodySchema },
      response: {
        description: 'Google OAuth2 verification successful',
        schema: z.object({ token: z.string().optional() }),
      },
      setsAuthCookie: true,
      errors: [400],
    },
  },
  {
    method: 'POST',
    path: '/auth/oauth2/google/id-token',
    handler: googleIdTokenLogin,
    docs: {
      summary: 'Login with a Google ID token (mobile-friendly)',
      description:
        'Accepts a Google `id_token` from a native/mobile Google sign-in flow and '
        + 'exchanges it for a MyBibleLog session. Recommended for mobile apps (no '
        + 'redirect/callback handling needed).',
      tags,
      public: true,
      request: { body: googleIdTokenBodySchema },
      response: {
        description: 'Google login successful',
        schema: z.object({ token: z.string().optional(), user: userSchema }),
      },
      setsAuthCookie: true,
      errors: [400],
    },
  },
];
