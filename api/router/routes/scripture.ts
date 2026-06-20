import express from 'express';
import { registerRoutes } from '../../http/adapters/express';
import { scriptureRoutes } from '../../http/routes/scripture';

/**
 * Express adapter wiring for scripture. The handler is framework-agnostic
 * (`api/http/handlers/scripture.ts`) and the route table carries its own OpenAPI
 * docs (`api/http/routes/scripture.ts`). This file only registers that table onto
 * Express; auth and validation are expressed by the handler/dependencies, not here.
 */
const router = express.Router();

registerRoutes(router, scriptureRoutes);

export default router;
