import { type RouteDefinition, type DocumentedRoute } from '../types';
import { logEntryRoutes } from './log-entries';
import { authRoutes } from './auth';
import { adminRoutes } from './admin';
import { feedbackRoutes } from './feedback';

/**
 * Every route the OpenAPI generator should document. This includes:
 *
 *  - migrated route tables (framework-agnostic handlers + `docs`), e.g.
 *    `logEntryRoutes` and `authRoutes`, and
 *  - documentation-only descriptors for any routers still on Express handlers.
 *
 * As more routers are migrated, add their route tables here (and remove any
 * corresponding doc-only descriptors / JSDoc).
 */
export const documentedRoutes: Array<RouteDefinition | DocumentedRoute> = [
  ...logEntryRoutes,
  ...authRoutes,
  ...adminRoutes,
  ...feedbackRoutes,
];
