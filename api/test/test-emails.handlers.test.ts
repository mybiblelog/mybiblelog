import { describe, it, expect, vi, afterEach } from 'vitest';
import { withEnvConfig, restoreEnvConfig } from './config-helpers';
import { listRecentEmails } from '../http/handlers/test-emails';
import { type HttpRequest, type RouteDependencies } from '../http/types';
import { NotFoundError } from '../http/errors/http-errors';
import { ValidationError } from '../http/errors/validation-errors';
import { type EmailRecord } from '../repositories/helpers/types';

/**
 * Unit tests for the test-only email seam handler. The handler gates on
 * `checkTestBypass` (config: `nodeEnv` + `testBypassSecret`), so these tests drive
 * those branches in-process via `withEnvConfig` and assert the 404-or-data
 * behavior with a fake email repository.
 */

const SECRET = 'secret-value';

const emailRecord = (overrides: Partial<EmailRecord> = {}): EmailRecord => ({
  id: '507f1f77bcf86cd799439011',
  from: 'team@example.com',
  to: 'user@example.com',
  replyTo: null,
  headers: {},
  subject: 'Reset Password',
  text: null,
  html: '<a href="https://app.test/reset-password?code=abc123">reset</a>',
  status: 'log_only',
  createdAt: new Date('2026-06-30T00:00:00.000Z'),
  updatedAt: new Date('2026-06-30T00:00:00.000Z'),
  ...overrides,
});

const makeDeps = (findRecentByRecipient = vi.fn(async () => [emailRecord()])): RouteDependencies => ({
  repositories: { emails: { findRecentByRecipient } } as unknown as RouteDependencies['repositories'],
  authenticate: (async () => { throw new Error('not used'); }) as unknown as RouteDependencies['authenticate'],
  emailService: {} as RouteDependencies['emailService'],
  rateLimiter: { check: async () => {} } as unknown as RouteDependencies['rateLimiter'],
});

const makeRequest = (overrides: Partial<HttpRequest> = {}): HttpRequest => ({
  method: 'GET',
  params: {},
  query: { to: 'user@example.com' },
  body: undefined,
  headers: { 'x-test-bypass-secret': SECRET },
  ...overrides,
});

describe('listRecentEmails handler', () => {
  afterEach(restoreEnvConfig);

  it('returns 404 in production even with a matching bypass secret', async () => {
    withEnvConfig({ NODE_ENV: 'production', TEST_BYPASS_SECRET: SECRET });
    await expect(listRecentEmails(makeRequest(), makeDeps())).rejects.toBeInstanceOf(NotFoundError);
  });

  it('returns 404 when the bypass header is missing', async () => {
    withEnvConfig({ NODE_ENV: 'test', TEST_BYPASS_SECRET: SECRET });
    const req = makeRequest({ headers: {} });
    await expect(listRecentEmails(req, makeDeps())).rejects.toBeInstanceOf(NotFoundError);
  });

  it('returns 404 when the bypass header is wrong', async () => {
    withEnvConfig({ NODE_ENV: 'test', TEST_BYPASS_SECRET: SECRET });
    const req = makeRequest({ headers: { 'x-test-bypass-secret': 'wrong' } });
    await expect(listRecentEmails(req, makeDeps())).rejects.toBeInstanceOf(NotFoundError);
  });

  it('returns recent emails when the bypass header matches', async () => {
    withEnvConfig({ NODE_ENV: 'test', TEST_BYPASS_SECRET: SECRET });
    const find = vi.fn(async () => [emailRecord()]);
    const result = await listRecentEmails(makeRequest(), makeDeps(find));

    expect(result.status).toBe(200);
    expect(result.body?.data).toHaveLength(1);
    expect((result.body?.data as EmailRecord[])[0].subject).toBe('Reset Password');
    // `to` is lower-cased by the schema before reaching the repository.
    expect(find).toHaveBeenCalledWith('user@example.com', { subject: undefined, limit: undefined });
  });

  it('forwards the subject and limit filters to the repository', async () => {
    withEnvConfig({ NODE_ENV: 'test', TEST_BYPASS_SECRET: SECRET });
    const find = vi.fn(async () => []);
    const req = makeRequest({ query: { to: 'User@Example.com', subject: 'Reset Password', limit: '5' } });
    await listRecentEmails(req, makeDeps(find));
    expect(find).toHaveBeenCalledWith('user@example.com', { subject: 'Reset Password', limit: 5 });
  });

  it('rejects a request with no recipient', async () => {
    withEnvConfig({ NODE_ENV: 'test', TEST_BYPASS_SECRET: SECRET });
    const req = makeRequest({ query: {} });
    await expect(listRecentEmails(req, makeDeps())).rejects.toBeInstanceOf(ValidationError);
  });
});
