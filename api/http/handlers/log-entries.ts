import dayjs from 'dayjs';
import { isValidObjectId } from '../../repositories/helpers/ids';
import { toLogEntryJSON } from '../../repositories/helpers/serializers';
import { ApiErrorDetailCode } from '../../router/errors/error-codes';
import { ValidationError } from '../../router/errors/validation-errors';
import { NotFoundError } from '../../router/errors/http-errors';
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
  const { startDate, endDate } = req.query;

  if (startDate && !dayjs(startDate, 'YYYY-MM-DD', true).isValid()) {
    throw new ValidationError([{ code: ApiErrorDetailCode.NotValid, field: 'startDate' }]);
  }

  if (endDate && !dayjs(endDate, 'YYYY-MM-DD', true).isValid()) {
    throw new ValidationError([{ code: ApiErrorDetailCode.NotValid, field: 'endDate' }]);
  }

  const logEntries = await deps.repositories.logEntries.listByOwner(currentUser!.id, { startDate, endDate });
  return { status: 200, body: { data: logEntries.map(toLogEntryJSON) } };
};

// GET /log-entries/:id - Get a specific log entry by ID
export const getLogEntry: RouteHandler = async (req, deps) => {
  const { id } = req.params;
  if (!id || !isValidObjectId(id)) {
    throw new ValidationError([{ code: ApiErrorDetailCode.NotValid, field: 'id' }]);
  }

  const currentUser = await deps.authenticate(req);

  const logEntry = await deps.repositories.logEntries.findByIdForOwner(currentUser!.id, id);
  if (!logEntry) {
    throw new NotFoundError();
  }
  return { status: 200, body: { data: toLogEntryJSON(logEntry) } };
};

// POST /log-entries - Create a new log entry
export const createLogEntry: RouteHandler = async (req, deps) => {
  const currentUser = await deps.authenticate(req);
  const { date, startVerseId, endVerseId } = req.body;

  const logEntry = await deps.repositories.logEntries.create(currentUser!.id, { date, startVerseId, endVerseId });

  return { status: 200, body: { data: toLogEntryJSON(logEntry) } };
};

// PUT /log-entries/:id - Update a log entry
export const updateLogEntry: RouteHandler = async (req, deps) => {
  const { id } = req.params;
  if (!id || !isValidObjectId(id)) {
    throw new ValidationError([{ code: ApiErrorDetailCode.NotValid, field: 'id' }]);
  }

  const currentUser = await deps.authenticate(req);
  const { date, startVerseId, endVerseId } = req.body;

  const logEntry = await deps.repositories.logEntries.update(currentUser!.id, id, { date, startVerseId, endVerseId });
  if (!logEntry) {
    throw new NotFoundError();
  }

  return { status: 200, body: { data: toLogEntryJSON(logEntry) } };
};

// DELETE /log-entries/:id - Delete a log entry
export const deleteLogEntry: RouteHandler = async (req, deps) => {
  const { id } = req.params;
  if (!id || !isValidObjectId(id)) {
    throw new ValidationError([{ code: ApiErrorDetailCode.NotValid, field: 'id' }]);
  }

  const currentUser = await deps.authenticate(req);

  const deletedCount = await deps.repositories.logEntries.deleteByIdForOwner(currentUser!.id, id);
  if (deletedCount === 0) {
    throw new NotFoundError();
  }

  return { status: 200, body: { data: deletedCount } };
};
