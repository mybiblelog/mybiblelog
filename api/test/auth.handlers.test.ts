import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withEnvConfig, restoreEnvConfig } from './config-helpers';

// The google-verify handler imports the OAuth helper directly; mock it so the
// CSRF-state branch is testable without real Google config. `verifyState` is a
// spy (defaulting to false) so individual tests can let the state check pass.
const { mockVerifyState } = vi.hoisted(() => ({ mockVerifyState: vi.fn(() => false) }));
vi.mock('../http/helpers/google-oauth2', () => ({
  default: {
    getGoogleLoginUrl: () => ({ url: 'https://example.com', state: 'state' }),
    verifyState: mockVerifyState,
    getAccessTokenFromCode: async () => 'token',
    getUserProfileFromToken: async () => ({ id: 'g', email: 'g@example.com', verified_email: true }),
  },
}));

// The id-token login handler verifies the token via this helper (which talks to
// Google's tokeninfo endpoint); mock it so the handler is testable without a
// real token or network access.
vi.mock('../http/helpers/google-id-token', () => ({
  default: { verifyGoogleIdToken: vi.fn() },
}));

import {
  getUser,
  login,
  logout,
  register,
  verifyEmail,
  beginPasswordReset,
  completePasswordReset,
  beginEmailChange,
  completeEmailChange,
  resendEmailVerification,
  verifyGoogleOauth,
  googleIdTokenLogin,
} from '../http/handlers/auth';
import { type HttpRequest, type RouteDependencies } from '../http/types';
import { type UserRecord } from '../repositories/helpers/types';
import { AUTH_COOKIE_NAME } from '../http/helpers/authCurrentUser';
import { ValidationError } from '../http/errors/validation-errors';
import { UnauthorizedError, NotFoundError, InvalidRequestError } from '../http/errors/http-errors';
import googleIdToken from '../http/helpers/google-id-token';

const mockedVerifyIdToken = vi.mocked(googleIdToken.verifyGoogleIdToken);

/**
 * Pure unit tests for the framework-agnostic auth handlers. They call the
 * handlers directly with a normalized `HttpRequest` and a fake
 * `RouteDependencies` — no Express, no supertest, no database. The cookie/email/
 * rate-limit collaborators are injected, so these tests also cover the behavior
 * that the old bypass-driven integration tests exercised.
 */

const USER_ID = '507f1f77bcf86cd799439011';

const verifiedUser = {
  id: USER_ID,
  email: 'user@example.com',
  isAdmin: false,
  hasLocalAccount: true,
  emailVerificationCode: '', // '' => verified (see isEmailVerified)
} as unknown as UserRecord;

// Non-empty emailVerificationCode => unverified (see isEmailVerified). The
// past `emailVerificationCodeLastSentAt` keeps the resend cooldown out of the way.
const unverifiedUser = {
  ...verifiedUser,
  emailVerificationCode: 'abc123',
  emailVerificationCodeLastSentAt: new Date(0),
} as unknown as UserRecord;

type UsersStub = Partial<RouteDependencies['repositories']['users']>;

const makeDeps = (overrides: {
  users?: UsersStub;
  authenticate?: RouteDependencies['authenticate'];
  emailService?: Partial<RouteDependencies['emailService']>;
  rateLimiter?: Partial<RouteDependencies['rateLimiter']>;
} = {}): RouteDependencies => {
  return {
    repositories: { users: (overrides.users ?? {}) } as RouteDependencies['repositories'],
    authenticate: overrides.authenticate ?? (async () => verifiedUser),
    emailService: (overrides.emailService ?? {}) as RouteDependencies['emailService'],
    rateLimiter: { check: async () => {}, ...overrides.rateLimiter } as RouteDependencies['rateLimiter'],
  };
};

const makeRequest = (overrides: Partial<HttpRequest> = {}): HttpRequest => ({
  method: 'POST',
  params: {},
  query: {},
  body: {},
  headers: {},
  ...overrides,
});

