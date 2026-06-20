import express from 'express';
import { registerRoutes } from '../../http/adapters/express';
import { passageNoteRoutes } from '../../http/routes/passage-notes';

/**
 * Express adapter wiring for passage notes. The handlers are framework-agnostic
 * (`api/http/handlers/passage-notes.ts`) and the route table carries its own
 * OpenAPI docs (`api/http/routes/passage-notes.ts`). This file only registers
 * that table onto Express; auth, validation, and query parsing are expressed by
 * the handlers/dependencies, not here.
 */
const router = express.Router();

registerRoutes(router, passageNoteRoutes);

export default router;
