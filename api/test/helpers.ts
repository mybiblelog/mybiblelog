import crypto from 'node:crypto';
import path from 'node:path';
import request from 'supertest';
import dotenv from 'dotenv';
import useRepositories from '../repositories/useRepositories';

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
  quiet: true,
});

const { TEST_API_URL } = process.env;
if (!TEST_API_URL) {
  throw new Error('TEST_API_URL environment variable is not set');
}
const api = request(TEST_API_URL);

const generateTestEmail = (): string => {
  return 'test_user_' + crypto.randomBytes(10).toString('hex') + '@example.com';
};

const generateRandomString = (bytes: number): string => {
  return crypto.randomBytes(bytes).toString('hex');
};

export interface TestUser {
  id: string;
  email: string;
  password: string;
  token: string;
}

interface CreateTestUserOptions {
  locale?: string;
  isAdmin?: boolean;
}

/**
 * Creates a test user and returns a token
 */
async function createTestUser({ locale = 'en', isAdmin = false }: CreateTestUserOptions = {}): Promise<TestUser> {
  const email = generateTestEmail();
  const password = crypto.randomBytes(10).toString('hex');
  const testBypassSecret = process.env.TEST_BYPASS_SECRET;

  // Register the user. The bypass header only skips rate limiting now; the API
  // under test must run with REQUIRE_EMAIL_VERIFICATION=false so the user can log
  // in without verifying (verification skipping is governed by config, not the
  // bypass — see the auth handler refactor).
  const registerResponse = await api
    .post('/api/auth/register')
    .set('x-test-bypass-secret', testBypassSecret!)
    .send({ email, password, locale });

  if (registerResponse.status !== 200) {
    throw new Error(`Failed to register test user: ${registerResponse.body.message}`);
  }

  // Admin is no longer grantable through the register endpoint; promote directly
  // via the repository (the test process shares the API's database).
  if (isAdmin) {
    const { users } = await useRepositories();
    const user = await users.findByEmail(email);
    if (!user) {
      throw new Error('Failed to load test user for admin promotion');
    }
    await users.setAdmin(user.id, true);
  }

  // Login to get the token
  const loginResponse = await api
    .post('/api/auth/login')
    .set('x-test-bypass-secret', testBypassSecret!)
    .send({ email, password });

  if (loginResponse.status !== 200) {
    throw new Error(`Failed to login test user: ${loginResponse.body.message}`);
  }

  return {
    id: loginResponse.body.data.id,
    email,
    password,
    token: loginResponse.body.data.token,
  };
}

/**
 * Deletes a test user
 */
async function deleteTestUser(user: TestUser | { token: TestUser['token'] }): Promise<void> {
  await api.delete(`/api/settings/account`)
    .set('Authorization', `Bearer ${user.token}`);
}

export {
  api as requestApi,
  generateTestEmail,
  generateRandomString,
  createTestUser,
  deleteTestUser,
};

// Named exports for convenience
export const createTestAdmin = () => createTestUser({ isAdmin: true });

