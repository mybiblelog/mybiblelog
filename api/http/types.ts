import { type ZodType } from 'zod';
import { type ApiResponse } from '../router/response';
import { type Repositories } from '../repositories/useRepositories';
import { type UserRecord } from '../repositories/helpers/types';

/**
 * A framework-agnostic, normalized representation of an inbound HTTP request.
 *
 * Adapters (Express, Hono, H3, …) are responsible for mapping their native
 * request object onto this shape. `headers` is intentionally typed to be
 * structurally compatible with Express's `req.headers` so that helpers such as
 * `authCurrentUser` accept both a native request and an `HttpRequest`.
 */
export interface HttpRequest {
  method: string;
  params: Record<string, string | undefined>;
  query: Record<string, string | undefined>;
  body: unknown;
  headers: Record<string, string | string[] | undefined>;
}

/**
 * A framework-agnostic representation of the response a handler wants to send.
 * Adapters translate this into a native response (status code + JSON body).
 */
export interface HttpResult<T = any> {
  status: number;
  body: ApiResponse<T>;
}

/**
 * Authenticates a request. Overloaded so the common (non-optional) call is
 * typed as returning a guaranteed `UserRecord` — it throws rather than
 * returning `null` — while the `optional: true` call returns `UserRecord | null`.
 * This mirrors the real `authCurrentUser` and lets handlers use the result
 * without a non-null assertion.
 */
export interface Authenticate {
  (req: HttpRequest, opts?: { optional?: false; adminOnly?: boolean }): Promise<UserRecord>;
  (req: HttpRequest, opts: { optional: true; adminOnly?: boolean }): Promise<UserRecord | null>;
}

/**
 * The dependencies a handler needs to do its job. Injecting these (rather than
 * importing them directly) is what makes the handlers unit-testable: tests pass
 * in fakes, production wiring passes in the real repositories and auth.
 */
export interface RouteDependencies {
  repositories: Repositories;
  authenticate: Authenticate;
}

/**
 * A pure route handler: given a normalized request and its dependencies, it
 * returns a normalized result or throws an `AppError` subclass on failure.
 */
export type RouteHandler = (req: HttpRequest, deps: RouteDependencies) => Promise<HttpResult>;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * OpenAPI documentation for a route, expressed in terms of the *same* zod
 * schemas the handler validates with. Because the docs reference the validation
 * schemas (rather than re-describing them by hand) the generated spec cannot
 * drift from what the endpoint actually accepts and returns.
 */
export interface RouteDocs {
  summary: string;
  tags: string[];
  description?: string;
  /** Request schemas — reuse the exact schemas passed to `validate()`. */
  request?: {
    params?: ZodType;
    query?: ZodType;
    body?: ZodType;
  };
  /** The schema of the `data` payload returned on a 200 response. */
  response?: {
    description?: string;
    schema: ZodType;
  };
}

/**
 * A framework-neutral description of a single route. A list of these is the
 * contract every adapter consumes. The optional `docs` field is consumed only
 * by the OpenAPI generator (see `api/http/openapi/generate.ts`); adapters ignore
 * it.
 */
export interface RouteDefinition {
  method: HttpMethod;
  path: string;
  handler: RouteHandler;
  docs?: RouteDocs;
}
