import { describe, it, expect } from 'vitest';
import { requestApi, createTestUser, deleteTestUser } from './helpers';

// Test data
const tag1 = { label: 'Theology', color: '#FF0000', description: 'Theological concepts' };
const tag2 = { label: 'Application', color: '#00FF00', description: 'Practical applications' };

// Helper function to create tags
async function createPassageNoteTags(testUser, tags) {
  const tagResponses = await Promise.all(
    tags.map((tag) =>
      requestApi
        .post('/api/passage-note-tags')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(tag),
    ),
  );
  return tagResponses.map((response) => response.body.data);
}

// Test data with tag IDs (to be populated during test setup)
const passageNote1 = {
  passages: [{ startVerseId: 101001001, endVerseId: 101001005 }], // Genesis 1:1-5
  content: 'Test note 1',
  tags: [], // Will be populated with tag IDs during test setup
};

const passageNote2 = {
  passages: [{ startVerseId: 101001006, endVerseId: 101001010 }], // Genesis 1:6-10
  content: 'Test note 2',
  tags: [], // Will be populated with tag IDs during test setup
};

const passageNote3 = {
  passages: [{ startVerseId: 101001011, endVerseId: 101001015 }], // Genesis 1:11-15
  content: 'Test note 3',
  tags: [], // Will be populated with tag IDs during test setup
};

const invalidPassageNote = {
  passages: [{ startVerseId: 101001005, endVerseId: 101001001 }], // Start verse after end verse
  content: 'Test note 7',
  tags: ['Theology'],
};

const missingObjectId = '666666666666666666666666';

