import { describe, it, expect } from 'vitest';
import { requestApi, createTestUser, deleteTestUser } from './helpers';

const missingObjectId = '666666666666666666666666';
const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

const createPlan = async (token: string, name = 'Plan') => {
  const response = await requestApi.post('/api/reading-plans').set(auth(token)).send({ name });
  return response.body.data.id as string;
};

describe('plan-trackers.test.js', () => {
  describe('GET /api/plan-trackers', () => {
    it('protected', async () => {
      const response = await requestApi.get('/api/plan-trackers');
      expect(response.status).toBe(401);
    });

    it('returns an array', async () => {
      const testUser = await createTestUser();
      try {
        const response = await requestApi.get('/api/plan-trackers').set(auth(testUser.token));
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });
  });

  describe('POST /api/plan-trackers', () => {
    it('protected', async () => {
      const response = await requestApi.post('/api/plan-trackers').send({ planId: missingObjectId, startDate: '2024-01-01' });
      expect(response.status).toBe(401);
    });

    it('error if planId is malformed', async () => {
      const testUser = await createTestUser();
      try {
        const response = await requestApi.post('/api/plan-trackers').set(auth(testUser.token)).send({ planId: 'nope', startDate: '2024-01-01' });
        expect(response.status).toBe(400);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('404 if the plan does not exist', async () => {
      const testUser = await createTestUser();
      try {
        const response = await requestApi.post('/api/plan-trackers').set(auth(testUser.token)).send({ planId: missingObjectId, startDate: '2024-01-01' });
        expect(response.status).toBe(404);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('can start tracking a plan', async () => {
      const testUser = await createTestUser();
      try {
        const planId = await createPlan(testUser.token);
        const response = await requestApi.post('/api/plan-trackers').set(auth(testUser.token)).send({ planId, startDate: '2024-01-01' });
        expect(response.status).toBe(200);
        expect(response.body.data).toMatchObject({ planId, startDate: '2024-01-01', completedDate: null });
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('rejects a second active tracker for the same plan', async () => {
      const testUser = await createTestUser();
      try {
        const planId = await createPlan(testUser.token);
        await requestApi.post('/api/plan-trackers').set(auth(testUser.token)).send({ planId, startDate: '2024-01-01' });
        const response = await requestApi.post('/api/plan-trackers').set(auth(testUser.token)).send({ planId, startDate: '2024-02-01' });
        expect(response.status).toBe(400);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });
  });

  describe('PATCH /api/plan-trackers/:id', () => {
    it('marks a tracker complete', async () => {
      const testUser = await createTestUser();
      try {
        const planId = await createPlan(testUser.token);
        const created = await requestApi.post('/api/plan-trackers').set(auth(testUser.token)).send({ planId, startDate: '2024-01-01' });
        const response = await requestApi
          .patch(`/api/plan-trackers/${created.body.data.id}`)
          .set(auth(testUser.token))
          .send({ completedDate: '2024-01-31' });
        expect(response.status).toBe(200);
        expect(response.body.data.completedDate).toBe('2024-01-31');
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('404 if the tracker does not exist', async () => {
      const testUser = await createTestUser();
      try {
        const response = await requestApi.patch(`/api/plan-trackers/${missingObjectId}`).set(auth(testUser.token)).send({ completedDate: null });
        expect(response.status).toBe(404);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });
  });

  describe('DELETE /api/plan-trackers/:id', () => {
    it('deletes an owned tracker', async () => {
      const testUser = await createTestUser();
      try {
        const planId = await createPlan(testUser.token);
        const created = await requestApi.post('/api/plan-trackers').set(auth(testUser.token)).send({ planId, startDate: '2024-01-01' });
        const response = await requestApi.delete(`/api/plan-trackers/${created.body.data.id}`).set(auth(testUser.token));
        expect(response.status).toBe(200);
        expect(response.body.data).toBe(1);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });
  });
});
