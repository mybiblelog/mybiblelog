import { describe, it, expect, vi } from 'vitest';

// deleteUserAccount delegates the actual deletion work to this helper; mock it
// so the failure branch (helper returns false -> InternalError) is testable
// without needing real repositories to fail.
const mockDeleteAccount = vi.fn(async () => true);
vi.mock('../http/helpers/delete-account', () => ({
  default: (...args: unknown[]) => mockDeleteAccount(...args),
}));

import { deleteUserAccount } from '../http/handlers/settings';
import { InternalError } from '../http/errors/internal-error';
import { type HttpRequest, type RouteDependencies } from '../http/types';
import { type UserRecord } from '../repositories/helpers/types';

/**
 * Pure unit test for the deleteUserAccount handler's failure branch. The
 * success path (real deletion + cookie clearing + user actually gone) is
 * covered end-to-end in settings.test.ts; this covers the case where
 * `deleteAccount` reports failure, which the integration suite can't force.
 */

const verifiedUser = {
  id: '507f1f77bcf86cd799439011',
  email: 'user@example.com',
} as unknown as UserRecord;

const makeDeps = (): RouteDependencies => ({
  repositories: {} as RouteDependencies['repositories'],
  authenticate: async () => verifiedUser,
  emailService: {} as RouteDependencies['emailService'],
  rateLimiter: { check: async () => {} } as RouteDependencies['rateLimiter'],
});

const makeRequest = (overrides: Partial<HttpRequest> = {}): HttpRequest => ({
  method: 'DELETE',
  params: {},
  query: {},
  body: {},
  headers: {},
  ...overrides,
});

describe('settings handlers (unit)', () => {
  describe('deleteUserAccount', () => {
    it('throws InternalError when deleteAccount reports failure', async () => {
      mockDeleteAccount.mockResolvedValueOnce(false);
      const deps = makeDeps();
      await expect(deleteUserAccount(makeRequest(), deps)).rejects.toBeInstanceOf(InternalError);
    });

    it('succeeds and clears the auth cookie when deleteAccount reports success', async () => {
      mockDeleteAccount.mockResolvedValueOnce(true);
      const deps = makeDeps();
      const result = await deleteUserAccount(makeRequest(), deps);
      expect(result.status).toBe(200);
      expect(result.body).toEqual({ data: 1 });
      expect(result.cookies?.length).toBeGreaterThan(0);
    });
  });
});
