import express from 'express';
import { registerRoutes } from '../../http/adapters/express';
import { settingsRoutes } from '../../http/routes/settings';

/**
 * Express adapter wiring for settings. The handlers are framework-agnostic
 * (`api/http/handlers/settings.ts`) and the route table carries its own OpenAPI
 * docs (`api/http/routes/settings.ts`). This file only registers that table onto
 * Express; auth, validation, and cookie handling are expressed by the
 * handlers/dependencies, not here.
 */
const router = express.Router();

registerRoutes(router, settingsRoutes);

export default router;
