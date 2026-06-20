import { type ApiResponse } from '../router/response';
import { type Repositories } from '../repositories/useRepositories';
import { type UserRecord } from '../repositories/types';

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
  body: any;
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
 * The dependencies a handler needs to do its job. Injecting these (rather than
 * importing them directly) is what makes the handlers unit-testable: tests pass
 * in fakes, production wiring passes in the real repositories and auth.
 */
export interface RouteDependencies {
  repositories: Repositories;
  authenticate: (
    req: HttpRequest,
    opts?: { optional?: boolean; adminOnly?: boolean },
  ) => Promise<UserRecord | null>;
}

/**
 * A pure route handler: given a normalized request and its dependencies, it
 * returns a normalized result or throws an `AppError` subclass on failure.
 */
export type RouteHandler = (req: HttpRequest, deps: RouteDependencies) => Promise<HttpResult>;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * A framework-neutral description of a single route. A list of these is the
 * contract every adapter consumes.
 */
export interface RouteDefinition {
  method: HttpMethod;
  path: string;
  handler: RouteHandler;
}