describe('auth handlers (unit)', () => {
  // Tests that call withEnvConfig rely on this to restore process.env + the
  // config cache; harmless for tests that never touch config.
  afterEach(restoreEnvConfig);

  describe('getUser', () => {
    it('returns null user when unauthenticated', async () => {
      const deps = makeDeps({ authenticate: (async () => null) as unknown as RouteDependencies['authenticate'] });
      const result = await getUser(makeRequest({ method: 'GET' }), deps);
      expect(result.status).toBe(200);
      expect(result.body).toEqual({ data: { user: null } });
    });

    it('returns the serialized user when authenticated', async () => {
      const deps = makeDeps();
      const result = await getUser(makeRequest({ method: 'GET' }), deps);
      expect(result.body?.data).toEqual({
        user: { hasLocalAccount: true, email: 'user@example.com', isAdmin: false },
      });
    });
  });

  describe('login', () => {
    it('rejects a missing email with a ValidationError', async () => {
      const deps = makeDeps();
      await expect(login(makeRequest({ body: { password: 'x' } }), deps)).rejects.toBeInstanceOf(ValidationError);
    });

    it('rejects a non-string email (NoSQL injection guard)', async () => {
      const deps = makeDeps();
      await expect(login(makeRequest({ body: { email: { $gt: '' }, password: 'x' } }), deps))
        .rejects.toBeInstanceOf(ValidationError);
    });

    it('returns Unauthorized when the user does not exist', async () => {
      const deps = makeDeps({ users: { findByEmail: async () => null } });
      await expect(login(makeRequest({ body: { email: 'a@b.com', password: 'pw' } }), deps))
        .rejects.toBeInstanceOf(UnauthorizedError);
    });

    it('returns Unauthorized when the password is wrong', async () => {
      const deps = makeDeps({ users: { findByEmail: async () => verifiedUser, verifyPassword: async () => false } });
      await expect(login(makeRequest({ body: { email: 'a@b.com', password: 'pw' } }), deps))
        .rejects.toBeInstanceOf(UnauthorizedError);
    });

    it('returns a token and sets the auth cookie on success', async () => {
      const deps = makeDeps({ users: { findByEmail: async () => verifiedUser, verifyPassword: async () => true } });
      const result = await login(makeRequest({ body: { email: 'a@b.com', password: 'pw' } }), deps);
      expect(result.status).toBe(200);
      expect(typeof (result.body?.data as { token: string }).token).toBe('string');
      const cookie = result.cookies?.find((c) => c.name === AUTH_COOKIE_NAME);
      expect(cookie?.value).toEqual(expect.any(String));
      expect(cookie?.options?.httpOnly).toBe(true);
    });

    it('propagates a rate-limit rejection', async () => {
      const deps = makeDeps({
        rateLimiter: { check: async () => { throw new Error('rate limited'); } },
      });
      await expect(login(makeRequest({ body: { email: 'a@b.com', password: 'pw' } }), deps))
        .rejects.toThrow('rate limited');
    });

    it('rejects an unverified user when REQUIRE_EMAIL_VERIFICATION is on', async () => {
      withEnvConfig({ REQUIRE_EMAIL_VERIFICATION: 'true' });
      const deps = makeDeps({ users: { findByEmail: async () => unverifiedUser, verifyPassword: async () => true } });

      const error = await login(makeRequest({ body: { email: 'a@b.com', password: 'pw' } }), deps)
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(UnauthorizedError);
      expect((error as UnauthorizedError).details).toEqual([
        { code: 'verify_email', field: null, properties: { email: 'user@example.com' } },
      ]);
    });

    it('allows an unverified user to log in when REQUIRE_EMAIL_VERIFICATION is off', async () => {
      withEnvConfig({ REQUIRE_EMAIL_VERIFICATION: 'false' });
      const deps = makeDeps({ users: { findByEmail: async () => unverifiedUser, verifyPassword: async () => true } });

      const result = await login(makeRequest({ body: { email: 'a@b.com', password: 'pw' } }), deps);

      expect(result.status).toBe(200);
      expect(typeof (result.body?.data as { token: string }).token).toBe('string');
      expect(result.cookies?.find((c) => c.name === AUTH_COOKIE_NAME)?.value).toEqual(expect.any(String));
    });
  });

  describe('logout', () => {
    it('clears the auth cookie', async () => {
      const deps = makeDeps();
      const result = await logout(makeRequest(), deps);
      expect(result.body).toEqual({ data: true });
      const cookie = result.cookies?.find((c) => c.name === AUTH_COOKIE_NAME);
      expect(cookie?.value).toBeNull();
    });
  });

  describe('register', () => {
    it('creates the user and enqueues a verification email', async () => {
      const created = { ...verifiedUser, emailVerificationCode: 'CODE123' } as UserRecord;
      const create = vi.fn(async () => created);
      const queueUserEmailVerification = vi.fn();
      const deps = makeDeps({
        users: { create },
        emailService: { queueUserEmailVerification },
      });

      const result = await register(
        makeRequest({ body: { email: 'new@example.com', password: 'password123', locale: 'en' } }),
        deps,
      );

      expect(result.body).toEqual({ data: { success: true } });
      expect(create).toHaveBeenCalledWith({ email: 'new@example.com', password: 'password123', locale: 'en' });
      expect(queueUserEmailVerification).toHaveBeenCalledWith('new@example.com', 'CODE123', 'en');
    });

    it('rejects an invalid body via zod', async () => {
      const deps = makeDeps({ users: { create: async () => verifiedUser } });
      await expect(register(makeRequest({ body: { email: 'bad', password: 'short' } }), deps))
        .rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe('resendEmailVerification', () => {
    it('returns generic success without queueing when REQUIRE_EMAIL_VERIFICATION is off', async () => {
      withEnvConfig({ REQUIRE_EMAIL_VERIFICATION: 'false' });
      const queueUserEmailVerification = vi.fn();
      const deps = makeDeps({
        users: { findByEmail: async () => unverifiedUser },
        emailService: { queueUserEmailVerification },
      });

      const result = await resendEmailVerification(makeRequest({ body: { email: 'user@example.com' } }), deps);

      expect(result.body?.data).toMatchObject({ success: true });
      expect(queueUserEmailVerification).not.toHaveBeenCalled();
    });

    it('queues a verification email for an unverified user when REQUIRE_EMAIL_VERIFICATION is on', async () => {
      withEnvConfig({ REQUIRE_EMAIL_VERIFICATION: 'true' });
      const refreshed = { ...unverifiedUser, emailVerificationCode: 'NEWCODE' } as UserRecord;
      const queueUserEmailVerification = vi.fn();
      const deps = makeDeps({
        users: {
          findByEmail: async () => unverifiedUser,
          resendEmailVerification: async () => refreshed,
        },
        emailService: { queueUserEmailVerification },
      });

      const result = await resendEmailVerification(makeRequest({ body: { email: 'user@example.com' } }), deps);

      expect(result.body?.data).toMatchObject({ success: true });
      expect(queueUserEmailVerification).toHaveBeenCalledWith('user@example.com', 'NEWCODE', 'en');
    });
  });

  describe('verifyEmail', () => {
    it('throws NotFound when the code matches no user', async () => {
      const deps = makeDeps({ users: { findByEmailVerificationCode: async () => null } });
      await expect(verifyEmail(makeRequest({ body: { code: 'nope' } }), deps))
        .rejects.toBeInstanceOf(NotFoundError);
    });

    it('returns a token and cookie on success', async () => {
      const pending = {
        ...verifiedUser,
        emailVerificationCode: 'GOOD',
        emailVerificationExpires: new Date(Date.now() + 60_000),
      } as UserRecord;
      const deps = makeDeps({
        users: {
          findByEmailVerificationCode: async () => pending,
          markEmailVerified: async () => verifiedUser,
        },
      });
      const result = await verifyEmail(makeRequest({ body: { code: 'GOOD' } }), deps);
      expect(typeof (result.body?.data as { token: string }).token).toBe('string');
      expect(result.cookies?.find((c) => c.name === AUTH_COOKIE_NAME)?.value).toEqual(expect.any(String));
    });
  });

  describe('beginPasswordReset', () => {
    it('returns generic success without queueing email for an unknown address', async () => {
      const queuePasswordResetLink = vi.fn();
      const deps = makeDeps({
        users: { findByEmail: async () => null },
        emailService: { queuePasswordResetLink },
      });
      const result = await beginPasswordReset(makeRequest({ body: { email: 'ghost@example.com' } }), deps);
      expect(result.body).toEqual({ data: { success: true } });
      expect(queuePasswordResetLink).not.toHaveBeenCalled();
    });

    it('enqueues a reset link for a known address', async () => {
      const resetUser = { ...verifiedUser, passwordResetCode: 'RESET', settings: { locale: 'en' } } as unknown as UserRecord;
      const queuePasswordResetLink = vi.fn();
      const deps = makeDeps({
        users: { findByEmail: async () => verifiedUser, beginPasswordReset: async () => resetUser },
        emailService: { queuePasswordResetLink },
      });
      const result = await beginPasswordReset(makeRequest({ body: { email: 'user@example.com' } }), deps);
      expect(result.body).toEqual({ data: { success: true } });
      expect(queuePasswordResetLink).toHaveBeenCalledWith('user@example.com', 'RESET', 'en');
    });
  });

  describe('completePasswordReset', () => {
    it('throws NotFound for an unknown reset code', async () => {
      const deps = makeDeps({ users: { findByPasswordResetCode: async () => null } });
      await expect(
        completePasswordReset(makeRequest({ params: { passwordResetCode: 'x' }, body: { newPassword: 'password123' } }), deps),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('sets a new password and returns a token + cookie', async () => {
      const pending = {
        ...verifiedUser,
        passwordResetCode: 'RESET',
        passwordResetExpires: new Date(Date.now() + 60_000),
      } as unknown as UserRecord;
      const completePasswordResetFn = vi.fn(async () => verifiedUser);
      const deps = makeDeps({
        users: {
          findByPasswordResetCode: async () => pending,
          completePasswordReset: completePasswordResetFn,
        },
      });
      const result = await completePasswordReset(
        makeRequest({ params: { passwordResetCode: 'RESET' }, body: { newPassword: 'password123' } }),
        deps,
      );
      expect(completePasswordResetFn).toHaveBeenCalledWith(USER_ID, 'password123');
      expect(typeof (result.body?.data as { token: string }).token).toBe('string');
      expect(result.cookies?.find((c) => c.name === AUTH_COOKIE_NAME)?.value).toEqual(expect.any(String));
    });
  });

  describe('beginEmailChange', () => {
    it('rejects an incorrect password', async () => {
      const deps = makeDeps({ users: { verifyPassword: async () => false } });
      await expect(
        beginEmailChange(makeRequest({ body: { newEmail: 'new@example.com', password: 'wrong' } }), deps),
      ).rejects.toBeInstanceOf(ValidationError);
    });

    it('begins the change and enqueues the confirmation email', async () => {
      const currentUser = { ...verifiedUser, settings: { locale: 'en' } } as unknown as UserRecord;
      const updated = { ...currentUser, newEmailVerificationCode: 'NEWCODE' } as unknown as UserRecord;
      const queueEmailUpdateLink = vi.fn();
      const deps = makeDeps({
        authenticate: (async () => currentUser) as RouteDependencies['authenticate'],
        users: { verifyPassword: async () => true, beginEmailUpdate: async () => updated },
        emailService: { queueEmailUpdateLink },
      });
      const result = await beginEmailChange(
        makeRequest({ body: { newEmail: 'new@example.com', password: 'pw' } }),
        deps,
      );
      expect(result.body).toEqual({ data: { success: true } });
      expect(queueEmailUpdateLink).toHaveBeenCalledWith('user@example.com', 'new@example.com', 'NEWCODE', 'en');
    });
  });

  describe('completeEmailChange', () => {
    it('throws NotFound for an unknown code', async () => {
      const deps = makeDeps({ users: { findByNewEmailVerificationCode: async () => null } });
      await expect(
        completeEmailChange(makeRequest({ params: { newEmailVerificationCode: 'x' } }), deps),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('completes the change and returns a token + cookie', async () => {
      const pending = {
        ...verifiedUser,
        newEmail: 'new@example.com',
        newEmailVerificationCode: 'GOOD',
        newEmailVerificationExpires: new Date(Date.now() + 60_000),
      } as unknown as UserRecord;
      const deps = makeDeps({
        users: {
          findByNewEmailVerificationCode: async () => pending,
          findByEmail: async () => null, // new address not in use
          completeEmailUpdate: async () => verifiedUser,
        },
      });
      const result = await completeEmailChange(makeRequest({ params: { newEmailVerificationCode: 'GOOD' } }), deps);
      expect(typeof (result.body?.data as { token: string }).token).toBe('string');
      expect(result.cookies?.find((c) => c.name === AUTH_COOKIE_NAME)?.value).toEqual(expect.any(String));
    });
  });

  describe('resendEmailVerification', () => {
    it('returns generic success without queueing for an unknown email', async () => {
      const queueUserEmailVerification = vi.fn();
      const deps = makeDeps({
        users: { findByEmail: async () => null },
        emailService: { queueUserEmailVerification },
      });
      const result = await resendEmailVerification(
        makeRequest({ body: { email: 'ghost@example.com', locale: 'en' } }),
        deps,
      );
      expect((result.body?.data as { success: boolean }).success).toBe(true);
      expect(queueUserEmailVerification).not.toHaveBeenCalled();
    });

    it('rejects a missing email', async () => {
      const deps = makeDeps();
      await expect(resendEmailVerification(makeRequest({ body: {} }), deps)).rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe('verifyGoogleOauth', () => {
    beforeEach(() => {
      mockVerifyState.mockReset();
      mockVerifyState.mockReturnValue(false);
    });

    it('rejects an invalid CSRF state', async () => {
      const deps = makeDeps();
      await expect(
        verifyGoogleOauth(makeRequest({ body: { code: 'c', state: 'invalid', locale: 'en' } }), deps),
      ).rejects.toBeInstanceOf(InvalidRequestError);
    });

    it('rejects a non-string code once the state is valid (NoSQL injection guard)', async () => {
      mockVerifyState.mockReturnValue(true);
      const deps = makeDeps();
      await expect(
        verifyGoogleOauth(makeRequest({ body: { code: { $gt: '' }, state: 'ok', locale: 'en' } }), deps),
      ).rejects.toBeInstanceOf(InvalidRequestError);
    });
  });

  describe('googleIdTokenLogin', () => {
    beforeEach(() => {
      mockedVerifyIdToken.mockReset();
    });

    it('rejects a missing idToken with a ValidationError', async () => {
      const deps = makeDeps();
      await expect(googleIdTokenLogin(makeRequest({ body: {} }), deps))
        .rejects.toBeInstanceOf(ValidationError);
      expect(mockedVerifyIdToken).not.toHaveBeenCalled();
    });

    it('rejects a non-string idToken (NoSQL injection guard)', async () => {
      const deps = makeDeps();
      await expect(googleIdTokenLogin(makeRequest({ body: { idToken: { $gt: '' } } }), deps))
        .rejects.toBeInstanceOf(ValidationError);
    });

    it('maps a verification failure to an InvalidRequestError', async () => {
      mockedVerifyIdToken.mockRejectedValue(new Error('Invalid Google id_token (status 400)'));
      const deps = makeDeps();
      await expect(googleIdTokenLogin(makeRequest({ body: { idToken: 'bad' } }), deps))
        .rejects.toBeInstanceOf(InvalidRequestError);
    });

    it('links the Google account to an existing user and returns a token + cookie', async () => {
      mockedVerifyIdToken.mockResolvedValue({
        googleUserId: 'g-sub-1',
        email: 'user@example.com',
        audience: 'aud',
      });
      const existing = { ...verifiedUser, googleId: null } as unknown as UserRecord;
      const linkGoogleAccount = vi.fn(async () => existing);
      const create = vi.fn();
      const deps = makeDeps({
        users: { findByEmail: async () => existing, linkGoogleAccount, create },
      });

      const result = await googleIdTokenLogin(makeRequest({ body: { idToken: 'good' } }), deps);

      expect(linkGoogleAccount).toHaveBeenCalledWith(USER_ID, 'g-sub-1');
      expect(create).not.toHaveBeenCalled();
      expect(typeof (result.body.data as { token: string }).token).toBe('string');
      expect(result.cookies?.find((c) => c.name === AUTH_COOKIE_NAME)?.value).toEqual(expect.any(String));
    });

    it('does not re-link when the existing user already has a googleId', async () => {
      mockedVerifyIdToken.mockResolvedValue({
        googleUserId: 'g-sub-1',
        email: 'user@example.com',
        audience: 'aud',
      });
      const existing = { ...verifiedUser, googleId: 'already-linked' } as unknown as UserRecord;
      const linkGoogleAccount = vi.fn();
      const deps = makeDeps({ users: { findByEmail: async () => existing, linkGoogleAccount } });

      await googleIdTokenLogin(makeRequest({ body: { idToken: 'good' } }), deps);

      expect(linkGoogleAccount).not.toHaveBeenCalled();
    });

    it('creates a new OAuth-only account for an unknown email', async () => {
      mockedVerifyIdToken.mockResolvedValue({
        googleUserId: 'g-sub-2',
        email: 'new@example.com',
        audience: 'aud',
      });
      const created = { ...verifiedUser, email: 'new@example.com', hasLocalAccount: false } as unknown as UserRecord;
      const create = vi.fn(async () => created);
      const deps = makeDeps({ users: { findByEmail: async () => null, create } });

      const result = await googleIdTokenLogin(
        makeRequest({ body: { idToken: 'good', locale: 'en' } }),
        deps,
      );

      expect(create).toHaveBeenCalledWith({
        email: 'new@example.com',
        emailVerificationCode: '',
        password: null,
        googleId: 'g-sub-2',
        locale: 'en',
      });
      expect(typeof (result.body.data as { token: string }).token).toBe('string');
      expect(result.cookies?.find((c) => c.name === AUTH_COOKIE_NAME)?.value).toEqual(expect.any(String));
    });
  });
});
