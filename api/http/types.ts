import { type ZodType } from 'zod';
import { type ApiResponse } from '../router/response';
import { type Repositories } from '../repositories/useRepositories';
import { type UserRecord } from '../repositories/helpers/types';
import { type EmailService } from '../services/email/email-service';
import { type RateLimiter } from './rate-limit';

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
  /** Client IP, used for rate-limit keying. Optional — not every adapter sets it. */
  ip?: string;
  /** Request path, used for rate-limit keying. Optional — not every adapter sets it. */
  path?: string;
}

/**
 * Options for a single cookie the handler wants the adapter to set. Mirrors the
 * subset of Express/`h3` cookie options the app uses.
 */
export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  maxAge?: number;
  sameSite?: 'lax' | 'strict' | 'none';
  path?: string;
}

/**
 * A declarative cookie instruction. `value: null` means "clear this cookie".
 * Handlers describe cookie intent in their `HttpResult`; the adapter performs the
 * framework-specific `res.cookie()` / `res.clearCookie()` call. This keeps the
 * handlers pure (no `res` access).
 */
export interface CookieInstruction {
  name: string;
  value: string | null;
  options?: CookieOptions;
}

/**
 * A non-JSON response body the adapter should send verbatim under an explicit
 * content type (e.g. an XML sitemap). Bypasses the standard `{ data }` JSON
 * envelope entirely.
 */
export interface RawBody {
  contentType: string;
  body: string;
}

/**
 * A framework-agnostic representation of the response a handler wants to send.
 * Adapters translate this into a native response (cookies + status code + body).
 *
 * Exactly one of `body`, `redirect`, or `raw` describes the payload:
 *  - `body`: the standard JSON `{ data }` / `{ error }` envelope (the common case),
 *  - `redirect`: a `Location` redirect to the given URL using `status` (e.g. 302),
 *  - `raw`: a verbatim non-JSON body sent under `raw.contentType`.
 */
export interface HttpResult<T = any> {
  status: number;
  /** The JSON response envelope. Omitted for `redirect` / `raw` responses. */
  body?: ApiResponse<T>;
  /** Cookies to set/clear before sending the body. */
  cookies?: CookieInstruction[];
  /** Target URL for a redirect response; the adapter issues it with `status`. */
  redirect?: string;
  /** A verbatim non-JSON body (e.g. XML) the adapter sends under its content type. */
  raw?: RawBody;
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
  /** Enqueues transactional email (verification, password reset, …). */
  emailService: EmailService;
  /** Framework-agnostic rate limiter; honors the test bypass internally. */
  rateLimiter: RateLimiter;
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
  /** When true the endpoint requires no authentication (emits `security: []`). */
  public?: boolean;
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
    /** Content type of the 200 body. Defaults to `application/json`. */
    contentType?: string;
    /**
     * When true, the 200 body is documented as `schema` verbatim rather than
     * wrapped in the standard `{ data }` success envelope. Use for non-JSON /
     * raw responses (e.g. an XML sitemap).
     */
    raw?: boolean;
  };
  /**
   * Documented error status codes, each rendered as an `ApiErrorResponse`. When
   * omitted, defaults to `400` plus `404` if the route has path params.
   */
  errors?: number[];
  /** When true, documents that a 200 response sets the `auth_token` cookie. */
  setsAuthCookie?: boolean;
}

/**
 * A documentation-only route descriptor: a path/method paired with `docs`, but
 * no handler. Used to document endpoints that have not been migrated to the
 * framework-agnostic handler pattern yet (e.g. the Express-coupled auth routes),
 * so their OpenAPI spec is still schema-driven rather than hand-written JSDoc.
 */
export interface DocumentedRoute {
  method: HttpMethod;
  path: string;
  docs: RouteDocs;
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
