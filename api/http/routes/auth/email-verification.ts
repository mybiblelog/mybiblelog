import { z } from 'zod';
import { type RouteDefinition } from '../../types';
import { verifyEmailBodySchema, resendEmailVerificationBodySchema } from '../../../validation/schemas/auth';
import { verifyEmail, resendEmailVerification } from '../../handlers/auth/email-verification';

const tags = ['Authentication'];

export const authEmailVerificationRoutes: RouteDefinition[] = [
  {
    method: 'POST',
    path: '/auth/verify-email',
    handler: verifyEmail,
    docs: {
      summary: 'Verify email via code',
      tags,
      public: true,
      request: { body: verifyEmailBodySchema },
      response: {
        description: 'Email verified successfully',
        schema: z.object({ token: z.string().optional() }),
      },
      setsAuthCookie: true,
      errors: [400, 404],
    },
  },
  {
    method: 'POST',
    path: '/auth/verify-email/resend',
    handler: resendEmailVerification,
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
];
