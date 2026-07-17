import { describe, it, expect } from 'vitest';
import {
  listReadingPlans,
  getReadingPlan,
  createReadingPlan,
  updateReadingPlan,
  deleteReadingPlan,
} from '../http/handlers/reading-plans';
import { type HttpRequest, type RouteDependencies } from '../http/types';
import { type ReadingPlanRecord, type UserRecord } from '../repositories/helpers/types';
import { ValidationError } from '../http/errors/validation-errors';
import { NotFoundError, UnauthenticatedError } from '../http/errors/http-errors';

/**
 * Pure unit tests for the framework-agnostic reading plan handlers — no
 * Express, supertest, database, or running server.
 */

const OWNER_ID = '507f1f77bcf86cd799439011';
const PLAN_ID = '507f1f77bcf86cd799439012';

const fakeUser = { id: OWNER_ID } as UserRecord;

const samplePlan: ReadingPlanRecord = {
  id: PLAN_ID,
  ownerId: OWNER_ID,
  name: 'Gospel of John',
  days: [{ _id: 'd1', passages: [{ _id: 'p1', startVerseId: 143001001, endVerseId: 143001051 }] }],
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

const serializedPlan = {
  id: PLAN_ID,
  name: 'Gospel of John',
  days: [{ passages: [{ startVerseId: 143001001, endVerseId: 143001051 }] }],
};

const makeDeps = (overrides: {
  readingPlans?: Partial<RouteDependencies['repositories']['readingPlans']>;
  authenticate?: RouteDependencies['authenticate'];
}): RouteDependencies => {
  return {
    repositories: {
      readingPlans: (overrides.readingPlans ?? {}) as RouteDependencies['repositories']['readingPlans'],
    } as RouteDependencies['repositories'],
    authenticate: overrides.authenticate ?? (async () => fakeUser),
  } as RouteDependencies;
};

const makeRequest = (overrides: Partial<HttpRequest> = {}): HttpRequest => ({
  method: 'GET',
  params: {},
  query: {},
  body: {},
  headers: {},
  ...overrides,
});

describe('reading plan handlers (unit)', () => {
  describe('listReadingPlans', () => {
    it('returns serialized plans for the current user', async () => {
      const deps = makeDeps({ readingPlans: { listByOwner: async () => [samplePlan] } });
      const result = await listReadingPlans(makeRequest(), deps);
      expect(result.status).toBe(200);
      expect(result.body).toEqual({ data: [serializedPlan] });
    });

    it('propagates authentication failures', async () => {
      const deps = makeDeps({ authenticate: async () => { throw new UnauthenticatedError(); } });
      await expect(listReadingPlans(makeRequest(), deps)).rejects.toBeInstanceOf(UnauthenticatedError);
    });
  });

  describe('getReadingPlan', () => {
    it('throws ValidationError for an invalid id', async () => {
      const deps = makeDeps({});
      await expect(getReadingPlan(makeRequest({ params: { id: 'nope' } }), deps))
        .rejects.toBeInstanceOf(ValidationError);
    });

    it('throws NotFoundError when the plan does not exist', async () => {
      const deps = makeDeps({ readingPlans: { findByIdForOwner: async () => null } });
      await expect(getReadingPlan(makeRequest({ params: { id: PLAN_ID } }), deps))
        .rejects.toBeInstanceOf(NotFoundError);
    });

    it('returns the serialized plan on success', async () => {
      const deps = makeDeps({ readingPlans: { findByIdForOwner: async () => samplePlan } });
      const result = await getReadingPlan(makeRequest({ params: { id: PLAN_ID } }), deps);
      expect(result.body).toEqual({ data: serializedPlan });
    });
  });

  describe('createReadingPlan', () => {
    it('creates and returns the serialized plan', async () => {
      let received: unknown;
      const deps = makeDeps({
        readingPlans: { create: async (_ownerId, input) => { received = input; return samplePlan; } },
      });
      const body = { name: 'Gospel of John', days: [{ passages: [{ startVerseId: 143001001, endVerseId: 143001051 }] }] };
      const result = await createReadingPlan(makeRequest({ method: 'POST', body }), deps);
      expect(received).toEqual(body);
      expect(result.body).toEqual({ data: serializedPlan });
    });

    it('throws ValidationError when the name is missing', async () => {
      const deps = makeDeps({ readingPlans: { create: async () => samplePlan } });
      await expect(createReadingPlan(makeRequest({ method: 'POST', body: { days: [] } }), deps))
        .rejects.toBeInstanceOf(ValidationError);
    });

    it('propagates repository limit errors', async () => {
      const deps = makeDeps({
        readingPlans: { create: async () => { throw new ValidationError(); } },
      });
      const body = { name: 'Another plan' };
      await expect(createReadingPlan(makeRequest({ method: 'POST', body }), deps))
        .rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe('updateReadingPlan', () => {
    it('throws NotFoundError when the plan does not exist', async () => {
      const deps = makeDeps({ readingPlans: { update: async () => null } });
      await expect(updateReadingPlan(makeRequest({ method: 'PATCH', params: { id: PLAN_ID }, body: { name: 'x' } }), deps))
        .rejects.toBeInstanceOf(NotFoundError);
    });

    it('returns the updated serialized plan on success', async () => {
      const updated = { ...samplePlan, name: 'Renamed' };
      const deps = makeDeps({ readingPlans: { update: async () => updated } });
      const result = await updateReadingPlan(
        makeRequest({ method: 'PATCH', params: { id: PLAN_ID }, body: { name: 'Renamed' } }),
        deps,
      );
      expect(result.body).toEqual({ data: { ...serializedPlan, name: 'Renamed' } });
    });
  });

  describe('deleteReadingPlan', () => {
    it('throws NotFoundError when nothing was deleted', async () => {
      const deps = makeDeps({ readingPlans: { deleteByIdForOwner: async () => 0 } });
      await expect(deleteReadingPlan(makeRequest({ method: 'DELETE', params: { id: PLAN_ID } }), deps))
        .rejects.toBeInstanceOf(NotFoundError);
    });

    it('returns the deleted count on success', async () => {
      const deps = makeDeps({ readingPlans: { deleteByIdForOwner: async () => 1 } });
      const result = await deleteReadingPlan(makeRequest({ method: 'DELETE', params: { id: PLAN_ID } }), deps);
      expect(result.body).toEqual({ data: 1 });
    });
  });
});
