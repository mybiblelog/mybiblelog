import { type Router } from 'express';
import { createRouteDependencies } from '../dependencies';
import { type HttpRequest, type RouteDefinition } from '../types';

/**
 * Express adapter. Registers a list of framework-neutral `RouteDefinition`s on
 * an Express router.
 *
 * For each route it: maps the Express `req` onto a normalized `HttpRequest`,
 * resolves the production dependencies, invokes the pure handler, and writes the
 * returned `HttpResult` as `res.status().json()`. Thrown errors are forwarded to
 * `next` so the existing global `AppError` error handler (see `api/app.ts`)
 * produces the response — keeping HTTP error shapes/status codes unchanged.
 */
export const registerRoutes = (router: Router, routes: RouteDefinition[]): void => {
  for (const route of routes) {
    const method = route.method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete';
    router[method](route.path, async (req, res, next) => {
      try {
        const deps = await createRouteDependencies();
        const httpReq: HttpRequest = {
          method: req.method,
          params: req.params as HttpRequest['params'],
          query: req.query as HttpRequest['query'],
          body: req.body,
          headers: req.headers,
        };
        const result = await route.handler(httpReq, deps);
        res.status(result.status).json(result.body);
      }
      catch (error) {
        next(error);
      }
    });
  }
};