describe('passage-notes.test.js', () => {
  describe('GET /api/passage-notes', () => {
    it('protected', async () => {
      const response = await requestApi
        .get('/api/passage-notes');
      expect(response.status).toBe(401);
    });

    it('returns expected response format', async () => {
      const testUser = await createTestUser();
      try {
        const response = await requestApi
          .get('/api/passage-notes')
          .set('Authorization', `Bearer ${testUser.token}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('meta');
        expect(response.body).not.toHaveProperty('error');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.meta).toHaveProperty('pagination');
        expect(response.body.meta.pagination).toHaveProperty('offset');
        expect(response.body.meta.pagination).toHaveProperty('limit');
        expect(response.body.meta.pagination).toHaveProperty('size');
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('error if invalid query', async () => {
      const testUser = await createTestUser();
      try {
        const response = await requestApi
          .get('/api/passage-notes?limit=invalid&offset=invalid&sortOn=invalid&sortDirection=invalid')
          .set('Authorization', `Bearer ${testUser.token}`);
        expect(response.status).toBe(400);
        expect(response.body).not.toHaveProperty('data');
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('error if invalid filter', async () => {
      const testUser = await createTestUser();
      try {
        const response = await requestApi
          .get('/api/passage-notes?filterTags=invalid&filterTagMatching=invalid&filterPassageStartVerseId=invalid&filterPassageEndVerseId=invalid&filterPassageMatching=invalid')
          .set('Authorization', `Bearer ${testUser.token}`);
        expect(response.status).toBe(400);
        expect(response.body).not.toHaveProperty('data');
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('returns expected result format with valid query', async () => {
      const testUser = await createTestUser();
      try {
        // Create tags first
        const tags = await createPassageNoteTags(testUser, [tag1, tag2]);

        // Create a note with tag IDs
        const noteWithTags = {
          ...passageNote1,
          tags: [tags[0].id, tags[1].id],
        };

        await requestApi
          .post('/api/passage-notes')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(noteWithTags);

        const response = await requestApi
          .get('/api/passage-notes')
          .set('Authorization', `Bearer ${testUser.token}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('meta');
        expect(response.body).not.toHaveProperty('error');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.meta).toHaveProperty('pagination');
        expect(response.body.meta.pagination).toHaveProperty('offset');
        expect(response.body.meta.pagination).toHaveProperty('limit');
        expect(response.body.meta.pagination).toHaveProperty('size');
        expect(response.body.data.length).toBeGreaterThan(0);
        expect(response.body.data[0]).toHaveProperty('id');
        expect(response.body.data[0]).toHaveProperty('passages');
        expect(response.body.data[0]).toHaveProperty('content');
        expect(response.body.data[0]).toHaveProperty('tags');
        expect(response.body.data[0]).toHaveProperty('createdAt');
        expect(response.body.data[0]).toHaveProperty('updatedAt');
        expect(response.body.meta.pagination.offset).toBe(0);
        expect(response.body.meta.pagination.limit).toBe(10);
        expect(response.body.meta.pagination.size).toBe(1);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('can filter by tags', async () => {
      const testUser = await createTestUser();
      try {
        // Create tags first
        const tags = await createPassageNoteTags(testUser, [tag1, tag2]);

        // Create a note with specific tag
        const noteWithTag = {
          ...passageNote1,
          tags: [tags[0].id],
        };

        const createResponse = await requestApi
          .post('/api/passage-notes')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(noteWithTag);

        const response = await requestApi
          .get(`/api/passage-notes?filterTags=${tags[0].id}`)
          .set('Authorization', `Bearer ${testUser.token}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('meta');
        expect(response.body).not.toHaveProperty('error');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(1);
        expect(response.body.data[0].id).toBe(createResponse.body.data.id);
        expect(response.body.meta).toHaveProperty('pagination');
        expect(response.body.meta.pagination).toHaveProperty('offset');
        expect(response.body.meta.pagination).toHaveProperty('limit');
        expect(response.body.meta.pagination).toHaveProperty('size');
        expect(response.body.meta.pagination.offset).toBe(0);
        expect(response.body.meta.pagination.limit).toBe(10);
        expect(response.body.meta.pagination.size).toBe(1);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('can filter by passages', async () => {
      const testUser = await createTestUser();
      try {
        // Create tags first
        await createPassageNoteTags(testUser, [tag1, tag2]);

        // Create a note with specific passages
        const createResponse = await requestApi
          .post('/api/passage-notes')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(passageNote1);

        const response = await requestApi
          .get(`/api/passage-notes?filterPassageStartVerseId=${passageNote1.passages[0]!.startVerseId}&filterPassageEndVerseId=${passageNote1.passages[0]!.endVerseId}`)
          .set('Authorization', `Bearer ${testUser.token}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('meta');
        expect(response.body).not.toHaveProperty('error');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(1);
        expect(response.body.data[0].id).toBe(createResponse.body.data.id);
        expect(response.body.meta).toHaveProperty('pagination');
        expect(response.body.meta.pagination).toHaveProperty('offset');
        expect(response.body.meta.pagination).toHaveProperty('limit');
        expect(response.body.meta.pagination).toHaveProperty('size');
        expect(response.body.meta.pagination.offset).toBe(0);
        expect(response.body.meta.pagination.limit).toBe(10);
        expect(response.body.meta.pagination.size).toBe(1);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('can filter by search text', async () => {
      const testUser = await createTestUser();
      try {
        // Create tags first
        await createPassageNoteTags(testUser, [tag1, tag2]);

        // Create a note with specific content
        const createResponse = await requestApi
          .post('/api/passage-notes')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(passageNote1);

        const response = await requestApi
          .get('/api/passage-notes?searchText=Test note 1')
          .set('Authorization', `Bearer ${testUser.token}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('meta');
        expect(response.body).not.toHaveProperty('error');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(1);
        expect(response.body.data[0].id).toBe(createResponse.body.data.id);
        expect(response.body.meta).toHaveProperty('pagination');
        expect(response.body.meta.pagination).toHaveProperty('offset');
        expect(response.body.meta.pagination).toHaveProperty('limit');
        expect(response.body.meta.pagination).toHaveProperty('size');
        expect(response.body.meta.pagination.offset).toBe(0);
        expect(response.body.meta.pagination.limit).toBe(10);
        expect(response.body.meta.pagination.size).toBe(1);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('can sort by date', async () => {
      const testUser = await createTestUser();
      try {
        // Create tags first
        await createPassageNoteTags(testUser, [tag1, tag2]);

        // Create two notes
        await requestApi
          .post('/api/passage-notes')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(passageNote1);

        await requestApi
          .post('/api/passage-notes')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(passageNote2);

        const response = await requestApi
          .get('/api/passage-notes?sortOn=createdAt&sortDirection=descending')
          .set('Authorization', `Bearer ${testUser.token}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('meta');
        expect(response.body).not.toHaveProperty('error');
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBe(2);
        expect(new Date(response.body.data[0].createdAt) > new Date(response.body.data[1].createdAt)).toBe(true);
        expect(response.body.meta).toHaveProperty('pagination');
        expect(response.body.meta.pagination).toHaveProperty('offset');
        expect(response.body.meta.pagination).toHaveProperty('limit');
        expect(response.body.meta.pagination).toHaveProperty('size');
        expect(response.body.meta.pagination.offset).toBe(0);
        expect(response.body.meta.pagination.limit).toBe(10);
        expect(response.body.meta.pagination.size).toBe(2);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });
  });

  describe('POST /api/passage-notes', () => {
    it('protected', async () => {
      const response = await requestApi
        .post('/api/passage-notes')
        .send(passageNote1);
      expect(response.status).toBe(401);
    });

    describe('Validation', () => {
      it('error if missing required fields', async () => {
        const testUser = await createTestUser();
        try {
          const response = await requestApi
            .post('/api/passage-notes')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({});
          expect(response.status).toBe(400);
          expect(response.body).toHaveProperty('error');
          expect(response.body).not.toHaveProperty('data');
          expect(response.body.error.code).toBe('validation_error');
        }
        finally {
          await deleteTestUser(testUser);
        }
      });

      it('error if content exceeds max length', async () => {
        const testUser = await createTestUser();
        try {
          const response = await requestApi
            .post('/api/passage-notes')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({
              content: 'a'.repeat(3001), // Exceeds max length
            });
          expect(response.status).toBe(400);
          expect(response.body).toHaveProperty('error');
          expect(response.body).not.toHaveProperty('data');
          expect(response.body.error.code).toBe('validation_error');
        }
        finally {
          await deleteTestUser(testUser);
        }
      });

      it('error if invalid passage verse IDs', async () => {
        const testUser = await createTestUser();
        try {
          const response = await requestApi
            .post('/api/passage-notes')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({
              content: 'Test content',
              passages: [{
                startVerseId: 'invalid',
                endVerseId: 'invalid',
              }],
            });
          expect(response.status).toBe(400);
          expect(response.body).toHaveProperty('error');
          expect(response.body).not.toHaveProperty('data');
          expect(response.body.error.code).toBe('validation_error');
        }
        finally {
          await deleteTestUser(testUser);
        }
      });

      it('error if invalid passage verse range', async () => {
        const testUser = await createTestUser();
        try {
          const response = await requestApi
            .post('/api/passage-notes')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send(invalidPassageNote);
          expect(response.status).toBe(400);
          expect(response.body).toHaveProperty('error');
          expect(response.body).not.toHaveProperty('data');
          expect(response.body.error.code).toBe('validation_error');
        }
        finally {
          await deleteTestUser(testUser);
        }
      });

      it('error if passages array is empty and content is empty', async () => {
        const testUser = await createTestUser();
        try {
          const response = await requestApi
            .post('/api/passage-notes')
            .set('Authorization', `Bearer ${testUser.token}`)
            .send({ passages: [], content: '' });
          expect(response.status).toBe(400);
          expect(response.body).toHaveProperty('error');
          expect(response.body).not.toHaveProperty('data');
          expect(response.body.error.code).toBe('validation_error');
        }
        finally {
          await deleteTestUser(testUser);
        }
      });
    });

    it('can create note with just passages', async () => {
      const testUser = await createTestUser();
      try {
        const response = await requestApi
          .post('/api/passage-notes')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send({ passages: passageNote1.passages });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body).not.toHaveProperty('error');
        expect(response.body.data.passages.length).toEqual(passageNote1.passages.length);
        expect(response.body.data.passages[0].startVerseId).toEqual(passageNote1.passages[0]!.startVerseId);
        expect(response.body.data.passages[0].endVerseId).toEqual(passageNote1.passages[0]!.endVerseId);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('can create note with just content', async () => {
      const testUser = await createTestUser();
      try {
        const response = await requestApi
          .post('/api/passage-notes')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send({ content: passageNote2.content });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body).not.toHaveProperty('error');
        expect(response.body.data.content).toBe(passageNote2.content);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('can create note with both passages and content', async () => {
      const testUser = await createTestUser();
      try {
        const response = await requestApi
          .post('/api/passage-notes')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send({
            passages: passageNote3.passages,
            content: passageNote3.content,
          });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body).not.toHaveProperty('error');
        expect(response.body.data.passages.length).toEqual(passageNote3.passages.length);
        expect(response.body.data.passages[0].startVerseId).toEqual(passageNote3.passages[0]!.startVerseId);
        expect(response.body.data.passages[0].endVerseId).toEqual(passageNote3.passages[0]!.endVerseId);
        expect(response.body.data.content).toBe(passageNote3.content);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('can create note with tags', async () => {
      const testUser = await createTestUser();
      try {
        // Create tags first
        const tags = await createPassageNoteTags(testUser, [tag1]);

        const noteWithTag = {
          ...passageNote1,
          tags: [tags[0].id],
        };

        const response = await requestApi
          .post('/api/passage-notes')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(noteWithTag);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body).not.toHaveProperty('error');
        expect(response.body.data.tags).toEqual([tags[0].id]);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });
  });

  describe('PATCH /api/passage-notes/:id', () => {
    it('protected', async () => {
      const testUser = await createTestUser();
      try {
        // Create tags first
        await createPassageNoteTags(testUser, [tag1]);

        // Create a note first
        const createResponse = await requestApi
          .post('/api/passage-notes')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(passageNote1);

        const response = await requestApi
          .patch(`/api/passage-notes/${createResponse.body.data.id}`)
          .send(passageNote2);
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
          .patch('/api/passage-notes/123456789012345678901234')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(passageNote1);
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error');
        expect(response.body).not.toHaveProperty('data');
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('can update passages', async () => {
      const testUser = await createTestUser();
      try {
        // Create tags first
        await createPassageNoteTags(testUser, [tag1]);

        // Create a note first
        const createResponse = await requestApi
          .post('/api/passage-notes')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(passageNote1);

        const response = await requestApi
          .patch(`/api/passage-notes/${createResponse.body.data.id}`)
          .set('Authorization', `Bearer ${testUser.token}`)
          .send({ passages: passageNote2.passages });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body).not.toHaveProperty('error');
        expect(response.body.data.passages.length).toEqual(passageNote2.passages.length);
        expect(response.body.data.passages[0].startVerseId).toEqual(passageNote2.passages[0]!.startVerseId);
        expect(response.body.data.passages[0].endVerseId).toEqual(passageNote2.passages[0]!.endVerseId);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('can update content', async () => {
      const testUser = await createTestUser();
      try {
        // Create tags first
        await createPassageNoteTags(testUser, [tag1]);

        // Create a note first
        const createResponse = await requestApi
          .post('/api/passage-notes')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(passageNote1);

        const response = await requestApi
          .patch(`/api/passage-notes/${createResponse.body.data.id}`)
          .set('Authorization', `Bearer ${testUser.token}`)
          .send({ content: passageNote2.content });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body).not.toHaveProperty('error');
        expect(response.body.data.content).toBe(passageNote2.content);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('can set content to empty string', async () => {
      const testUser = await createTestUser();
      try {
        // Create tags first
        await createPassageNoteTags(testUser, [tag1]);

        // Create a note first
        const createResponse = await requestApi
          .post('/api/passage-notes')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(passageNote1);

        // Update content to empty string (should not be ignored)
        const updateResponse = await requestApi
          .patch(`/api/passage-notes/${createResponse.body.data.id}`)
          .set('Authorization', `Bearer ${testUser.token}`)
          .send({ content: '' });
        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body).toHaveProperty('data');
        expect(updateResponse.body).not.toHaveProperty('error');
        expect(updateResponse.body.data.content).toBe('');

        // Ensure persisted
        const getResponse = await requestApi
          .get(`/api/passage-notes/${createResponse.body.data.id}`)
          .set('Authorization', `Bearer ${testUser.token}`);
        expect(getResponse.status).toBe(200);
        expect(getResponse.body).toHaveProperty('data');
        expect(getResponse.body).not.toHaveProperty('error');
        expect(getResponse.body.data.content).toBe('');
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('can update tags', async () => {
      const testUser = await createTestUser();
      try {
        // Create tags first
        const tags = await createPassageNoteTags(testUser, [tag1, tag2]);

        // Create a note first
        const createResponse = await requestApi
          .post('/api/passage-notes')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(passageNote1);

        const response = await requestApi
          .patch(`/api/passage-notes/${createResponse.body.data.id}`)
          .set('Authorization', `Bearer ${testUser.token}`)
          .send({ tags: [tags[0].id] });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body).not.toHaveProperty('error');
        expect(response.body.data.tags).toEqual([tags[0].id]);
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('error if invalid ID format', async () => {
      const testUser = await createTestUser();
      try {
        const response = await requestApi
          .patch('/api/passage-notes/invalid-id')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(passageNote1);
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error');
        expect(response.body).not.toHaveProperty('data');
      }
      finally {
        await deleteTestUser(testUser);
      }
    });
  });

  describe('DELETE /api/passage-notes/:id', () => {
    it('protected', async () => {
      const testUser = await createTestUser();
      try {
        // Create tags first
        await createPassageNoteTags(testUser, [tag1]);

        // Create a note first
        const createResponse = await requestApi
          .post('/api/passage-notes')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(passageNote1);

        const response = await requestApi
          .delete(`/api/passage-notes/${createResponse.body.data.id}`);
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
          .delete(`/api/passage-notes/${missingObjectId}`)
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
        // Create tags first
        await createPassageNoteTags(testUser, [tag1]);

        // Create a note first
        const createResponse = await requestApi
          .post('/api/passage-notes')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(passageNote1);

        const response = await requestApi
          .delete(`/api/passage-notes/${createResponse.body.data.id}`)
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
        // Create tags first
        await createPassageNoteTags(testUser, [tag1]);

        // Create a note first
        const createResponse = await requestApi
          .post('/api/passage-notes')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send(passageNote1);

        // First delete
        await requestApi
          .delete(`/api/passage-notes/${createResponse.body.data.id}`)
          .set('Authorization', `Bearer ${testUser.token}`);

        // Second delete
        const response = await requestApi
          .delete(`/api/passage-notes/${createResponse.body.data.id}`)
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
          .delete('/api/passage-notes/invalid-id')
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

  describe('GET /api/passage-notes/count/books', () => {
    it('protected', async () => {
      const response = await requestApi
        .get('/api/passage-notes/count/books');
      expect(response.status).toBe(401);
    });

    it('returns expected response format', async () => {
      const testUser = await createTestUser();
      try {
        const response = await requestApi
          .get('/api/passage-notes/count/books')
          .set('Authorization', `Bearer ${testUser.token}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body).not.toHaveProperty('error');
        expect(typeof response.body.data).toBe('object');
        // Check that all Bible books are present in the response
        expect(response.body.data).toHaveProperty('1');
        expect(response.body.data).toHaveProperty('66');
        // Check that all values are numbers
        Object.values(response.body.data).forEach((value) => {
          expect(typeof value).toBe('number');
        });
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('returns accurate counts for notes in different books', async () => {
      const testUser = await createTestUser();
      try {
        // Create tags first
        await createPassageNoteTags(testUser, [tag1]);

        // Create a note in Genesis
        await requestApi
          .post('/api/passage-notes')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send({
            passages: [{ startVerseId: 101001001, endVerseId: 101001005 }], // Genesis 1:1-5
            content: 'Test note in Genesis',
          });

        // Create a note in Exodus
        await requestApi
          .post('/api/passage-notes')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send({
            passages: [{ startVerseId: 102001001, endVerseId: 102001005 }], // Exodus 1:1-5
            content: 'Test note in Exodus',
          });

        // Create another note in Genesis
        await requestApi
          .post('/api/passage-notes')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send({
            passages: [{ startVerseId: 101001006, endVerseId: 101001010 }], // Genesis 1:6-10
            content: 'Another test note in Genesis',
          });

        const response = await requestApi
          .get('/api/passage-notes/count/books')
          .set('Authorization', `Bearer ${testUser.token}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body).not.toHaveProperty('error');
        expect(response.body.data[1]).toEqual(2); // 2 notes in Genesis
        expect(response.body.data[2]).toEqual(1); // 1 note in Exodus
        expect(response.body.data[66]).toEqual(0); // 0 notes in Revelation
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('does not double-count a note with multiple passages in the same book', async () => {
      const testUser = await createTestUser();
      try {
        // Create tags first
        await createPassageNoteTags(testUser, [tag1]);

        // One note with two passages in Genesis
        await requestApi
          .post('/api/passage-notes')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send({
            passages: [
              { startVerseId: 101001001, endVerseId: 101001005 }, // Genesis 1:1-5
              { startVerseId: 101001006, endVerseId: 101001010 }, // Genesis 1:6-10
            ],
            content: 'Test note with two Genesis passages',
          });

        const response = await requestApi
          .get('/api/passage-notes/count/books')
          .set('Authorization', `Bearer ${testUser.token}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body).not.toHaveProperty('error');
        expect(response.body.data[1]).toEqual(1); // 1 note in Genesis (not 2 passages)
        expect(response.body.data[2]).toEqual(0); // 0 notes in Exodus
      }
      finally {
        await deleteTestUser(testUser);
      }
    });

    it('handles notes spanning multiple books', async () => {
      const testUser = await createTestUser();
      try {
        // Create tags first
        await createPassageNoteTags(testUser, [tag1]);

        // Create a note that spans Genesis and Exodus
        await requestApi
          .post('/api/passage-notes')
          .set('Authorization', `Bearer ${testUser.token}`)
          .send({
            passages: [
              { startVerseId: 101001001, endVerseId: 101001005 }, // Genesis 1:1 to Genesis 1:5
              { startVerseId: 102001001, endVerseId: 102001005 }, // Exodus 1:1 to Exodus 1:5
            ],
            content: 'Test note spanning Genesis and Exodus',
          });

        const response = await requestApi
          .get('/api/passage-notes/count/books')
          .set('Authorization', `Bearer ${testUser.token}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body).not.toHaveProperty('error');
        expect(response.body.data[1]).toEqual(1); // Note counted in Genesis
        expect(response.body.data[2]).toEqual(1); // Note counted in Exodus
      }
      finally {
        await deleteTestUser(testUser);
      }
    });
  });

  describe('GET /api/passage-notes/:id', () => {
    it('protected', async () => {
      const response = await requestApi
        .get('/api/passage-notes/123456789012345678901234');
      expect(response.status).toBe(401);
    });

    it('error if invalid ID format', async () => {
      const testUser = await createTestUser();
      try {
        const response = await requestApi
          .get('/api/passage-notes/invalid-id')
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
});
