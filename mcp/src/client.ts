/**
 * A small client for the My Bible Log HTTP API, authenticated with a personal
 * access token. Every tool goes through it, so the API's own scope checks and
 * rate limits apply to everything the agent does.
 */

export type ApiErrorDetail = {
  field: string | null;
  code: string;
  properties?: Record<string, unknown>;
};

export class ApiClientError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly details: ApiErrorDetail[] = [],
  ) {
    super(`My Bible Log API error ${status} (${code})`);
  }
}

export type Query = Record<string, string | number | undefined | ReadonlyArray<string>>;

export type ApiClient = {
  readonly siteUrl: string;
  get<T>(path: string, query?: Query): Promise<{ data: T; meta?: unknown }>;
  post<T>(path: string, body: unknown): Promise<T>;
  patch<T>(path: string, body: unknown): Promise<T>;
  delete<T>(path: string): Promise<T>;
};

type Fetch = typeof fetch;

export const createApiClient = (
  { siteUrl, token, fetchImpl = fetch }: { siteUrl: string; token: string; fetchImpl?: Fetch },
): ApiClient => {
  const base = siteUrl.replace(/\/+$/, '');

  const request = async <T>(method: string, path: string, { query, body }: { query?: Query; body?: unknown } = {}) => {
    const url = new URL(`${base}/api${path}`);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value === undefined) { continue; }
      for (const item of Array.isArray(value) ? value : [value]) {
        url.searchParams.append(key, String(item));
      }
    }

    const response = await fetchImpl(url, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        accept: 'application/json',
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

    const payload = await response.json().catch(() => null) as
      | { data: T; meta?: unknown; error?: undefined }
      | { error: { code: string; errors?: ApiErrorDetail[] } }
      | null;

    if (!response.ok || !payload || payload.error) {
      const error = payload && 'error' in payload && payload.error ? payload.error : undefined;
      throw new ApiClientError(response.status, error?.code ?? 'unknown_error', error?.errors ?? []);
    }
    return payload;
  };

  return {
    siteUrl: base,
    get: (path, query) => request('GET', path, { query }),
    post: async <T>(path: string, body: unknown) => (await request<T>('POST', path, { body })).data,
    patch: async <T>(path: string, body: unknown) => (await request<T>('PATCH', path, { body })).data,
    delete: async <T>(path: string) => (await request<T>('DELETE', path)).data,
  };
};

/**
 * Turns an API failure into a message an agent can act on: which permission
 * is missing and where the user grants it, or what was wrong with the input.
 */
export const describeApiError = (error: unknown, siteUrl: string): string => {
  if (!(error instanceof ApiClientError)) {
    return `Could not reach My Bible Log: ${error instanceof Error ? error.message : String(error)}`;
  }
  const tokenPage = `${siteUrl}/settings/access-tokens`;
  const scopeDetail = error.details.find((detail) => detail.code === 'insufficient_scope');
  if (scopeDetail) {
    const required = (scopeDetail.properties?.requiredScopes as string[] | undefined) ?? [];
    return required.length
      ? `This access token lacks the ${required.join(' and ')} permission. Ask the user to create a token that includes it at ${tokenPage}.`
      : 'Access tokens cannot do this. The user has to do it themselves in My Bible Log.';
  }
  switch (error.status) {
  case 401:
    return `The access token is missing, expired or revoked. Ask the user to create a new one at ${tokenPage} and update the MCP server configuration.`;
  case 404:
    return 'Not found. It may have been deleted, or the ID may be wrong.';
  case 429:
    return 'Too many requests. Wait a minute before trying again, and batch work where possible.';
  default: {
    const fields = error.details
      .map((detail) => (detail.field ? `${detail.field}: ${detail.code}` : detail.code))
      .join('; ');
    return `My Bible Log rejected the request (${error.status} ${error.code})${fields ? `: ${fields}` : ''}.`;
  }
  }
};
