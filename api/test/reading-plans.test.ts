import { describe, it, expect } from 'vitest';
import { MAX_DAYS_PER_PLAN, MAX_PASSAGES_PER_PLAN, MAX_READING_PLANS_PER_USER } from '@mybiblelog/shared';
import { requestApi, createTestUser, deleteTestUser } from './helpers';

const GEN_1_1_5 = { startVerseId: 101001001, endVerseId: 101001005 };
const GEN_1_6_10 = { startVerseId: 101001006, endVerseId: 101001010 };
const missingObjectId = '666666666666666666666666';

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

describe('reading-plans.test.js', () => {
  describe('GET /api/reading-plans', () => {
    it('protected', async () => {
      const response = await requestApi.get('/api/reading-plans');
      expect(response.status).toBe(401);
    });

    it('returns an array', async () => {
      const testUser = await createTestUser();
      try {
        const response = await requestApi.get('/api/reading-plans').set(auth(testUser.token));
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });
  });

  describe('POST /api/reading-plans', () => {
    it('protected', async () => {
      const response = await requestApi.post('/api/reading-plans').send({ name: 'x' });
      expect(response.status).toBe(401);
    });

    it('error if name missing', async () => {
      const testUser = await createTestUser();
      try {
        const response = await requestApi.post('/api/reading-plans').set(auth(testUser.token)).send({ days: [] });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('error if a passage range is invalid', async () => {
      const testUser = await createTestUser();
      try {
        const response = await requestApi.post('/api/reading-plans').set(auth(testUser.token)).send({
          name: 'Bad',
          days: [{ passages: [{ startVerseId: 101001005, endVerseId: 101001001 }] }],
        });
        expect(response.status).toBe(400);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('error if more than the maximum days', async () => {
      const testUser = await createTestUser();
      try {
        const days = Array.from({ length: MAX_DAYS_PER_PLAN + 1 }, () => ({ passages: [] }));
        const response = await requestApi.post('/api/reading-plans').set(auth(testUser.token)).send({
          name: 'Too many days',
          days,
        });
        expect(response.status).toBe(400);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('error if more than the maximum passages across all days', async () => {
      const testUser = await createTestUser();
      try {
        const passages = Array.from({ length: MAX_PASSAGES_PER_PLAN + 1 }, () => GEN_1_1_5);
        const response = await requestApi.post('/api/reading-plans').set(auth(testUser.token)).send({
          name: 'Too many passages',
          days: [{ passages }],
        });
        expect(response.status).toBe(400);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('can create a valid plan', async () => {
      const testUser = await createTestUser();
      try {
        const response = await requestApi.post('/api/reading-plans').set(auth(testUser.token)).send({
          name: 'Gospel of John',
          days: [{ passages: [GEN_1_1_5] }, { passages: [GEN_1_6_10] }],
        });
        expect(response.status).toBe(200);
        expect(response.body.data).toMatchObject({
          name: 'Gospel of John',
          days: [{ passages: [GEN_1_1_5] }, { passages: [GEN_1_6_10] }],
        });
        expect(response.body.data.id).toBeTruthy();
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('error when the per-user plan limit is reached', async () => {
      const testUser = await createTestUser();
      try {
        for (let i = 0; i < MAX_READING_PLANS_PER_USER; i++) {
          const ok = await requestApi.post('/api/reading-plans').set(auth(testUser.token)).send({ name: `Plan ${i}` });
          expect(ok.status).toBe(200);
        }
        const response = await requestApi.post('/api/reading-plans').set(auth(testUser.token)).send({ name: 'One too many' });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
      }
      finally {
        await deleteTestUser(testUser);
      }
    });
  });

  describe('PATCH /api/reading-plans/:id', () => {
    it('error if updating non-existent plan', async () => {
      const testUser = await createTestUser();
      try {
        const response = await requestApi.patch(`/api/reading-plans/${missingObjectId}`).set(auth(testUser.token)).send({ name: 'x' });
        expect(response.status).toBe(404);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('can rename and change days', async () => {
      const testUser = await createTestUser();
      try {
        const created = await requestApi.post('/api/reading-plans').set(auth(testUser.token)).send({ name: 'Original' });
        const response = await requestApi
          .patch(`/api/reading-plans/${created.body.data.id}`)
          .set(auth(testUser.token))
          .send({ name: 'Renamed', days: [{ passages: [GEN_1_6_10] }] });
        expect(response.status).toBe(200);
        expect(response.body.data.name).toBe('Renamed');
        expect(response.body.data.days).toEqual([{ passages: [GEN_1_6_10] }]);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });
  });

  describe('DELETE /api/reading-plans/:id', () => {
    it('404 if not exists', async () => {
      const testUser = await createTestUser();
      try {
        const response = await requestApi.delete(`/api/reading-plans/${missingObjectId}`).set(auth(testUser.token));
        expect(response.status).toBe(404);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('deletes an owned plan', async () => {
      const testUser = await createTestUser();
      try {
        const created = await requestApi.post('/api/reading-plans').set(auth(testUser.token)).send({ name: 'Doomed' });
        const response = await requestApi.delete(`/api/reading-plans/${created.body.data.id}`).set(auth(testUser.token));
        expect(response.status).toBe(200);
        expect(response.body.data).toBe(1);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });
  });
});
