import { describe, it, expect } from 'vitest';
import {
  listLogEntries,
  getLogEntry,
  createLogEntry,
  updateLogEntry,
  deleteLogEntry,
} from '../http/handlers/log-entries';
import { type HttpRequest, type RouteDependencies } from '../http/types';
import { type LogEntryRecord, type UserRecord } from '../repositories/helpers/types';
import { ValidationError } from '../http/errors/validation-errors';
import { NotFoundError } from '../http/errors/http-errors';
import { UnauthenticatedError } from '../http/errors/http-errors';

/**
 * Pure unit tests for the framework-agnostic log entry handlers. These call the
 * handlers directly with a normalized `HttpRequest` and a fake
 * `RouteDependencies` — no Express, no supertest, no database, no running
 * server. This is the testability win the refactor enables.
 */

const OWNER_ID = '507f1f77bcf86cd799439011';
const ENTRY_ID = '507f1f77bcf86cd799439012';

const fakeUser = { id: OWNER_ID } as UserRecord;

const sampleEntry: LogEntryRecord = {
  id: ENTRY_ID,
  ownerId: OWNER_ID,
  date: '2024-01-01',
  startVerseId: 101001001,
  endVerseId: 101001005,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

/**
 * Builds a fake dependency container. `logEntries` overrides let each test stub
 * only the repository methods it exercises; `authenticate` defaults to a
 * successful auth returning `fakeUser`.
 */
const makeDeps = (overrides: {
  logEntries?: Partial<RouteDependencies['repositories']['logEntries']>;
  authenticate?: RouteDependencies['authenticate'];
}): RouteDependencies => {
  return {
    repositories: {
      logEntries: (overrides.logEntries ?? {}) as RouteDependencies['repositories']['logEntries'],
    } as RouteDependencies['repositories'],
    authenticate: overrides.authenticate ?? (async () => fakeUser),
    emailService: {} as RouteDependencies['emailService'],
    rateLimiter: { check: async () => {} } as unknown as RouteDependencies['rateLimiter'],
  };
};

const makeRequest = (overrides: Partial<HttpRequest> = {}): HttpRequest => ({
  method: 'GET',
  params: {},
  query: {},
  body: {},
  headers: {},
  ...overrides,
});

describe('log entry handlers (unit)', () => {
  describe('listLogEntries', () => {
    it('returns serialized entries for the current user', async () => {
      const deps = makeDeps({
        logEntries: { listByOwner: async () => [sampleEntry] },
      });
      const result = await listLogEntries(makeRequest(), deps);
      expect(result.status).toBe(200);
      expect(result.body).toEqual({
        data: [{
          id: ENTRY_ID, date: '2024-01-01', startVerseId: 101001001, endVerseId: 101001005, passage: 'GEN.1.1-5',
        }],
      });
    });

    it('passes the date range through to the repository', async () => {
      let received: unknown;
      const deps = makeDeps({
        logEntries: {
          listByOwner: async (_ownerId, range) => { received = range; return []; },
        },
      });
      await listLogEntries(makeRequest({ query: { startDate: '2024-01-01', endDate: '2024-01-31' } }), deps);
      expect(received).toEqual({ startDate: '2024-01-01', endDate: '2024-01-31' });
    });

    it('throws ValidationError for an invalid startDate', async () => {
      const deps = makeDeps({ logEntries: { listByOwner: async () => [] } });
      await expect(listLogEntries(makeRequest({ query: { startDate: 'nope' } }), deps))
        .rejects.toBeInstanceOf(ValidationError);
    });

    it('throws ValidationError for an invalid endDate', async () => {
      const deps = makeDeps({ logEntries: { listByOwner: async () => [] } });
      await expect(listLogEntries(makeRequest({ query: { endDate: 'nope' } }), deps))
        .rejects.toBeInstanceOf(ValidationError);
    });

    it('propagates authentication failures', async () => {
      const deps = makeDeps({
        authenticate: async () => { throw new UnauthenticatedError(); },
      });
      await expect(listLogEntries(makeRequest(), deps))
        .rejects.toBeInstanceOf(UnauthenticatedError);
    });
  });

  describe('getLogEntry', () => {
    it('throws ValidationError for an invalid id', async () => {
      const deps = makeDeps({});
      await expect(getLogEntry(makeRequest({ params: { id: 'not-an-id' } }), deps))
        .rejects.toBeInstanceOf(ValidationError);
    });

    it('throws NotFoundError when the entry does not exist', async () => {
      const deps = makeDeps({ logEntries: { findByIdForOwner: async () => null } });
      await expect(getLogEntry(makeRequest({ params: { id: ENTRY_ID } }), deps))
        .rejects.toBeInstanceOf(NotFoundError);
    });

    it('returns the serialized entry on success', async () => {
      const deps = makeDeps({ logEntries: { findByIdForOwner: async () => sampleEntry } });
      const result = await getLogEntry(makeRequest({ params: { id: ENTRY_ID } }), deps);
      expect(result.status).toBe(200);
      expect(result.body).toEqual({
        data: { id: ENTRY_ID, date: '2024-01-01', startVerseId: 101001001, endVerseId: 101001005, passage: 'GEN.1.1-5' },
      });
    });
  });

  describe('createLogEntry', () => {
    it('creates and returns the serialized entry', async () => {
      let received: unknown;
      const deps = makeDeps({
        logEntries: {
          create: async (_ownerId, input) => { received = input; return sampleEntry; },
        },
      });
      const body = { date: '2024-01-01', startVerseId: 101001001, endVerseId: 101001005 };
      const result = await createLogEntry(makeRequest({ method: 'POST', body }), deps);
      expect(received).toEqual(body);
      expect(result.status).toBe(200);
      expect(result.body).toEqual({
        data: { id: ENTRY_ID, date: '2024-01-01', startVerseId: 101001001, endVerseId: 101001005, passage: 'GEN.1.1-5' },
      });
    });

    it('accepts a USFM passage in place of verse ids', async () => {
      let received: unknown;
      const deps = makeDeps({
        logEntries: {
          create: async (_ownerId, input) => { received = input; return sampleEntry; },
        },
      });
      await createLogEntry(makeRequest({ method: 'POST', body: { date: '2024-01-01', passage: 'JHN.3.16-18' } }), deps);
      expect(received).toEqual({ date: '2024-01-01', startVerseId: 143003016, endVerseId: 143003018 });
    });

    it.each([
      ['an unknown book', { passage: 'XYZ.1.1' }, 'passage'],
      ['a passage crossing books', { passage: 'GEN.50-EXO.1' }, 'passage'],
      ['both passage forms', { passage: 'GEN.1', startVerseId: 101001001, endVerseId: 101001005 }, 'passage'],
    ])('rejects %s', async (_label, passageFields, field) => {
      const deps = makeDeps({ logEntries: { create: async () => sampleEntry } });
      const error = await createLogEntry(makeRequest({ method: 'POST', body: { date: '2024-01-01', ...passageFields } }), deps)
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).details).toEqual([{ field, code: 'not_valid' }]);
    });

    it('reports every missing field when the body is empty', async () => {
      const deps = makeDeps({ logEntries: { create: async () => sampleEntry } });
      const error = await createLogEntry(makeRequest({ method: 'POST', body: {} }), deps).catch((e: unknown) => e);
      expect((error as ValidationError).details).toEqual([
        { field: 'date', code: 'required' },
        { field: 'startVerseId', code: 'required' },
        { field: 'endVerseId', code: 'required' },
      ]);
    });

    it.each([null, 'GEN.1', 5])('rejects a non-object body (%j) as a validation error', async (body) => {
      const deps = makeDeps({ logEntries: { create: async () => sampleEntry } });
      await expect(createLogEntry(makeRequest({ method: 'POST', body }), deps))
        .rejects.toBeInstanceOf(ValidationError);
    });

    it('propagates repository validation errors', async () => {
      const deps = makeDeps({
        logEntries: { create: async () => { throw new ValidationError(); } },
      });
      await expect(createLogEntry(makeRequest({ method: 'POST', body: {} }), deps))
        .rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe('updateLogEntry', () => {
    it('throws ValidationError for an invalid id', async () => {
      const deps = makeDeps({});
      await expect(updateLogEntry(makeRequest({ method: 'PATCH', params: { id: 'bad' }, body: {} }), deps))
        .rejects.toBeInstanceOf(ValidationError);
    });

    it('throws NotFoundError when the entry does not exist', async () => {
      const deps = makeDeps({ logEntries: { update: async () => null } });
      await expect(updateLogEntry(makeRequest({ method: 'PATCH', params: { id: ENTRY_ID }, body: {} }), deps))
        .rejects.toBeInstanceOf(NotFoundError);
    });

    it('returns the updated serialized entry on success', async () => {
      const updated = { ...sampleEntry, date: '2024-02-02' };
      const deps = makeDeps({ logEntries: { update: async () => updated } });
      const result = await updateLogEntry(
        makeRequest({ method: 'PATCH', params: { id: ENTRY_ID }, body: { date: '2024-02-02' } }),
        deps,
      );
      expect(result.status).toBe(200);
      expect(result.body).toEqual({
        data: { id: ENTRY_ID, date: '2024-02-02', startVerseId: 101001001, endVerseId: 101001005, passage: 'GEN.1.1-5' },
      });
    });
  });

  describe('updateLogEntry with a USFM passage', () => {
    it('replaces both endpoints', async () => {
      let received: unknown;
      const deps = makeDeps({
        logEntries: { update: async (_ownerId, _id, patch) => { received = patch; return sampleEntry; } },
      });
      await updateLogEntry(makeRequest({ method: 'PATCH', params: { id: ENTRY_ID }, body: { passage: 'PSA.23' } }), deps);
      expect(received).toEqual({ startVerseId: 119023001, endVerseId: 119023006 });
    });

    it('rejects a passage sent alongside a verse id', async () => {
      const deps = makeDeps({ logEntries: { update: async () => sampleEntry } });
      await expect(updateLogEntry(
        makeRequest({ method: 'PATCH', params: { id: ENTRY_ID }, body: { passage: 'PSA.23', endVerseId: 119023006 } }),
        deps,
      )).rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe('deleteLogEntry', () => {
    it('throws ValidationError for an invalid id', async () => {
      const deps = makeDeps({});
      await expect(deleteLogEntry(makeRequest({ method: 'DELETE', params: { id: 'bad' } }), deps))
        .rejects.toBeInstanceOf(ValidationError);
    });

    it('throws NotFoundError when nothing was deleted', async () => {
      const deps = makeDeps({ logEntries: { deleteByIdForOwner: async () => 0 } });
      await expect(deleteLogEntry(makeRequest({ method: 'DELETE', params: { id: ENTRY_ID } }), deps))
        .rejects.toBeInstanceOf(NotFoundError);
    });

    it('returns the deleted count on success', async () => {
      const deps = makeDeps({ logEntries: { deleteByIdForOwner: async () => 1 } });
      const result = await deleteLogEntry(makeRequest({ method: 'DELETE', params: { id: ENTRY_ID } }), deps);
      expect(result.status).toBe(200);
      expect(result.body).toEqual({ data: 1 });
    });
  });
});
