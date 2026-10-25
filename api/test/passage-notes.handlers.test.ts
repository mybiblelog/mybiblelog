import { describe, it, expect } from 'vitest';
import {
  listPassageNotes,
  getPassageNote,
  createPassageNote,
} from '../http/handlers/passage-notes';
import { type HttpRequest, type RouteDependencies } from '../http/types';
import {
  type PassageNoteRecord,
  type PassageNoteSearchQuery,
  type PassageNoteSearchResultItem,
  type UserRecord,
} from '../repositories/helpers/types';
import { ValidationError } from '../http/errors/validation-errors';
import { InvalidRequestError } from '../http/errors/http-errors';

/**
 * Pure unit tests for the USFM boundary of the passage note handlers: passages
 * may be sent as USFM references, the list filter accepts `filterPassage`, and
 * responses carry a `passage` reference next to the integer verse ids.
 */

const OWNER_ID = '507f1f77bcf86cd799439011';
const NOTE_ID = '507f1f77bcf86cd799439013';
const PASSAGE_ID = '507f1f77bcf86cd799439014';

const fakeUser = { id: OWNER_ID } as UserRecord;

const sampleNote: PassageNoteRecord = {
  id: NOTE_ID,
  ownerId: OWNER_ID,
  content: 'In the beginning',
  passages: [{ _id: PASSAGE_ID, startVerseId: 101001001, endVerseId: 101001031 }],
  tags: [],
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

const makeDeps = (overrides: {
  passageNotes?: Partial<RouteDependencies['repositories']['passageNotes']>;
}): RouteDependencies => ({
  repositories: {
    passageNotes: (overrides.passageNotes ?? {}) as RouteDependencies['repositories']['passageNotes'],
    passageNoteTags: { ownsAll: async () => true } as unknown as RouteDependencies['repositories']['passageNoteTags'],
  } as RouteDependencies['repositories'],
  authenticate: async () => fakeUser,
  emailService: {} as RouteDependencies['emailService'],
  rateLimiter: { check: async () => {} } as unknown as RouteDependencies['rateLimiter'],
});

const makeRequest = (overrides: Partial<HttpRequest> = {}): HttpRequest => ({
  method: 'GET',
  params: {},
  query: {},
  body: {},
  headers: {},
  ...overrides,
});

describe('passage note handlers (USFM)', () => {
  describe('createPassageNote', () => {
    it('accepts USFM strings, { passage } objects, and verse id pairs together', async () => {
      let received: unknown;
      const deps = makeDeps({
        passageNotes: { create: async (_ownerId, input) => { received = input; return sampleNote; } },
      });
      await createPassageNote(makeRequest({
        method: 'POST',
        body: {
          passages: ['ROM.8.28-30', { passage: 'gen.1' }, { startVerseId: 143003016, endVerseId: 143003016 }],
        },
      }), deps);
      expect(received).toEqual({
        content: undefined,
        tags: [],
        passages: [
          { startVerseId: 145008028, endVerseId: 145008030 },
          { startVerseId: 101001001, endVerseId: 101001031 },
          { startVerseId: 143003016, endVerseId: 143003016 },
        ],
      });
    });

    it('reports an invalid USFM passage at its index', async () => {
      const deps = makeDeps({ passageNotes: { create: async () => sampleNote } });
      const error = await createPassageNote(makeRequest({
        method: 'POST',
        body: { content: 'x', passages: ['GEN.1', 'GEN.50-EXO.1'] },
      }), deps).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).details).toEqual([{ field: 'passages.1.passage', code: 'not_valid' }]);
    });

    it('rejects null and non-string, non-object passages as validation errors', async () => {
      const deps = makeDeps({ passageNotes: { create: async () => sampleNote } });
      await expect(createPassageNote(makeRequest({ method: 'POST', body: { content: 'x', passages: [null, 5] } }), deps))
        .rejects.toBeInstanceOf(ValidationError);
    });

    it('returns passages with their USFM reference', async () => {
      const deps = makeDeps({ passageNotes: { create: async () => sampleNote } });
      const result = await createPassageNote(makeRequest({ method: 'POST', body: { passages: ['GEN.1'] } }), deps);
      expect(result.body).toEqual({
        data: {
          id: NOTE_ID,
          content: 'In the beginning',
          passages: [{ _id: PASSAGE_ID, startVerseId: 101001001, endVerseId: 101001031, passage: 'GEN.1' }],
          tags: [],
        },
      });
    });
  });

  describe('getPassageNote', () => {
    it('returns passages with their USFM reference', async () => {
      const deps = makeDeps({ passageNotes: { findByIdForOwner: async () => sampleNote } });
      const result = await getPassageNote(makeRequest({ params: { id: NOTE_ID } }), deps);
      expect((result.body as { data: { passages: unknown } }).data.passages)
        .toEqual([{ _id: PASSAGE_ID, startVerseId: 101001001, endVerseId: 101001031, passage: 'GEN.1' }]);
    });
  });

  describe('listPassageNotes', () => {
    const searchResult: PassageNoteSearchResultItem = {
      id: NOTE_ID,
      content: sampleNote.content,
      passages: sampleNote.passages,
      tags: [],
      createdAt: sampleNote.createdAt,
      updatedAt: sampleNote.updatedAt,
    };

    const searchDeps = (onQuery: (query: PassageNoteSearchQuery) => void = () => {}) => makeDeps({
      passageNotes: { search: async (_ownerId, query) => { onQuery(query); return { results: [searchResult], total: 1 }; } },
    });

    it('filters by a USFM filterPassage', async () => {
      let received: PassageNoteSearchQuery | undefined;
      await listPassageNotes(makeRequest({ query: { filterPassage: 'JHN.3' } }), searchDeps((q) => { received = q; }));
      expect(received?.filterPassageStartVerseId).toBe(143003001);
      expect(received?.filterPassageEndVerseId).toBe(143003036);
    });

    it('prefers filterPassage over the verse id pair', async () => {
      let received: PassageNoteSearchQuery | undefined;
      await listPassageNotes(makeRequest({
        query: { filterPassage: 'GEN.1.1', filterPassageStartVerseId: '143003001', filterPassageEndVerseId: '143003036' },
      }), searchDeps((q) => { received = q; }));
      expect(received?.filterPassageStartVerseId).toBe(101001001);
      expect(received?.filterPassageEndVerseId).toBe(101001001);
    });

    it('rejects an invalid filterPassage', async () => {
      await expect(listPassageNotes(makeRequest({ query: { filterPassage: 'GEN-EXO' } }), searchDeps()))
        .rejects.toBeInstanceOf(InvalidRequestError);
    });

    it('returns passages with their USFM reference', async () => {
      const result = await listPassageNotes(makeRequest(), searchDeps());
      expect((result.body as { data: Array<{ passages: unknown }> }).data[0]!.passages)
        .toEqual([{ _id: PASSAGE_ID, startVerseId: 101001001, endVerseId: 101001031, passage: 'GEN.1' }]);
    });
  });
});
