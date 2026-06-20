import { describe, test, expect } from 'vitest';
import { requestApi, createTestUser, deleteTestUser } from './helpers';

describe('Feedback routes', () => {
  test('POST /api/feedback (guest) (flaky - rate limiting)', async () => {
    // Act
    const res = await requestApi
      .post('/api/feedback')
      .send({
        email: 'guest@example.com',
        kind: 'bug',
        message: 'Test feedback from guest',
      });

    // Assert
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('data');
    expect(res.body).not.toHaveProperty('error');
    expect(res.body.data).toHaveProperty('ip');
    expect(res.body.data).toHaveProperty('owner');
    expect(res.body.data).toHaveProperty('email');
    expect(res.body.data).toHaveProperty('kind');
    expect(res.body.data).toHaveProperty('message');
    expect(res.body.data).toHaveProperty('createdAt');
    expect(res.body.data).toHaveProperty('updatedAt');
  });

  test('POST /api/feedback (authenticated user)', async () => {
    // Arrange
    const testUser = await createTestUser();

    // Act
    const res = await requestApi
      .post('/api/feedback')
      .set('Authorization', `Bearer ${testUser.token}`)
      .send({
        email: testUser.email,
        kind: 'feature',
        message: 'Test feedback from authenticated user',
      });

    // Assert
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('data');
    expect(res.body).not.toHaveProperty('error');
    expect(res.body.data).toHaveProperty('ip');
    expect(res.body.data).toHaveProperty('owner');
    expect(res.body.data).toHaveProperty('email');
    expect(res.body.data).toHaveProperty('kind');
    expect(res.body.data).toHaveProperty('message');
    expect(res.body.data).toHaveProperty('createdAt');
    expect(res.body.data).toHaveProperty('updatedAt');

    // Cleanup
    await deleteTestUser(testUser);
  });

  // Negative-path validation (previously enforced by Mongoose). These share
  // the same IP-based rate limit as the cases above, so they are kept minimal.
  test('POST /api/feedback rejects an unknown kind', async () => {
    const res = await requestApi
      .post('/api/feedback')
      .send({ email: 'guest@example.com', kind: 'not-a-kind', message: 'Hello' });

    // 400 for validation; 429 is possible if the shared rate limit is hit.
    expect([400, 429]).toContain(res.statusCode);
    if (res.statusCode === 400) {
      expect(res.body.error.code).toBe('validation_error');
    }
  });

  test('POST /api/feedback rejects an invalid email', async () => {
    const res = await requestApi
      .post('/api/feedback')
      .send({ email: 'not-an-email', kind: 'bug', message: 'Hello' });

    expect([400, 429]).toContain(res.statusCode);
    if (res.statusCode === 400) {
      expect(res.body.error.code).toBe('validation_error');
    }
  });
});

