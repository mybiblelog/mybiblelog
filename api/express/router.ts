import express from 'express';

import { registerRoutes } from '../http/adapters/express';
import { authRoutes } from '../http/routes/auth';
import { logEntryRoutes } from '../http/routes/log-entries';
import { passageNoteRoutes } from '../http/routes/passage-notes';
import { passageNoteTagRoutes } from '../http/routes/passage-note-tags';
import { settingsRoutes } from '../http/routes/settings';
import { reminderRoutes } from '../http/routes/reminders';
import { feedbackRoutes } from '../http/routes/feedback';
import { adminRoutes } from '../http/routes/admin';
import { scriptureRoutes } from '../http/routes/scripture';
import { sitemapRoutes } from '../http/routes/sitemap';
import { mobileAppRoutes } from '../http/routes/mobile-app';
import { testEmailRoutes } from '../http/routes/test-emails';

/**
 * Express wiring for the API. The handlers are framework-agnostic
 * (`api/http/handlers/`) and each route table carries its own OpenAPI docs
 * (`api/http/routes/`). This file only registers those tables onto Express;
 * auth, validation, rate limiting, cookies and redirects are expressed by the
 * handlers/dependencies, not here. Registration order is route-matching order.
 */
const apiRouter = express.Router();

registerRoutes(apiRouter, [
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
  // Test-only seam; the handler returns 404 in production / without the bypass header.
  ...testEmailRoutes,
]);

export default apiRouter;
