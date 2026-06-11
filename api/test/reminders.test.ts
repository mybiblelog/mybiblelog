import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { requestApi, createTestUser, deleteTestUser, TestUser } from './helpers';

describe('Reminders routes', () => {
  let testUser: TestUser;

  beforeEach(async () => {
    testUser = await createTestUser();
  });

  afterEach(async () => {
    await deleteTestUser(testUser);
  });

  test('GET /api/reminders/daily-reminder (protected)', async () => {
    // Act
    const res = await requestApi
      .get('/api/reminders/daily-reminder')
      .set('Authorization', `Bearer ${testUser.token}`);

    // Assert
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).not.toHaveProperty('error');
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('hour');
    expect(res.body.data).toHaveProperty('minute');
    expect(res.body.data).toHaveProperty('timezoneOffset');
    expect(res.body.data).toHaveProperty('active');
  });

  test('PUT /api/reminders/daily-reminder (update single property)', async () => {
    // Act
    const res = await requestApi
      .put('/api/reminders/daily-reminder')
      .set('Authorization', `Bearer ${testUser.token}`)
      .send({
        hour: 9,
      });

    // Assert
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).not.toHaveProperty('error');
    expect(res.body.data.hour).toBe(9);
  });

  test('PUT /api/reminders/daily-reminder (update multiple properties)', async () => {
    // Act
    const res = await requestApi
      .put('/api/reminders/daily-reminder')
      .set('Authorization', `Bearer ${testUser.token}`)
      .send({
        hour: 10,
        minute: 30,
        timezoneOffset: -420,
        active: true,
      });

    // Assert
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).not.toHaveProperty('error');
    expect(res.body.data.hour).toBe(10);
    expect(res.body.data.minute).toBe(30);
    expect(res.body.data.timezoneOffset).toBe(-420);
    expect(res.body.data.active).toBe(true);
  });

  test('GET /api/reminders/daily-reminder/track/:token (redirects safely)', async () => {
    const res = await requestApi
      .get('/api/reminders/daily-reminder/track/not-a-real-token?to=/start');

    expect(res.statusCode).toBe(302);
    expect(res.headers).toHaveProperty('location');
    expect(res.headers.location).toMatch(/\/start$/);
  });
});

