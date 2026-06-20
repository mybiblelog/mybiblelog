import { type RouteDefinition } from '../types';
import { logEntryRoutes } from './log-entries';

/**
 * All framework-neutral route tables that have been migrated to the
 * `http/handlers` + `http/routes` pattern. The OpenAPI generator documents
 * every route here that carries a `docs` entry.
 *
 * As more routers are migrated, add their route tables to this list.
 */
export const documentedRoutes: RouteDefinition[] = [
  ...logEntryRoutes,
];
