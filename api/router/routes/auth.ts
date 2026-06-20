import express from 'express';
import { registerRoutes } from '../../http/adapters/express';
import { authRoutes } from '../../http/routes/auth';

/**
 * Express adapter wiring for authentication. The handlers are framework-agnostic
 * (`api/http/handlers/auth.ts`) and the route table carries its own OpenAPI docs
 * (`api/http/routes/auth.ts`). This file only registers that table onto Express;
 * cookie-setting, rate limiting and email enqueueing are expressed by the
 * handlers/dependencies, not here.
 */
const router = express.Router();

registerRoutes(router, authRoutes);

export default router;
