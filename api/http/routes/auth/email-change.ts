import { z } from 'zod';
import { type RouteDefinition } from '../../types';
import { changeEmailBodySchema, completeEmailChangeBodySchema } from '../../../validation/schemas/auth';
import {
  beginEmailChange,
  getEmailChange,
  cancelEmailChange,
  completeEmailChange,
} from '../../handlers/auth/email-change';

const tags = ['Authentication'];

export const authEmailChangeRoutes: RouteDefinition[] = [
  {
    method: 'POST',
    path: '/auth/change-email',
    handler: beginEmailChange,
    docs: {
      operationId: 'beginEmailChange',
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
      operationId: 'getEmailChange',
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
    method: 'DELETE',
    path: '/auth/change-email',
    handler: cancelEmailChange,
    docs: {
      operationId: 'cancelEmailChange',
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
    path: '/auth/change-email/complete',
    handler: completeEmailChange,
    docs: {
      operationId: 'completeEmailChange',
      summary: 'Complete email change process using email and verification code',
      tags,
      public: true,
      request: { body: completeEmailChangeBodySchema },
      response: {
        description: 'Email change completed',
        schema: z.object({ token: z.string().optional() }),
      },
      setsAuthCookie: true,
      errors: [400, 404],
    },
  },
];
