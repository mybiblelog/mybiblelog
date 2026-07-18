import { z } from 'zod';
import { type RouteDefinition } from '../../types';
import { changeEmailBodySchema } from '../../../validation/schemas/auth';
import {
  beginEmailChange,
  getEmailChange,
  getEmailChangeByCode,
  cancelEmailChange,
  completeEmailChange,
} from '../../handlers/auth/email-change';

const tags = ['Authentication'];

const codeParam = z.object({ newEmailVerificationCode: z.string() });

export const authEmailChangeRoutes: RouteDefinition[] = [
  {
    method: 'POST',
    path: '/auth/change-email',
    handler: beginEmailChange,
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
    handler: getEmailChange,
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
    handler: getEmailChangeByCode,
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
    handler: cancelEmailChange,
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
    handler: completeEmailChange,
    docs: {
      summary: 'Complete email change process using verification code',
      tags,
      public: true,
      request: { params: codeParam },
      response: {
        description: 'Email change completed',
        schema: z.object({ token: z.string().optional() }),
      },
      setsAuthCookie: true,
      errors: [400, 404],
    },
  },
];
