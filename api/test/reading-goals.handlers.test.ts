import { describe, it, expect, vi } from 'vitest';
import { bookToPassage } from '@mybiblelog/shared';
import {
  createReadingGoal,
  deleteReadingGoal,
  getReadingGoal,
  updateReadingGoal,
} from '../http/handlers/reading-goals';
import { type HttpRequest, type RouteDependencies } from '../http/types';
import { type ReadingGoalRecord } from '../repositories/helpers/types';

/**
 * Pure unit tests for the reading goal handlers' validation and not-found
 * branches, using a fake repository. `reading-goals.test.ts` covers the same
 * routes end-to-end against a running API and database.
 */

const JUDE = 65;
const PHILEMON = 57;
const goalId = '507f1f77bcf86cd799439011';

const body = {
  title: '  Short letters  ',
  passages: [bookToPassage(JUDE), bookToPassage(PHILEMON)],
  startDate: '2026-01-01',
  endDate: '2026-01-10',
};

const record = (input: Omit<ReadingGoalRecord, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>): ReadingGoalRecord => ({
  id: goalId,
  ownerId: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...input,
});

const makeDeps = (readingGoals: Partial<RouteDependencies['repositories']['readingGoals']> = {}): RouteDependencies => ({
  repositories: {
    readingGoals: {
      create: vi.fn(async (_owner, input) => record(input)),
      replace: vi.fn(async () => null),
      findByIdForOwner: vi.fn(async () => null),
      deleteByIdForOwner: vi.fn(async () => 0),
      ...readingGoals,
    },
  } as unknown as RouteDependencies['repositories'],
  authenticate: (async () => ({ id: 'user-1' })) as unknown as RouteDependencies['authenticate'],
  emailService: {} as RouteDependencies['emailService'],
  rateLimiter: { check: async () => {} } as RouteDependencies['rateLimiter'],
});

const makeRequest = (overrides: Partial<HttpRequest> = {}): HttpRequest => ({
  method: 'POST',
  params: {},
  query: {},
  body,
  headers: {},
  ...overrides,
});

const expectBadRequest = async (promise: Promise<unknown>) => {
  await expect(promise).rejects.toMatchObject({ status: 400 });
};

describe('reading goal handlers (unit)', () => {
  it('creates a goal with a trimmed title and active defaulting to true', async () => {
    const deps = makeDeps();
    const response = await createReadingGoal(makeRequest(), deps);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: {
        id: goalId,
        title: 'Short letters',
        passages: body.passages,
        startDate: body.startDate,
        endDate: body.endDate,
        active: true,
      },
    });
  });

  it('rejects a partial-book passage', async () => {
    const jude = bookToPassage(JUDE);
    const passages = [{ ...jude, endVerseId: jude.startVerseId + 4 }];
    await expectBadRequest(createReadingGoal(makeRequest({ body: { ...body, passages } }), makeDeps()));
  });

  it('rejects duplicate and overlapping passages', async () => {
    const jude = bookToPassage(JUDE);
    await expectBadRequest(createReadingGoal(makeRequest({ body: { ...body, passages: [jude, jude] } }), makeDeps()));
    await expectBadRequest(createReadingGoal(
      makeRequest({ body: { ...body, passages: [jude, { ...jude, startVerseId: jude.startVerseId + 2 }] } }),
      makeDeps(),
    ));
  });

  it('rejects empty passages, an empty title, and an end date before the start date', async () => {
    await expectBadRequest(createReadingGoal(makeRequest({ body: { ...body, passages: [] } }), makeDeps()));
    await expectBadRequest(createReadingGoal(makeRequest({ body: { ...body, title: '   ' } }), makeDeps()));
    await expectBadRequest(createReadingGoal(
      makeRequest({ body: { ...body, startDate: '2026-02-01', endDate: '2026-01-31' } }),
      makeDeps(),
    ));
  });

  it('accepts a single-day goal', async () => {
    const response = await createReadingGoal(
      makeRequest({ body: { ...body, endDate: body.startDate } }),
      makeDeps(),
    );
    expect(response.status).toBe(200);
  });

  it('returns 404 for goals the user does not own', async () => {
    const deps = makeDeps();
    const params = { id: goalId };
    await expect(getReadingGoal(makeRequest({ method: 'GET', params }), deps)).rejects.toMatchObject({ status: 404 });
    await expect(updateReadingGoal(makeRequest({ method: 'PATCH', params }), deps)).rejects.toMatchObject({ status: 404 });
    await expect(deleteReadingGoal(makeRequest({ method: 'DELETE', params }), deps)).rejects.toMatchObject({ status: 404 });
  });
});
