import express from 'express';
import { registerRoutes } from '../../http/adapters/express';
import { logEntryRoutes } from '../../http/routes/log-entries';

/**
 * Express adapter wiring for log entries. The handlers are framework-agnostic
 * (`api/http/handlers/`) and the route table carries its own OpenAPI docs
 * (`api/http/routes/log-entries.ts`), which the generator turns into the spec
 * served at `/api-docs`. This file only registers that table onto Express.
 */
const router = express.Router();

registerRoutes(router, logEntryRoutes);

export default router;
