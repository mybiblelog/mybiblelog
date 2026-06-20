import express from 'express';
import { registerRoutes } from '../../http/adapters/express';
import { passageNoteTagRoutes } from '../../http/routes/passage-note-tags';

/**
 * Express adapter wiring for passage note tags. The handlers are
 * framework-agnostic (`api/http/handlers/passage-note-tags.ts`) and the route
 * table carries its own OpenAPI docs (`api/http/routes/passage-note-tags.ts`).
 * This file only registers that table onto Express; auth and validation are
 * expressed by the handlers/dependencies, not here.
 */
const router = express.Router();

registerRoutes(router, passageNoteTagRoutes);

export default router;
