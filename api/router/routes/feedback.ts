import express from 'express';
import { registerRoutes } from '../../http/adapters/express';
import { feedbackRoutes } from '../../http/routes/feedback';

/**
 * Express adapter wiring for feedback. The handler is framework-agnostic
 * (`api/http/handlers/feedback.ts`) and the route table carries its own OpenAPI
 * docs (`api/http/routes/feedback.ts`). This file only registers that table onto
 * Express; rate limiting and validation are expressed by the handler/dependencies,
 * not here.
 */
const router = express.Router();

registerRoutes(router, feedbackRoutes);

export default router;
