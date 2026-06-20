import { type Router } from 'express';
import { createRouteDependencies } from '../dependencies';
import { type HttpRequest, type RouteDefinition, type RouteDependencies } from '../types';

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
  // Resolve dependencies once, lazily on the first request. Deferring (rather
  // than building them at registration time) avoids triggering a DB connection
  // at import time; memoizing avoids rebuilding them on every request.
  let depsPromise: Promise<RouteDependencies> | undefined;
  const getDeps = (): Promise<RouteDependencies> => (depsPromise ??= createRouteDependencies());

  for (const route of routes) {
    const method = route.method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete';
    router[method](route.path, async (req, res, next) => {
      try {
        const deps = await getDeps();
        const httpReq: HttpRequest = {
          method: req.method,
          params: req.params as HttpRequest['params'],
          query: req.query as HttpRequest['query'],
          body: req.body,
          headers: req.headers,
          ip: req.ip,
          path: req.path,
        };
        const result = await route.handler(httpReq, deps);
        for (const cookie of result.cookies ?? []) {
          if (cookie.value === null) {
            res.clearCookie(cookie.name);
          }
          else {
            res.cookie(cookie.name, cookie.value, cookie.options ?? {});
          }
        }
        res.status(result.status).json(result.body);
      }
      catch (error) {
        next(error);
      }
    });
  }
};
