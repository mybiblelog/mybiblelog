import express from 'express';
import { registerRoutes } from '../../http/adapters/express';
import { adminRoutes } from '../../http/routes/admin';

/**
 * Express adapter wiring for the admin endpoints. The handlers are
 * framework-agnostic (`api/http/handlers/admin.ts`) and the route table carries
 * its own OpenAPI docs (`api/http/routes/admin.ts`). This file only registers that
 * table onto Express; admin authorization, cookie-setting and query parsing are
 * expressed by the handlers/dependencies, not here.
 */
const router = express.Router();

registerRoutes(router, adminRoutes);

export default router;
