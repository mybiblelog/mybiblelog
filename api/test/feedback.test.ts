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
});

