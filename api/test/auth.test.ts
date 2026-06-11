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
        errors: [{ field: 'email', code: 'review', properties: {} }],
      });
    });

    it('error if email already in use', async () => {
      // Arrange
      const testUser = await createTestUser();

      // Act
      const response = await requestApi
        .post('/api/auth/register')
        // bypass rate limiting
        .set('x-test-bypass-secret', TEST_BYPASS_SECRET!)
        .send({
          email: testUser.email,
          password: 'newpassword123',
          locale: 'en',
        });

      // Assert
      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body).not.toHaveProperty('data');
      expect(response.body.error).toEqual({
        code: 'validation_error',
        errors: [{ field: 'email', code: 'email_in_use' }],
      });

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

    it('returns a token with cookie when verification code is valid', async () => {
      const testEmail = generateTestEmail();
      const testEmailVerificationCode = generateRandomString(64);
      const registerResponse = await requestApi
        .post('/api/auth/register')
        .set('x-test-bypass-secret', TEST_BYPASS_SECRET!)
        .send({
          email: testEmail,
          password: 'password123',
          locale: 'en',
          emailVerificationCode: testEmailVerificationCode,
        });
      expect(registerResponse.statusCode).toBe(200);

      const res = await requestApi
        .post(`/api/auth/verify-email`)
        .send({ code: testEmailVerificationCode });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).not.toHaveProperty('error');
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.headers['set-cookie']?.[0]).toContain(`${AUTH_COOKIE_NAME}=`);
      expect(res.body.data).toHaveProperty('token');
      expect(typeof res.body.data.token).toBe('string');

      await deleteTestUser({ token: registerResponse.body.data.token });
    });
  });


  describe('PUT /api/auth/change-password', () => {
    test('Incorrect password for password change', async () => {
      // Arrange
      const testUser = await createTestUser();

      // Act
      const response = await requestApi
        .put('/api/auth/change-password')
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


  describe('POST /api/auth/reset-password', () => {
    it('returns the password reset code in the response body when test bypass header is present', async () => {
      const testUser = await createTestUser();
      const response = await requestApi
        .post('/api/auth/reset-password')
        .set('x-test-bypass-secret', TEST_BYPASS_SECRET!)
        .send({
          email: testUser.email,
        });
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).not.toHaveProperty('error');
      expect(response.body.data).toHaveProperty('success');
      expect(response.body.data.success).toBe(true);
      expect(response.body.data).toHaveProperty('passwordResetCode');
      expect(response.body.data.passwordResetCode).toBeDefined();

      await deleteTestUser(testUser);
    });

    it('does not return the password reset code in the response body when test bypass header is not present', async () => {
      const testUser = await createTestUser();
      const response = await requestApi
        .post('/api/auth/reset-password')
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
        .post('/api/auth/reset-password')
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

  describe('POST /api/auth/resend-email-verification', () => {
    it('returns 200 for unknown email (avoid enumeration)', async () => {
      const res = await requestApi
        .post('/api/auth/resend-email-verification')
        .send({ email: 'unknown_user@example.com', locale: 'en' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).not.toHaveProperty('error');
      expect(res.body.data).toHaveProperty('success');
      expect(res.body.data).toHaveProperty('secondsUntilCanRetry');
      expect(res.body.data.success).toBe(true);
      expect(res.body.data.secondsUntilCanRetry).toBe(300);
    });

    it('returns cooldown info for recently-sent verification email', async () => {
      const testEmail = generateTestEmail();
      const testEmailVerificationCode = generateRandomString(64);

      const registerResponse = await requestApi
        .post('/api/auth/register')
        .set('x-test-bypass-secret', TEST_BYPASS_SECRET!)
        .send({
          email: testEmail,
          password: 'password123',
          locale: 'en',
          emailVerificationCode: testEmailVerificationCode,
        });
      expect(registerResponse.statusCode).toBe(200);

      const res = await requestApi
        .post('/api/auth/resend-email-verification')
        .set('x-test-bypass-secret', TEST_BYPASS_SECRET!)
        .send({ email: testEmail, locale: 'en' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).not.toHaveProperty('error');
      expect(res.body.data.success).toBe(true); // always true to avoid enumeration
      expect(res.body.data.secondsUntilCanRetry).toBeGreaterThan(0);
      expect(res.body.data.secondsUntilCanRetry).toBeLessThanOrEqual(300);

      // Cleanup by logging in (bypasses email verification) then deleting account
      const loginResponse = await requestApi
        .post('/api/auth/login')
        .set('x-test-bypass-secret', TEST_BYPASS_SECRET!)
        .send({ email: testEmail, password: 'password123' });
      expect(loginResponse.statusCode).toBe(200);
      await deleteTestUser({ token: loginResponse.body.data.token });
    });
  });

  describe('POST /api/auth/reset-password/:passwordResetCode', () => {
    it('returns 404 for invalid reset code', async () => {
      const res = await requestApi
        .post('/api/auth/reset-password/invalid-code-12345')
        .send({ newPassword: 'newpassword123' });
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error');
      expect(res.body).not.toHaveProperty('data');
      expect(res.body.error).toEqual({
        code: 'not_found',
      });
    });

    it('returns a token with cookie when reset code is valid', async () => {
      const testUser = await createTestUser();
      const passwordResetCodeResponse = await requestApi
        .post('/api/auth/reset-password')
        .set('x-test-bypass-secret', TEST_BYPASS_SECRET!)
        .send({ email: testUser.email });

      const passwordResetCode = passwordResetCodeResponse.body.data.passwordResetCode;
      expect(passwordResetCode).toBeDefined();

      const response = await requestApi
        .post(`/api/auth/reset-password/${passwordResetCode}`)
        .send({ newPassword: 'newpassword123' });

      expect(response.statusCode).toBe(200);
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie']?.[0]).toContain(`${AUTH_COOKIE_NAME}=`);
      expect(response.body).toHaveProperty('data');
      expect(response.body).not.toHaveProperty('error');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.token).toBeDefined();
      expect(typeof response.body.data.token).toBe('string');

      await deleteTestUser(testUser);
    });
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
    // as seen in the route implementation at api/router/routes/auth.ts:414-483
  });

  describe('POST /api/auth/change-email', () => {
    it('returns the new email verification code in the response body when test bypass header is present', async () => {
      const testUser = await createTestUser();
      const response = await requestApi
        .post('/api/auth/change-email')
        .set('x-test-bypass-secret', TEST_BYPASS_SECRET!)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          newEmail: generateTestEmail(),
          password: testUser.password,
        });
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).not.toHaveProperty('error');
      expect(response.body.data).toHaveProperty('success');
      expect(response.body.data.success).toBe(true);
      expect(response.body.data).toHaveProperty('newEmailVerificationCode');
      expect(response.body.data.newEmailVerificationCode).toBeDefined();

      await deleteTestUser(testUser);
    });

    it('does not return the new email verification code in the response body when test bypass header is not present', async () => {
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
    it('changes email and returns token with cookie', async () => {
      const testUser = await createTestUser();
      const newEmail = generateTestEmail();
      const newEmailVerificationCodeResponse = await requestApi
        .post('/api/auth/change-email')
        .set('x-test-bypass-secret', TEST_BYPASS_SECRET!)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          newEmail,
          password: testUser.password,
        });
      const newEmailVerificationCode = newEmailVerificationCodeResponse.body.data.newEmailVerificationCode;
      expect(newEmailVerificationCode).toBeDefined();

      const response = await requestApi
        .post(`/api/auth/change-email/${newEmailVerificationCode}`)
        // .set('Authorization', `Bearer ${testUser.token}`)
        .send({
          newEmail,
          password: testUser.password,
        });
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).not.toHaveProperty('error');
      expect(response.body.data).toHaveProperty('token');
      expect(typeof response.body.data.token).toBe('string');
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie']?.[0]).toContain(`${AUTH_COOKIE_NAME}=`);

      // Verify email change (by logging in with the new email)
      const loginResponse = await requestApi
        .post('/api/auth/login')
        .send({
          email: newEmail,
          password: testUser.password,
        });
      expect(loginResponse.statusCode).toBe(200);
      expect(loginResponse.body).toHaveProperty('data');
      expect(loginResponse.body).not.toHaveProperty('error');

      await deleteTestUser(testUser);
    });

    it('returns 404 for invalid verification code', async () => {
      const res = await requestApi
        .post('/api/auth/change-email/invalid-code-12345');
      expect(res.statusCode).toBe(404);
    });
  });
});
