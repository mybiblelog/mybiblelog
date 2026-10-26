import { describe, it, expect } from 'vitest';
import { bookToPassage } from '@mybiblelog/shared';
import { requestApi, createTestUser, deleteTestUser } from './helpers';

const JUDE = 65;
const PHILEMON = 57;

const goal = {
  title: 'Short letters',
  passages: [bookToPassage(JUDE), bookToPassage(PHILEMON)],
  startDate: '2026-01-01',
  endDate: '2026-01-10',
  active: true,
};

const missingObjectId = '666666666666666666666666';

describe('reading-goals.test.js', () => {
  it('protected', async () => {
    const response = await requestApi.get('/api/reading-goals');
    expect(response.status).toBe(401);
  });

  it('supports create, read, update and delete', async () => {
    const testUser = await createTestUser();
    const auth = `Bearer ${testUser.token}`;
    try {
      const created = await requestApi.post('/api/reading-goals').set('Authorization', auth).send(goal);
      expect(created.status).toBe(200);
      expect(created.body.data).toMatchObject(goal);
      const { id } = created.body.data;

      const list = await requestApi.get('/api/reading-goals').set('Authorization', auth);
      expect(list.status).toBe(200);
      expect(list.body.data).toHaveLength(1);
      // Passage order is preserved.
      expect(list.body.data[0].passages).toEqual(goal.passages);

      const updated = await requestApi.patch(`/api/reading-goals/${id}`).set('Authorization', auth)
        .send({ ...goal, title: 'Renamed', active: false, passages: [bookToPassage(PHILEMON)] });
      expect(updated.status).toBe(200);
      expect(updated.body.data).toMatchObject({ id, title: 'Renamed', active: false, passages: [bookToPassage(PHILEMON)] });

      const fetched = await requestApi.get(`/api/reading-goals/${id}`).set('Authorization', auth);
      expect(fetched.body.data.title).toBe('Renamed');

      const deleted = await requestApi.delete(`/api/reading-goals/${id}`).set('Authorization', auth);
      expect(deleted.status).toBe(200);
      const missing = await requestApi.get(`/api/reading-goals/${id}`).set('Authorization', auth);
      expect(missing.status).toBe(404);
    }
    finally {
      await deleteTestUser(testUser);
    }
  });

  it('defaults active to true', async () => {
    const testUser = await createTestUser();
    try {
      const { active: _active, ...withoutActive } = goal;
      const response = await requestApi.post('/api/reading-goals')
        .set('Authorization', `Bearer ${testUser.token}`).send(withoutActive);
      expect(response.status).toBe(200);
      expect(response.body.data.active).toBe(true);
    }
    finally {
      await deleteTestUser(testUser);
    }
  });

  it("does not expose another user's goals", async () => {
    const owner = await createTestUser();
    const other = await createTestUser();
    try {
      const created = await requestApi.post('/api/reading-goals')
        .set('Authorization', `Bearer ${owner.token}`).send(goal);
      const { id } = created.body.data;
      const otherAuth = `Bearer ${other.token}`;

      expect((await requestApi.get(`/api/reading-goals/${id}`).set('Authorization', otherAuth)).status).toBe(404);
      expect((await requestApi.patch(`/api/reading-goals/${id}`).set('Authorization', otherAuth).send(goal)).status).toBe(404);
      expect((await requestApi.delete(`/api/reading-goals/${id}`).set('Authorization', otherAuth)).status).toBe(404);
      expect((await requestApi.get(`/api/reading-goals/${missingObjectId}`).set('Authorization', otherAuth)).status).toBe(404);
      expect((await requestApi.get('/api/reading-goals').set('Authorization', otherAuth)).body.data).toEqual([]);
    }
    finally {
      await deleteTestUser(owner);
      await deleteTestUser(other);
    }
  });

  describe('validation', () => {
    const invalidBodies: Array<[string, object]> = [
      ['an empty title', { ...goal, title: '   ' }],
      ['no passages', { ...goal, passages: [] }],
      ['a partial-book passage', { ...goal, passages: [{ ...bookToPassage(JUDE), endVerseId: bookToPassage(JUDE).startVerseId + 4 }] }],
      ['a duplicate book', { ...goal, passages: [bookToPassage(JUDE), bookToPassage(JUDE)] }],
      ['overlapping passages', { ...goal, passages: [bookToPassage(JUDE), { ...bookToPassage(JUDE), startVerseId: bookToPassage(JUDE).startVerseId + 2 }] }],
      ['an end date before the start date', { ...goal, startDate: '2026-02-01', endDate: '2026-01-31' }],
      ['an invalid date', { ...goal, startDate: '2026-13-01' }],
    ];

    for (const [label, body] of invalidBodies) {
      it(`rejects ${label}`, async () => {
        const testUser = await createTestUser();
        try {
          const response = await requestApi.post('/api/reading-goals')
            .set('Authorization', `Bearer ${testUser.token}`).send(body);
          expect(response.status).toBe(400);
        }
        finally {
          await deleteTestUser(testUser);
        }
      });
    }
  });
});
