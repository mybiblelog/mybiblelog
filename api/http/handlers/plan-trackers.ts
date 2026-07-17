import { toPlanTrackerJSON } from '../../repositories/helpers/serializers';
import { NotFoundError } from '../errors/http-errors';
import { validate } from '../../validation/validate';
import { objectIdParam } from '../../validation/primitives';
import {
  planTrackerCreateSchema,
  planTrackerUpdateSchema,
} from '../../validation/schemas/plan-tracker';
import { type RouteHandler } from '../types';

/**
 * Framework-agnostic plan tracker handlers. A tracker is an active attempt at
 * following a reading plan; `create` verifies plan ownership and rejects a
 * second active tracker for the same plan (both in the repository).
 */

// GET /plan-trackers - List the current user's plan trackers
export const listPlanTrackers: RouteHandler = async (req, deps) => {
  const currentUser = await deps.authenticate(req);
  const trackers = await deps.repositories.planTrackers.listByOwner(currentUser.id);
  return { status: 200, body: { data: trackers.map(toPlanTrackerJSON) } };
};

// GET /plan-trackers/:id - Get a specific plan tracker
export const getPlanTracker: RouteHandler = async (req, deps) => {
  const { params } = validate(req, { params: objectIdParam });
  const currentUser = await deps.authenticate(req);

  const tracker = await deps.repositories.planTrackers.findByIdForOwner(currentUser.id, params.id);
  if (!tracker) {
    throw new NotFoundError();
  }
  return { status: 200, body: { data: toPlanTrackerJSON(tracker) } };
};

// POST /plan-trackers - Start tracking a plan
export const createPlanTracker: RouteHandler = async (req, deps) => {
  const currentUser = await deps.authenticate(req);
  const { body } = validate(req, { body: planTrackerCreateSchema });

  const tracker = await deps.repositories.planTrackers.create(currentUser.id, body);
  return { status: 200, body: { data: toPlanTrackerJSON(tracker) } };
};

// PUT /plan-trackers/:id - Mark a tracker complete (or reopen it)
export const updatePlanTracker: RouteHandler = async (req, deps) => {
  const { params, body } = validate(req, { params: objectIdParam, body: planTrackerUpdateSchema });
  const currentUser = await deps.authenticate(req);

  const tracker = await deps.repositories.planTrackers.update(currentUser.id, params.id, body);
  if (!tracker) {
    throw new NotFoundError();
  }
  return { status: 200, body: { data: toPlanTrackerJSON(tracker) } };
};

// DELETE /plan-trackers/:id - Delete a plan tracker
export const deletePlanTracker: RouteHandler = async (req, deps) => {
  const { params } = validate(req, { params: objectIdParam });
  const currentUser = await deps.authenticate(req);

  const deletedCount = await deps.repositories.planTrackers.deleteByIdForOwner(currentUser.id, params.id);
  if (deletedCount === 0) {
    throw new NotFoundError();
  }
  return { status: 200, body: { data: deletedCount } };
};
