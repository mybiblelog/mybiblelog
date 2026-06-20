import { type RouteDefinition, type DocumentedRoute } from '../types';
import { logEntryRoutes } from './log-entries';
import { authDocRoutes } from './auth.docs';

/**
 * Every route the OpenAPI generator should document. This includes:
 *
 *  - migrated route tables (framework-agnostic handlers + `docs`), e.g.
 *    `logEntryRoutes`, and
 *  - documentation-only descriptors for routers still on Express handlers, e.g.
 *    `authDocRoutes`.
 *
 * As more routers are migrated, add their route tables here (and remove any
 * corresponding doc-only descriptors / JSDoc).
 */
export const documentedRoutes: Array<RouteDefinition | DocumentedRoute> = [
  ...logEntryRoutes,
  ...authDocRoutes,
];
