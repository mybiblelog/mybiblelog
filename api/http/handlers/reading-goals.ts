import { toReadingGoalJSON } from '../../repositories/helpers/serializers';
import { NotFoundError } from '../errors/http-errors';
import { validate } from '../../validation/validate';
import { objectIdParam } from '../../validation/primitives';
import { readingGoalBodySchema } from '../../validation/schemas/reading-goal';
import { type RouteHandler } from '../types';

/**
 * Framework-agnostic reading goal handlers. Progress and completion are not
 * stored; clients derive them from log entries (see `shared/reading-goals`).
 */

// GET /reading-goals - List all goals for the current user
export const listReadingGoals: RouteHandler = async (req, deps) => {
  const currentUser = await deps.authenticate(req);
  const goals = await deps.repositories.readingGoals.listByOwner(currentUser.id);
  return { status: 200, body: { data: goals.map(toReadingGoalJSON) } };
};

// GET /reading-goals/:id - Get a specific goal by ID
export const getReadingGoal: RouteHandler = async (req, deps) => {
  const { params } = validate(req, { params: objectIdParam });
  const currentUser = await deps.authenticate(req);

  const goal = await deps.repositories.readingGoals.findByIdForOwner(currentUser.id, params.id);
  if (!goal) {
    throw new NotFoundError();
  }
  return { status: 200, body: { data: toReadingGoalJSON(goal) } };
};

// POST /reading-goals - Create a new goal
export const createReadingGoal: RouteHandler = async (req, deps) => {
  const { body } = validate(req, { body: readingGoalBodySchema });
  const currentUser = await deps.authenticate(req);

  const goal = await deps.repositories.readingGoals.create(currentUser.id, body);
  return { status: 200, body: { data: toReadingGoalJSON(goal) } };
};

// PUT /reading-goals/:id - Replace a goal
export const updateReadingGoal: RouteHandler = async (req, deps) => {
  const { params, body } = validate(req, { params: objectIdParam, body: readingGoalBodySchema });
  const currentUser = await deps.authenticate(req);

  const goal = await deps.repositories.readingGoals.replace(currentUser.id, params.id, body);
  if (!goal) {
    throw new NotFoundError();
  }
  return { status: 200, body: { data: toReadingGoalJSON(goal) } };
};

// DELETE /reading-goals/:id - Delete a goal
export const deleteReadingGoal: RouteHandler = async (req, deps) => {
  const { params } = validate(req, { params: objectIdParam });
  const currentUser = await deps.authenticate(req);

  const deletedCount = await deps.repositories.readingGoals.deleteByIdForOwner(currentUser.id, params.id);
  if (deletedCount === 0) {
    throw new NotFoundError();
  }
  return { status: 200, body: { data: deletedCount } };
};
