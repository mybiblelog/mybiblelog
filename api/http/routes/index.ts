import { type RouteDefinition, type DocumentedRoute } from '../types';
import { authRoutes } from './auth';
import { logEntryRoutes } from './log-entries';
import { passageNoteRoutes } from './passage-notes';
import { passageNoteTagRoutes } from './passage-note-tags';
import { settingsRoutes } from './settings';
import { reminderRoutes } from './reminders';
import { feedbackRoutes } from './feedback';
import { adminRoutes } from './admin';
import { scriptureRoutes } from './scripture';
import { sitemapRoutes } from './sitemap';
import { mobileAppRoutes } from './mobile-app';

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
  ...authRoutes,
  ...logEntryRoutes,
  ...passageNoteRoutes,
  ...passageNoteTagRoutes,
  ...settingsRoutes,
  ...reminderRoutes,
  ...feedbackRoutes,
  ...adminRoutes,
  ...scriptureRoutes,
  ...sitemapRoutes,
  ...mobileAppRoutes,
];
