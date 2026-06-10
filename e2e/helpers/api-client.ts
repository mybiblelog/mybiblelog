/**
 * Standalone API client for e2e tests.
 *
 * This module encodes the HTTP contract the e2e suite depends on:
 *   - POST /api/auth/register  { email, password, locale }        (x-test-bypass-secret skips email verification)
 *   - POST /api/auth/login     { email, password } -> data.token  (x-test-bypass-secret skips rate limiting)
 *   - PUT  /api/settings/delete-account                            (Bearer token)
 *
 * It intentionally does NOT import from the api/ workspace so the suite can run
 * unchanged against a migrated backend that honors the same contract.
 */
import crypto from 'node:crypto';
import { request } from '@playwright/test';
import { env } from './env';

export interface TestUser {
  id: string;
  email: string;
  password: string;
  token: string;
}

export const generateTestEmail = (): string => {
  return 'test_user_' + crypto.randomBytes(10).toString('hex') + '@example.com';
};

export const generateRandomString = (bytes: number): string => {
  return crypto.randomBytes(bytes).toString('hex');
};

interface CreateTestUserOptions {
  locale?: string;
  isAdmin?: boolean;
}

/**
 * Logs in via the API (with the test bypass header to dodge rate limiting)
 * and returns the user id and JWT.
 */
export async function login(email: string, password: string): Promise<{ id: string; token: string }> {
  const ctx = await request.newContext({ baseURL: env.apiUrl });
  try {
    const response = await ctx.post('/api/auth/login', {
      headers: { 'x-test-bypass-secret': env.bypassSecret },
      data: { email, password },
    });
    if (!response.ok()) {
      throw new Error(`Failed to login test user: ${response.status()} ${await response.text()}`);
    }
    const body = await response.json();
    return { id: body.data.id, token: body.data.token };
  }
  finally {
    await ctx.dispose();
  }
}

/**
 * Registers a fresh user (email verification bypassed) and logs in.
 */
export async function createTestUser({ locale = 'en', isAdmin = false }: CreateTestUserOptions = {}): Promise<TestUser> {
  const email = generateTestEmail();
  const password = generateRandomString(10);

  const ctx = await request.newContext({ baseURL: env.apiUrl });
  try {
    const registerResponse = await ctx.post('/api/auth/register', {
      headers: { 'x-test-bypass-secret': env.bypassSecret },
      data: { email, password, locale, ...(isAdmin && { isAdmin }) },
    });
    if (!registerResponse.ok()) {
      throw new Error(`Failed to register test user: ${registerResponse.status()} ${await registerResponse.text()}`);
    }
  }
  finally {
    await ctx.dispose();
  }

  const { id, token } = await login(email, password);
  return { id, email, password, token };
}

/**
 * Deletes a test user account and all associated data.
 */
export async function deleteTestUser(user: Pick<TestUser, 'token'>): Promise<void> {
  const ctx = await request.newContext({ baseURL: env.apiUrl });
  try {
    await ctx.put('/api/settings/delete-account', {
      headers: { Authorization: `Bearer ${user.token}` },
    });
  }
  finally {
    await ctx.dispose();
  }
}
