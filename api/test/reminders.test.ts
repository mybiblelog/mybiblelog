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

  test('PATCH /api/reminders/daily-reminder (update single property)', async () => {
    // Act
    const res = await requestApi
      .patch('/api/reminders/daily-reminder')
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

  test('PATCH /api/reminders/daily-reminder (update multiple properties)', async () => {
    // Act
    const res = await requestApi
      .patch('/api/reminders/daily-reminder')
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

  // Negative-path validation: bounds previously enforced by Mongoose.
  const invalidReminderCases: { name: string; body: Record<string, unknown> }[] = [
    { name: 'hour above maximum', body: { hour: 24 } },
    { name: 'hour below minimum', body: { hour: -1 } },
    { name: 'minute above maximum', body: { minute: 60 } },
    { name: 'minute below minimum', body: { minute: -1 } },
    { name: 'timezoneOffset below minimum', body: { timezoneOffset: -721 } },
    { name: 'timezoneOffset above maximum', body: { timezoneOffset: 841 } },
  ];

  for (const { name, body } of invalidReminderCases) {
    test(`PATCH /api/reminders/daily-reminder rejects ${name}`, async () => {
      const res = await requestApi
        .patch('/api/reminders/daily-reminder')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(body);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body).not.toHaveProperty('data');
      expect(res.body.error.code).toBe('validation_error');
    });
  }

  test('GET /api/reminders/daily-reminder/track/:token (redirects safely)', async () => {
    const res = await requestApi
      .get('/api/reminders/daily-reminder/track/not-a-real-token?to=/start');

    expect(res.statusCode).toBe(302);
    expect(res.headers).toHaveProperty('location');
    expect(res.headers.location).toMatch(/\/start$/);
  });
});

