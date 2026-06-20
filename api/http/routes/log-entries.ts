import { z } from 'zod';
import { type RouteDefinition } from '../types';
import { objectIdParam } from '../../validation/primitives';
import {
  logEntryCreateSchema,
  logEntryUpdateSchema,
  logEntryListQuerySchema,
  logEntrySchema,
} from '../../validation/schemas/log-entry';
import {
  listLogEntries,
  getLogEntry,
  createLogEntry,
  updateLogEntry,
  deleteLogEntry,
} from '../handlers/log-entries';

/**
 * Framework-neutral route table for log entries. Every adapter (Express, Hono,
 * H3, …) consumes this same list and is responsible only for translating its
 * native request/response onto the normalized `HttpRequest`/`HttpResult`.
 *
 * Each route's `docs` reuses the same zod schemas the handler validates with, so
 * the generated OpenAPI spec stays in lockstep with the real contract. See
 * `api/http/openapi/generate.ts`.
 */
export const logEntryRoutes: RouteDefinition[] = [
  {
    method: 'GET',
    path: '/log-entries',
    handler: listLogEntries,
    docs: {
      summary: 'Get all log entries for the current user',
      tags: ['LogEntries'],
      request: { query: logEntryListQuerySchema },
      response: { description: 'List of log entries', schema: z.array(logEntrySchema) },
    },
  },
  {
    method: 'GET',
    path: '/log-entries/:id',
    handler: getLogEntry,
    docs: {
      summary: 'Get a specific log entry by ID',
      tags: ['LogEntries'],
      request: { params: objectIdParam },
      response: { description: 'The log entry', schema: logEntrySchema },
    },
  },
  {
    method: 'POST',
    path: '/log-entries',
    handler: createLogEntry,
    docs: {
      summary: 'Create a new log entry',
      tags: ['LogEntries'],
      request: { body: logEntryCreateSchema },
      response: { description: 'The created log entry', schema: logEntrySchema },
    },
  },
  {
    method: 'PUT',
    path: '/log-entries/:id',
    handler: updateLogEntry,
    docs: {
      summary: 'Update a log entry',
      tags: ['LogEntries'],
      request: { params: objectIdParam, body: logEntryUpdateSchema },
      response: { description: 'The updated log entry', schema: logEntrySchema },
    },
  },
  {
    method: 'DELETE',
    path: '/log-entries/:id',
    handler: deleteLogEntry,
    docs: {
      summary: 'Delete a log entry',
      tags: ['LogEntries'],
      request: { params: objectIdParam },
      response: { description: 'Number of deleted entries (1)', schema: z.number() },
    },
  },
];
