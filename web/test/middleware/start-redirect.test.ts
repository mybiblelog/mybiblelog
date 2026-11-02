import { describe, it, expect, vi, beforeEach } from 'vitest';
import startRedirect from '~/middleware/start-redirect';

const runMiddleware = startRedirect as unknown as () => Promise<unknown>;

let navigateToMock: ReturnType<typeof vi.fn>;

function withStartPage(startPage: string | undefined) {
  vi.stubGlobal('useNuxtApp', () => ({
    $http: { get: vi.fn().mockResolvedValue({ data: { startPage } }) },
  }));
}

beforeEach(() => {
  navigateToMock = vi.fn((path: string) => path);
  vi.stubGlobal('navigateTo', navigateToMock);
});

describe('start-redirect middleware', () => {
  it.each([
    ['today', '/today'],
    ['books', '/books'],
    ['checklist', '/checklist'],
    ['calendar', '/calendar'],
    ['notes', '/notes'],
  ])('redirects a "%s" start page to %s', async (startPage, expected) => {
    withStartPage(startPage);
    await expect(runMiddleware()).resolves.toBe(expected);
    expect(navigateToMock).toHaveBeenCalledWith(expected);
  });

  it.each(['start', 'unknown', 'constructor', 'toString', undefined])(
    'stays on the welcome screen for %s',
    async (startPage) => {
      withStartPage(startPage);
      await expect(runMiddleware()).resolves.toBeUndefined();
      expect(navigateToMock).not.toHaveBeenCalled();
    },
  );

  it('stays on the welcome screen when the settings request fails', async () => {
    vi.stubGlobal('useNuxtApp', () => ({
      $http: { get: vi.fn().mockRejectedValue(new Error('offline')) },
    }));
    await expect(runMiddleware()).resolves.toBeUndefined();
    expect(navigateToMock).not.toHaveBeenCalled();
  });
});
