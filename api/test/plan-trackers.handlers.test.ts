import { describe, it, expect } from 'vitest';
import {
  listPlanTrackers,
  getPlanTracker,
  createPlanTracker,
  updatePlanTracker,
  deletePlanTracker,
} from '../http/handlers/plan-trackers';
import { type HttpRequest, type RouteDependencies } from '../http/types';
import { type PlanTrackerRecord, type UserRecord } from '../repositories/helpers/types';
import { ValidationError } from '../http/errors/validation-errors';
import { NotFoundError, UnauthenticatedError } from '../http/errors/http-errors';

const OWNER_ID = '507f1f77bcf86cd799439011';
const PLAN_ID = '507f1f77bcf86cd799439012';
const TRACKER_ID = '507f1f77bcf86cd799439013';

const fakeUser = { id: OWNER_ID } as UserRecord;

const sampleTracker: PlanTrackerRecord = {
  id: TRACKER_ID,
  ownerId: OWNER_ID,
  planId: PLAN_ID,
  startDate: '2024-01-01',
  completedDate: null,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

const serializedTracker = {
  id: TRACKER_ID,
  planId: PLAN_ID,
  startDate: '2024-01-01',
  completedDate: null,
};

const makeDeps = (overrides: {
  planTrackers?: Partial<RouteDependencies['repositories']['planTrackers']>;
  authenticate?: RouteDependencies['authenticate'];
}): RouteDependencies => {
  return {
    repositories: {
      planTrackers: (overrides.planTrackers ?? {}) as RouteDependencies['repositories']['planTrackers'],
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

describe('plan tracker handlers (unit)', () => {
  describe('listPlanTrackers', () => {
    it('returns serialized trackers for the current user', async () => {
      const deps = makeDeps({ planTrackers: { listByOwner: async () => [sampleTracker] } });
      const result = await listPlanTrackers(makeRequest(), deps);
      expect(result.body).toEqual({ data: [serializedTracker] });
    });

    it('propagates authentication failures', async () => {
      const deps = makeDeps({ authenticate: async () => { throw new UnauthenticatedError(); } });
      await expect(listPlanTrackers(makeRequest(), deps)).rejects.toBeInstanceOf(UnauthenticatedError);
    });
  });

  describe('getPlanTracker', () => {
    it('throws NotFoundError when the tracker does not exist', async () => {
      const deps = makeDeps({ planTrackers: { findByIdForOwner: async () => null } });
      await expect(getPlanTracker(makeRequest({ params: { id: TRACKER_ID } }), deps))
        .rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('createPlanTracker', () => {
    it('creates and returns the serialized tracker', async () => {
      let received: unknown;
      const deps = makeDeps({
        planTrackers: { create: async (_ownerId, input) => { received = input; return sampleTracker; } },
      });
      const body = { planId: PLAN_ID, startDate: '2024-01-01' };
      const result = await createPlanTracker(makeRequest({ method: 'POST', body }), deps);
      expect(received).toEqual(body);
      expect(result.body).toEqual({ data: serializedTracker });
    });

    it('throws ValidationError for a malformed planId', async () => {
      const deps = makeDeps({ planTrackers: { create: async () => sampleTracker } });
      const body = { planId: 'not-an-id', startDate: '2024-01-01' };
      await expect(createPlanTracker(makeRequest({ method: 'POST', body }), deps))
        .rejects.toBeInstanceOf(ValidationError);
    });

    it('propagates repository rejection of a second active tracker', async () => {
      const deps = makeDeps({ planTrackers: { create: async () => { throw new ValidationError(); } } });
      const body = { planId: PLAN_ID, startDate: '2024-01-01' };
      await expect(createPlanTracker(makeRequest({ method: 'POST', body }), deps))
        .rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe('updatePlanTracker', () => {
    it('throws NotFoundError when the tracker does not exist', async () => {
      const deps = makeDeps({ planTrackers: { update: async () => null } });
      await expect(updatePlanTracker(
        makeRequest({ method: 'PATCH', params: { id: TRACKER_ID }, body: { completedDate: '2024-02-02' } }),
        deps,
      )).rejects.toBeInstanceOf(NotFoundError);
    });

    it('marks the tracker complete on success', async () => {
      const completed = { ...sampleTracker, completedDate: '2024-02-02' };
      const deps = makeDeps({ planTrackers: { update: async () => completed } });
      const result = await updatePlanTracker(
        makeRequest({ method: 'PATCH', params: { id: TRACKER_ID }, body: { completedDate: '2024-02-02' } }),
        deps,
      );
      expect(result.body).toEqual({ data: { ...serializedTracker, completedDate: '2024-02-02' } });
    });

    it('throws ValidationError for an invalid completedDate', async () => {
      const deps = makeDeps({ planTrackers: { update: async () => sampleTracker } });
      await expect(updatePlanTracker(
        makeRequest({ method: 'PATCH', params: { id: TRACKER_ID }, body: { completedDate: 'nope' } }),
        deps,
      )).rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe('deletePlanTracker', () => {
    it('throws NotFoundError when nothing was deleted', async () => {
      const deps = makeDeps({ planTrackers: { deleteByIdForOwner: async () => 0 } });
      await expect(deletePlanTracker(makeRequest({ method: 'DELETE', params: { id: TRACKER_ID } }), deps))
        .rejects.toBeInstanceOf(NotFoundError);
    });

    it('returns the deleted count on success', async () => {
      const deps = makeDeps({ planTrackers: { deleteByIdForOwner: async () => 1 } });
      const result = await deletePlanTracker(makeRequest({ method: 'DELETE', params: { id: TRACKER_ID } }), deps);
      expect(result.body).toEqual({ data: 1 });
    });
  });
});
