import { type HttpRequest } from '../types';

/**
 * `X-Client: web` is sent by the Nuxt app on every request (see
 * `web/app/plugins/http.ts`). Auth endpoints use it to omit the session token
 * from the JSON body for browser callers — the httpOnly `auth_token` cookie is
 * sufficient there, and leaving the token out of the body keeps it out of
 * reach of anything that logs, serializes, or (via XSS) reads the response.
 *
 * This is a header-gated *exclusion* for web, not an allowlist for mobile: any
 * caller that doesn't send the header (the mobile app, which stores the token
 * itself and can't rely on a browser cookie jar, or a bare API client) keeps
 * getting the token in the body exactly as before. That intentionally avoids
 * needing a coordinated mobile rollout — already-installed mobile builds are
 * unaffected by this check.
 */
const CLIENT_HEADER = 'x-client';
const WEB_CLIENT_VALUE = 'web';

export function isWebClient(req: HttpRequest): boolean {
  const value = req.headers[CLIENT_HEADER];
  const header = Array.isArray(value) ? value[0] : value;
  return header === WEB_CLIENT_VALUE;
}
