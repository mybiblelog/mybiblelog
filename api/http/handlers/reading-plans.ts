import { toReadingPlanJSON } from '../../repositories/helpers/serializers';
import { NotFoundError } from '../errors/http-errors';
import { validate } from '../../validation/validate';
import { objectIdParam } from '../../validation/primitives';
import {
  readingPlanCreateSchema,
  readingPlanUpdateSchema,
} from '../../validation/schemas/reading-plan';
import { type RouteHandler } from '../types';

/**
 * Framework-agnostic reading plan handlers. Same shape as the log-entry
 * handlers: authenticate, validate, delegate to the owner-scoped repository,
 * return the standard `{ data }` envelope. The per-user plan limit and the
 * per-plan passage limit are enforced in the repository.
 */

// GET /reading-plans - List the current user's reading plans
export const listReadingPlans: RouteHandler = async (req, deps) => {
  const currentUser = await deps.authenticate(req);
  const plans = await deps.repositories.readingPlans.listByOwner(currentUser.id);
  return { status: 200, body: { data: plans.map(toReadingPlanJSON) } };
};

// GET /reading-plans/:id - Get a specific reading plan
export const getReadingPlan: RouteHandler = async (req, deps) => {
  const { params } = validate(req, { params: objectIdParam });
  const currentUser = await deps.authenticate(req);

  const plan = await deps.repositories.readingPlans.findByIdForOwner(currentUser.id, params.id);
  if (!plan) {
    throw new NotFoundError();
  }
  return { status: 200, body: { data: toReadingPlanJSON(plan) } };
};

// POST /reading-plans - Create a new reading plan
export const createReadingPlan: RouteHandler = async (req, deps) => {
  const currentUser = await deps.authenticate(req);
  const { body } = validate(req, { body: readingPlanCreateSchema });

  const plan = await deps.repositories.readingPlans.create(currentUser.id, body);
  return { status: 200, body: { data: toReadingPlanJSON(plan) } };
};

// PUT /reading-plans/:id - Update a reading plan
export const updateReadingPlan: RouteHandler = async (req, deps) => {
  const { params, body } = validate(req, { params: objectIdParam, body: readingPlanUpdateSchema });
  const currentUser = await deps.authenticate(req);

  const plan = await deps.repositories.readingPlans.update(currentUser.id, params.id, body);
  if (!plan) {
    throw new NotFoundError();
  }
  return { status: 200, body: { data: toReadingPlanJSON(plan) } };
};

// DELETE /reading-plans/:id - Delete a reading plan (and its trackers)
export const deleteReadingPlan: RouteHandler = async (req, deps) => {
  const { params } = validate(req, { params: objectIdParam });
  const currentUser = await deps.authenticate(req);

  const deletedCount = await deps.repositories.readingPlans.deleteByIdForOwner(currentUser.id, params.id);
  if (deletedCount === 0) {
    throw new NotFoundError();
  }
  return { status: 200, body: { data: deletedCount } };
};
