import { describe, expect, it } from 'vitest';
import { createTestUser, deleteTestUser, requestApi } from './helpers';

/** Genesis 1:1 */
const GEN_1_1 = 101001001;
/** Genesis 1:2 */
const GEN_1_2 = 101001002;
/** Genesis 2:1 */
const GEN_2_1 = 101002001;
/** Genesis 2:2 */
const GEN_2_2 = 101002002;

describe('GET /api/scripture/passage', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await requestApi.get(
      `/api/scripture/passage?startVerseId=${GEN_1_1}&endVerseId=${GEN_1_2}`,
    );
    expect(res.status).toBe(401);
  });

  it('returns 400 when startVerseId is missing', async () => {
    const user = await createTestUser();
    try {
      const res = await requestApi
        .get(`/api/scripture/passage?endVerseId=${GEN_1_2}`)
        .set('Authorization', `Bearer ${user.token}`);
      expect(res.status).toBe(400);
      expect(res.body.error.errors).toEqual([{ code: 'not_valid', field: 'startVerseId' }]);
    }
    finally {
      await deleteTestUser(user);
    }
  });

  it('returns 400 when endVerseId is missing', async () => {
    const user = await createTestUser();
    try {
      const res = await requestApi
        .get(`/api/scripture/passage?startVerseId=${GEN_1_1}`)
        .set('Authorization', `Bearer ${user.token}`);
      expect(res.status).toBe(400);
      expect(res.body.error.errors).toEqual([{ code: 'not_valid', field: 'endVerseId' }]);
    }
    finally {
      await deleteTestUser(user);
    }
  });

  it('returns 400 for a reversed range', async () => {
    const user = await createTestUser();
    try {
      const res = await requestApi
        .get(`/api/scripture/passage?startVerseId=${GEN_1_2}&endVerseId=${GEN_1_1}`)
        .set('Authorization', `Bearer ${user.token}`);
      expect(res.status).toBe(400);
      expect(res.body.error.errors).toEqual([{ code: 'not_valid', field: 'passage' }]);
    }
    finally {
      await deleteTestUser(user);
    }
  });

  it('returns 400 for a cross-book range', async () => {
    const user = await createTestUser();
    try {
      // Genesis 50:1 -> Exodus 1:1
      const res = await requestApi
        .get('/api/scripture/passage?startVerseId=101050001&endVerseId=102001001')
        .set('Authorization', `Bearer ${user.token}`);
      expect(res.status).toBe(400);
    }
    finally {
      await deleteTestUser(user);
    }
  });

  it('returns a single chunk with no continuation for a single-chapter passage (integration)', async () => {
    const user = await createTestUser();
    try {
      const res = await requestApi
        .get(`/api/scripture/passage?startVerseId=${GEN_1_1}&endVerseId=${GEN_1_2}&bibleVersion=NASB2020`)
        .set('Authorization', `Bearer ${user.token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.next).toBeNull();
      expect(Array.isArray(res.body.data.blocks)).toBe(true);
      const verseBlocks = res.body.data.blocks.filter((b: { type: string }) => b.type === 'verse');
      expect(verseBlocks.length).toBe(2);
      expect(verseBlocks[0].chapter).toBe(1);
      expect(verseBlocks[0].number).toBe(1);
      expect(verseBlocks[1].number).toBe(2);
      expect(verseBlocks[0].segments.length).toBeGreaterThan(0);
      expect(typeof res.body.data.translation.name).toBe('string');
      expect(res.body.data.translation.name.length).toBeGreaterThan(0);
      expect(typeof res.body.data.translation.licenseUrl).toBe('string');
    }
    finally {
      await deleteTestUser(user);
    }
  });

  it('walks a cross-chapter passage with the continuation cursor (integration)', async () => {
    const user = await createTestUser();
    try {
      const first = await requestApi
        .get(`/api/scripture/passage?startVerseId=${GEN_1_1}&endVerseId=${GEN_2_2}`)
        .set('Authorization', `Bearer ${user.token}`);
      expect(first.status).toBe(200);
      expect(first.body.data.next).toEqual({ startVerseId: GEN_2_1, endVerseId: GEN_2_2 });
      const firstVerses = first.body.data.blocks.filter((b: { type: string }) => b.type === 'verse');
      expect(firstVerses.length).toBeGreaterThan(0);
      expect(firstVerses.every((b: { chapter: number }) => b.chapter === 1)).toBe(true);

      const { startVerseId, endVerseId } = first.body.data.next;
      const second = await requestApi
        .get(`/api/scripture/passage?startVerseId=${startVerseId}&endVerseId=${endVerseId}`)
        .set('Authorization', `Bearer ${user.token}`);
      expect(second.status).toBe(200);
      expect(second.body.data.next).toBeNull();
      const secondVerses = second.body.data.blocks.filter((b: { type: string }) => b.type === 'verse');
      expect(secondVerses.length).toBe(2);
      expect(secondVerses.every((b: { chapter: number }) => b.chapter === 2)).toBe(true);
    }
    finally {
      await deleteTestUser(user);
    }
  });

  it('falls back to the default version for an unknown bibleVersion (integration)', async () => {
    const user = await createTestUser();
    try {
      const res = await requestApi
        .get(`/api/scripture/passage?startVerseId=${GEN_1_1}&endVerseId=${GEN_1_1}&bibleVersion=NOT_A_VERSION`)
        .set('Authorization', `Bearer ${user.token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.blocks.filter((b: { type: string }) => b.type === 'verse').length).toBe(1);
    }
    finally {
      await deleteTestUser(user);
    }
  });
});
