import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../config', () => ({
  getConfig: () => ({
    helloao: { apiBaseUrl: 'https://example.test/api' },
  }),
}));

import { fetchHelloaoChapter } from '../services/scripture/helloao-client';
import { UpstreamServiceError } from '../http/errors/upstream-error';

describe('fetchHelloaoChapter (unit)', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('throws UpstreamServiceError when fetch() rejects (network failure)', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network down'));
    await expect(fetchHelloaoChapter('trans-net-fail', 'GEN', 1))
      .rejects.toBeInstanceOf(UpstreamServiceError);
  });

  it('throws UpstreamServiceError when the response is not ok', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response);
    await expect(fetchHelloaoChapter('trans-not-ok', 'GEN', 1))
      .rejects.toBeInstanceOf(UpstreamServiceError);
  });

  it('throws UpstreamServiceError when the response body is malformed JSON', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => { throw new Error('invalid json'); },
    } as unknown as Response);
    await expect(fetchHelloaoChapter('trans-bad-json', 'GEN', 1))
      .rejects.toBeInstanceOf(UpstreamServiceError);
  });

  it('caches a successful response and does not re-fetch for the same args', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ chapter: { content: [] } }),
    } as unknown as Response);
    global.fetch = fetchMock;

    const first = await fetchHelloaoChapter('trans-cache-hit', 'GEN', 1);
    const second = await fetchHelloaoChapter('trans-cache-hit', 'GEN', 1);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });
});
