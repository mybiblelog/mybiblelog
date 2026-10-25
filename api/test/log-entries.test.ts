import { describe, it, expect } from 'vitest';
import { requestApi, createTestUser, deleteTestUser } from './helpers';

// Test data
const logEntry1 = { date: '2024-01-01', startVerseId: 101001001, endVerseId: 101001005 }; // Genesis 1:1-5
const logEntry2 = { date: '2024-01-02', startVerseId: 101001006, endVerseId: 101001010 }; // Genesis 1:6-10
const invalidLogEntry1 = { date: 'invalid-date', startVerseId: 100000000, endVerseId: 100000001 }; // Invalid verse IDs
const invalidLogEntry2 = { date: '2024-01-06', startVerseId: 101001005, endVerseId: 101001001 }; // Start verse after end verse
const invalidLogEntry3 = { date: '2024-01-07', startVerseId: 101001001, endVerseId: 143001005 }; // Different books

const missingObjectId = '666666666666666666666666';

describe('log-entries.test.js', () => {
  describe('GET /api/log-entries', () => {
    it('protected', async () => {
      const response = await requestApi
        .get('/api/log-entries');
      expect(response.status).toBe(401);
    });

    it('returns an array', async () => {
      const testUser = await createTestUser();
      try {
        const response = await requestApi
          .get('/api/log-entries')
          .set('Authorization', `Bearer ${testUser.token}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body).not.toHaveProperty('error');
        expect(Array.isArray(response.body.data)).toBe(true);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('error if invalid startDate', async () => {
      const testUser = await createTestUser();
      try {
        const response = await requestApi
          .get('/api/log-entries?startDate=invalid')
          .set('Authorization', `Bearer ${testUser.token}`);
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body).not.toHaveProperty('data');
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('error if invalid endDate', async () => {
      const testUser = await createTestUser();
      try {
        const response = await requestApi
          .get('/api/log-entries?startDate=2024-01-01&endDate=invalid')
          .set('Authorization', `Bearer ${testUser.token}`);
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body).not.toHaveProperty('data');
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('can filter by start date', async () => {
      const testUser = await createTestUser();
      try {
        // Create test entries
        await requestApi
          .post('/api/log-entries')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(logEntry1);

        const entry2 = await requestApi
          .post('/api/log-entries')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(logEntry2);

        const response = await requestApi
          .get(`/api/log-entries?startDate=${logEntry2.date}`)
          .set('Authorization', `Bearer ${testUser.token}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body).not.toHaveProperty('error');
        expect(response.body.data.length).toBe(1);
        expect(response.body.data[0].id).toBe(entry2.body.data.id);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('can filter by end date', async () => {
      const testUser = await createTestUser();
      try {
        // Create test entries
        const entry1 = await requestApi
          .post('/api/log-entries')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(logEntry1);

        await requestApi
          .post('/api/log-entries')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(logEntry2);

        const response = await requestApi
          .get(`/api/log-entries?endDate=${logEntry1.date}`)
          .set('Authorization', `Bearer ${testUser.token}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body).not.toHaveProperty('error');
        expect(response.body.data.length).toBe(1);
        expect(response.body.data[0].id).toBe(entry1.body.data.id);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('can filter by both dates', async () => {
      const testUser = await createTestUser();
      try {
        // Create test entries
        await requestApi
          .post('/api/log-entries')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(logEntry1);

        await requestApi
          .post('/api/log-entries')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(logEntry2);

        const response = await requestApi
          .get(`/api/log-entries?startDate=${logEntry1.date}&endDate=${logEntry2.date}`)
          .set('Authorization', `Bearer ${testUser.token}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body).not.toHaveProperty('error');
        expect(response.body.data.length).toBe(2);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });
  });

  it('returns all entries if no dates are provided', async () => {
    const testUser = await createTestUser();
    try {
      // Create test entries
      await requestApi
        .post('/api/log-entries')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(logEntry1);

      await requestApi
        .post('/api/log-entries')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(logEntry2);

      const response = await requestApi
        .get('/api/log-entries')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).not.toHaveProperty('error');
      expect(response.body.data.length).toBe(2);
    }
    finally {
      await deleteTestUser(testUser);
    }
  });

  describe('POST /api/log-entries', () => {
    it('protected', async () => {
      const response = await requestApi
        .post('/api/log-entries')
        .send(logEntry1);
      expect(response.status).toBe(401);
    });

    it('error if missing required fields', async () => {
      const testUser = await createTestUser();
      try {
        const response = await requestApi
          .post('/api/log-entries')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send({});
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body).not.toHaveProperty('data');
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('error if invalid date format', async () => {
      const testUser = await createTestUser();
      try {
        const response = await requestApi
          .post('/api/log-entries')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(invalidLogEntry1);
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body).not.toHaveProperty('data');
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('error if invalid verse IDs', async () => {
      const testUser = await createTestUser();
      try {
        const response = await requestApi
          .post('/api/log-entries')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(invalidLogEntry1);
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body).not.toHaveProperty('data');
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('error if invalid verse range', async () => {
      const testUser = await createTestUser();
      try {
        const response = await requestApi
          .post('/api/log-entries')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(invalidLogEntry2);
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body).not.toHaveProperty('data');
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('error if different books', async () => {
      const testUser = await createTestUser();
      try {
        const response = await requestApi
          .post('/api/log-entries')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(invalidLogEntry3);
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body).not.toHaveProperty('data');
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('can create valid entry', async () => {
      const testUser = await createTestUser();
      try {
        const response = await requestApi
          .post('/api/log-entries')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(logEntry1);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body).not.toHaveProperty('error');
        expect(response.body.data).toMatchObject({
          date: logEntry1.date,
          startVerseId: logEntry1.startVerseId,
          endVerseId: logEntry1.endVerseId,
        });
      }
      finally {
        await deleteTestUser(testUser);
      }
    });
  });

  describe('PATCH /api/log-entries/:id', () => {
    it('protected', async () => {
      const testUser = await createTestUser();
      try {
        // Create an entry first
        const createResponse = await requestApi
          .post('/api/log-entries')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(logEntry1);

        const response = await requestApi
          .patch(`/api/log-entries/${createResponse.body.data.id}`)
          .send(logEntry2);
        expect(response.status).toBe(401);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('error if updating non-existent entry', async () => {
      const testUser = await createTestUser();
      try {
        const response = await requestApi
          .patch(`/api/log-entries/${missingObjectId}`)
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(logEntry2);
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error');
        expect(response.body).not.toHaveProperty('data');
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('error if invalid verse range', async () => {
      const testUser = await createTestUser();
      try {
        // Create an entry first
        const createResponse = await requestApi
          .post('/api/log-entries')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(logEntry1);

        const response = await requestApi
          .patch(`/api/log-entries/${createResponse.body.data.id}`)
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(invalidLogEntry2);
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body).not.toHaveProperty('data');
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('can update date', async () => {
      const testUser = await createTestUser();
      try {
        // Create an entry first
        const createResponse = await requestApi
          .post('/api/log-entries')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(logEntry1);

        const response = await requestApi
          .patch(`/api/log-entries/${createResponse.body.data.id}`)
          .set('Authorization', `Bearer ${testUser.token}`)
          .send({ date: logEntry2.date });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body).not.toHaveProperty('error');
        expect(response.body.data.date).toBe(logEntry2.date);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('can update verse range', async () => {
      const testUser = await createTestUser();
      try {
        // Create an entry first
        const createResponse = await requestApi
          .post('/api/log-entries')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(logEntry1);

        const response = await requestApi
          .patch(`/api/log-entries/${createResponse.body.data.id}`)
          .set('Authorization', `Bearer ${testUser.token}`)
          .send({
            startVerseId: logEntry2.startVerseId,
            endVerseId: logEntry2.endVerseId,
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body).not.toHaveProperty('error');
        expect(response.body.data.startVerseId).toBe(logEntry2.startVerseId);
        expect(response.body.data.endVerseId).toBe(logEntry2.endVerseId);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('documents current behavior when patching only one end of the verse range invalid against the existing other end', async () => {
      // logEntryUpdateSchema's verse-range refine only runs when BOTH
      // startVerseId and endVerseId are present in the same request body (see
      // validation/schemas/log-entry.ts). Patching only startVerseId to a value
      // that is invalid against the entry's EXISTING endVerseId bypasses that
      // zod refine entirely. The repository layer does still recompute the
      // merged range (repositories/log-entry.repository.ts `update`), but via a
      // plain `throw new Error(...)` rather than a zod/ValidationError, so it
      // currently surfaces as an unhandled 500 rather than a 400
      // validation_error -- and the entry is left unmodified, since the throw
      // happens before the `updateOne` write.
      const testUser = await createTestUser();
      try {
        // Create an entry first: Genesis 1:1-5
        const createResponse = await requestApi
          .post('/api/log-entries')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(logEntry1);
        expect(createResponse.status).toBe(200);

        // Patch only startVerseId to something after the entry's existing
        // endVerseId -- an invalid range once merged, but the request body
        // alone (just `startVerseId`) satisfies the schema.
        const response = await requestApi
          .patch(`/api/log-entries/${createResponse.body.data.id}`)
          .set('Authorization', `Bearer ${testUser.token}`)
          .send({ startVerseId: logEntry1.endVerseId + 1 });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: { code: 'internal_server_error' } });

        // The invalid merge was never persisted: the entry keeps its original values.
        const listResponse = await requestApi
          .get('/api/log-entries')
          .set('Authorization', `Bearer ${testUser.token}`);
        expect(listResponse.body.data).toEqual([
          expect.objectContaining({
            id: createResponse.body.data.id,
            startVerseId: logEntry1.startVerseId,
            endVerseId: logEntry1.endVerseId,
          }),
        ]);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('error if invalid ID format', async () => {
      const testUser = await createTestUser();
      try {
        const response = await requestApi
          .patch('/api/log-entries/invalid-id')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(logEntry2);
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body).not.toHaveProperty('data');
      }
      finally {
        await deleteTestUser(testUser);
      }
    });
  });

  describe('DELETE /api/log-entries/:id', () => {
    it('protected', async () => {
      const testUser = await createTestUser();
      try {
        // Create an entry first
        const createResponse = await requestApi
          .post('/api/log-entries')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(logEntry1);

        const response = await requestApi
          .delete(`/api/log-entries/${createResponse.body.data.id}`);
        expect(response.status).toBe(401);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('returns expected response if not exists', async () => {
      const testUser = await createTestUser();
      try {
        const response = await requestApi
          .delete(`/api/log-entries/${missingObjectId}`)
          .set('Authorization', `Bearer ${testUser.token}`);
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error');
        expect(response.body).not.toHaveProperty('data');
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('returns expected response if exists and was deleted', async () => {
      const testUser = await createTestUser();
      try {
        // Create an entry first
        const createResponse = await requestApi
          .post('/api/log-entries')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(logEntry1);

        const response = await requestApi
          .delete(`/api/log-entries/${createResponse.body.data.id}`)
          .set('Authorization', `Bearer ${testUser.token}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body).not.toHaveProperty('error');
        expect(response.body.data).toBe(1);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('response changes after initial successful call', async () => {
      const testUser = await createTestUser();
      try {
        // Create an entry first
        const createResponse = await requestApi
          .post('/api/log-entries')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(logEntry1);

        // First delete
        await requestApi
          .delete(`/api/log-entries/${createResponse.body.data.id}`)
          .set('Authorization', `Bearer ${testUser.token}`);

        // Second delete
        const response = await requestApi
          .delete(`/api/log-entries/${createResponse.body.data.id}`)
          .set('Authorization', `Bearer ${testUser.token}`);
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error');
        expect(response.body).not.toHaveProperty('data');
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('error if invalid ID format', async () => {
      const testUser = await createTestUser();
      try {
        const response = await requestApi
          .delete('/api/log-entries/invalid-id')
          .set('Authorization', `Bearer ${testUser.token}`);
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body).not.toHaveProperty('data');
      }
      finally {
        await deleteTestUser(testUser);
      }
    });
  });

  describe('USFM passage references', () => {
    it('creates an entry from a USFM passage and returns its reference', async () => {
      const testUser = await createTestUser();
      try {
        const response = await requestApi
          .post('/api/log-entries')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send({ date: '2024-01-01', passage: 'PSA.23' });
        expect(response.status).toBe(200);
        expect(response.body.data).toMatchObject({
          date: '2024-01-01',
          startVerseId: 119023001,
          endVerseId: 119023006,
          passage: 'PSA.23',
        });
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('returns the USFM reference for entries created with verse IDs', async () => {
      const testUser = await createTestUser();
      try {
        await requestApi
          .post('/api/log-entries')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(logEntry1);
        const response = await requestApi
          .get('/api/log-entries')
          .set('Authorization', `Bearer ${testUser.token}`);
        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([expect.objectContaining({ passage: 'GEN.1.1-5' })]);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it.each([
      ['an unknown book', { passage: 'XYZ.1.1' }],
      ['a passage that crosses books', { passage: 'GEN.50-EXO.1' }],
      ['a passage alongside verse IDs', { passage: 'GEN.1', startVerseId: 101001001, endVerseId: 101001005 }],
    ])('rejects %s', async (_label, passageFields) => {
      const testUser = await createTestUser();
      try {
        const response = await requestApi
          .post('/api/log-entries')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send({ date: '2024-01-01', ...passageFields });
        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('validation_error');
        expect(response.body.error.errors).toEqual([{ field: 'passage', code: 'not_valid' }]);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('updates an entry from a USFM passage', async () => {
      const testUser = await createTestUser();
      try {
        const createResponse = await requestApi
          .post('/api/log-entries')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(logEntry1);
        const response = await requestApi
          .patch(`/api/log-entries/${createResponse.body.data.id}`)
          .set('Authorization', `Bearer ${testUser.token}`)
          .send({ passage: 'JHN.3.16-18' });
        expect(response.status).toBe(200);
        expect(response.body.data).toMatchObject({
          date: logEntry1.date,
          startVerseId: 143003016,
          endVerseId: 143003018,
          passage: 'JHN.3.16-18',
        });
      }
      finally {
        await deleteTestUser(testUser);
      }
    });
  });
});
