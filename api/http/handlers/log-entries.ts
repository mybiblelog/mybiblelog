import { toLogEntryJSON } from '../../repositories/helpers/serializers';
import { NotFoundError } from '../../router/errors/http-errors';
import { validate } from '../../validation/validate';
import { objectIdParam } from '../../validation/primitives';
import {
  logEntryCreateSchema,
  logEntryUpdateSchema,
  logEntryListQuerySchema,
} from '../../validation/schemas/log-entry';
import { type RouteHandler } from '../types';

/**
 * Framework-agnostic log entry handlers.
 *
 * Each handler is a pure function of `(request, dependencies)`: it reads from
 * the normalized request, talks to the injected repositories, and returns a
 * normalized result. Failures are signalled by throwing `AppError` subclasses
 * (the adapter / global error handler turns those into HTTP responses). This
 * keeps the validation, error, and response semantics identical to the original
 * Express handlers while removing any direct dependency on Express.
 */

// GET /log-entries - List all log entries for current user with optional date filtering
export const listLogEntries: RouteHandler = async (req, deps) => {
  const currentUser = await deps.authenticate(req);
  const { query } = validate(req, { query: logEntryListQuerySchema });

  const logEntries = await deps.repositories.logEntries.listByOwner(currentUser.id, query);
  return { status: 200, body: { data: logEntries.map(toLogEntryJSON) } };
};

// GET /log-entries/:id - Get a specific log entry by ID
export const getLogEntry: RouteHandler = async (req, deps) => {
  const { params } = validate(req, { params: objectIdParam });
  const currentUser = await deps.authenticate(req);

  const logEntry = await deps.repositories.logEntries.findByIdForOwner(currentUser.id, params.id);
  if (!logEntry) {
    throw new NotFoundError();
  }
  return { status: 200, body: { data: toLogEntryJSON(logEntry) } };
};

// POST /log-entries - Create a new log entry
export const createLogEntry: RouteHandler = async (req, deps) => {
  const currentUser = await deps.authenticate(req);
  const { body } = validate(req, { body: logEntryCreateSchema });

  const logEntry = await deps.repositories.logEntries.create(currentUser.id, body);

  return { status: 200, body: { data: toLogEntryJSON(logEntry) } };
};

// PUT /log-entries/:id - Update a log entry
export const updateLogEntry: RouteHandler = async (req, deps) => {
  const { params, body } = validate(req, { params: objectIdParam, body: logEntryUpdateSchema });
  const currentUser = await deps.authenticate(req);

  const logEntry = await deps.repositories.logEntries.update(currentUser.id, params.id, body);
  if (!logEntry) {
    throw new NotFoundError();
  }

  return { status: 200, body: { data: toLogEntryJSON(logEntry) } };
};

// DELETE /log-entries/:id - Delete a log entry
export const deleteLogEntry: RouteHandler = async (req, deps) => {
  const { params } = validate(req, { params: objectIdParam });
  const currentUser = await deps.authenticate(req);

  const deletedCount = await deps.repositories.logEntries.deleteByIdForOwner(currentUser.id, params.id);
  if (deletedCount === 0) {
    throw new NotFoundError();
  }

  return { status: 200, body: { data: deletedCount } };
};
