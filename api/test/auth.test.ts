import { describe, it, test, expect } from 'vitest';
import {
  requestApi,
  createTestUser,
  deleteTestUser,
  generateTestEmail,
  generateRandomString,
} from './helpers';

const { TEST_BYPASS_SECRET } = process.env;

const AUTH_COOKIE_NAME = 'auth_token';

/**
 * Integration tests for the auth routes (run against a live API + DB).
 *
 * Flows that previously relied on the test-bypass echoing one-time codes
 * (verification / reset / email-change codes) back in the response now live as
 * pure handler unit tests in `auth.handlers.test.ts`. These remaining tests
 * cover HTTP-level concerns (status codes, `Set-Cookie` headers, rate limiting).
 *
 * Requires the API under test to run with `REQUIRE_EMAIL_VERIFICATION=false`: the
 * test-bypass no longer marks registered users verified (verification skipping is
 * now governed by config), so `createTestUser` relies on that flag to register →
 * log in. The `x-test-bypass-secret` header still skips rate limiting.
 */

describe('Auth routes', () => {
  test('POST /api/auth/login (invalid credentials)', async () => {
    // Act
    const res = await requestApi
      .post('/api/auth/login')
      .send({
        email: 'invalid@example.com',
        password: 'invalid_password',
      });

    // Assert
    expect(res.statusCode).toBe(403);
    expect(res.headers['set-cookie']).toBeUndefined();
    expect(res.body).toHaveProperty('error');
    expect(res.body).not.toHaveProperty('data');
    expect(res.body.error).toEqual({
      code: 'unauthorized',
      errors: [{ field: null, code: 'invalid_login' }],
    });
  });

  test('POST /api/auth/login (valid credentials)', async () => {
    // Arrange
    const testUser = await createTestUser();

    // Act
    const res = await requestApi
      .post('/api/auth/login')
      .set('x-test-bypass-secret', TEST_BYPASS_SECRET!)
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    // Assert
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).not.toHaveProperty('error');
    // expect token in response body
    expect(res.body.data).toHaveProperty('token');
    expect(typeof res.body.data.token).toBe('string');
    // expect cookie to be set in header
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie']?.[0]).toContain(`${AUTH_COOKIE_NAME}=`);

    // Cleanup
    await deleteTestUser(testUser);
  });

  test('POST /api/auth/logout', async () => {
    // Arrange
    const testUser = await createTestUser();

    // Act
    const res = await requestApi
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${testUser.token}`);

    // Assert
    expect(res.statusCode).toBe(200);
    // expect cookie to be cleared in header
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie']?.[0]).toContain(`${AUTH_COOKIE_NAME}=;`);

    // Cleanup
    await deleteTestUser(testUser);
  });

  test('GET /api/auth/user (unauthenticated)', async () => {
    // Act
    const res = await requestApi
      .get('/api/auth/user');

    // Assert
    // The ONE unauthenticated route that returns a 200
    // only because Nuxt auth would fail otherwise
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).not.toHaveProperty('error');
    expect(res.body.data).toHaveProperty('user');
    expect(res.body.data.user).toBe(null);
  });

  test('GET /api/auth/user (authenticated)', async () => {
    // Arrange
    const testUser = await createTestUser();

    // Act
    const res = await requestApi
      .get('/api/auth/user')
      .set('Authorization', `Bearer ${testUser.token}`);

    // Assert
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).not.toHaveProperty('error');
    expect(res.body.data).toHaveProperty('user');
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.user.hasLocalAccount).toBe(true);
    expect(res.body.data.user.isAdmin).toBe(false);

    // Cleanup
    await deleteTestUser(testUser);
  });

  describe('POST /api/auth/register', () => {
    it('error if email is invalid', async () => {
      const response = await requestApi
        .post('/api/auth/register')
        // bypass rate limiting
        .set('x-test-bypass-secret', TEST_BYPASS_SECRET!)
        .send({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User',
          locale: 'en',
        });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body).not.toHaveProperty('data');
      expect(response.body.error).toEqual({
        code: 'validation_error',
        errors: [{ field: 'email', code: 'not_valid' }],
      });
    });

    it('returns generic success, notifies the holder once, and cools down repeat notices', async () => {
      // Registering with a taken email must be indistinguishable from a fresh
      // signup (no `email_in_use` leak). Instead of erroring, the API notifies
      // the existing account holder — but only once per cooldown window, so a
      // repeated probe can't flood their inbox.
      const testUser = await createTestUser();

      const registerTaken = () => requestApi
        .post('/api/auth/register')
        // bypass rate limiting
        .set('x-test-bypass-secret', TEST_BYPASS_SECRET!)
        .send({
          email: testUser.email,
          password: 'newpassword123',
          locale: 'en',
        });

      const countNotices = async (): Promise<number> => {
        const emailsResponse = await requestApi
          .get('/api/test/emails')
          .query({ to: testUser.email, subject: 'You already have an account' })
          .set('x-test-bypass-secret', TEST_BYPASS_SECRET!);
        expect(emailsResponse.statusCode).toBe(200);
        return emailsResponse.body.data.length;
      };

      // First attempt: same generic success as a new account, no error leak.
      const response = await registerTaken();
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ data: { success: true } });
      expect(response.body).not.toHaveProperty('error');

      // A privacy-preserving "you already have an account" notice was recorded
      // for the existing holder (emails are recorded as `log_only` outside prod).
      // Recording is enqueued off the request path, so poll the seam briefly.
      let noticeCount = 0;
      for (let attempt = 0; attempt < 10 && noticeCount === 0; attempt++) {
        noticeCount = await countNotices();
        if (noticeCount === 0) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
      expect(noticeCount).toBe(1);

      // Second attempt within the cooldown: still a generic success, but no new
      // notice is sent to the victim.
      const secondResponse = await registerTaken();
      expect(secondResponse.statusCode).toBe(200);
      expect(secondResponse.body).toEqual({ data: { success: true } });
      // Give any (unwanted) enqueued email time to land before asserting.
      await new Promise((resolve) => setTimeout(resolve, 300));
      expect(await countNotices()).toBe(1);

      // Cleanup
      await deleteTestUser(testUser);
    });

    it('error if password is too short', async () => {
      const response = await requestApi
        .post('/api/auth/register')
        // bypass rate limiting
        .set('x-test-bypass-secret', TEST_BYPASS_SECRET!)
        .send({
          email: generateTestEmail(),
          password: '123',
          name: 'Test User',
          locale: 'en',
        });
      expect(response.status).toBe(400);
      expect(response.body.error).toEqual({
        code: 'validation_error',
        errors: [{
          field: 'password',
          code: 'min_length',
          properties: { minlength: 8 },
        }],
      });
    });

    it('enforces rate limiting when test bypass header is not present', async () => {
      // Send 6 requests to ensure the rate limit is enforced
      // (previous tests may have already counted against the rate limit)
      let response: any = null;
      const testUsers: { email: string; password: string; token: string }[] = [];
      for (let i = 0; i < 6; i++) {
        const email = generateTestEmail();
        const password = generateRandomString(10);
        response = await requestApi
          .post('/api/auth/register')
          .send({
            email,
            password,
            locale: 'en',
          });

        if (response.status === 200) {
          testUsers.push({
            email,
            password,
            token: response.body.data.token,
          });
        }
      }

      expect(response.status).toBe(429); // Too Many Requests
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toEqual({
        code: 'too_many_requests',
      });

      for (const testUser of testUsers) {
        await deleteTestUser(testUser);
      }
    });

    it('bypasses rate limiting when test bypass header is present', async () => {
      // Should be able to make more than 5 requests when bypass header is present
      const successfulRequests: any[] = [];
      const testUsers: { email: string; password: string; token: string }[] = [];
      for (let i = 0; i < 7; i++) {
        const email = generateTestEmail();
        const password = generateRandomString(10);

        const response = await requestApi
          .post('/api/auth/register')
          .set('x-test-bypass-secret', TEST_BYPASS_SECRET!)
          .send({
            email,
            password,
            locale: 'en',
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('success');
        expect(response.body.data.success).toBe(true);
        successfulRequests.push(response);

        // Login to get token for cleanup
        if (response.status === 200) {
          const loginResponse = await requestApi
            .post('/api/auth/login')
            .set('x-test-bypass-secret', TEST_BYPASS_SECRET!)
            .send({ email, password });
          if (loginResponse.status === 200) {
            testUsers.push({
              email,
              password,
              token: loginResponse.body.data.token,
            });
          }
        }
      }

      for (const testUser of testUsers) {
        await deleteTestUser(testUser);
      }
    });
  });

  describe('POST /api/auth/verify-email', () => {
    it('returns 404 for invalid verification code', async () => {
      const res = await requestApi
        .post('/api/auth/verify-email')
        .send({ code: 'invalid-code-12345' });
      expect(res.statusCode).toBe(404);
    });

    // The valid-code flow (token + auth cookie on success) is covered by the
    // `verifyEmail` handler unit test, which no longer needs the bypass to inject
    // a known verification code.
  });


  describe('PATCH /api/auth/password', () => {
    test('Incorrect password for password change', async () => {
      // Arrange
      const testUser = await createTestUser();

      // Act
      const response = await requestApi
        .patch('/api/auth/password')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123',
        });

      // Assert
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body).not.toHaveProperty('data');
      expect(response.body.error).toEqual({
        code: 'validation_error',
        errors: [{ field: 'currentPassword', code: 'password_incorrect' }],
      });

      // Cleanup
      await deleteTestUser(testUser);
    });
  });


  describe('POST /api/auth/password/reset', () => {
    it('never includes the reset code in the response body', async () => {
      const testUser = await createTestUser();
      const response = await requestApi
        .post('/api/auth/password/reset')
        .send({
          email: testUser.email,
        });
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).not.toHaveProperty('error');
      expect(response.body.data).not.toHaveProperty('passwordResetCode');

      await deleteTestUser(testUser);
    });

    it('returns generic success for an unknown email to prevent account enumeration', async () => {
      const response = await requestApi
        .post('/api/auth/password/reset')
        .set('x-test-bypass-secret', TEST_BYPASS_SECRET!)
        .send({
          email: 'unknown-account@example.com',
        });
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).not.toHaveProperty('error');
      expect(response.body.data).toEqual({ success: true });
    });
  });

  describe('POST /api/auth/verify-email/resend', () => {
    it('returns 200 for unknown email (avoid enumeration)', async () => {
      const res = await requestApi
        .post('/api/auth/verify-email/resend')
        .send({ email: 'unknown_user@example.com', locale: 'en' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).not.toHaveProperty('error');
      expect(res.body.data).toHaveProperty('success');
      expect(res.body.data).toHaveProperty('secondsUntilCanRetry');
      expect(res.body.data.success).toBe(true);
      expect(res.body.data.secondsUntilCanRetry).toBe(300);
    });

    // The cooldown branch (recently-sent verification email) is config-dependent
    // (`requireEmailVerification`) and is covered at the handler level.
  });

  describe('POST /api/auth/password/reset/:passwordResetCode', () => {
    it('returns 404 for invalid reset code', async () => {
      const res = await requestApi
        .post('/api/auth/password/reset/invalid-code-12345')
        .send({ newPassword: 'newpassword123' });
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error');
      expect(res.body).not.toHaveProperty('data');
      expect(res.body.error).toEqual({
        code: 'not_found',
      });
    });

    // The valid-code flow (token + auth cookie on success) is covered by the
    // `completePasswordReset` handler unit test.
  });

  describe('POST /api/auth/oauth2/google/verify', () => {
    it('returns 400 for invalid state parameter', async () => {
      const res = await requestApi
        .post('/api/auth/oauth2/google/verify')
        .send({ code: 'test-code', state: 'invalid-state' });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body).not.toHaveProperty('data');
      expect(res.body.error.code).toBe('invalid_request');
    });

    // Note: A full test that verifies token and cookie would require mocking
    // the Google OAuth API calls (getAccessTokenFromCode and getUserProfileFromToken).
    // The endpoint does set a cookie and return a token when successful,
    // as seen in the route implementation at api/http/handlers/auth/oauth.ts
  });

  describe('POST /api/auth/oauth2/google/id-token', () => {
    it('returns 400 when idToken is missing', async () => {
      const res = await requestApi
        .post('/api/auth/oauth2/google/id-token')
        .send({ locale: 'en' });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body).not.toHaveProperty('data');
      expect(res.body.error.errors).toEqual([{ code: 'required', field: 'idToken' }]);
    });

    // Note: the success path (verifying a real Google id_token via the tokeninfo
    // endpoint, then returning a token + auth cookie) can't be exercised here
    // because the out-of-process live API server can't intercept Google's HTTP
    // call. That behavior is covered by the `googleIdTokenLogin` handler unit
    // tests in auth.handlers.test.ts.
  });

  describe('POST /api/auth/change-email', () => {
    it('never includes the new email verification code in the response body', async () => {
      const testUser = await createTestUser();
      const response = await requestApi
        .post('/api/auth/change-email')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          newEmail: generateTestEmail(),
          password: testUser.password,
        });
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).not.toHaveProperty('error');
      expect(response.body.data).not.toHaveProperty('newEmailVerificationCode');

      await deleteTestUser(testUser);
    });
  });

  describe('POST /api/auth/change-email/:newEmailVerificationCode', () => {
    // The completion flow (token + auth cookie on success) is covered by the
    // `completeEmailChange` handler unit test, which no longer needs the bypass
    // to inject a known verification code.
    it('returns 404 for invalid verification code', async () => {
      const res = await requestApi
        .post('/api/auth/change-email/invalid-code-12345');
      expect(res.statusCode).toBe(404);
    });
  });
});
