import { describe, expect, it, vi } from 'vitest';
import type { ApiResponse, HttpClient } from '../platform/http-client';
import {
  deleteLogEntryRequest,
  fetchLogEntries,
  patchLogEntry,
  postLogEntry,
  type LogEntry,
} from './api';

const respond = <T>(data: T): ApiResponse<T> => ({ data });

const makeHttp = (overrides: Partial<HttpClient> = {}): HttpClient => ({
  get: vi.fn().mockResolvedValue(respond([])),
  post: vi.fn().mockResolvedValue(respond(undefined)),
  patch: vi.fn().mockResolvedValue(respond(undefined)),
  delete: vi.fn().mockResolvedValue(respond(undefined)),
  ...overrides,
});

const logEntry: LogEntry = { id: 1, date: '2024-06-01', startVerseId: 1001001, endVerseId: 1001001 };

describe('fetchLogEntries', () => {
  it('GETs the log-entries collection', async () => {
    const http = makeHttp({ get: vi.fn().mockResolvedValue(respond([logEntry])) });
    const result = await fetchLogEntries(http);
    expect(http.get).toHaveBeenCalledWith('/api/log-entries');
    expect(result).toEqual([logEntry]);
  });

  it('falls back to an empty array when the response data is not an array', async () => {
    const http = makeHttp({ get: vi.fn().mockResolvedValue(respond(null)) });
    const result = await fetchLogEntries(http);
    expect(result).toEqual([]);
  });
});

describe('postLogEntry', () => {
  it('POSTs the input to the log-entries collection', async () => {
    const input = { date: '2024-06-01', startVerseId: 1001001, endVerseId: 1001001 };
    const http = makeHttp({ post: vi.fn().mockResolvedValue(respond(logEntry)) });
    const result = await postLogEntry(http, input);
    expect(http.post).toHaveBeenCalledWith('/api/log-entries', input);
    expect(result).toEqual(logEntry);
  });
});

describe('patchLogEntry', () => {
  it('PATCHes the entry by id, excluding id from the body', async () => {
    const http = makeHttp({ patch: vi.fn().mockResolvedValue(respond(logEntry)) });
    const result = await patchLogEntry(http, {
      id: 1,
      date: '2024-06-02',
      startVerseId: 1001001,
      endVerseId: 1001002,
    });
    expect(http.patch).toHaveBeenCalledWith('/api/log-entries/1', {
      date: '2024-06-02',
      startVerseId: 1001001,
      endVerseId: 1001002,
    });
    expect(result).toEqual(logEntry);
  });
});

describe('deleteLogEntryRequest', () => {
  it('DELETEs the entry by id', async () => {
    const http = makeHttp({ delete: vi.fn().mockResolvedValue(respond(true)) });
    const result = await deleteLogEntryRequest(http, 1);
    expect(http.delete).toHaveBeenCalledWith('/api/log-entries/1');
    expect(result).toBe(true);
  });

  it('coerces a falsy response body to false', async () => {
    const http = makeHttp({ delete: vi.fn().mockResolvedValue(respond(null)) });
    const result = await deleteLogEntryRequest(http, 1);
    expect(result).toBe(false);
  });
});
