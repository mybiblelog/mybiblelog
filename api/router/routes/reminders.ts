import express from 'express';
import { registerRoutes } from '../../http/adapters/express';
import { reminderRoutes } from '../../http/routes/reminders';

/**
 * Express adapter wiring for daily reminders. The handlers are framework-agnostic
 * (`api/http/handlers/reminders.ts`) and the route table carries its own OpenAPI
 * docs (`api/http/routes/reminders.ts`). This file only registers that table onto
 * Express; auth, validation, redirect, and the open-redirect guard are expressed
 * by the handlers/dependencies, not here.
 */
const router = express.Router();

registerRoutes(router, reminderRoutes);

export default router;
