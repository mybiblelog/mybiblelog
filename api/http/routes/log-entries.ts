import { type RouteDefinition } from '../types';
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
 */
export const logEntryRoutes: RouteDefinition[] = [
  { method: 'GET', path: '/log-entries', handler: listLogEntries },
  { method: 'GET', path: '/log-entries/:id', handler: getLogEntry },
  { method: 'POST', path: '/log-entries', handler: createLogEntry },
  { method: 'PUT', path: '/log-entries/:id', handler: updateLogEntry },
  { method: 'DELETE', path: '/log-entries/:id', handler: deleteLogEntry },
];
