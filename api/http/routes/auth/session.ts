import { z } from 'zod';
import { type RouteDefinition } from '../../types';
import { loginBodySchema, registerBodySchema, userSchema } from '../../../validation/schemas/auth';
import { getUser, login, logout, register } from '../../handlers/auth/session';

const tags = ['Authentication'];

export const authSessionRoutes: RouteDefinition[] = [
  {
    method: 'GET',
    path: '/auth/user',
    handler: getUser,
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
    handler: login,
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
    handler: logout,
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
    handler: register,
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
];
