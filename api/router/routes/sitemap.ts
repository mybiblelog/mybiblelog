import express from 'express';
import { registerRoutes } from '../../http/adapters/express';
import { sitemapRoutes } from '../../http/routes/sitemap';

/**
 * Express adapter wiring for the sitemap. The handler is framework-agnostic
 * (`api/http/handlers/sitemap.ts`) and the route table carries its own OpenAPI
 * docs (`api/http/routes/sitemap.ts`). This file only registers that table onto
 * Express; the raw XML response shape is expressed by the handler/adapter, not here.
 */
const router = express.Router();

registerRoutes(router, sitemapRoutes);

export default router;
