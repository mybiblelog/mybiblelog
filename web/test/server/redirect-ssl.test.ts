import { describe, it, expect, vi, beforeEach } from 'vitest';

// `redirect-ssl.ts` relies on Nitro's auto-imported H3 helpers
// (`defineNitroPlugin`, `getRequestHeader`, `sendRedirect`, `useRuntimeConfig`),
// which don't exist outside a running Nitro server. Stub the minimal surface
// the plugin touches so it can be exercised as a plain unit under vitest.
vi.stubGlobal('defineNitroPlugin', (fn: unknown) => fn);
vi.stubGlobal('getRequestHeader', (event: { headers: Record<string, string | undefined> }, name: string) =>
  event.headers[name],
);
const sendRedirectMock = vi.fn((_event: unknown, location: string, code: number) => ({ location, code }));
vi.stubGlobal('sendRedirect', sendRedirectMock);

function makeEvent(headers: Record<string, string | undefined>, path = '/today') {
  return { headers, path } as unknown as Parameters<typeof sendRedirectMock>[0] & { headers: typeof headers; path: string };
}

async function loadPlugin(dev: boolean) {
  vi.resetModules();
  vi.doMock('../../server/utils/is-dev', () => ({ isDev: () => dev }));
  const mod = await import('../../server/plugins/redirect-ssl');
  return mod.default as (nitroApp: { hooks: { hook: (name: string, cb: (event: unknown) => unknown) => void } }) => void;
}

describe('redirect-ssl plugin', () => {
  beforeEach(() => {
    sendRedirectMock.mockClear();
    // Overrides the default stub installed by test/setup.ts's own
    // beforeEach (which runs first), so each test gets a real, distinct
    // configured hostname to assert against.
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: { siteUrl: 'https://mybiblelog.example' },
    }));
  });

  it('does not register the redirect hook in dev mode', async () => {
    const pluginFn = await loadPlugin(true);
    const hook = vi.fn();
    pluginFn({ hooks: { hook } });
    expect(hook).not.toHaveBeenCalled();
  });

  it('does nothing when x-forwarded-proto is missing', async () => {
    const pluginFn = await loadPlugin(false);
    let requestHandler: ((event: unknown) => unknown) | undefined;
    pluginFn({ hooks: { hook: (name, cb) => { if (name === 'request') { requestHandler = cb; } } } });

    const result = requestHandler?.(makeEvent({ host: 'attacker.evil' }));

    expect(result).toBeUndefined();
    expect(sendRedirectMock).not.toHaveBeenCalled();
  });

  it('does nothing when the proto is already https', async () => {
    const pluginFn = await loadPlugin(false);
    let requestHandler: ((event: unknown) => unknown) | undefined;
    pluginFn({ hooks: { hook: (name, cb) => { if (name === 'request') { requestHandler = cb; } } } });

    const result = requestHandler?.(
      makeEvent({ 'x-forwarded-proto': 'https', host: 'attacker.evil' }),
    );

    expect(result).toBeUndefined();
    expect(sendRedirectMock).not.toHaveBeenCalled();
  });

  it('redirects to the configured hostname, ignoring a forged Host header', async () => {
    const pluginFn = await loadPlugin(false);
    let requestHandler: ((event: unknown) => unknown) | undefined;
    pluginFn({ hooks: { hook: (name, cb) => { if (name === 'request') { requestHandler = cb; } } } });

    requestHandler?.(
      makeEvent({ 'x-forwarded-proto': 'http', host: 'evil.attacker.example' }, '/today'),
    );

    expect(sendRedirectMock).toHaveBeenCalledTimes(1);
    const [, location, code] = sendRedirectMock.mock.calls[0];
    expect(location).toBe('https://mybiblelog.example/today');
    expect(location).not.toContain('evil.attacker.example');
    expect(code).toBe(301);
  });
});
