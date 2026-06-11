import { describe, it, expect } from 'vitest';
import { requestApi, createTestUser, deleteTestUser } from './helpers';
import { AUTH_COOKIE_NAME } from '../router/helpers/authCurrentUser';

describe('settings.test.js', () => {
  describe('GET /api/settings', () => {
    it('protected from guests', async () => {
      const response = await requestApi
        .get('/api/settings');
      expect(response.status).toBe(401);
    });

    it('settings response has expected properties', async () => {
      const testUser = await createTestUser();
      try {
        const response = await requestApi
          .get('/api/settings')
          .set('Authorization', `Bearer ${testUser.token}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body).not.toHaveProperty('error');
        expect(response.body.data).toHaveProperty('dailyVerseCountGoal');
        expect(response.body.data).toHaveProperty('lookBackDate');
        expect(response.body.data).toHaveProperty('preferredBibleVersion');
        expect(response.body.data).toHaveProperty('startPage');
        expect(response.body.data).toHaveProperty('locale');

        // verify lookBackDate is in correct format
        expect(typeof response.body.data.lookBackDate).toBe('string');
        expect(response.body.data.lookBackDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });
  });

  describe('PUT /api/settings', () => {
    it('protected from guests', async () => {
      const response = await requestApi
        .put('/api/settings')
        .send({ settings: { dailyVerseCountGoal: 100 } });
      expect(response.status).toBe(401);
    });

    it('user can update individual settings (dailyVerseCountGoal)', async () => {
      const testUser = await createTestUser();
      try {
        // First get current settings
        const getResponse = await requestApi
          .get('/api/settings')
          .set('Authorization', `Bearer ${testUser.token}`);
        const originalGoal = getResponse.body.data.dailyVerseCountGoal;

        // Update just the dailyVerseCountGoal
        const newGoal = originalGoal + 10;
        const putResponse = await requestApi
          .put('/api/settings')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send({ settings: { dailyVerseCountGoal: newGoal } });
        expect(putResponse.status).toBe(200);
        expect(putResponse.body).toHaveProperty('data');
        expect(putResponse.body).not.toHaveProperty('error');

        // Verify the change
        const verifyResponse = await requestApi
          .get('/api/settings')
          .set('Authorization', `Bearer ${testUser.token}`);
        expect(verifyResponse.body.data.dailyVerseCountGoal).toBe(newGoal);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('user can update multiple settings at once', async () => {
      const testUser = await createTestUser();
      try {
        const newSettings = {
          dailyVerseCountGoal: 100,
          lookBackDate: '2024-01-01',
          preferredBibleVersion: 'NASB2020',
          locale: 'en',
        };

        const putResponse = await requestApi
          .put('/api/settings')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send({ settings: newSettings });
        expect(putResponse.status).toBe(200);
        expect(putResponse.body).toHaveProperty('data');
        expect(putResponse.body).not.toHaveProperty('error');

        // Verify all changes
        const verifyResponse = await requestApi
          .get('/api/settings')
          .set('Authorization', `Bearer ${testUser.token}`);
        expect(verifyResponse.body.data).toMatchObject(newSettings);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('ignores undefined settings', async () => {
      const testUser = await createTestUser();
      try {
        // First get current settings
        const getResponse = await requestApi
          .get('/api/settings')
          .set('Authorization', `Bearer ${testUser.token}`);
        const originalSettings = { ...getResponse.body.data };

        // Update with some undefined values
        const putResponse = await requestApi
          .put('/api/settings')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send({ settings: { dailyVerseCountGoal: 100, lookBackDate: undefined } });
        expect(putResponse.status).toBe(200);
        expect(putResponse.body).toHaveProperty('data');
        expect(putResponse.body).not.toHaveProperty('error');

        // Verify only the defined setting changed
        const verifyResponse = await requestApi
          .get('/api/settings')
          .set('Authorization', `Bearer ${testUser.token}`);
        expect(verifyResponse.body.data.dailyVerseCountGoal).toBe(100);
        expect(verifyResponse.body.data.lookBackDate).toBe(originalSettings.lookBackDate);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });
  });

  describe('PUT /api/settings/delete-account', () => {
    it('protected from guests', async () => {
      const response = await requestApi
        .put('/api/settings/delete-account');
      expect(response.status).toBe(401);
    });

    it('deletes user account and all associated data', async () => {
      const testUser = await createTestUser();
      try {
        const response = await requestApi
          .put('/api/settings/delete-account')
          .set('Authorization', `Bearer ${testUser.token}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body).not.toHaveProperty('error');
        expect(response.body.data).toBe(1);
        // expect cookie to be cleared in header
        expect(response.headers['set-cookie']).toBeDefined();
        expect(response.headers['set-cookie']?.[0]).toContain(`${AUTH_COOKIE_NAME}=;`);

        // Verify user can no longer access protected endpoints
        const verifyResponse = await requestApi
          .get('/api/settings')
          .set('Authorization', `Bearer ${testUser.token}`);
        expect(verifyResponse.status).toBe(401);
      }
      finally {
        // No need to delete test user since it was already deleted
      }
    });
  });
});

