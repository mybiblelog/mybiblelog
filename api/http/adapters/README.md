# HTTP adapters

The route handlers in `api/http/handlers/` are **framework-agnostic**. Each one is a pure
function of `(req: HttpRequest, deps: RouteDependencies) => Promise<HttpResult>` that throws
`AppError` subclasses on failure. An *adapter* is the only framework-specific layer: it maps
a native request onto `HttpRequest`, invokes the handler, writes the `HttpResult`, and
translates thrown `AppError`s into the standard `{ error: { code, errors } }` response.

The Express adapter (`express.ts`) is the one that is actually wired into the app today. The
examples below show how the *same* `logEntryRoutes` table would be driven by **Hono** and
**H3** (the Nuxt nitro server). They are intentionally kept here as documentation rather than
`.ts` files so that `hono`/`h3` do not need to be installed and the `tsc` build is unaffected.

A small shared helper turns a thrown `AppError` into a normalized result. Every adapter can
reuse it:

```ts
import { AppError } from '../../router/errors/app-error';
import { InternalError } from '../../router/errors/internal-error';
import { type HttpResult } from '../types';

export const toErrorResult = (err: unknown): HttpResult => {
  const error = err instanceof AppError ? err : new InternalError();
  return {
    status: error.status,
    body: { error: { code: error.code, errors: error.details } },
  };
};
```

## Hono adapter (example)

```ts
import { Hono } from 'hono';
import { logEntryRoutes } from '../routes/log-entries';
import { createRouteDependencies } from '../dependencies';
import { type HttpRequest } from '../types';
import { toErrorResult } from './shared'; // the helper shown above

export const registerHonoRoutes = (app: Hono) => {
  for (const route of logEntryRoutes) {
    app.on(route.method, route.path, async (c) => {
      const httpReq: HttpRequest = {
        method: c.req.method,
        params: c.req.param(),
        query: c.req.query(),                       // Record<string, string>
        body: c.req.header('content-type')?.includes('application/json')
          ? await c.req.json().catch(() => undefined)
          : undefined,
        headers: Object.fromEntries(c.req.raw.headers),
      };

      try {
        const deps = await createRouteDependencies();
        const result = await route.handler(httpReq, deps);
        return c.json(result.body, result.status);
      }
      catch (err) {
        const result = toErrorResult(err);
        return c.json(result.body, result.status);
      }
    });
  }
};
```

## H3 / nitro adapter (example)

```ts
import { createRouter, defineEventHandler, getRouterParams, getQuery, readBody, setResponseStatus } from 'h3';
import { logEntryRoutes } from '../routes/log-entries';
import { createRouteDependencies } from '../dependencies';
import { type HttpRequest } from '../types';
import { toErrorResult } from './shared'; // the helper shown above

export const createH3Router = () => {
  const router = createRouter();

  for (const route of logEntryRoutes) {
    // H3 uses ':param' segments too, so route.path can be used directly.
    const handler = defineEventHandler(async (event) => {
      const httpReq: HttpRequest = {
        method: event.method,
        params: getRouterParams(event),
        query: getQuery(event) as HttpRequest['query'],
        body: ['POST', 'PUT', 'PATCH'].includes(event.method)
          ? await readBody(event).catch(() => undefined)
          : undefined,
        headers: Object.fromEntries(event.headers),
      };

      try {
        const deps = await createRouteDependencies();
        const result = await route.handler(httpReq, deps);
        setResponseStatus(event, result.status);
        return result.body;
      }
      catch (err) {
        const result = toErrorResult(err);
        setResponseStatus(event, result.status);
        return result.body;
      }
    });

    const method = route.method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete';
    router[method](route.path, handler);
  }

  return router;
};
```

Notice that in every adapter the handler call (`route.handler(httpReq, deps)`) and the error
translation are identical — only the request-mapping and response-writing differ. That is
exactly the seam this refactor introduces.
